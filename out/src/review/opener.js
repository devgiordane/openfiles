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
exports.Opener = void 0;
exports.openFile = openFile;
exports.openDiff = openDiff;
exports.closeTabs = closeTabs;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const tabs_1 = require("../bridge/tabs");
const labels_1 = require("../views/labels");
const log_1 = require("../shared/log");
/** Don't yank the editor away while someone is typing. */
const TYPING_IDLE_MS = 2000;
const TYPING_MAX_DEFER_MS = 15_000;
class Opener {
    settings;
    collector;
    autoOpened = 0;
    limitNoticeShown = false;
    lastTypingAt = 0;
    disposables = [];
    constructor(settings, collector) {
        this.settings = settings;
        this.collector = collector;
        this.disposables.push(vscode.workspace.onDidChangeTextDocument((event) => {
            const active = vscode.window.activeTextEditor?.document;
            if (event.document === active && event.contentChanges.length > 0 && event.document.isDirty) {
                this.lastTypingAt = Date.now();
            }
        }));
    }
    resetCount() {
        this.autoOpened = 0;
        this.limitNoticeShown = false;
    }
    async handle(batch) {
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
            const who = (0, labels_1.agentLabel)(openable[0].entry);
            const message = openable.length === 1
                ? vscode.l10n.t("{0} changed {1}.", who, path.basename(openable[0].uri.fsPath))
                : vscode.l10n.t("{0} changed {1} files.", who, openable.length);
            const choice = await vscode.window.showInformationMessage(message, open, review);
            if (choice === open) {
                await Promise.all(openable.map((change) => openFile(change.uri, true)));
            }
            else if (choice === review) {
                await vscode.commands.executeCommand("openfiles.aiEdits.focus");
            }
            return;
        }
        await this.waitForTypingPause();
        let skipped = 0;
        for (const change of openable) {
            if ((0, tabs_1.isOpenInTab)(change.uri.fsPath)) {
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
            void vscode.window.showInformationMessage(vscode.l10n.t("OpenFiles stopped auto-opening after {0} files. The rest are in the AI Edits view.", settings.maxAutoOpen));
        }
    }
    async waitForTypingPause() {
        const started = Date.now();
        while (Date.now() - this.lastTypingAt < TYPING_IDLE_MS && Date.now() - started < TYPING_MAX_DEFER_MS) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.Opener = Opener;
async function openFile(uri, preserveFocus = false, selection) {
    try {
        await vscode.window.showTextDocument(uri, { preview: false, preserveFocus, selection });
        return true;
    }
    catch (error) {
        // Binary files and huge files can't open as text; open them the way VS Code would.
        try {
            await vscode.commands.executeCommand("vscode.open", uri, { preview: false, preserveFocus });
            return true;
        }
        catch {
            log_1.log.warn(`Could not open ${uri.fsPath}: ${String(error)}`);
            return false;
        }
    }
}
async function openDiff(uri, git) {
    const head = git.headUri(uri);
    if (!head) {
        void vscode.window.showInformationMessage(vscode.l10n.t("{0} isn't in a Git repository, so there's nothing to diff against.", path.basename(uri.fsPath)));
        await openFile(uri);
        return;
    }
    const title = vscode.l10n.t("{0} (HEAD ↔ Working Tree)", path.basename(uri.fsPath));
    await vscode.commands.executeCommand("vscode.diff", head, uri, title, { preview: true });
}
async function closeTabs(fsPaths) {
    const tabs = fsPaths.flatMap((p) => (0, tabs_1.tabsFor)(p)).filter((tab) => !tab.isDirty);
    if (tabs.length > 0) {
        await vscode.window.tabGroups.close(tabs, true);
    }
}
//# sourceMappingURL=opener.js.map