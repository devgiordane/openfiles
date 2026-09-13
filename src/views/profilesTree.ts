import * as vscode from "vscode";
import { readProfiles } from "../profiles/profiles";
import type { Settings } from "../shared/settings";

export class ProfilesTree implements vscode.TreeDataProvider<string>, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private readonly view: vscode.TreeView<string>;
  private defaultProfile: string | undefined;

  constructor(private readonly settings: () => Settings) {
    this.view = vscode.window.createTreeView("openfiles.profiles", { treeDataProvider: this });
  }

  refresh(): void {
    this.emitter.fire();
  }

  async getChildren(node?: string): Promise<string[]> {
    if (node) {
      return [];
    }
    const found = await readProfiles(this.settings().configFile);
    this.defaultProfile = found?.config.defaultProfile;
    return Object.keys(found?.config.profiles ?? {}).sort();
  }

  getTreeItem(name: string): vscode.TreeItem {
    const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None);
    item.iconPath = new vscode.ThemeIcon("layers");
    item.description = name === this.defaultProfile ? vscode.l10n.t("default") : undefined;
    item.contextValue = "profile";
    item.command = { command: "openfiles.openProfile", title: vscode.l10n.t("Open Profile"), arguments: [name] };
    return item;
  }

  dispose(): void {
    this.view.dispose();
    this.emitter.dispose();
  }
}
