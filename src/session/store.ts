import { pathKey } from "../core/paths";

export type EditSource = "watcher" | "git" | "hook";

export interface EditEntry {
  key: string;
  fsPath: string;
  source: EditSource;
  agent?: string;
  tool?: string;
  firstSeen: number;
  lastSeen: number;
  changes: number;
  reviewed: boolean;
}

export interface RecordInput {
  fsPath: string;
  source: EditSource;
  agent?: string;
  tool?: string;
  at?: number;
}

export interface RecordResult {
  entry: EditEntry;
  isNew: boolean;
  /** False when the event was a duplicate report of an edit we already counted. */
  isNewChange: boolean;
}

/** A hook event and the watcher usually report the same write a few ms apart. */
export const DUPLICATE_WINDOW_MS = 2000;

const SOURCE_RANK: Record<EditSource, number> = { git: 0, watcher: 1, hook: 2 };

type Listener = () => void;

export class EditSession {
  private readonly entries = new Map<string, EditEntry>();
  private readonly listeners = new Set<Listener>();

  constructor(private readonly platform: NodeJS.Platform = process.platform) {}

  onDidChange(listener: Listener): { dispose(): void } {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  get size(): number {
    return this.entries.size;
  }

  get(fsPath: string): EditEntry | undefined {
    return this.entries.get(pathKey(fsPath, this.platform));
  }

  has(fsPath: string): boolean {
    return this.entries.has(pathKey(fsPath, this.platform));
  }

  /** Newest first. */
  all(): EditEntry[] {
    return [...this.entries.values()].sort((a, b) => b.lastSeen - a.lastSeen);
  }

  unreviewed(): EditEntry[] {
    return this.all().filter((entry) => !entry.reviewed);
  }

  record(input: RecordInput): RecordResult {
    const at = input.at ?? Date.now();
    const key = pathKey(input.fsPath, this.platform);
    const existing = this.entries.get(key);

    if (!existing) {
      const entry: EditEntry = {
        key,
        fsPath: input.fsPath,
        source: input.source,
        agent: input.agent,
        tool: input.tool,
        firstSeen: at,
        lastSeen: at,
        changes: 1,
        reviewed: false,
      };
      this.entries.set(key, entry);
      this.emit();
      return { entry, isNew: true, isNewChange: true };
    }

    // Watchers fire create+change for one write, and some agents report an edit through two hooks.
    const duplicate = Math.abs(at - existing.lastSeen) <= DUPLICATE_WINDOW_MS && !existing.reviewed;

    if (SOURCE_RANK[input.source] >= SOURCE_RANK[existing.source]) {
      existing.source = input.source;
      existing.agent = input.agent ?? existing.agent;
      existing.tool = input.tool ?? existing.tool;
    }
    existing.lastSeen = Math.max(existing.lastSeen, at);
    if (!duplicate) {
      existing.changes += 1;
      existing.reviewed = false;
    }
    this.emit();
    return { entry: existing, isNew: false, isNewChange: !duplicate };
  }

  setReviewed(fsPaths: readonly string[], reviewed: boolean): number {
    let changed = 0;
    for (const fsPath of fsPaths) {
      const entry = this.get(fsPath);
      if (entry && entry.reviewed !== reviewed) {
        entry.reviewed = reviewed;
        changed += 1;
      }
    }
    if (changed > 0) {
      this.emit();
    }
    return changed;
  }

  markAllReviewed(): number {
    return this.setReviewed(
      this.unreviewed().map((entry) => entry.fsPath),
      true,
    );
  }

  remove(fsPath: string): boolean {
    const removed = this.entries.delete(pathKey(fsPath, this.platform));
    if (removed) {
      this.emit();
    }
    return removed;
  }

  clear(): void {
    if (this.entries.size === 0) {
      return;
    }
    this.entries.clear();
    this.emit();
  }

  toJSON(): EditEntry[] {
    return this.all();
  }

  restore(entries: readonly EditEntry[] | undefined): void {
    this.entries.clear();
    for (const entry of entries ?? []) {
      if (entry && typeof entry.fsPath === "string") {
        const key = pathKey(entry.fsPath, this.platform);
        this.entries.set(key, { ...entry, key });
      }
    }
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
