import type * as vscode from "vscode";
import type { HookInstaller } from "./agents/installFlow";
import type { LiveStateBridge } from "./bridge/liveState";
import type { Detector } from "./detect/detector";
import type { GitSignals } from "./detect/git";
import type { DiagnosticsCollector } from "./diagnostics/collector";
import type { Opener } from "./review/opener";
import type { EditSession } from "./session/store";
import type { Settings } from "./shared/settings";
import type { StatusBar } from "./statusbar/statusBar";
import type { AgentsTree } from "./views/agentsTree";
import type { EditsTree } from "./views/editsTree";
import type { ProblemsTree } from "./views/problemsTree";
import type { ProfilesTree } from "./views/profilesTree";

export interface Services {
  context: vscode.ExtensionContext;
  settings: () => Settings;
  session: EditSession;
  git: GitSignals;
  detector: Detector;
  opener: Opener;
  collector: DiagnosticsCollector;
  installer: HookInstaller;
  bridge: LiveStateBridge;
  statusBar: StatusBar;
  editsTree: EditsTree;
  problemsTree: ProblemsTree;
  agentsTree: AgentsTree;
  profilesTree: ProfilesTree;
}
