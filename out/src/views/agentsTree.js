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
exports.AgentsTree = void 0;
const vscode = __importStar(require("vscode"));
const detect_1 = require("../agents/detect");
class AgentsTree {
    emitter = new vscode.EventEmitter();
    onDidChangeTreeData = this.emitter.event;
    view;
    constructor() {
        this.view = vscode.window.createTreeView("openfiles.agents", { treeDataProvider: this });
    }
    refresh() {
        this.emitter.fire();
    }
    async getChildren(node) {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (node || !root) {
            return [];
        }
        const statuses = await (0, detect_1.agentStatuses)(root);
        // Show agents that are in use or already hooked; the rest only clutter the list.
        const relevant = statuses.filter((s) => s.detected || s.hookInstalled);
        return relevant.sort((a, b) => Number(b.hookInstalled) - Number(a.hookInstalled) || a.agent.name.localeCompare(b.agent.name));
    }
    getTreeItem(status) {
        const { agent } = status;
        const item = new vscode.TreeItem(agent.name, vscode.TreeItemCollapsibleState.None);
        const parts = [
            status.detected ? vscode.l10n.t("detected") : undefined,
            agent.hook ? (status.hookInstalled ? vscode.l10n.t("hook installed") : vscode.l10n.t("no hook")) : vscode.l10n.t("watcher only"),
            agent.beta ? vscode.l10n.t("beta") : undefined,
        ];
        item.description = parts.filter(Boolean).join(" · ");
        item.iconPath = new vscode.ThemeIcon(status.hookInstalled ? "pass-filled" : agent.hook ? "circle-large-outline" : "eye");
        item.contextValue = !agent.hook ? "agent.manual" : status.hookInstalled ? "agent.hooked" : "agent.noHook";
        item.tooltip = new vscode.MarkdownString([
            `**${agent.name}**`,
            agent.feedback ? vscode.l10n.t("Its hook can send problems back to the agent.") : vscode.l10n.t("Edits are tracked; problems are not sent back automatically."),
            agent.hookDocs ? `[${vscode.l10n.t("Hook documentation")}](${agent.hookDocs})` : "",
        ].join("\n\n"));
        if (agent.hookDocs) {
            item.command = { command: "vscode.open", title: agent.name, arguments: [vscode.Uri.parse(agent.hookDocs)] };
        }
        return item;
    }
    dispose() {
        this.view.dispose();
        this.emitter.dispose();
    }
}
exports.AgentsTree = AgentsTree;
//# sourceMappingURL=agentsTree.js.map