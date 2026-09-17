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
exports.StatusBar = void 0;
exports.showStatusMenu = showStatusMenu;
exports.configureStatusBar = configureStatusBar;
const vscode = __importStar(require("vscode"));
const settings_1 = require("../shared/settings");
const labels_1 = require("../views/labels");
const render_1 = require("./render");
const CLICK_COMMANDS = {
    menu: "openfiles.statusBarMenu",
    reviewNext: "openfiles.reviewNext",
    openAiEdits: "openfiles.openAiEdits",
    showProblems: "openfiles.showProblems",
    focusSidebar: "openfiles.aiEdits.focus",
};
class StatusBar {
    session;
    collector;
    detector;
    settings;
    item;
    alignment;
    timer;
    disposables = [];
    constructor(session, collector, detector, settings) {
        this.session = session;
        this.collector = collector;
        this.detector = detector;
        this.settings = settings;
        this.disposables.push(session.onDidChange(() => this.update()), collector.onDidChange(() => this.update()));
        this.update();
    }
    update() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => this.render(), 100);
    }
    render() {
        const { statusBar } = this.settings();
        if (!statusBar.enabled || !vscode.workspace.workspaceFolders?.length) {
            this.item?.hide();
            return;
        }
        if (!this.item || this.alignment !== statusBar.alignment) {
            this.item?.dispose();
            this.alignment = statusBar.alignment;
            const alignment = statusBar.alignment === "right" ? vscode.StatusBarAlignment.Right : vscode.StatusBarAlignment.Left;
            this.item = vscode.window.createStatusBarItem("openfiles.status", alignment, 100);
            this.item.name = "OpenFiles";
        }
        const entries = this.session.all();
        const totals = this.collector.totals(entries);
        const unreviewed = entries.filter((e) => !e.reviewed).length;
        const latest = entries[0];
        const state = {
            edited: entries.length,
            unreviewed,
            errors: totals.errors,
            warnings: totals.warnings,
            agent: latest ? (0, labels_1.agentLabel)(latest) : undefined,
            paused: this.detector.isPaused,
        };
        this.item.text = (0, render_1.renderStatusText)(statusBar.items, state);
        this.item.command = CLICK_COMMANDS[statusBar.clickAction] ?? CLICK_COMMANDS.menu;
        this.item.backgroundColor = unreviewed > 0 && totals.errors > 0 ? new vscode.ThemeColor("statusBarItem.warningBackground") : undefined;
        const tooltip = new vscode.MarkdownString(undefined, true);
        tooltip.isTrusted = { enabledCommands: Object.values(CLICK_COMMANDS).concat("openfiles.configureStatusBar", "openfiles.togglePause") };
        tooltip.appendMarkdown(`**OpenFiles**${state.paused ? ` — ${vscode.l10n.t("paused")}` : ""}\n\n`);
        tooltip.appendMarkdown(`${vscode.l10n.t("{0} file(s) changed by agents, {1} not reviewed", entries.length, unreviewed)}\n\n`);
        tooltip.appendMarkdown(`${vscode.l10n.t("{0} errors, {1} warnings", totals.errors, totals.warnings)}\n\n`);
        tooltip.appendMarkdown([
            `[$(arrow-right) ${vscode.l10n.t("Review next")}](command:openfiles.reviewNext)`,
            `[$(warning) ${vscode.l10n.t("Problems")}](command:openfiles.showProblems)`,
            `[$(debug-pause) ${state.paused ? vscode.l10n.t("Resume") : vscode.l10n.t("Pause")}](command:openfiles.togglePause)`,
            `[$(settings-gear) ${vscode.l10n.t("Configure")}](command:openfiles.configureStatusBar)`,
        ].join(" · "));
        this.item.tooltip = tooltip;
        this.item.show();
    }
    dispose() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.item?.dispose();
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.StatusBar = StatusBar;
async function showStatusMenu(paused) {
    const items = [
        { label: `$(arrow-right) ${vscode.l10n.t("Review Next Changed File")}`, command: "openfiles.reviewNext" },
        { label: `$(files) ${vscode.l10n.t("Open AI-Edited Files")}`, command: "openfiles.openAiEdits" },
        { label: `$(warning) ${vscode.l10n.t("Show Problems in AI-Edited Files")}`, command: "openfiles.showProblems" },
        { label: `$(copy) ${vscode.l10n.t("Copy \"Fix These Problems\" Prompt")}`, command: "openfiles.copyFixPrompt" },
        { label: `$(check-all) ${vscode.l10n.t("Mark All as Reviewed")}`, command: "openfiles.markAllReviewed" },
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        { label: `$(debug-pause) ${paused ? vscode.l10n.t("Resume Watching") : vscode.l10n.t("Pause Watching")}`, command: "openfiles.togglePause" },
        { label: `$(git-compare) ${vscode.l10n.t("Add Uncommitted Git Changes")}`, command: "openfiles.scanGitChanges" },
        { label: `$(plug) ${vscode.l10n.t("Install Agent Hooks…")}`, command: "openfiles.installHooks" },
        { label: `$(comment-discussion) ${vscode.l10n.t("Copy a Prompt for Your Agent…")}`, command: "openfiles.copyAgentPrompt" },
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        { label: `$(settings-gear) ${vscode.l10n.t("Configure Status Bar…")}`, command: "openfiles.configureStatusBar" },
        { label: `$(pulse) ${vscode.l10n.t("Run Doctor")}`, command: "openfiles.doctor" },
        { label: `$(rocket) ${vscode.l10n.t("Get Started")}`, command: "openfiles.getStarted" },
    ];
    const picked = await vscode.window.showQuickPick(items, { placeHolder: "OpenFiles" });
    if (picked?.command) {
        await vscode.commands.executeCommand(picked.command);
    }
}
const ITEM_LABELS = () => ({
    edited: vscode.l10n.t("Files changed by agents"),
    unreviewed: vscode.l10n.t("Files not reviewed yet"),
    errors: vscode.l10n.t("Errors in those files"),
    warnings: vscode.l10n.t("Warnings in those files"),
    agent: vscode.l10n.t("Last agent that edited"),
    paused: vscode.l10n.t("Paused indicator"),
});
const CLICK_LABELS = () => ({
    menu: vscode.l10n.t("Show the OpenFiles menu"),
    reviewNext: vscode.l10n.t("Review the next changed file"),
    openAiEdits: vscode.l10n.t("Open all AI-edited files"),
    showProblems: vscode.l10n.t("Show problems in AI-edited files"),
    focusSidebar: vscode.l10n.t("Focus the OpenFiles sidebar"),
});
async function configureStatusBar(current) {
    const config = vscode.workspace.getConfiguration("openfiles");
    const labels = ITEM_LABELS();
    const itemPicks = settings_1.STATUS_ITEMS.map((id) => ({ id, label: labels[id], picked: current.items.includes(id) }));
    const items = await vscode.window.showQuickPick(itemPicks, {
        canPickMany: true,
        title: vscode.l10n.t("OpenFiles status bar (1/2): what should it show?"),
    });
    if (!items) {
        return;
    }
    // Keep the canonical order so the status bar reads the same everywhere.
    const chosen = settings_1.STATUS_ITEMS.filter((id) => items.some((i) => i.id === id));
    await config.update("statusBar.items", chosen, vscode.ConfigurationTarget.Global);
    const clickLabels = CLICK_LABELS();
    const click = await vscode.window.showQuickPick(settings_1.CLICK_ACTIONS.map((id) => ({ id, label: clickLabels[id], description: id === current.clickAction ? vscode.l10n.t("current") : undefined })), { title: vscode.l10n.t("OpenFiles status bar (2/2): what happens when you click it?") });
    if (click) {
        await config.update("statusBar.clickAction", click.id, vscode.ConfigurationTarget.Global);
    }
}
//# sourceMappingURL=statusBar.js.map