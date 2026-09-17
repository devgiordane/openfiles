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
exports.activate = activate;
exports.deactivate = deactivate;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const installFlow_1 = require("./agents/installFlow");
const liveState_1 = require("./bridge/liveState");
const commands_1 = require("./commands");
const detector_1 = require("./detect/detector");
const editorOrigin_1 = require("./detect/editorOrigin");
const git_1 = require("./detect/git");
const ignore_1 = require("./detect/ignore");
const queue_1 = require("./detect/queue");
const collector_1 = require("./diagnostics/collector");
const opener_1 = require("./review/opener");
const store_1 = require("./session/store");
const log_1 = require("./shared/log");
const openfilesDir_1 = require("./shared/openfilesDir");
const settings_1 = require("./shared/settings");
const statusBar_1 = require("./statusbar/statusBar");
const agentsTree_1 = require("./views/agentsTree");
const decorations_1 = require("./views/decorations");
const editsTree_1 = require("./views/editsTree");
const problemsTree_1 = require("./views/problemsTree");
const profilesTree_1 = require("./views/profilesTree");
const SESSION_KEY = "openfiles.session";
const REVIEWED_TTL_MS = 24 * 60 * 60 * 1000;
let bridge;
async function activate(context) {
    context.subscriptions.push((0, log_1.initLog)());
    let settings = (0, settings_1.readSettings)();
    const getSettings = () => settings;
    const session = new store_1.EditSession();
    session.restore(context.workspaceState.get(SESSION_KEY));
    for (const entry of session.all()) {
        if (entry.reviewed && Date.now() - entry.lastSeen > REVIEWED_TTL_MS) {
            session.remove(entry.fsPath);
        }
    }
    const ignore = new ignore_1.IgnoreRules(settings);
    const git = new git_1.GitSignals();
    void git.init();
    const origin = new editorOrigin_1.EditorOrigin(() => settings.detection.editorSaveGraceMs);
    const collector = new collector_1.DiagnosticsCollector(session, getSettings);
    const detector = new detector_1.Detector(session, ignore, origin, git, getSettings);
    const opener = new opener_1.Opener(getSettings, collector);
    const queue = new queue_1.HookQueue((events) => detector.handleHookEvents(events));
    bridge = new liveState_1.LiveStateBridge(() => settings.heartbeatSeconds);
    const agentsTree = new agentsTree_1.AgentsTree();
    const installer = new installFlow_1.HookInstaller(context, () => agentsTree.refresh());
    const editsTree = new editsTree_1.EditsTree(session, collector);
    const problemsTree = new problemsTree_1.ProblemsTree(session, collector);
    const profilesTree = new profilesTree_1.ProfilesTree(getSettings);
    const decorations = new decorations_1.AiEditDecorations(session);
    const statusBar = new statusBar_1.StatusBar(session, collector, detector, getSettings);
    const services = {
        context,
        settings: getSettings,
        session,
        git,
        detector,
        opener,
        collector,
        installer,
        bridge,
        statusBar,
        editsTree,
        problemsTree,
        agentsTree,
        profilesTree,
    };
    let saveTimer;
    context.subscriptions.push(git, origin, collector, detector, opener, queue, installer, editsTree, problemsTree, agentsTree, profilesTree, decorations, statusBar, vscode.window.registerFileDecorationProvider(decorations), detector.onDidAccept((batch) => void opener.handle(batch)), session.onDidChange(() => {
        void vscode.commands.executeCommand("setContext", "openfiles.hasSession", session.size > 0);
        if (saveTimer) {
            clearTimeout(saveTimer);
        }
        saveTimer = setTimeout(() => void context.workspaceState.update(SESSION_KEY, session.toJSON()), 500);
    }), vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("openfiles") || event.affectsConfiguration("files.exclude")) {
            settings = (0, settings_1.readSettings)();
            ignore.rebuild(settings);
            statusBar.update();
            void collector.export();
        }
    }), vscode.workspace.onDidSaveTextDocument((doc) => {
        if (path.basename(doc.uri.fsPath) === path.basename(settings.configFile)) {
            profilesTree.refresh();
        }
    }), ...(0, commands_1.registerCommands)(services));
    const startWriters = async () => {
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            await (0, openfilesDir_1.ensureOpenfilesDir)(folder.uri.fsPath).catch((error) => log_1.log.warn(`Could not create .openfiles: ${String(error)}`));
        }
        bridge?.start();
        await queue.start();
        await collector.export();
        // Keep ~/.openfiles/hook.js in step with this version, but only once someone has installed hooks.
        if (await (0, openfilesDir_1.exists)((0, installFlow_1.hookScriptTarget)())) {
            await installer.syncHookScript();
        }
    };
    if (vscode.workspace.isTrusted) {
        await startWriters();
    }
    else {
        context.subscriptions.push(vscode.workspace.onDidGrantWorkspaceTrust(() => void startWriters()));
    }
    detector.start();
    await vscode.commands.executeCommand("setContext", "openfiles.hasSession", session.size > 0);
    await vscode.commands.executeCommand("setContext", "openfiles.paused", false);
    log_1.log.info(`Ready in ${vscode.env.appName}. Mode: ${settings.mode}. ${session.size} file(s) restored from the last session.`);
}
async function deactivate() {
    await bridge?.dispose();
}
//# sourceMappingURL=extension.js.map