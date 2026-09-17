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
exports.EditorOrigin = void 0;
const fs = __importStar(require("node:fs/promises"));
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
/**
 * Remembers saves and file operations done inside this editor, so the watcher
 * doesn't report the user's own work (including format-on-save) as an agent edit.
 */
class EditorOrigin {
    graceMs;
    saves = new Map();
    fileOps = new Map();
    disposables = [];
    constructor(graceMs) {
        this.graceMs = graceMs;
        const markSave = (doc) => {
            if (doc.uri.scheme === "file") {
                this.saves.set((0, paths_1.pathKey)(doc.uri.fsPath), Date.now());
            }
        };
        const markOp = (uris) => {
            const now = Date.now();
            for (const uri of uris) {
                this.fileOps.set((0, paths_1.pathKey)(uri.fsPath), now);
            }
        };
        this.disposables.push(vscode.workspace.onWillSaveTextDocument((e) => markSave(e.document)), vscode.workspace.onDidSaveTextDocument(markSave), vscode.workspace.onDidCreateFiles((e) => markOp(e.files)), vscode.workspace.onDidRenameFiles((e) => markOp(e.files.flatMap((f) => [f.oldUri, f.newUri]))));
    }
    async isEditorWrite(uri, at) {
        const key = (0, paths_1.pathKey)(uri.fsPath);
        const grace = this.graceMs();
        this.prune(at - grace * 4);
        const op = this.fileOps.get(key);
        if (op !== undefined && Math.abs(at - op) <= grace) {
            return true;
        }
        const saved = this.saves.get(key);
        if (saved === undefined || Math.abs(at - saved) > grace) {
            return false;
        }
        // Saved recently. If the disk still matches the buffer, the write was ours;
        // if not, something rewrote the file right after the save.
        const doc = vscode.workspace.textDocuments.find((d) => d.uri.scheme === "file" && (0, paths_1.pathKey)(d.uri.fsPath) === key);
        if (!doc) {
            return true;
        }
        try {
            return (await fs.readFile(uri.fsPath, "utf8")) === doc.getText();
        }
        catch {
            return true;
        }
    }
    prune(before) {
        for (const map of [this.saves, this.fileOps]) {
            for (const [key, at] of map) {
                if (at < before) {
                    map.delete(key);
                }
            }
        }
    }
    dispose() {
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.EditorOrigin = EditorOrigin;
//# sourceMappingURL=editorOrigin.js.map