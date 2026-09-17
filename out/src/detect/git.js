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
exports.GitSignals = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const log_1 = require("../shared/log");
/** Suppress watcher events this long around a HEAD change (checkout, pull, rebase…). */
const HEAD_CHANGE_WINDOW_MS = 5000;
class GitSignals {
    api;
    heads = new Map();
    lastHeadChange = 0;
    disposables = [];
    async init() {
        try {
            const extension = vscode.extensions.getExtension("vscode.git");
            if (!extension) {
                return;
            }
            const exports = extension.isActive ? extension.exports : await extension.activate();
            this.api = exports.getAPI(1);
            this.api.repositories.forEach((repo) => this.track(repo));
            this.disposables.push(this.api.onDidOpenRepository((repo) => this.track(repo)));
        }
        catch (error) {
            log_1.log.warn(`Git extension unavailable: ${String(error)}`);
        }
    }
    get available() {
        return this.api !== undefined;
    }
    track(repo) {
        const root = repo.rootUri.fsPath;
        this.heads.set(root, repo.state.HEAD?.commit);
        this.disposables.push(repo.state.onDidChange(() => {
            const commit = repo.state.HEAD?.commit;
            if (commit !== this.heads.get(root)) {
                this.heads.set(root, commit);
                this.lastHeadChange = Date.now();
                log_1.log.info(`HEAD moved in ${root}; ignoring file changes around it.`);
            }
        }));
    }
    /** True when changes at `at` are likely part of a git operation rather than an edit. */
    isGitOperation(at) {
        return Math.abs(at - this.lastHeadChange) <= HEAD_CHANGE_WINDOW_MS;
    }
    /** A git command holding the index lock is probably rewriting the working tree right now. */
    isBusy() {
        return (vscode.workspace.workspaceFolders ?? []).some((folder) => {
            const gitDir = path.join(folder.uri.fsPath, ".git");
            return ["index.lock", "rebase-merge", "rebase-apply", "MERGE_HEAD"].some((name) => fs.existsSync(path.join(gitDir, name)));
        });
    }
    async changedFiles() {
        if (!this.api) {
            return [];
        }
        const uris = new Map();
        for (const repo of this.api.repositories) {
            const { workingTreeChanges, indexChanges, untrackedChanges = [] } = repo.state;
            for (const change of [...workingTreeChanges, ...indexChanges, ...untrackedChanges]) {
                uris.set(change.uri.toString(), change.uri);
            }
        }
        return [...uris.values()];
    }
    headUri(uri) {
        if (!this.api?.getRepository(uri)) {
            return undefined;
        }
        return this.api.toGitUri(uri, "HEAD");
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.GitSignals = GitSignals;
//# sourceMappingURL=git.js.map