import * as fs from "node:fs/promises";
import * as vscode from "vscode";
import { pathKey } from "../core/paths";
import type { EditEntry, EditSession, EditSource } from "../session/store";
import type { Settings } from "../shared/settings";
import { log } from "../shared/log";
import type { EditorOrigin } from "./editorOrigin";
import type { GitSignals } from "./git";
import type { IgnoreRules } from "./ignore";
import type { QueueEvent } from "./queue";

export interface AcceptedChange {
  entry: EditEntry;
  uri: vscode.Uri;
  sensitive: boolean;
}

export interface AcceptedBatch {
  changes: AcceptedChange[];
  source: EditSource;
  /** False for bulk results (git scans, bursts) that should be listed, not opened. */
  allowOpen: boolean;
}

const QUIET_MS = 1000;
const MAX_WAIT_MS = 3000;

export class Detector implements vscode.Disposable {
  private readonly accepted = new vscode.EventEmitter<AcceptedBatch>();
  readonly onDidAccept = this.accepted.event;

  private pending = new Map<string, { uri: vscode.Uri; at: number }>();
  private quietTimer: ReturnType<typeof setTimeout> | undefined;
  private batchStartedAt = 0;
  private paused = false;
  private readonly disposables: vscode.Disposable[] = [this.accepted];

  constructor(
    private readonly session: EditSession,
    private readonly ignore: IgnoreRules,
    private readonly origin: EditorOrigin,
    private readonly git: GitSignals,
    private readonly settings: () => Settings,
  ) {}

  start(): void {
    const watcher = vscode.workspace.createFileSystemWatcher("**/*", false, false, true);
    this.disposables.push(watcher, watcher.onDidCreate((uri) => this.onFsEvent(uri)), watcher.onDidChange((uri) => this.onFsEvent(uri)));
  }

  get isPaused(): boolean {
    return this.paused;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.pending.clear();
    }
  }

  private onFsEvent(uri: vscode.Uri): void {
    if (this.paused || !this.settings().detection.watcher || this.ignore.isIgnored(uri)) {
      return;
    }
    if (this.pending.size === 0) {
      this.batchStartedAt = Date.now();
    }
    this.pending.set(pathKey(uri.fsPath), { uri, at: Date.now() });
    if (this.quietTimer) {
      clearTimeout(this.quietTimer);
    }
    const wait = Math.max(0, Math.min(QUIET_MS, this.batchStartedAt + MAX_WAIT_MS - Date.now()));
    this.quietTimer = setTimeout(() => void this.flush(), wait);
  }

  private async flush(): Promise<void> {
    this.quietTimer = undefined;
    if (this.settings().detection.git && this.git.isBusy()) {
      this.quietTimer = setTimeout(() => void this.flush(), QUIET_MS);
      return;
    }
    const batch = [...this.pending.values()];
    this.pending.clear();

    const candidates: { uri: vscode.Uri; at: number }[] = [];
    for (const item of batch) {
      if (this.settings().detection.git && this.git.isGitOperation(item.at)) {
        continue;
      }
      if (!(await isFile(item.uri)) || (await this.origin.isEditorWrite(item.uri, item.at))) {
        continue;
      }
      candidates.push(item);
    }
    if (candidates.length === 0) {
      return;
    }

    const { burstLimit } = this.settings().detection;
    if (candidates.length > burstLimit) {
      log.info(`${candidates.length} files changed at once; asking before tracking them.`);
      const track = vscode.l10n.t("Track them");
      const choice = await vscode.window.showInformationMessage(
        vscode.l10n.t("{0} files changed at once (an install, build or checkout?). OpenFiles didn't open them.", candidates.length),
        track,
        vscode.l10n.t("Ignore"),
      );
      if (choice === track) {
        this.emit(candidates.map((c) => this.record(c.uri, "watcher", c.at)), "watcher", false);
      }
      return;
    }

    this.emit(candidates.map((c) => this.record(c.uri, "watcher", c.at)), "watcher", true);
  }

  handleHookEvents(events: readonly QueueEvent[]): void {
    if (this.paused || !this.settings().detection.hooks) {
      return;
    }
    const results = events.flatMap((event) =>
      event.paths
        .map((p) => vscode.Uri.file(p))
        .filter((uri) => !this.ignore.isIgnored(uri))
        .map((uri) => this.record(uri, "hook", Date.now(), event.agent, event.tool)),
    );
    this.emit(results, "hook", true);
  }

  async scanGit(): Promise<number> {
    const uris = (await this.git.changedFiles()).filter((uri) => !this.ignore.isIgnored(uri));
    const results: RecordOutcome[] = [];
    for (const uri of uris) {
      if (!this.session.has(uri.fsPath) && (await isFile(uri))) {
        results.push(this.record(uri, "git", Date.now()));
      }
    }
    this.emit(results, "git", false);
    return results.length;
  }

  private record(uri: vscode.Uri, source: EditSource, at: number, agent?: string, tool?: string): RecordOutcome {
    const result = this.session.record({ fsPath: uri.fsPath, source, agent, tool, at });
    return { uri, entry: result.entry, fresh: result.isNewChange };
  }

  private emit(results: readonly RecordOutcome[], source: EditSource, allowOpen: boolean): void {
    const changes = results
      .filter((r) => r.fresh)
      .map((r) => ({ entry: r.entry, uri: r.uri, sensitive: this.ignore.isSensitive(r.uri) }));
    if (changes.length > 0) {
      this.accepted.fire({ changes, source, allowOpen });
    }
  }

  dispose(): void {
    if (this.quietTimer) {
      clearTimeout(this.quietTimer);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}

interface RecordOutcome {
  uri: vscode.Uri;
  entry: EditEntry;
  fresh: boolean;
}

async function isFile(uri: vscode.Uri): Promise<boolean> {
  try {
    return (await fs.stat(uri.fsPath)).isFile();
  } catch {
    return false;
  }
}
