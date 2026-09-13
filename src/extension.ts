import * as path from "node:path";
import * as vscode from "vscode";
import { hookScriptTarget, HookInstaller } from "./agents/installFlow";
import { LiveStateBridge } from "./bridge/liveState";
import { registerCommands } from "./commands";
import { Detector } from "./detect/detector";
import { EditorOrigin } from "./detect/editorOrigin";
import { GitSignals } from "./detect/git";
import { IgnoreRules } from "./detect/ignore";
import { HookQueue } from "./detect/queue";
import { DiagnosticsCollector } from "./diagnostics/collector";
import { Opener } from "./review/opener";
import type { Services } from "./services";
import { EditSession, type EditEntry } from "./session/store";
import { initLog, log } from "./shared/log";
import { ensureOpenfilesDir, exists } from "./shared/openfilesDir";
import { readSettings } from "./shared/settings";
import { StatusBar } from "./statusbar/statusBar";
import { AgentsTree } from "./views/agentsTree";
import { AiEditDecorations } from "./views/decorations";
import { EditsTree } from "./views/editsTree";
import { ProblemsTree } from "./views/problemsTree";
import { ProfilesTree } from "./views/profilesTree";

const SESSION_KEY = "openfiles.session";
const REVIEWED_TTL_MS = 24 * 60 * 60 * 1000;

let bridge: LiveStateBridge | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(initLog());

  let settings = readSettings();
  const getSettings = () => settings;

  const session = new EditSession();
  session.restore(context.workspaceState.get<EditEntry[]>(SESSION_KEY));
  for (const entry of session.all()) {
    if (entry.reviewed && Date.now() - entry.lastSeen > REVIEWED_TTL_MS) {
      session.remove(entry.fsPath);
    }
  }

  const ignore = new IgnoreRules(settings);
  const git = new GitSignals();
  void git.init();
  const origin = new EditorOrigin(() => settings.detection.editorSaveGraceMs);
  const collector = new DiagnosticsCollector(session, getSettings);
  const detector = new Detector(session, ignore, origin, git, getSettings);
  const opener = new Opener(getSettings, collector);
  const queue = new HookQueue((events) => detector.handleHookEvents(events));
  bridge = new LiveStateBridge(() => settings.heartbeatSeconds);
  const agentsTree = new AgentsTree();
  const installer = new HookInstaller(context, () => agentsTree.refresh());
  const editsTree = new EditsTree(session, collector);
  const problemsTree = new ProblemsTree(session, collector);
  const profilesTree = new ProfilesTree(getSettings);
  const decorations = new AiEditDecorations(session);
  const statusBar = new StatusBar(session, collector, detector, getSettings);

  const services: Services = {
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

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    git,
    origin,
    collector,
    detector,
    opener,
    queue,
    installer,
    editsTree,
    problemsTree,
    agentsTree,
    profilesTree,
    decorations,
    statusBar,
    vscode.window.registerFileDecorationProvider(decorations),
    detector.onDidAccept((batch) => void opener.handle(batch)),
    session.onDidChange(() => {
      void vscode.commands.executeCommand("setContext", "openfiles.hasSession", session.size > 0);
      if (saveTimer) {
        clearTimeout(saveTimer);
      }
      saveTimer = setTimeout(() => void context.workspaceState.update(SESSION_KEY, session.toJSON()), 500);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("openfiles") || event.affectsConfiguration("files.exclude")) {
        settings = readSettings();
        ignore.rebuild(settings);
        statusBar.update();
        void collector.export();
      }
    }),
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (path.basename(doc.uri.fsPath) === path.basename(settings.configFile)) {
        profilesTree.refresh();
      }
    }),
    ...registerCommands(services),
  );

  const startWriters = async () => {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      await ensureOpenfilesDir(folder.uri.fsPath).catch((error) => log.warn(`Could not create .openfiles: ${String(error)}`));
    }
    bridge?.start();
    await queue.start();
    await collector.export();
    // Keep ~/.openfiles/hook.js in step with this version, but only once someone has installed hooks.
    if (await exists(hookScriptTarget())) {
      await installer.syncHookScript();
    }
  };
  if (vscode.workspace.isTrusted) {
    await startWriters();
  } else {
    context.subscriptions.push(vscode.workspace.onDidGrantWorkspaceTrust(() => void startWriters()));
  }

  detector.start();
  await vscode.commands.executeCommand("setContext", "openfiles.hasSession", session.size > 0);
  await vscode.commands.executeCommand("setContext", "openfiles.paused", false);
  log.info(`Ready in ${vscode.env.appName}. Mode: ${settings.mode}. ${session.size} file(s) restored from the last session.`);
}

export async function deactivate(): Promise<void> {
  await bridge?.dispose();
}
