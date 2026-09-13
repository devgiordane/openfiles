import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createHash } from "node:crypto";
import * as vscode from "vscode";
import { atomicWrite, ensureOpenfilesDir } from "../shared/openfilesDir";
import { log } from "../shared/log";
import { openTabUris } from "./tabs";

interface LiveState {
  version: 1;
  workspaceRoot: string;
  sessionId: string;
  appName: string;
  updatedAt: number;
  files: string[];
}

/**
 * Publishes the open tabs to `.openfiles/vscode/<id>.json`.
 * Agents can read it to see what the human is looking at; hook.js uses its freshness
 * to know an editor is running for this workspace.
 */
export class LiveStateBridge implements vscode.Disposable {
  private written: string[] = [];
  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly heartbeatSeconds: () => number) {}

  start(): void {
    if (this.timer) {
      return;
    }
    void this.publish();
    this.timer = setInterval(() => void this.publish(), this.heartbeatSeconds() * 1000);
    this.disposables.push(vscode.window.tabGroups.onDidChangeTabs(() => void this.publish()));
  }

  async publish(): Promise<void> {
    if (!vscode.workspace.isTrusted) {
      return;
    }
    const files = openTabUris().map((uri) => uri.fsPath);
    const next: string[] = [];
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const root = folder.uri.fsPath;
      try {
        const dir = await ensureOpenfilesDir(root);
        const id = createHash("sha1").update(`${root}\0${vscode.env.sessionId}`).digest("hex");
        const file = path.join(dir, "vscode", `${id}.json`);
        const state: LiveState = {
          version: 1,
          workspaceRoot: root,
          sessionId: vscode.env.sessionId,
          appName: vscode.env.appName,
          updatedAt: Date.now() / 1000,
          files,
        };
        await atomicWrite(file, `${JSON.stringify(state, null, 2)}\n`);
        next.push(file);
      } catch (error) {
        log.warn(`Could not publish live state for ${root}: ${String(error)}`);
      }
    }
    this.written = next;
  }

  async dispose(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.disposables.forEach((d) => d.dispose());
    await Promise.all(this.written.map((file) => fs.unlink(file).catch(() => undefined)));
  }
}
