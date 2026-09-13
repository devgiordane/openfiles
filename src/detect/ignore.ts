import * as path from "node:path";
import * as vscode from "vscode";
import { createMatcher, type PathMatcher } from "../core/globs";
import { toPosix } from "../core/paths";
import type { Settings } from "../shared/settings";

// Never tracked, whatever the settings say: our own state would otherwise feed back into the watcher.
const HARD_IGNORES = [".git/**", "**/.git/**", ".openfiles/**", "**/.openfiles/**"];

export class IgnoreRules {
  private ignored: PathMatcher = () => false;
  private sensitive: PathMatcher = () => false;

  constructor(settings: Settings) {
    this.rebuild(settings);
  }

  rebuild(settings: Settings): void {
    const filesExclude = vscode.workspace.getConfiguration("files").get<Record<string, boolean>>("exclude", {});
    const excluded = Object.entries(filesExclude)
      .filter(([, enabled]) => enabled === true)
      .flatMap(([pattern]) => [pattern, `${pattern}/**`]);
    this.ignored = createMatcher([...HARD_IGNORES, ...settings.ignore, ...excluded]);
    this.sensitive = createMatcher(settings.sensitive);
  }

  /** Workspace-relative posix path, or undefined when outside every workspace folder. */
  relative(uri: vscode.Uri): string | undefined {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    return folder ? toPosix(path.relative(folder.uri.fsPath, uri.fsPath)) : undefined;
  }

  isIgnored(uri: vscode.Uri): boolean {
    if (uri.scheme !== "file") {
      return true;
    }
    const relative = this.relative(uri);
    return relative === undefined || relative === "" || this.ignored(relative);
  }

  isSensitive(uri: vscode.Uri): boolean {
    const relative = this.relative(uri);
    return relative !== undefined && this.sensitive(relative);
  }
}
