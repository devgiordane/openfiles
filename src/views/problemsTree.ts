import * as vscode from "vscode";
import { displayPath } from "../core/paths";
import type { DiagnosticsCollector } from "../diagnostics/collector";
import type { EditEntry, EditSession } from "../session/store";
import { problemsSuffix } from "./labels";

type ProblemNode = { kind: "file"; entry: EditEntry } | { kind: "problem"; entry: EditEntry; diagnostic: vscode.Diagnostic };

export class ProblemsTree implements vscode.TreeDataProvider<ProblemNode>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private readonly view: vscode.TreeView<ProblemNode>;
  private readonly disposables: vscode.Disposable[] = [this.emitter];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly session: EditSession,
    private readonly collector: DiagnosticsCollector,
  ) {
    this.view = vscode.window.createTreeView("openfiles.problems", { treeDataProvider: this, showCollapseAll: true });
    this.disposables.push(this.view, this.collector.onDidChange(() => this.refresh()));
  }

  refresh(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      const { errors, warnings } = this.collector.totals();
      const total = errors + warnings;
      this.view.badge = total > 0 ? { value: total, tooltip: vscode.l10n.t("{0} errors, {1} warnings", errors, warnings) } : undefined;
      this.emitter.fire();
    }, 150);
  }

  getChildren(node?: ProblemNode): ProblemNode[] {
    if (!node) {
      return this.session
        .all()
        .filter((entry) => this.collector.diagnostics(entry.fsPath).length > 0)
        .sort((a, b) => this.collector.counts(b.fsPath).errors - this.collector.counts(a.fsPath).errors)
        .map((entry) => ({ kind: "file", entry }));
    }
    if (node.kind === "file") {
      return this.collector.diagnostics(node.entry.fsPath).map((diagnostic) => ({ kind: "problem", entry: node.entry, diagnostic }));
    }
    return [];
  }

  getTreeItem(node: ProblemNode): vscode.TreeItem {
    const uri = vscode.Uri.file(node.entry.fsPath);
    if (node.kind === "file") {
      const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.Expanded);
      const { errors, warnings } = this.collector.counts(node.entry.fsPath);
      const folder = vscode.workspace.getWorkspaceFolder(uri);
      item.description = `${displayPath(node.entry.fsPath, folder?.uri.fsPath)}  ${problemsSuffix(errors, warnings)}`;
      item.contextValue = "problem.file";
      return item;
    }
    const { diagnostic } = node;
    const item = new vscode.TreeItem(diagnostic.message.split("\n")[0], vscode.TreeItemCollapsibleState.None);
    const code = typeof diagnostic.code === "object" ? diagnostic.code.value : diagnostic.code;
    item.description = `${diagnostic.source ?? ""}${code !== undefined ? `(${code})` : ""} [${diagnostic.range.start.line + 1}, ${diagnostic.range.start.character + 1}]`;
    item.iconPath = new vscode.ThemeIcon(
      diagnostic.severity === vscode.DiagnosticSeverity.Error ? "error" : "warning",
      new vscode.ThemeColor(diagnostic.severity === vscode.DiagnosticSeverity.Error ? "problemsErrorIcon.foreground" : "problemsWarningIcon.foreground"),
    );
    item.tooltip = diagnostic.message;
    item.command = {
      command: "vscode.open",
      title: vscode.l10n.t("Open File"),
      arguments: [uri, { selection: diagnostic.range, preview: false }],
    };
    return item;
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
