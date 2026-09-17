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
exports.EditsTree = void 0;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
const labels_1 = require("./labels");
class EditsTree {
    session;
    collector;
    emitter = new vscode.EventEmitter();
    onDidChangeTreeData = this.emitter.event;
    view;
    refreshTimer;
    disposables = [this.emitter];
    constructor(session, collector) {
        this.session = session;
        this.collector = collector;
        this.view = vscode.window.createTreeView("openfiles.aiEdits", {
            treeDataProvider: this,
            manageCheckboxStateManually: true,
            showCollapseAll: true,
        });
        this.disposables.push(this.view, this.view.onDidChangeCheckboxState((event) => {
            for (const [node, state] of event.items) {
                if (node.kind === "file") {
                    void vscode.commands.executeCommand(state === vscode.TreeItemCheckboxState.Checked ? "openfiles.markReviewed" : "openfiles.markUnreviewed", node);
                }
            }
        }), this.session.onDidChange(() => this.refresh()), this.collector.onDidChange(() => this.refresh()));
        this.refresh();
    }
    refresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.refreshTimer = setTimeout(() => {
            const unreviewed = this.session.unreviewed().length;
            this.view.badge = unreviewed > 0 ? { value: unreviewed, tooltip: vscode.l10n.t("{0} file(s) to review", unreviewed) } : undefined;
            this.emitter.fire();
        }, 100);
    }
    getChildren(node) {
        if (node?.kind === "group") {
            return node.entries.map((entry) => ({ kind: "file", entry }));
        }
        if (node) {
            return [];
        }
        const groups = new Map();
        for (const entry of this.session.all()) {
            const label = (0, labels_1.agentLabel)(entry);
            groups.set(label, [...(groups.get(label) ?? []), entry]);
        }
        if (groups.size <= 1) {
            return this.session.all().map((entry) => ({ kind: "file", entry }));
        }
        return [...groups].map(([label, entries]) => ({ kind: "group", label, entries }));
    }
    getTreeItem(node) {
        if (node.kind === "group") {
            const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
            const open = node.entries.filter((e) => !e.reviewed).length;
            item.description = vscode.l10n.t("{0} to review", open);
            item.iconPath = new vscode.ThemeIcon(node.entries[0]?.source === "git" ? "git-commit" : "hubot");
            item.contextValue = "group";
            return item;
        }
        const { entry } = node;
        const uri = vscode.Uri.file(entry.fsPath);
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        const { errors, warnings } = this.collector.counts(entry.fsPath);
        const item = new vscode.TreeItem(uri, vscode.TreeItemCollapsibleState.None);
        const dir = path.dirname((0, paths_1.displayPath)(entry.fsPath, folder?.uri.fsPath));
        item.description = [dir === "." ? "" : dir, (0, labels_1.problemsSuffix)(errors, warnings)].filter(Boolean).join("  ");
        item.checkboxState = entry.reviewed ? vscode.TreeItemCheckboxState.Checked : vscode.TreeItemCheckboxState.Unchecked;
        item.contextValue = entry.reviewed ? "aiEdit.reviewed" : "aiEdit.unreviewed";
        item.command = { command: "openfiles.openFile", title: vscode.l10n.t("Open File"), arguments: [uri] };
        const tooltip = new vscode.MarkdownString();
        tooltip.appendMarkdown(`**${(0, paths_1.displayPath)(entry.fsPath, folder?.uri.fsPath)}**\n\n`);
        tooltip.appendMarkdown(`${vscode.l10n.t("By")}: ${(0, labels_1.agentLabel)(entry)}${entry.tool ? ` (\`${entry.tool}\`)` : ""}\n\n`);
        tooltip.appendMarkdown(`${vscode.l10n.t("Last change")}: ${new Date(entry.lastSeen).toLocaleTimeString()} · ${vscode.l10n.t("{0} change(s)", entry.changes)}\n\n`);
        tooltip.appendMarkdown(`${vscode.l10n.t("Problems")}: ${errors} ${vscode.l10n.t("errors")}, ${warnings} ${vscode.l10n.t("warnings")}`);
        item.tooltip = tooltip;
        return item;
    }
    dispose() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.EditsTree = EditsTree;
//# sourceMappingURL=editsTree.js.map