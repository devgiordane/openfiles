import * as vscode from "vscode";
import { agentStatuses, type AgentStatus } from "../agents/detect";

export class AgentsTree implements vscode.TreeDataProvider<AgentStatus>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private readonly view: vscode.TreeView<AgentStatus>;

  constructor() {
    this.view = vscode.window.createTreeView("openfiles.agents", { treeDataProvider: this });
  }

  refresh(): void {
    this.emitter.fire();
  }

  async getChildren(node?: AgentStatus): Promise<AgentStatus[]> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (node || !root) {
      return [];
    }
    const statuses = await agentStatuses(root);
    // Show agents that are in use or already hooked; the rest only clutter the list.
    const relevant = statuses.filter((s) => s.detected || s.hookInstalled);
    return relevant.sort((a, b) => Number(b.hookInstalled) - Number(a.hookInstalled) || a.agent.name.localeCompare(b.agent.name));
  }

  getTreeItem(status: AgentStatus): vscode.TreeItem {
    const { agent } = status;
    const item = new vscode.TreeItem(agent.name, vscode.TreeItemCollapsibleState.None);
    const parts = [
      status.detected ? vscode.l10n.t("detected") : undefined,
      agent.hook ? (status.hookInstalled ? vscode.l10n.t("hook installed") : vscode.l10n.t("no hook")) : vscode.l10n.t("watcher only"),
      agent.beta ? vscode.l10n.t("beta") : undefined,
    ];
    item.description = parts.filter(Boolean).join(" · ");
    item.iconPath = new vscode.ThemeIcon(status.hookInstalled ? "pass-filled" : agent.hook ? "circle-large-outline" : "eye");
    item.contextValue = !agent.hook ? "agent.manual" : status.hookInstalled ? "agent.hooked" : "agent.noHook";
    item.tooltip = new vscode.MarkdownString(
      [
        `**${agent.name}**`,
        agent.feedback ? vscode.l10n.t("Its hook can send problems back to the agent.") : vscode.l10n.t("Edits are tracked; problems are not sent back automatically."),
        agent.hookDocs ? `[${vscode.l10n.t("Hook documentation")}](${agent.hookDocs})` : "",
      ].join("\n\n"),
    );
    if (agent.hookDocs) {
      item.command = { command: "vscode.open", title: agent.name, arguments: [vscode.Uri.parse(agent.hookDocs)] };
    }
    return item;
  }

  dispose(): void {
    this.view.dispose();
    this.emitter.dispose();
  }
}
