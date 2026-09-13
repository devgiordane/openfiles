import * as vscode from "vscode";
import { pathKey } from "../core/paths";

export function urisFromTabInput(input: unknown): vscode.Uri[] {
  if (input instanceof vscode.TabInputText || input instanceof vscode.TabInputNotebook) {
    return [input.uri];
  }
  if (input instanceof vscode.TabInputTextDiff || input instanceof vscode.TabInputNotebookDiff) {
    return [input.original, input.modified];
  }
  return [];
}

export function openTabUris(): vscode.Uri[] {
  const files = new Map<string, vscode.Uri>();
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      for (const uri of urisFromTabInput(tab.input)) {
        if (uri.scheme === "file") {
          files.set(pathKey(uri.fsPath), uri);
        }
      }
    }
  }
  return [...files.values()].sort((a, b) => a.fsPath.localeCompare(b.fsPath));
}

export function tabsFor(fsPath: string): vscode.Tab[] {
  const key = pathKey(fsPath);
  return vscode.window.tabGroups.all.flatMap((group) =>
    group.tabs.filter((tab) =>
      urisFromTabInput(tab.input).some((uri) => uri.scheme === "file" && pathKey(uri.fsPath) === key),
    ),
  );
}

export function isOpenInTab(fsPath: string): boolean {
  return tabsFor(fsPath).length > 0;
}
