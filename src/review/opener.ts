import * as path from "node:path";
import * as vscode from "vscode";
import type { AcceptedBatch } from "../detect/detector";
import type { GitSignals } from "../detect/git";
import type { DiagnosticsCollector } from "../diagnostics/collector";
import type { Settings } from "../shared/settings";
import { isOpenInTab, tabsFor } from "../bridge/tabs";
import { agentLabel } from "../views/labels";
import { log } from "../shared/log";

/** Don't yank the editor away while someone is typing. */
const TYPING_IDLE_MS = 2000;
const TYPING_MAX_DEFER_MS = 15_000;

export class Opener implements vscode.Disposable {
  private autoOpened = 0;
  private limitNoticeShown = false;
  private lastTypingAt = 0;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly settings: () => Settings,
    private readonly collector: DiagnosticsCollector,
  ) {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        const active = vscode.window.activeTextEditor?.document;
        if (event.document === active && event.contentChanges.length > 0 && event.document.isDirty) {
          this.lastTypingAt = Date.now();
        }
      }),
    );
  }

  resetCount(): void {
    this.autoOpened = 0;
    this.limitNoticeShown = false;
  }

  async handle(batch: AcceptedBatch): Promise<void> {
    for (const change of batch.changes) {
      this.collector.track(change.entry.fsPath);
    }
    const settings = this.settings();
    const openable = batch.changes.filter((change) => !change.sensitive);
    if (!batch.allowOpen || settings.mode === "queue" || openable.length === 0) {
      return;
    }

    if (settings.mode === "notify") {
      const open = vscode.l10n.t("Open");
      const review = vscode.l10n.t("Review");
      const who = agentLabel(openable[0].entry);
      const message =
        openable.length === 1
          ? vscode.l10n.t("{0} changed {1}.", who, path.basename(openable[0].uri.fsPath))
          : vscode.l10n.t("{0} changed {1} files.", who, openable.length);
      const choice = await vscode.window.showInformationMessage(message, open, review);
      if (choice === open) {
        await Promise.all(openable.map((change) => openFile(change.uri, true)));
      } else if (choice === review) {
        await vscode.commands.executeCommand("openfiles.aiEdits.focus");
      }
      return;
    }

    await this.waitForTypingPause();
    let skipped = 0;
    for (const change of openable) {
      if (isOpenInTab(change.uri.fsPath)) {
        continue; // VS Code reloads it from disk; diagnostics refresh on their own.
      }
      if (this.autoOpened >= settings.maxAutoOpen) {
        skipped += 1;
        continue;
      }
      if (await openFile(change.uri, settings.openInBackground)) {
        this.autoOpened += 1;
      }
    }

    if (skipped > 0 && !this.limitNoticeShown) {
      this.limitNoticeShown = true;
      void vscode.window.showInformationMessage(
        vscode.l10n.t("OpenFiles stopped auto-opening after {0} files. The rest are in the AI Edits view.", settings.maxAutoOpen),
      );
    }
  }

  private async waitForTypingPause(): Promise<void> {
    const started = Date.now();
    while (Date.now() - this.lastTypingAt < TYPING_IDLE_MS && Date.now() - started < TYPING_MAX_DEFER_MS) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

export async function openFile(uri: vscode.Uri, preserveFocus = false, selection?: vscode.Range): Promise<boolean> {
  try {
    await vscode.window.showTextDocument(uri, { preview: false, preserveFocus, selection });
    return true;
  } catch (error) {
    // Binary files and huge files can't open as text; open them the way VS Code would.
    try {
      await vscode.commands.executeCommand("vscode.open", uri, { preview: false, preserveFocus });
      return true;
    } catch {
      log.warn(`Could not open ${uri.fsPath}: ${String(error)}`);
      return false;
    }
  }
}

export async function openDiff(uri: vscode.Uri, git: GitSignals): Promise<void> {
  const head = git.headUri(uri);
  if (!head) {
    void vscode.window.showInformationMessage(vscode.l10n.t("{0} isn't in a Git repository, so there's nothing to diff against.", path.basename(uri.fsPath)));
    await openFile(uri);
    return;
  }
  const title = vscode.l10n.t("{0} (HEAD ↔ Working Tree)", path.basename(uri.fsPath));
  await vscode.commands.executeCommand("vscode.diff", head, uri, title, { preview: true });
}

export async function closeTabs(fsPaths: readonly string[]): Promise<void> {
  const tabs = fsPaths.flatMap((p) => tabsFor(p)).filter((tab) => !tab.isDirty);
  if (tabs.length > 0) {
    await vscode.window.tabGroups.close(tabs, true);
  }
}
