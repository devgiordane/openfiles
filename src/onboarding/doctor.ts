import { execFile } from "node:child_process";
import * as path from "node:path";
import * as vscode from "vscode";
import { agentStatuses } from "../agents/detect";
import { hookScriptTarget } from "../agents/installFlow";
import type { Detector } from "../detect/detector";
import type { GitSignals } from "../detect/git";
import type { Settings } from "../shared/settings";
import { exists } from "../shared/openfilesDir";
import { coverage, OPEN_FILES_ONLY_SETTINGS } from "./linters";

const SCAN_LIMIT = 5000;

function nodeVersion(): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile("node", ["--version"], { timeout: 3000, windowsHide: true }, (error, stdout) => resolve(error ? undefined : stdout.trim()));
  });
}

/** Cursor, Windsurf, VSCodium, Antigravity, Kiro… install extensions from Open VSX. */
export function usesOpenVsx(): boolean {
  return !/visual studio code/i.test(vscode.env.appName);
}

function marketplaceLink(id: string, openVsx: boolean): string {
  const [publisher, name] = id.split(".");
  return openVsx
    ? `https://open-vsx.org/extension/${publisher}/${name}`
    : `https://marketplace.visualstudio.com/items?itemName=${id}`;
}

const ok = (value: boolean) => (value ? "✅" : "⚠️");

export async function runDoctor(settings: Settings, git: GitSignals, detector: Detector): Promise<void> {
  const report = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: vscode.l10n.t("OpenFiles: checking your setup…") },
    () => buildReport(settings, git, detector),
  );
  const doc = await vscode.workspace.openTextDocument({ language: "markdown", content: report });
  await vscode.window.showTextDocument(doc, { preview: false });
  await vscode.commands.executeCommand("markdown.showPreview", doc.uri).then(undefined, () => undefined);
}

async function buildReport(settings: Settings, git: GitSignals, detector: Detector): Promise<string> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const openVsx = usesOpenVsx();
  const node = await nodeVersion();
  const hookScript = await exists(hookScriptTarget());
  const lines: string[] = ["# OpenFiles Doctor", ""];

  lines.push("## Editor", "");
  lines.push(`- ${vscode.env.appName} ${vscode.version} · ${openVsx ? "Open VSX" : "Visual Studio Marketplace"}`);
  lines.push(`- ${ok(vscode.workspace.isTrusted)} Workspace trusted${vscode.workspace.isTrusted ? "" : " — hooks and diagnostics export are off until you trust it"}`);
  lines.push(`- ${ok(git.available)} Git extension ${git.available ? "available" : "not available — branch switches can't be filtered out"}`);
  lines.push(`- Mode: \`${settings.mode}\` · watcher ${settings.detection.watcher ? "on" : "off"} · hooks ${settings.detection.hooks ? "on" : "off"}${detector.isPaused ? " · **paused**" : ""}`);
  lines.push("");

  lines.push("## Agent hooks", "");
  lines.push(`- ${ok(!!node)} Node.js on PATH${node ? ` (${node})` : " — hooks run `node`, so they won't work until it is installed"}`);
  lines.push(`- ${ok(hookScript)} Hook script at \`${hookScriptTarget()}\``);
  if (root) {
    const statuses = await agentStatuses(root);
    const relevant = statuses.filter((s) => s.detected || s.hookInstalled);
    if (relevant.length === 0) {
      lines.push("- No agent config found in this workspace. The file watcher still catches edits from any agent.");
    }
    for (const status of relevant) {
      const hook = status.agent.hook
        ? status.hookInstalled
          ? "hook installed"
          : `no hook — run **OpenFiles: Install Agent Hooks…** (writes \`${status.agent.hook.file}\`)`
        : "no hook support yet — the watcher covers it";
      lines.push(`- ${ok(status.hookInstalled || !status.agent.hook)} **${status.agent.name}**: ${hook}`);
    }
  }
  lines.push("");

  lines.push("## Linters for this workspace", "");
  if (root) {
    const uris = await vscode.workspace.findFiles("**/*", "{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**,**/target/**,**/.venv/**}", SCAN_LIMIT);
    const counts = new Map<string, number>();
    for (const uri of uris) {
      const ext = path.extname(uri.fsPath).toLowerCase();
      counts.set(ext, (counts.get(ext) ?? 0) + 1);
    }
    const installed = new Set(vscode.extensions.all.map((e) => e.id.toLowerCase()));
    const rows = coverage(counts, (id) => installed.has(id.toLowerCase()), openVsx);
    if (rows.length === 0) {
      lines.push("No files OpenFiles has linter recommendations for.");
    } else {
      lines.push("| Language | Files | Checked by | Suggested |", "|---|---|---|---|");
      for (const row of rows) {
        const checkers = [row.builtIn, ...row.installed.map((e) => e.name)].filter(Boolean).join(", ");
        const suggestions = row.installed.length > 0 ? "" : row.suggestions.map((e) => `[${e.name}](${marketplaceLink(e.id, openVsx)})`).join(", ");
        lines.push(`| ${row.language} | ${row.files}${uris.length >= SCAN_LIMIT ? "+" : ""} | ${checkers ? `✅ ${checkers}` : "⚠️ nothing"} | ${suggestions} |`);
      }
    }
  }
  lines.push("");

  lines.push("## Settings that only check open files", "");
  lines.push("These are normal defaults. They're why agent edits go unchecked without OpenFiles opening the files.", "");
  for (const item of OPEN_FILES_ONLY_SETTINGS) {
    const [section, ...rest] = item.setting.split(".");
    const value = vscode.workspace.getConfiguration(section).get(rest.join("."));
    if (value === undefined) {
      continue;
    }
    lines.push(`- \`${item.setting}\` = \`${JSON.stringify(value)}\`${JSON.stringify(value) === JSON.stringify(item.value) ? ` — ${item.note}` : ""}`);
  }
  lines.push("", "---", "Something off? https://github.com/devgiordane/openfiles/issues");
  return lines.join("\n");
}
