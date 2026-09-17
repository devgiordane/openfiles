"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookQueue = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const log_1 = require("../shared/log");
const POLL_MS = 1000;
const TRUNCATE_AFTER_BYTES = 256 * 1024;
/** Tails `.openfiles/queue.jsonl`, where hook.js appends one line per agent edit. */
class HookQueue {
    onEvents;
    offsets = new Map();
    busy = new Set();
    disposables = [];
    timer;
    constructor(onEvents) {
        this.onEvents = onEvents;
    }
    async start() {
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
    async read(file) {
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
            }
            finally {
                await handle.close();
            }
            const text = buffer.toString("utf8");
            const lastNewline = text.lastIndexOf("\n");
            if (lastNewline < 0) {
                return;
            }
            offset += Buffer.byteLength(text.slice(0, lastNewline + 1));
            this.offsets.set(file, offset);
            const events = [];
            for (const line of text.slice(0, lastNewline).split("\n")) {
                try {
                    const parsed = JSON.parse(line);
                    if (Array.isArray(parsed.paths)) {
                        events.push(parsed);
                    }
                }
                catch {
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
        }
        catch (error) {
            log_1.log.warn(`Could not read hook queue ${file}: ${String(error)}`);
        }
        finally {
            this.busy.delete(file);
        }
    }
    dispose() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.HookQueue = HookQueue;
//# sourceMappingURL=queue.js.map