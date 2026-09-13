import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { displayPath } from "../core/paths";
import { formatForAgent } from "../diagnostics/format";
import { openTabUris } from "../bridge/tabs";
import { runDoctor } from "../onboarding/doctor";
import { addToProfile, openDefaultProfile, openOrCreateConfig, openProfile } from "../profiles/profiles";
import { PROMPTS, upsertInstructions, type PromptTemplate } from "../prompts/templates";
import { closeTabs, openDiff, openFile } from "../review/opener";
import type { EditEntry } from "../session/store";
import type { Services } from "../services";
import { configureStatusBar, showStatusMenu } from "../statusbar/statusBar";
import { log } from "../shared/log";

const DOCS_URL = "https://devgiordane.github.io/openfiles";

/** Commands get a Uri from explorer/editor menus, a tree node from our views, or nothing from the palette. */
function resolveUris(arg: unknown, selection?: unknown): vscode.Uri[] {
  const items = Array.isArray(selection) && selection.length > 0 ? selection : [arg];
  const uris: vscode.Uri[] = [];
  for (const item of items) {
    if (item instanceof vscode.Uri) {
      uris.push(item);
    } else if (item && typeof item === "object" && "entry" in item) {
      uris.push(vscode.Uri.file((item as { entry: EditEntry }).entry.fsPath));
    }
  }
  if (uris.length === 0) {
    const active = vscode.window.activeTextEditor?.document.uri;
    if (active?.scheme === "file") {
      uris.push(active);
    }
  }
  return uris;
}

function problemsText(s: Services, entries: readonly EditEntry[]): string {
  return formatForAgent(
    entries.map((entry) => s.collector.toFileDiagnostics(entry)),
    {
      level: "errorsAndWarnings",
      displayPath: (p) => displayPath(p, vscode.workspace.getWorkspaceFolder(vscode.Uri.file(p))?.uri.fsPath),
    },
  );
}

function relativeFiles(entries: readonly EditEntry[]): string[] {
  return entries.map((e) => displayPath(e.fsPath, vscode.workspace.getWorkspaceFolder(vscode.Uri.file(e.fsPath))?.uri.fsPath));
}

async function setReviewed(s: Services, uris: vscode.Uri[], reviewed: boolean): Promise<void> {
  const paths = uris.map((u) => u.fsPath).filter((p) => s.session.has(p));
  s.session.setReviewed(paths, reviewed);
  if (reviewed && s.settings().closeReviewedTabs) {
    await closeTabs(paths);
  }
}

async function reviewNext(s: Services): Promise<void> {
  const active = vscode.window.activeTextEditor?.document.uri;
  const current = active?.scheme === "file" ? s.session.get(active.fsPath) : undefined;
  if (current && !current.reviewed) {
    await setReviewed(s, [active!], true);
  }
  const next = s.session
    .unreviewed()
    .sort((a, b) => s.collector.counts(b.fsPath).errors - s.collector.counts(a.fsPath).errors || a.firstSeen - b.firstSeen)[0];
  if (!next) {
    void vscode.window.showInformationMessage(vscode.l10n.t("All caught up. Every AI-edited file is reviewed."));
    return;
  }
  await openFile(vscode.Uri.file(next.fsPath));
}

async function openAiEdits(s: Services): Promise<void> {
  const unreviewed = s.session.unreviewed();
  const entries = unreviewed.length > 0 ? unreviewed : s.session.all();
  if (entries.length === 0) {
    void vscode.window.showInformationMessage(vscode.l10n.t("No AI-edited files yet."));
    return;
  }
  if (entries.length > 25) {
    const open = vscode.l10n.t("Open {0} files", entries.length);
    if ((await vscode.window.showWarningMessage(vscode.l10n.t("That's a lot of tabs."), { modal: true }, open)) !== open) {
      return;
    }
  }
  for (const entry of entries) {
    await openFile(vscode.Uri.file(entry.fsPath), true);
  }
}

function promptLabel(template: PromptTemplate): { label: string; detail: string } {
  switch (template.id) {
    case "agents-md":
      return { label: vscode.l10n.t("Instructions for AGENTS.md / CLAUDE.md"), detail: vscode.l10n.t("Tells your agent to read the problems OpenFiles collects before it says it's done.") };
    case "fix-problems":
      return { label: vscode.l10n.t("Fix the problems in AI-edited files"), detail: vscode.l10n.t("Includes the current errors and warnings, with file and line.") };
    case "small-steps":
      return { label: vscode.l10n.t("Work in small steps and check as you go"), detail: vscode.l10n.t("Good at the start of a big task.") };
    case "review-handoff":
      return { label: vscode.l10n.t("Write a PR description for these changes"), detail: vscode.l10n.t("Lists the changed files and any problems left.") };
    case "setup":
      return { label: vscode.l10n.t("Ask your agent to set up OpenFiles"), detail: vscode.l10n.t("Adds the instructions block; hooks stay a one-click install here.") };
  }
}

async function copyAgentPrompt(s: Services): Promise<void> {
  const entries = s.session.unreviewed();
  const context = { docsUrl: DOCS_URL, problems: problemsText(s, entries), changedFiles: relativeFiles(entries.length ? entries : s.session.all()) };
  const picked = await vscode.window.showQuickPick(
    PROMPTS.map((template) => ({ ...promptLabel(template), template })),
    { title: vscode.l10n.t("Copy a prompt for your agent"), matchOnDetail: true },
  );
  if (!picked) {
    return;
  }
  const text = picked.template.build(context);
  await vscode.env.clipboard.writeText(text);

  if (picked.template.id !== "agents-md" || !vscode.workspace.isTrusted) {
    void vscode.window.showInformationMessage(vscode.l10n.t("Copied. Paste it into your agent."));
    return;
  }
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!root) {
    return;
  }
  const candidates = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];
  const present = (await Promise.all(candidates.map((name) => fs.access(path.join(root, name)).then(() => name, () => undefined)))).filter(
    (name): name is string => !!name,
  );
  const targets = present.length > 0 ? present : ["AGENTS.md"];
  const choice = await vscode.window.showInformationMessage(
    vscode.l10n.t("Copied. Want OpenFiles to add it to your instructions file?"),
    ...targets.map((name) => vscode.l10n.t("Add to {0}", name)),
  );
  const target = targets.find((name) => choice === vscode.l10n.t("Add to {0}", name));
  if (!target) {
    return;
  }
  const file = path.join(root, target);
  const existing = await fs.readFile(file, "utf8").catch(() => "");
  await fs.writeFile(file, upsertInstructions(existing, text), "utf8");
  await vscode.window.showTextDocument(vscode.Uri.file(file), { preview: false });
}

async function copyFixPrompt(s: Services): Promise<void> {
  const entries = s.session.unreviewed().length > 0 ? s.session.unreviewed() : s.session.all();
  const fix = PROMPTS.find((p) => p.id === "fix-problems")!;
  const problems = problemsText(s, entries);
  await vscode.env.clipboard.writeText(fix.build({ docsUrl: DOCS_URL, problems, changedFiles: relativeFiles(entries) }));
  void vscode.window.showInformationMessage(
    problems ? vscode.l10n.t("Copied the problems and a fix prompt. Paste it into your agent.") : vscode.l10n.t("No problems right now, copied a short note instead."),
  );
}

export function registerCommands(s: Services): vscode.Disposable[] {
  const register = (id: string, handler: (...args: any[]) => unknown) =>
    vscode.commands.registerCommand(id, async (...args: unknown[]) => {
      try {
        await handler(...args);
      } catch (error) {
        log.error(`Command ${id} failed`, error);
        void vscode.window.showErrorMessage(`OpenFiles: ${String(error)}`);
      }
    });

  return [
    register("openfiles.openAiEdits", () => openAiEdits(s)),
    register("openfiles.reviewNext", () => reviewNext(s)),
    register("openfiles.markReviewed", (arg, selection) => setReviewed(s, resolveUris(arg, selection), true)),
    register("openfiles.markUnreviewed", (arg, selection) => setReviewed(s, resolveUris(arg, selection), false)),
    register("openfiles.markAllReviewed", async () => {
      const paths = s.session.unreviewed().map((e) => e.fsPath);
      s.session.markAllReviewed();
      if (s.settings().closeReviewedTabs) {
        await closeTabs(paths);
      }
    }),
    register("openfiles.openDiff", async (arg) => {
      const [uri] = resolveUris(arg);
      if (uri) {
        await openDiff(uri, s.git);
      }
    }),
    register("openfiles.openFile", async (arg) => {
      const [uri] = resolveUris(arg);
      if (uri) {
        await openFile(uri);
      }
    }),
    register("openfiles.removeFromSession", (arg, selection) => {
      for (const uri of resolveUris(arg, selection)) {
        s.session.remove(uri.fsPath);
      }
    }),
    register("openfiles.showProblems", async () => {
      await vscode.commands.executeCommand("openfiles.problems.focus");
    }),
    register("openfiles.copyFixPrompt", () => copyFixPrompt(s)),
    register("openfiles.copyAgentPrompt", () => copyAgentPrompt(s)),
    register("openfiles.installHooks", (arg) => s.installer.install(agentIdFrom(arg))),
    register("openfiles.removeHooks", (arg) => s.installer.remove(agentIdFrom(arg))),
    register("openfiles.clearSession", () => {
      s.session.clear();
      s.opener.resetCount();
    }),
    register("openfiles.togglePause", async () => {
      s.detector.setPaused(!s.detector.isPaused);
      await vscode.commands.executeCommand("setContext", "openfiles.paused", s.detector.isPaused);
      s.statusBar.update();
      void vscode.window.setStatusBarMessage(
        s.detector.isPaused ? vscode.l10n.t("OpenFiles paused") : vscode.l10n.t("OpenFiles watching again"),
        3000,
      );
    }),
    register("openfiles.scanGitChanges", async () => {
      if (!s.git.available) {
        void vscode.window.showWarningMessage(vscode.l10n.t("The Git extension isn't available in this window."));
        return;
      }
      const added = await s.detector.scanGit();
      void vscode.window.showInformationMessage(vscode.l10n.t("Added {0} uncommitted file(s) to AI Edits.", added));
    }),
    register("openfiles.configureStatusBar", () => configureStatusBar(s.settings().statusBar)),
    register("openfiles.statusBarMenu", () => showStatusMenu(s.detector.isPaused)),
    register("openfiles.doctor", () => runDoctor(s.settings(), s.git, s.detector)),
    register("openfiles.getStarted", () =>
      vscode.commands.executeCommand("workbench.action.openWalkthrough", `${s.context.extension.id}#welcome`, false),
    ),
    register("openfiles.openProfile", (name?: string) => openProfile(s.settings().configFile, typeof name === "string" ? name : undefined)),
    register("openfiles.sync", () => openDefaultProfile(s.settings().configFile)),
    register("openfiles.addToProfile", async (arg) => {
      await addToProfile(s.settings().configFile, resolveUris(arg)[0]);
      s.profilesTree.refresh();
    }),
    register("openfiles.openConfig", () => openOrCreateConfig(s.context, s.settings().configFile)),
    register("openfiles.showOpenFiles", () => {
      const tabs = openTabUris();
      log.info(`${tabs.length} file tab(s) open:`);
      tabs.forEach((uri) => log.info(`  ${uri.fsPath}`));
      log.show();
    }),
    register("openfiles.refresh", async () => {
      s.editsTree.refresh();
      s.problemsTree.refresh();
      s.agentsTree.refresh();
      s.profilesTree.refresh();
      await Promise.all([s.bridge.publish(), s.collector.export()]);
    }),
  ];
}

function agentIdFrom(arg: unknown): string | undefined {
  if (arg && typeof arg === "object" && "agent" in arg) {
    return (arg as { agent: { id: string } }).agent.id;
  }
  return undefined;
}
