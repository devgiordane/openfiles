import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { log } from "../shared/log";

// The slice of the built-in Git extension API (vscode.git, API v1) that we use.
interface GitChange {
  readonly uri: vscode.Uri;
}
interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly state: {
    readonly HEAD: { readonly commit?: string } | undefined;
    readonly workingTreeChanges: GitChange[];
    readonly indexChanges: GitChange[];
    readonly untrackedChanges?: GitChange[];
    readonly onDidChange: vscode.Event<void>;
  };
}
interface GitApi {
  readonly repositories: GitRepository[];
  readonly onDidOpenRepository: vscode.Event<GitRepository>;
  toGitUri(uri: vscode.Uri, ref: string): vscode.Uri;
  getRepository(uri: vscode.Uri): GitRepository | null;
}

/** Suppress watcher events this long around a HEAD change (checkout, pull, rebase…). */
const HEAD_CHANGE_WINDOW_MS = 5000;

export class GitSignals implements vscode.Disposable {
  private api: GitApi | undefined;
  private readonly heads = new Map<string, string | undefined>();
  private lastHeadChange = 0;
  private readonly disposables: vscode.Disposable[] = [];

  async init(): Promise<void> {
    try {
      const extension = vscode.extensions.getExtension<{ getAPI(version: 1): GitApi }>("vscode.git");
      if (!extension) {
        return;
      }
      const exports = extension.isActive ? extension.exports : await extension.activate();
      this.api = exports.getAPI(1);
      this.api.repositories.forEach((repo) => this.track(repo));
      this.disposables.push(this.api.onDidOpenRepository((repo) => this.track(repo)));
    } catch (error) {
      log.warn(`Git extension unavailable: ${String(error)}`);
    }
  }

  get available(): boolean {
    return this.api !== undefined;
  }

  private track(repo: GitRepository): void {
    const root = repo.rootUri.fsPath;
    this.heads.set(root, repo.state.HEAD?.commit);
    this.disposables.push(
      repo.state.onDidChange(() => {
        const commit = repo.state.HEAD?.commit;
        if (commit !== this.heads.get(root)) {
          this.heads.set(root, commit);
          this.lastHeadChange = Date.now();
          log.info(`HEAD moved in ${root}; ignoring file changes around it.`);
        }
      }),
    );
  }

  /** True when changes at `at` are likely part of a git operation rather than an edit. */
  isGitOperation(at: number): boolean {
    return Math.abs(at - this.lastHeadChange) <= HEAD_CHANGE_WINDOW_MS;
  }

  /** A git command holding the index lock is probably rewriting the working tree right now. */
  isBusy(): boolean {
    return (vscode.workspace.workspaceFolders ?? []).some((folder) => {
      const gitDir = path.join(folder.uri.fsPath, ".git");
      return ["index.lock", "rebase-merge", "rebase-apply", "MERGE_HEAD"].some((name) => fs.existsSync(path.join(gitDir, name)));
    });
  }

  async changedFiles(): Promise<vscode.Uri[]> {
    if (!this.api) {
      return [];
    }
    const uris = new Map<string, vscode.Uri>();
    for (const repo of this.api.repositories) {
      const { workingTreeChanges, indexChanges, untrackedChanges = [] } = repo.state;
      for (const change of [...workingTreeChanges, ...indexChanges, ...untrackedChanges]) {
        uris.set(change.uri.toString(), change.uri);
      }
    }
    return [...uris.values()];
  }

  headUri(uri: vscode.Uri): vscode.Uri | undefined {
    if (!this.api?.getRepository(uri)) {
      return undefined;
    }
    return this.api.toGitUri(uri, "HEAD");
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
