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
exports.Detector = void 0;
const fs = __importStar(require("node:fs/promises"));
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
const log_1 = require("../shared/log");
const QUIET_MS = 1000;
const MAX_WAIT_MS = 3000;
class Detector {
    session;
    ignore;
    origin;
    git;
    settings;
    accepted = new vscode.EventEmitter();
    onDidAccept = this.accepted.event;
    pending = new Map();
    quietTimer;
    batchStartedAt = 0;
    paused = false;
    disposables = [this.accepted];
    constructor(session, ignore, origin, git, settings) {
        this.session = session;
        this.ignore = ignore;
        this.origin = origin;
        this.git = git;
        this.settings = settings;
    }
    start() {
        const watcher = vscode.workspace.createFileSystemWatcher("**/*", false, false, true);
        this.disposables.push(watcher, watcher.onDidCreate((uri) => this.onFsEvent(uri)), watcher.onDidChange((uri) => this.onFsEvent(uri)));
    }
    get isPaused() {
        return this.paused;
    }
    setPaused(paused) {
        this.paused = paused;
        if (paused) {
            this.pending.clear();
        }
    }
    onFsEvent(uri) {
        if (this.paused || !this.settings().detection.watcher || this.ignore.isIgnored(uri)) {
            return;
        }
        if (this.pending.size === 0) {
            this.batchStartedAt = Date.now();
        }
        this.pending.set((0, paths_1.pathKey)(uri.fsPath), { uri, at: Date.now() });
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }
        const wait = Math.max(0, Math.min(QUIET_MS, this.batchStartedAt + MAX_WAIT_MS - Date.now()));
        this.quietTimer = setTimeout(() => void this.flush(), wait);
    }
    async flush() {
        this.quietTimer = undefined;
        if (this.settings().detection.git && this.git.isBusy()) {
            this.quietTimer = setTimeout(() => void this.flush(), QUIET_MS);
            return;
        }
        const batch = [...this.pending.values()];
        this.pending.clear();
        const candidates = [];
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
            log_1.log.info(`${candidates.length} files changed at once; asking before tracking them.`);
            const track = vscode.l10n.t("Track them");
            const choice = await vscode.window.showInformationMessage(vscode.l10n.t("{0} files changed at once (an install, build or checkout?). OpenFiles didn't open them.", candidates.length), track, vscode.l10n.t("Ignore"));
            if (choice === track) {
                this.emit(candidates.map((c) => this.record(c.uri, "watcher", c.at)), "watcher", false);
            }
            return;
        }
        this.emit(candidates.map((c) => this.record(c.uri, "watcher", c.at)), "watcher", true);
    }
    handleHookEvents(events) {
        if (this.paused || !this.settings().detection.hooks) {
            return;
        }
        const results = events.flatMap((event) => event.paths
            .map((p) => vscode.Uri.file(p))
            .filter((uri) => !this.ignore.isIgnored(uri))
            .map((uri) => this.record(uri, "hook", Date.now(), event.agent, event.tool)));
        this.emit(results, "hook", true);
    }
    async scanGit() {
        const uris = (await this.git.changedFiles()).filter((uri) => !this.ignore.isIgnored(uri));
        const results = [];
        for (const uri of uris) {
            if (!this.session.has(uri.fsPath) && (await isFile(uri))) {
                results.push(this.record(uri, "git", Date.now()));
            }
        }
        this.emit(results, "git", false);
        return results.length;
    }
    record(uri, source, at, agent, tool) {
        const result = this.session.record({ fsPath: uri.fsPath, source, agent, tool, at });
        return { uri, entry: result.entry, fresh: result.isNewChange };
    }
    emit(results, source, allowOpen) {
        const changes = results
            .filter((r) => r.fresh)
            .map((r) => ({ entry: r.entry, uri: r.uri, sensitive: this.ignore.isSensitive(r.uri) }));
        if (changes.length > 0) {
            this.accepted.fire({ changes, source, allowOpen });
        }
    }
    dispose() {
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.Detector = Detector;
async function isFile(uri) {
    try {
        return (await fs.stat(uri.fsPath)).isFile();
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=detector.js.map