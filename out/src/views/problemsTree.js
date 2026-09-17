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
exports.ProblemsTree = void 0;
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
const labels_1 = require("./labels");
class ProblemsTree {
    session;
    collector;
    emitter = new vscode.EventEmitter();
    onDidChangeTreeData = this.emitter.event;
    view;
    disposables = [this.emitter];
    timer;
    constructor(session, collector) {
        this.session = session;
        this.collector = collector;
        this.view = vscode.window.createTreeView("openfiles.problems", { treeDataProvider: this, showCollapseAll: true });
        this.disposables.push(this.view, this.collector.onDidChange(() => this.refresh()));
    }
    refresh() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            const { errors, warnings } = this.collector.totals();
            const total = errors + warnings;
            this.view.badge = total > 0 ? { value: total, tooltip: vscode.l10n.t("{0} errors, {1} warnings", errors, warnings) } : undefined;
            this.emitter.fire();
        }, 150);
    }
    getChildren(node) {
        if (!node) {
            return this.session
                .all()
                .filter((entry) => this.collector.diagnostics(entry.fsPath).length > 0)
                .sort((a, b) => this.collector.counts(b.fsPath).errors - this.collector.counts(a.fsPath).errors)
                .map((entry) => ({ kind: "file", entry }));
        }
        if (node.kind === "file") {
            return this.collector.diagnostics(node.entry.fsPath).map((diagnostic) => ({ kind: "problem", entry: node.entry, diagnostic }));
        }
        return [];
    }
    getTreeItem(node) {
        const uri = vscode.Uri.file(node.entry.fsPath);
        if (node.kind === "file") {
            const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.Expanded);
            const { errors, warnings } = this.collector.counts(node.entry.fsPath);
            const folder = vscode.workspace.getWorkspaceFolder(uri);
            item.description = `${(0, paths_1.displayPath)(node.entry.fsPath, folder?.uri.fsPath)}  ${(0, labels_1.problemsSuffix)(errors, warnings)}`;
            item.contextValue = "problem.file";
            return item;
        }
        const { diagnostic } = node;
        const item = new vscode.TreeItem(diagnostic.message.split("\n")[0], vscode.TreeItemCollapsibleState.None);
        const code = typeof diagnostic.code === "object" ? diagnostic.code.value : diagnostic.code;
        item.description = `${diagnostic.source ?? ""}${code !== undefined ? `(${code})` : ""} [${diagnostic.range.start.line + 1}, ${diagnostic.range.start.character + 1}]`;
        item.iconPath = new vscode.ThemeIcon(diagnostic.severity === vscode.DiagnosticSeverity.Error ? "error" : "warning", new vscode.ThemeColor(diagnostic.severity === vscode.DiagnosticSeverity.Error ? "problemsErrorIcon.foreground" : "problemsWarningIcon.foreground"));
        item.tooltip = diagnostic.message;
        item.command = {
            command: "vscode.open",
            title: vscode.l10n.t("Open File"),
            arguments: [uri, { selection: diagnostic.range, preview: false }],
        };
        return item;
    }
    dispose() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.ProblemsTree = ProblemsTree;
//# sourceMappingURL=problemsTree.js.map