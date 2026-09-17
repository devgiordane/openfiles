"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditSession = exports.DUPLICATE_WINDOW_MS = void 0;
const paths_1 = require("../core/paths");
/** A hook event and the watcher usually report the same write a few ms apart. */
exports.DUPLICATE_WINDOW_MS = 2000;
const SOURCE_RANK = { git: 0, watcher: 1, hook: 2 };
class EditSession {
    platform;
    entries = new Map();
    listeners = new Set();
    constructor(platform = process.platform) {
        this.platform = platform;
    }
    onDidChange(listener) {
        this.listeners.add(listener);
        return { dispose: () => this.listeners.delete(listener) };
    }
    get size() {
        return this.entries.size;
    }
    get(fsPath) {
        return this.entries.get((0, paths_1.pathKey)(fsPath, this.platform));
    }
    has(fsPath) {
        return this.entries.has((0, paths_1.pathKey)(fsPath, this.platform));
    }
    /** Newest first. */
    all() {
        return [...this.entries.values()].sort((a, b) => b.lastSeen - a.lastSeen);
    }
    unreviewed() {
        return this.all().filter((entry) => !entry.reviewed);
    }
    record(input) {
        const at = input.at ?? Date.now();
        const key = (0, paths_1.pathKey)(input.fsPath, this.platform);
        const existing = this.entries.get(key);
        if (!existing) {
            const entry = {
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
        const duplicate = Math.abs(at - existing.lastSeen) <= exports.DUPLICATE_WINDOW_MS && !existing.reviewed;
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
    setReviewed(fsPaths, reviewed) {
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
    markAllReviewed() {
        return this.setReviewed(this.unreviewed().map((entry) => entry.fsPath), true);
    }
    remove(fsPath) {
        const removed = this.entries.delete((0, paths_1.pathKey)(fsPath, this.platform));
        if (removed) {
            this.emit();
        }
        return removed;
    }
    clear() {
        if (this.entries.size === 0) {
            return;
        }
        this.entries.clear();
        this.emit();
    }
    toJSON() {
        return this.all();
    }
    restore(entries) {
        this.entries.clear();
        for (const entry of entries ?? []) {
            if (entry && typeof entry.fsPath === "string") {
                const key = (0, paths_1.pathKey)(entry.fsPath, this.platform);
                this.entries.set(key, { ...entry, key });
            }
        }
        this.emit();
    }
    emit() {
        for (const listener of this.listeners) {
            listener();
        }
    }
}
exports.EditSession = EditSession;
//# sourceMappingURL=store.js.map