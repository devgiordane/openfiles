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
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const vitest_1 = require("vitest");
// Runs the bundled hook the way an agent would. Needs `npm run build` first.
const hook = path.resolve(__dirname, "../../dist/hook.js");
const built = fs.existsSync(hook);
let root;
function writeLiveState() {
    fs.mkdirSync(path.join(root, ".openfiles", "vscode"), { recursive: true });
    fs.writeFileSync(path.join(root, ".openfiles", "vscode", "window.json"), "{}");
}
function writeDiagnostics(file, checkedAt) {
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
function run(agent, payload, extra = []) {
    return (0, node_child_process_1.spawnSync)(process.execPath, [hook, "--agent", agent, ...extra], { input: JSON.stringify(payload), encoding: "utf8", timeout: 10_000 });
}
vitest_1.describe.skipIf(!built)("hook.js", () => {
    (0, vitest_1.beforeEach)(() => {
        root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "openfiles-hook-")));
    });
    (0, vitest_1.afterEach)(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });
    (0, vitest_1.it)("does nothing when no editor is running for the workspace", () => {
        const result = run("claude", { cwd: root, tool_name: "Write", tool_input: { file_path: path.join(root, "a.ts") } });
        (0, vitest_1.expect)(result.status).toBe(0);
        (0, vitest_1.expect)(result.stdout).toBe("");
        (0, vitest_1.expect)(fs.existsSync(path.join(root, ".openfiles"))).toBe(false);
    });
    (0, vitest_1.it)("queues the edit and hands problems back to Claude Code", () => {
        const file = path.join(root, "src", "a.ts");
        writeLiveState();
        writeDiagnostics(file, Date.now() + 60_000);
        const result = run("claude", { cwd: root, tool_name: "Edit", tool_input: { file_path: file } });
        (0, vitest_1.expect)(result.status).toBe(0);
        const queued = JSON.parse(fs.readFileSync(path.join(root, ".openfiles", "queue.jsonl"), "utf8").trim());
        (0, vitest_1.expect)(queued).toMatchObject({ agent: "claude", tool: "Edit", paths: [file] });
        const output = JSON.parse(result.stdout);
        (0, vitest_1.expect)(output.hookSpecificOutput.hookEventName).toBe("PostToolUse");
        (0, vitest_1.expect)(output.hookSpecificOutput.additionalContext).toContain("src/a.ts:3:7 error 2322 (ts)");
    });
    (0, vitest_1.it)("uses the Gemini CLI event name", () => {
        const file = path.join(root, "src", "a.ts");
        writeLiveState();
        writeDiagnostics(file, Date.now() + 60_000);
        const output = JSON.parse(run("gemini", { cwd: root, tool_name: "replace", tool_input: { file_path: file } }).stdout);
        (0, vitest_1.expect)(output.hookSpecificOutput.hookEventName).toBe("AfterTool");
    });
    (0, vitest_1.it)("gives up after the timeout and lets the agent continue", () => {
        const file = path.join(root, "src", "a.ts");
        writeLiveState();
        writeDiagnostics(file, 0);
        const started = Date.now();
        const result = run("codex", { cwd: root, tool_name: "apply_patch", tool_input: { command: "*** Begin Patch\n*** Update File: src/a.ts\n*** End Patch" } });
        (0, vitest_1.expect)(result.status).toBe(0);
        (0, vitest_1.expect)(result.stdout).toBe("");
        (0, vitest_1.expect)(Date.now() - started).toBeLessThan(5000);
    });
    (0, vitest_1.it)("only queues for --no-feedback", () => {
        writeLiveState();
        const result = run("cursor", { file_path: path.join(root, "b.ts") }, ["--event", "afterFileEdit", "--no-feedback"]);
        (0, vitest_1.expect)(result.stdout).toBe("");
        (0, vitest_1.expect)(fs.readFileSync(path.join(root, ".openfiles", "queue.jsonl"), "utf8")).toContain("b.ts");
    });
    (0, vitest_1.it)("survives garbage on stdin", () => {
        const result = (0, node_child_process_1.spawnSync)(process.execPath, [hook, "--agent", "claude"], { input: "not json", encoding: "utf8" });
        (0, vitest_1.expect)(result.status).toBe(0);
    });
});
//# sourceMappingURL=hook.test.js.map