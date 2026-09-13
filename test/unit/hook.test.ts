import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Runs the bundled hook the way an agent would. Needs `npm run build` first.
const hook = path.resolve(__dirname, "../../dist/hook.js");
const built = fs.existsSync(hook);

let root: string;

function writeLiveState(): void {
  fs.mkdirSync(path.join(root, ".openfiles", "vscode"), { recursive: true });
  fs.writeFileSync(path.join(root, ".openfiles", "vscode", "window.json"), "{}");
}

function writeDiagnostics(file: string, checkedAt: number): void {
  const diagnostics = {
    version: 1,
    updatedAt: Date.now(),
    hook: { feedback: "errorsAndWarnings", timeoutMs: 1500 },
    files: {
      "src/a.ts": {
        path: file,
        checkedAt,
        errors: 1,
        warnings: 0,
        items: [{ line: 3, column: 7, severity: "error", source: "ts", code: "2322", message: "Type 'string' is not assignable to type 'number'." }],
      },
    },
  };
  fs.writeFileSync(path.join(root, ".openfiles", "diagnostics.json"), JSON.stringify(diagnostics));
}

function run(agent: string, payload: unknown, extra: string[] = []) {
  return spawnSync(process.execPath, [hook, "--agent", agent, ...extra], { input: JSON.stringify(payload), encoding: "utf8", timeout: 10_000 });
}

describe.skipIf(!built)("hook.js", () => {
  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "openfiles-hook-")));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("does nothing when no editor is running for the workspace", () => {
    const result = run("claude", { cwd: root, tool_name: "Write", tool_input: { file_path: path.join(root, "a.ts") } });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(fs.existsSync(path.join(root, ".openfiles"))).toBe(false);
  });

  it("queues the edit and hands problems back to Claude Code", () => {
    const file = path.join(root, "src", "a.ts");
    writeLiveState();
    writeDiagnostics(file, Date.now() + 60_000);

    const result = run("claude", { cwd: root, tool_name: "Edit", tool_input: { file_path: file } });
    expect(result.status).toBe(0);

    const queued = JSON.parse(fs.readFileSync(path.join(root, ".openfiles", "queue.jsonl"), "utf8").trim());
    expect(queued).toMatchObject({ agent: "claude", tool: "Edit", paths: [file] });

    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.hookEventName).toBe("PostToolUse");
    expect(output.hookSpecificOutput.additionalContext).toContain("src/a.ts:3:7 error 2322 (ts)");
  });

  it("uses the Gemini CLI event name", () => {
    const file = path.join(root, "src", "a.ts");
    writeLiveState();
    writeDiagnostics(file, Date.now() + 60_000);
    const output = JSON.parse(run("gemini", { cwd: root, tool_name: "replace", tool_input: { file_path: file } }).stdout);
    expect(output.hookSpecificOutput.hookEventName).toBe("AfterTool");
  });

  it("gives up after the timeout and lets the agent continue", () => {
    const file = path.join(root, "src", "a.ts");
    writeLiveState();
    writeDiagnostics(file, 0);
    const started = Date.now();
    const result = run("codex", { cwd: root, tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: src/a.ts\n*** End Patch" } });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("");
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it("only queues for --no-feedback", () => {
    writeLiveState();
    const result = run("cursor", { file_path: path.join(root, "b.ts") }, ["--event", "afterFileEdit", "--no-feedback"]);
    expect(result.stdout).toBe("");
    expect(fs.readFileSync(path.join(root, ".openfiles", "queue.jsonl"), "utf8")).toContain("b.ts");
  });

  it("survives garbage on stdin", () => {
    const result = spawnSync(process.execPath, [hook, "--agent", "claude"], { input: "not json", encoding: "utf8" });
    expect(result.status).toBe(0);
  });
});
