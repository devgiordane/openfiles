import * as path from "node:path";
import * as vscode from "vscode";
import { displayPath } from "../core/paths";
import type { DiagnosticsCollector } from "../diagnostics/collector";
import type { EditEntry, EditSession } from "../session/store";
import { agentLabel, problemsSuffix } from "./labels";

export type EditNode = { kind: "group"; label: string; entries: EditEntry[] } | { kind: "file"; entry: EditEntry };

export class EditsTree implements vscode.TreeDataProvider<EditNode>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  readonly view: vscode.TreeView<EditNode>;
  private refreshTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly disposables: vscode.Disposable[] = [this.emitter];

  constructor(
    private readonly session: EditSession,
    private readonly collector: DiagnosticsCollector,
  ) {
    this.view = vscode.window.createTreeView("openfiles.aiEdits", {
      treeDataProvider: this,
      manageCheckboxStateManually: true,
      showCollapseAll: true,
    });
    this.disposables.push(
      this.view,
      this.view.onDidChangeCheckboxState((event) => {
        for (const [node, state] of event.items) {
          if (node.kind === "file") {
            void vscode.commands.executeCommand(
              state === vscode.TreeItemCheckboxState.Checked ? "openfiles.markReviewed" : "openfiles.markUnreviewed",
              node,
            );
          }
        }
      }),
      this.session.onDidChange(() => this.refresh()),
      this.collector.onDidChange(() => this.refresh()),
    );
    this.refresh();
  }

  refresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.refreshTimer = setTimeout(() => {
      const unreviewed = this.session.unreviewed().length;
      this.view.badge = unreviewed > 0 ? { value: unreviewed, tooltip: vscode.l10n.t("{0} file(s) to review", unreviewed) } : undefined;
      this.emitter.fire();
    }, 100);
  }

  getChildren(node?: EditNode): EditNode[] {
    if (node?.kind === "group") {
      return node.entries.map((entry) => ({ kind: "file", entry }));
    }
    if (node) {
      return [];
    }
    const groups = new Map<string, EditEntry[]>();
    for (const entry of this.session.all()) {
      const label = agentLabel(entry);
      groups.set(label, [...(groups.get(label) ?? []), entry]);
    }
    if (groups.size <= 1) {
      return this.session.all().map((entry) => ({ kind: "file", entry }));
    }
    return [...groups].map(([label, entries]) => ({ kind: "group", label, entries }));
  }

  getTreeItem(node: EditNode): vscode.TreeItem {
    if (node.kind === "group") {
      const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
      const open = node.entries.filter((e) => !e.reviewed).length;
      item.description = vscode.l10n.t("{0} to review", open);
      item.iconPath = new vscode.ThemeIcon(node.entries[0]?.source === "git" ? "git-commit" : "hubot");
      item.contextValue = "group";
      return item;
    }

    const { entry } = node;
    const uri = vscode.Uri.file(entry.fsPath);
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    const { errors, warnings } = this.collector.counts(entry.fsPath);
    const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.None);
    const dir = path.dirname(displayPath(entry.fsPath, folder?.uri.fsPath));
    item.description = [dir === "." ? "" : dir, problemsSuffix(errors, warnings)].filter(Boolean).join("  ");
    item.checkboxState = entry.reviewed ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
    item.contextValue = entry.reviewed ? "aiEdit.reviewed" : "aiEdit.unreviewed";
    item.command = { command: "openfiles.openFile", title: vscode.l10n.t("Open File"), arguments: [uri] };

    const tooltip = new vscode.MarkdownString();
    tooltip.appendMarkdown(`**${displayPath(entry.fsPath, folder?.uri.fsPath)}**\n\n`);
    tooltip.appendMarkdown(`${vscode.l10n.t("By")}: ${agentLabel(entry)}${entry.tool ? ` (\`${entry.tool}\`)` : ""}\n\n`);
    tooltip.appendMarkdown(`${vscode.l10n.t("Last change")}: ${new Date(entry.lastSeen).toLocaleTimeString()} · ${vscode.l10n.t("{0} change(s)", entry.changes)}\n\n`);
    tooltip.appendMarkdown(`${vscode.l10n.t("Problems")}: ${errors} ${vscode.l10n.t("errors")}, ${warnings} ${vscode.l10n.t("warnings")}`);
    item.tooltip = tooltip;
    return item;
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
