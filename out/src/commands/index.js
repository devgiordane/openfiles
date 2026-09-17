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
exports.registerCommands = registerCommands;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
const format_1 = require("../diagnostics/format");
const tabs_1 = require("../bridge/tabs");
const doctor_1 = require("../onboarding/doctor");
const profiles_1 = require("../profiles/profiles");
const templates_1 = require("../prompts/templates");
const opener_1 = require("../review/opener");
const statusBar_1 = require("../statusbar/statusBar");
const log_1 = require("../shared/log");
const DOCS_URL = "https://devgiordane.github.io/openfiles";
/** Commands get a Uri from explorer/editor menus, a tree node from our views, or nothing from the palette. */
function resolveUris(arg, selection) {
    const items = Array.isArray(selection) && selection.length > 0 ? selection : [arg];
    const uris = [];
    for (const item of items) {
        if (item instanceof vscode.Uri) {
            uris.push(item);
        }
        else if (item && typeof item === "object" && "entry" in item) {
            uris.push(vscode.Uri.file(item.entry.fsPath));
        }
    }
    if (uris.length === 0) {
        const active = vscode.window.activeTextEditor?.document.uri;
        if (active?.scheme === "file") {
            uris.push(active);
        }
    }
    return uris;
}
function problemsText(s, entries) {
    return (0, format_1.formatForAgent)(entries.map((entry) => s.collector.toFileDiagnostics(entry)), {
        level: "errorsAndWarnings",
        displayPath: (p) => (0, paths_1.displayPath)(p, vscode.workspace.getWorkspaceFolder(vscode.Uri.file(p))?.uri.fsPath),
    });
}
function relativeFiles(entries) {
    return entries.map((e) => (0, paths_1.displayPath)(e.fsPath, vscode.workspace.getWorkspaceFolder(vscode.Uri.file(e.fsPath))?.uri.fsPath));
}
async function setReviewed(s, uris, reviewed) {
    const paths = uris.map((u) => u.fsPath).filter((p) => s.session.has(p));
    s.session.setReviewed(paths, reviewed);
    if (reviewed && s.settings().closeReviewedTabs) {
        await (0, opener_1.closeTabs)(paths);
    }
}
async function reviewNext(s) {
    const active = vscode.window.activeTextEditor?.document.uri;
    const current = active?.scheme === "file" ? s.session.get(active.fsPath) : undefined;
    if (current && !current.reviewed) {
        await setReviewed(s, [active], true);
    }
    const next = s.session
        .unreviewed()
        .sort((a, b) => s.collector.counts(b.fsPath).errors - s.collector.counts(a.fsPath).errors || a.firstSeen - b.firstSeen)[0];
    if (!next) {
        void vscode.window.showInformationMessage(vscode.l10n.t("All caught up. Every AI-edited file is reviewed."));
        return;
    }
    await (0, opener_1.openFile)(vscode.Uri.file(next.fsPath));
}
async function openAiEdits(s) {
    const unreviewed = s.session.unreviewed();
    const entries = unreviewed.length > 0 ? unreviewed : s.session.all();
    if (entries.length === 0) {
        void vscode.window.showInformationMessage(vscode.l10n.t("No AI-edited files yet."));
        return;
    }
    if (entries.length > 25) {
        const open = vscode.l10n.t("Open {0} files", entries.length);
        if ((await vscode.window.showWarningMessage(vscode.l10n.t("That's a lot of tabs."), { modal: true }, open)) !== open) {
            return;
        }
    }
    for (const entry of entries) {
        await (0, opener_1.openFile)(vscode.Uri.file(entry.fsPath), true);
    }
}
function promptLabel(template) {
    switch (template.id) {
        case "agents-md":
            return { label: vscode.l10n.t("Instructions for AGENTS.md / CLAUDE.md"), detail: vscode.l10n.t("Tells your agent to read the problems OpenFiles collects before it says it's done.") };
        case "fix-problems":
            return { label: vscode.l10n.t("Fix the problems in AI-edited files"), detail: vscode.l10n.t("Includes the current errors and warnings, with file and line.") };
        case "small-steps":
            return { label: vscode.l10n.t("Work in small steps and check as you go"), detail: vscode.l10n.t("Good at the start of a big task.") };
        case "review-handoff":
            return { label: vscode.l10n.t("Write a PR description for these changes"), detail: vscode.l10n.t("Lists the changed files and any problems left.") };
        case "setup":
            return { label: vscode.l10n.t("Ask your agent to set up OpenFiles"), detail: vscode.l10n.t("Adds the instructions block; hooks stay a one-click install here.") };
    }
}
async function copyAgentPrompt(s) {
    const entries = s.session.unreviewed();
    const context = { docsUrl: DOCS_URL, problems: problemsText(s, entries), changedFiles: relativeFiles(entries.length ? entries : s.session.all()) };
    const picked = await vscode.window.showQuickPick(templates_1.PROMPTS.map((template) => ({ ...promptLabel(template), template })), { title: vscode.l10n.t("Copy a prompt for your agent"), matchOnDetail: true });
    if (!picked) {
        return;
    }
    const text = picked.template.build(context);
    await vscode.env.clipboard.writeText(text);
    if (picked.template.id !== "agents-md" || !vscode.workspace.isTrusted) {
        void vscode.window.showInformationMessage(vscode.l10n.t("Copied. Paste it into your agent."));
        return;
    }
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
        return;
    }
    const candidates = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];
    const present = (await Promise.all(candidates.map((name) => fs.access(path.join(root, name)).then(() => name, () => undefined)))).filter((name) => !!name);
    const targets = present.length > 0 ? present : ["AGENTS.md"];
    const choice = await vscode.window.showInformationMessage(vscode.l10n.t("Copied. Want OpenFiles to add it to your instructions file?"), ...targets.map((name) => vscode.l10n.t("Add to {0}", name)));
    const target = targets.find((name) => choice === vscode.l10n.t("Add to {0}", name));
    if (!target) {
        return;
    }
    const file = path.join(root, target);
    const existing = await fs.readFile(file, "utf8").catch(() => "");
    await fs.writeFile(file, (0, templates_1.upsertInstructions)(existing, text), "utf8");
    await vscode.window.showTextDocument(vscode.Uri.file(file), { preview: false });
}
async function copyFixPrompt(s) {
    const entries = s.session.unreviewed().length > 0 ? s.session.unreviewed() : s.session.all();
    const fix = templates_1.PROMPTS.find((p) => p.id === "fix-problems");
    const problems = problemsText(s, entries);
    await vscode.env.clipboard.writeText(fix.build({ docsUrl: DOCS_URL, problems, changedFiles: relativeFiles(entries) }));
    void vscode.window.showInformationMessage(problems ? vscode.l10n.t("Copied the problems and a fix prompt. Paste it into your agent.") : vscode.l10n.t("No problems right now, copied a short note instead."));
}
function registerCommands(s) {
    const register = (id, handler) => vscode.commands.registerCommand(id, async (...args) => {
        try {
            await handler(...args);
        }
        catch (error) {
            log_1.log.error(`Command ${id} failed`, error);
            void vscode.window.showErrorMessage(`OpenFiles: ${String(error)}`);
        }
    });
    return [
        register("openfiles.openAiEdits", () => openAiEdits(s)),
        register("openfiles.reviewNext", () => reviewNext(s)),
        register("openfiles.markReviewed", (arg, selection) => setReviewed(s, resolveUris(arg, selection), true)),
        register("openfiles.markUnreviewed", (arg, selection) => setReviewed(s, resolveUris(arg, selection), false)),
        register("openfiles.markAllReviewed", async () => {
            const paths = s.session.unreviewed().map((e) => e.fsPath);
            s.session.markAllReviewed();
            if (s.settings().closeReviewedTabs) {
                await (0, opener_1.closeTabs)(paths);
            }
        }),
        register("openfiles.openDiff", async (arg) => {
            const [uri] = resolveUris(arg);
            if (uri) {
                await (0, opener_1.openDiff)(uri, s.git);
            }
        }),
        register("openfiles.openFile", async (arg) => {
            const [uri] = resolveUris(arg);
            if (uri) {
                await (0, opener_1.openFile)(uri);
            }
        }),
        register("openfiles.removeFromSession", (arg, selection) => {
            for (const uri of resolveUris(arg, selection)) {
                s.session.remove(uri.fsPath);
            }
        }),
        register("openfiles.showProblems", async () => {
            await vscode.commands.executeCommand("openfiles.problems.focus");
        }),
        register("openfiles.copyFixPrompt", () => copyFixPrompt(s)),
        register("openfiles.copyAgentPrompt", () => copyAgentPrompt(s)),
        register("openfiles.installHooks", (arg) => s.installer.install(agentIdFrom(arg))),
        register("openfiles.removeHooks", (arg) => s.installer.remove(agentIdFrom(arg))),
        register("openfiles.clearSession", () => {
            s.session.clear();
            s.opener.resetCount();
        }),
        register("openfiles.togglePause", async () => {
            s.detector.setPaused(!s.detector.isPaused);
            await vscode.commands.executeCommand("setContext", "openfiles.paused", s.detector.isPaused);
            s.statusBar.update();
            void vscode.window.setStatusBarMessage(s.detector.isPaused ? vscode.l10n.t("OpenFiles paused") : vscode.l10n.t("OpenFiles watching again"), 3000);
        }),
        register("openfiles.scanGitChanges", async () => {
            if (!s.git.available) {
                void vscode.window.showWarningMessage(vscode.l10n.t("The Git extension isn't available in this window."));
                return;
            }
            const added = await s.detector.scanGit();
            void vscode.window.showInformationMessage(vscode.l10n.t("Added {0} uncommitted file(s) to AI Edits.", added));
        }),
        register("openfiles.configureStatusBar", () => (0, statusBar_1.configureStatusBar)(s.settings().statusBar)),
        register("openfiles.statusBarMenu", () => (0, statusBar_1.showStatusMenu)(s.detector.isPaused)),
        register("openfiles.doctor", () => (0, doctor_1.runDoctor)(s.settings(), s.git, s.detector)),
        register("openfiles.getStarted", () => vscode.commands.executeCommand("workbench.action.openWalkthrough", `${s.context.extension.id}#welcome`, false)),
        register("openfiles.openProfile", (name) => (0, profiles_1.openProfile)(s.settings().configFile, typeof name === "string" ? name : undefined)),
        register("openfiles.sync", () => (0, profiles_1.openDefaultProfile)(s.settings().configFile)),
        register("openfiles.addToProfile", async (arg) => {
            await (0, profiles_1.addToProfile)(s.settings().configFile, resolveUris(arg)[0]);
            s.profilesTree.refresh();
        }),
        register("openfiles.openConfig", () => (0, profiles_1.openOrCreateConfig)(s.context, s.settings().configFile)),
        register("openfiles.showOpenFiles", () => {
            const tabs = (0, tabs_1.openTabUris)();
            log_1.log.info(`${tabs.length} file tab(s) open:`);
            tabs.forEach((uri) => log_1.log.info(`  ${uri.fsPath}`));
            log_1.log.show();
        }),
        register("openfiles.refresh", async () => {
            s.editsTree.refresh();
            s.problemsTree.refresh();
            s.agentsTree.refresh();
            s.profilesTree.refresh();
            await Promise.all([s.bridge.publish(), s.collector.export()]);
        }),
    ];
}
function agentIdFrom(arg) {
    if (arg && typeof arg === "object" && "agent" in arg) {
        return arg.agent.id;
    }
    return undefined;
}
//# sourceMappingURL=index.js.map