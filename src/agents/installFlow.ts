import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { toPosix } from "../core/paths";
import { log } from "../shared/log";
import { agentStatuses, readAgentConfig } from "./detect";
import { installHook, removeHook } from "./hookConfig";
import type { AgentDefinition } from "./registry";

const PREVIEW_SCHEME = "openfiles-preview";

interface Plan {
  agent: AgentDefinition;
  file: string;
  before: string;
  after: string | undefined;
}

/** Where agent hooks point. Outside the extension folder, so updates and editor forks don't break the path. */
export function hookScriptTarget(): string {
  return path.join(os.homedir(), ".openfiles", "hook.js");
}

export class HookInstaller implements vscode.Disposable {
  private readonly previews = new Map<string, string>();
  private readonly registration: vscode.Disposable;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly onChanged: () => void,
  ) {
    this.registration = vscode.workspace.registerTextDocumentContentProvider(PREVIEW_SCHEME, {
      provideTextDocumentContent: (uri) => this.previews.get(uri.toString()) ?? "",
    });
  }

  /** Copies the bundled hook to ~/.openfiles/hook.js when it's missing or out of date. */
  async syncHookScript(): Promise<string> {
    const target = hookScriptTarget();
    const source = this.context.asAbsolutePath(path.join("dist", "hook.js"));
    try {
      const [next, current] = await Promise.all([fs.readFile(source, "utf8"), fs.readFile(target, "utf8").catch(() => "")]);
      if (next !== current) {
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, next, "utf8");
        log.info(`Updated hook script at ${target}`);
      }
    } catch (error) {
      log.warn(`Could not copy hook script: ${String(error)}`);
    }
    return target;
  }

  async install(preselect?: string): Promise<void> {
    const root = await pickRoot();
    if (!root) {
      return;
    }
    const statuses = await agentStatuses(root);
    const picks = statuses
      .filter((s) => s.agent.hook)
      .map((s) => ({
        label: s.agent.name,
        description: [
          s.hookInstalled ? vscode.l10n.t("installed") : undefined,
          s.detected ? vscode.l10n.t("detected") : undefined,
          s.agent.feedback ? vscode.l10n.t("sends problems back") : undefined,
          s.agent.beta ? vscode.l10n.t("beta") : undefined,
        ]
          .filter(Boolean)
          .join(" · "),
        detail: s.agent.hook?.file,
        picked: preselect ? s.agent.id === preselect : s.detected && !s.hookInstalled,
        agent: s.agent,
      }));
    const chosen = await vscode.window.showQuickPick(picks, {
      canPickMany: true,
      title: vscode.l10n.t("Install OpenFiles hooks"),
      placeHolder: vscode.l10n.t("Pick the agents you use in this project. You'll see every file change before it's written."),
    });
    if (!chosen?.length) {
      return;
    }

    const script = await this.syncHookScript();
    const plans: Plan[] = [];
    for (const { agent } of chosen) {
      const config = await readAgentConfig(root, agent);
      if (!config || !agent.hook) {
        continue;
      }
      if (config.error) {
        void vscode.window.showWarningMessage(vscode.l10n.t("Skipped {0}: {1} has {2}. Fix it and try again.", agent.name, rel(root, config.path), config.error));
        continue;
      }
      const result = installHook(agent.hook, agent, config.value, script);
      if (result.changed) {
        plans.push({ agent, file: config.path, before: config.raw ?? "", after: result.content });
      }
    }
    await this.apply(root, plans, vscode.l10n.t("Write"), vscode.l10n.t("Hooks are already installed for the selected agents."));
  }

  async remove(preselect?: string): Promise<void> {
    const root = await pickRoot();
    if (!root) {
      return;
    }
    const installed = (await agentStatuses(root)).filter((s) => s.hookInstalled);
    if (installed.length === 0) {
      void vscode.window.showInformationMessage(vscode.l10n.t("No OpenFiles hooks found in this workspace."));
      return;
    }
    const chosen = await vscode.window.showQuickPick(
      installed.map((s) => ({ label: s.agent.name, detail: s.agent.hook?.file, picked: !preselect || s.agent.id === preselect, agent: s.agent })),
      { canPickMany: true, title: vscode.l10n.t("Remove OpenFiles hooks") },
    );
    if (!chosen?.length) {
      return;
    }
    const plans: Plan[] = [];
    for (const { agent } of chosen) {
      const config = await readAgentConfig(root, agent);
      if (config?.exists && agent.hook) {
        const result = removeHook(agent.hook, config.value);
        if (result.changed) {
          plans.push({ agent, file: config.path, before: config.raw ?? "", after: result.content });
        }
      }
    }
    await this.apply(root, plans, vscode.l10n.t("Remove"), vscode.l10n.t("Nothing to remove."));
  }

  private async apply(root: string, plans: Plan[], confirmLabel: string, nothingMessage: string): Promise<void> {
    if (plans.length === 0) {
      void vscode.window.showInformationMessage(nothingMessage);
      return;
    }

    for (const plan of plans) {
      const stamp = Date.now();
      const left = vscode.Uri.from({ scheme: PREVIEW_SCHEME, path: `/${toPosix(rel(root, plan.file))}`, query: `before-${stamp}` });
      const right = vscode.Uri.from({ scheme: PREVIEW_SCHEME, path: `/${toPosix(rel(root, plan.file))}`, query: `after-${stamp}` });
      this.previews.set(left.toString(), plan.before);
      this.previews.set(right.toString(), plan.after ?? "");
      const title = vscode.l10n.t("{0} — OpenFiles change preview", rel(root, plan.file));
      await vscode.commands.executeCommand("vscode.diff", left, right, title, { preview: false, preserveFocus: true });
    }

    const detail = plans
      .map((p) => `${p.agent.name}: ${rel(root, p.file)}${p.after === undefined ? ` (${vscode.l10n.t("delete")})` : ""}`)
      .join("\n");
    const choice = await vscode.window.showInformationMessage(
      vscode.l10n.t("Apply these changes to {0} file(s)?", plans.length),
      { modal: true, detail },
      confirmLabel,
    );
    if (choice !== confirmLabel) {
      return;
    }

    for (const plan of plans) {
      try {
        if (plan.after === undefined) {
          await fs.unlink(plan.file);
        } else {
          await fs.mkdir(path.dirname(plan.file), { recursive: true });
          await fs.writeFile(plan.file, plan.after, "utf8");
        }
      } catch (error) {
        void vscode.window.showErrorMessage(vscode.l10n.t("Could not write {0}: {1}", rel(root, plan.file), String(error)));
      }
    }
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor").then(undefined, () => undefined);
    this.onChanged();

    const notes = plans
      .filter((p) => p.after !== undefined)
      .map((p) => restartNote(p.agent))
      .filter(Boolean);
    void vscode.window.showInformationMessage(
      [vscode.l10n.t("Done. Restart any running agent sessions so they pick up the change."), ...notes].join(" "),
    );
  }

  dispose(): void {
    this.registration.dispose();
  }
}

function restartNote(agent: AgentDefinition): string {
  if (agent.id === "codex") {
    return vscode.l10n.t("Codex: if the hook doesn't fire, check that hooks are enabled in your Codex config.");
  }
  if (agent.id === "claude") {
    return vscode.l10n.t("Claude Code: run /hooks once to confirm it's listed.");
  }
  return "";
}

function rel(root: string, file: string): string {
  return toPosix(path.relative(root, file));
}

async function pickRoot(): Promise<string | undefined> {
  if (!vscode.workspace.isTrusted) {
    void vscode.window.showWarningMessage(vscode.l10n.t("Trust this workspace before installing agent hooks."));
    return undefined;
  }
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (folders.length <= 1) {
    return folders[0]?.uri.fsPath;
  }
  const folder = await vscode.window.showWorkspaceFolderPick({ placeHolder: vscode.l10n.t("Which folder do your agents run in?") });
  return folder?.uri.fsPath;
}
