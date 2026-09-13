import * as fs from "node:fs/promises";
import * as vscode from "vscode";
import { pathKey } from "../core/paths";

/**
 * Remembers saves and file operations done inside this editor, so the watcher
 * doesn't report the user's own work (including format-on-save) as an agent edit.
 */
export class EditorOrigin implements vscode.Disposable {
  private readonly saves = new Map<string, number>();
  private readonly fileOps = new Map<string, number>();
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly graceMs: () => number) {
    const markSave = (doc: vscode.TextDocument) => {
      if (doc.uri.scheme === "file") {
        this.saves.set(pathKey(doc.uri.fsPath), Date.now());
      }
    };
    const markOp = (uris: readonly vscode.Uri[]) => {
      const now = Date.now();
      for (const uri of uris) {
        this.fileOps.set(pathKey(uri.fsPath), now);
      }
    };
    this.disposables.push(
      vscode.workspace.onWillSaveTextDocument((e) => markSave(e.document)),
      vscode.workspace.onDidSaveTextDocument(markSave),
      vscode.workspace.onDidCreateFiles((e) => markOp(e.files)),
      vscode.workspace.onDidRenameFiles((e) => markOp(e.files.flatMap((f) => [f.oldUri, f.newUri]))),
    );
  }

  async isEditorWrite(uri: vscode.Uri, at: number): Promise<boolean> {
    const key = pathKey(uri.fsPath);
    const grace = this.graceMs();
    this.prune(at - grace * 4);

    const op = this.fileOps.get(key);
    if (op !== undefined && Math.abs(at - op) <= grace) {
      return true;
    }
    const saved = this.saves.get(key);
    if (saved === undefined || Math.abs(at - saved) > grace) {
      return false;
    }
    // Saved recently. If the disk still matches the buffer, the write was ours;
    // if not, something rewrote the file right after the save.
    const doc = vscode.workspace.textDocuments.find((d) => d.uri.scheme === "file" && pathKey(d.uri.fsPath) === key);
    if (!doc) {
      return true;
    }
    try {
      return (await fs.readFile(uri.fsPath, "utf8")) === doc.getText();
    } catch {
      return true;
    }
  }

  private prune(before: number): void {
    for (const map of [this.saves, this.fileOps]) {
      for (const [key, at] of map) {
        if (at < before) {
          map.delete(key);
        }
      }
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
