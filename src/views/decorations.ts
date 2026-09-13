import * as vscode from "vscode";
import type { EditSession } from "../session/store";
import { agentLabel } from "./labels";

export class AiEditDecorations implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<undefined>();
  readonly onDidChangeFileDecorations = this.emitter.event;
  private readonly subscription: vscode.Disposable;

  constructor(private readonly session: EditSession) {
    this.subscription = session.onDidChange(() => this.emitter.fire(undefined));
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (uri.scheme !== "file") {
      return undefined;
    }
    const entry = this.session.get(uri.fsPath);
    if (!entry || entry.reviewed) {
      return undefined;
    }
    return {
      badge: "AI",
      tooltip: vscode.l10n.t("Changed by {0}, not reviewed yet", agentLabel(entry)),
      color: new vscode.ThemeColor("openfiles.unreviewedForeground"),
    };
  }

  dispose(): void {
    this.subscription.dispose();
    this.emitter.dispose();
  }
}
