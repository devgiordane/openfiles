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
exports.LiveStateBridge = void 0;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const node_crypto_1 = require("node:crypto");
const vscode = __importStar(require("vscode"));
const openfilesDir_1 = require("../shared/openfilesDir");
const log_1 = require("../shared/log");
const tabs_1 = require("./tabs");
/**
 * Publishes the open tabs to `.openfiles/vscode/<id>.json`.
 * Agents can read it to see what the human is looking at; hook.js uses its freshness
 * to know an editor is running for this workspace.
 */
class LiveStateBridge {
    heartbeatSeconds;
    written = [];
    timer;
    disposables = [];
    constructor(heartbeatSeconds) {
        this.heartbeatSeconds = heartbeatSeconds;
    }
    start() {
        if (this.timer) {
            return;
        }
        void this.publish();
        this.timer = setInterval(() => void this.publish(), this.heartbeatSeconds() * 1000);
        this.disposables.push(vscode.window.tabGroups.onDidChangeTabs(() => void this.publish()));
    }
    async publish() {
        if (!vscode.workspace.isTrusted) {
            return;
        }
        const files = (0, tabs_1.openTabUris)().map((uri) => uri.fsPath);
        const next = [];
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const root = folder.uri.fsPath;
            try {
                const dir = await (0, openfilesDir_1.ensureOpenfilesDir)(root);
                const id = (0, node_crypto_1.createHash)("sha1").update(`${root}\0${vscode.env.sessionId}`).digest("hex");
                const file = path.join(dir, "vscode", `${id}.json`);
                const state = {
                    version: 1,
                    workspaceRoot: root,
                    sessionId: vscode.env.sessionId,
                    appName: vscode.env.appName,
                    updatedAt: Date.now() / 1000,
                    files,
                };
                await (0, openfilesDir_1.atomicWrite)(file, `${JSON.stringify(state, null, 2)}\n`);
                next.push(file);
            }
            catch (error) {
                log_1.log.warn(`Could not publish live state for ${root}: ${String(error)}`);
            }
        }
        this.written = next;
    }
    async dispose() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.disposables.forEach((d) => d.dispose());
        await Promise.all(this.written.map((file) => fs.unlink(file).catch(() => undefined)));
    }
}
exports.LiveStateBridge = LiveStateBridge;
//# sourceMappingURL=liveState.js.map