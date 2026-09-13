import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { log } from "../shared/log";

export interface QueueEvent {
  ts: number;
  agent: string;
  tool?: string;
  event?: string;
  paths: string[];
}

const POLL_MS = 1000;
const TRUNCATE_AFTER_BYTES = 256 * 1024;

/** Tails `.openfiles/queue.jsonl`, where hook.js appends one line per agent edit. */
export class HookQueue implements vscode.Disposable {
  private readonly offsets = new Map<string, number>();
  private readonly busy = new Set<string>();
  private readonly disposables: vscode.Disposable[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly onEvents: (events: QueueEvent[]) => void) {}

  async start(): Promise<void> {
    if (this.timer) {
      return;
    }
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const file = path.join(folder.uri.fsPath, ".openfiles", "queue.jsonl");
      // Events written while the editor was closed are stale; start from the end.
      this.offsets.set(file, await fs.stat(file).then((s) => s.size, () => 0));
      const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folder, ".openfiles/queue.jsonl"));
      watcher.onDidChange(() => void this.read(file));
      watcher.onDidCreate(() => void this.read(file));
      this.disposables.push(watcher);
    }
    // Watchers can miss events on network drives and some WSL setups; polling a stat is cheap.
    this.timer = setInterval(() => this.offsets.forEach((_, file) => void this.read(file)), POLL_MS);
  }

  private async read(file: string): Promise<void> {
    if (this.busy.has(file)) {
      return;
    }
    this.busy.add(file);
    try {
      const size = await fs.stat(file).then((s) => s.size, () => -1);
      let offset = this.offsets.get(file) ?? 0;
      if (size < 0) {
        return;
      }
      if (size < offset) {
        offset = 0;
      }
      if (size === offset) {
        return;
      }

      const handle = await fs.open(file, "r");
      const buffer = Buffer.alloc(size - offset);
      try {
        await handle.read(buffer, 0, buffer.length, offset);
      } finally {
        await handle.close();
      }

      const text = buffer.toString("utf8");
      const lastNewline = text.lastIndexOf("\n");
      if (lastNewline < 0) {
        return;
      }
      offset += Buffer.byteLength(text.slice(0, lastNewline + 1));
      this.offsets.set(file, offset);

      const events: QueueEvent[] = [];
      for (const line of text.slice(0, lastNewline).split("\n")) {
        try {
          const parsed = JSON.parse(line) as QueueEvent;
          if (Array.isArray(parsed.paths)) {
            events.push(parsed);
          }
        } catch {
          // A partial or foreign line; skip it.
        }
      }
      if (events.length > 0) {
        this.onEvents(events);
      }

      if (offset >= TRUNCATE_AFTER_BYTES && offset === size) {
        await fs.truncate(file, 0);
        this.offsets.set(file, 0);
      }
    } catch (error) {
      log.warn(`Could not read hook queue ${file}: ${String(error)}`);
    } finally {
      this.busy.delete(file);
    }
  }

  dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
