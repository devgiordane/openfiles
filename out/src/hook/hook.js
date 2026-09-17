"use strict";
// Runs inside the agent's hook process, not inside VS Code.
// stdin: the agent's hook payload. Effects: appends to <workspace>/.openfiles/queue.jsonl,
// waits briefly for the editor to check the files, prints feedback for the agent.
// It must never break the agent: every failure path exits 0 silently.
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
exports.findWorkspaceRoot = findWorkspaceRoot;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const format_1 = require("../diagnostics/format");
const paths_1 = require("../core/paths");
const output_1 = require("./output");
const parse_1 = require("./parse");
const STDIN_TIMEOUT_MS = 3000;
const POLL_MS = 150;
const LIVE_STATE_MAX_AGE_MS = 60_000;
function parseArgs(argv) {
    const args = { agent: "unknown", feedback: true };
    for (let i = 0; i < argv.length; i += 1) {
        const value = argv[i + 1];
        if (argv[i] === "--agent" && (0, parse_1.isAgentId)(value)) {
            args.agent = value;
            i += 1;
        }
        else if (argv[i] === "--event" && value) {
            args.event = value;
            i += 1;
        }
        else if (argv[i] === "--no-feedback") {
            args.feedback = false;
        }
    }
    return args;
}
function readStdin() {
    return new Promise((resolve) => {
        if (process.stdin.isTTY) {
            resolve("");
            return;
        }
        const chunks = [];
        const timer = setTimeout(() => resolve(Buffer.concat(chunks).toString("utf8")), STDIN_TIMEOUT_MS);
        process.stdin.on("data", (chunk) => chunks.push(chunk));
        process.stdin.on("end", () => {
            clearTimeout(timer);
            resolve(Buffer.concat(chunks).toString("utf8"));
        });
        process.stdin.on("error", () => {
            clearTimeout(timer);
            resolve("");
        });
    });
}
/** Nearest ancestor with a live OpenFiles editor session. */
function findWorkspaceRoot(start, now = Date.now()) {
    let dir = path.resolve(start);
    for (;;) {
        const liveDir = path.join(dir, ".openfiles", "vscode");
        try {
            const fresh = fs
                .readdirSync(liveDir)
                .some((name) => name.endsWith(".json") && now - fs.statSync(path.join(liveDir, name)).mtimeMs < LIVE_STATE_MAX_AGE_MS);
            if (fresh) {
                return dir;
            }
        }
        catch {
            // No live state here; keep walking up.
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            return undefined;
        }
        dir = parent;
    }
}
function readDiagnostics(root) {
    try {
        return JSON.parse(fs.readFileSync(path.join(root, ".openfiles", "diagnostics.json"), "utf8"));
    }
    catch {
        return undefined;
    }
}
async function waitForCheck(root, paths, since) {
    const keys = paths.map((p) => (0, paths_1.pathKey)(p));
    let file = readDiagnostics(root);
    const deadline = since + (file?.hook.timeoutMs ?? 4000);
    for (;;) {
        const byKey = new Map(Object.values(file?.files ?? {}).map((entry) => [(0, paths_1.pathKey)(entry.path), entry]));
        const checked = keys.map((key) => byKey.get(key)).filter((entry) => !!entry && entry.checkedAt >= since);
        if (checked.length === keys.length || Date.now() >= deadline) {
            return { files: checked, file };
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        file = readDiagnostics(root);
    }
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const raw = await readStdin();
    let payload;
    try {
        payload = raw.trim() ? JSON.parse(raw) : {};
    }
    catch {
        return;
    }
    const event = (0, parse_1.parseHookInput)(args.agent, payload);
    if (event.paths.length === 0) {
        return;
    }
    // The edited file decides the workspace; the agent's cwd can be a parent or an unrelated folder.
    const start = event.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.env.GEMINI_PROJECT_DIR ?? process.cwd();
    const root = findWorkspaceRoot(path.dirname(event.paths[0])) ?? findWorkspaceRoot(start);
    if (!root) {
        return;
    }
    const ts = Date.now();
    const line = JSON.stringify({ v: 1, ts, agent: args.agent, event: args.event, tool: event.tool, paths: event.paths });
    fs.appendFileSync(path.join(root, ".openfiles", "queue.jsonl"), `${line}\n`, "utf8");
    if (!args.feedback || !(0, output_1.supportsFeedback)(args.agent, args.event)) {
        return;
    }
    const { files, file } = await waitForCheck(root, event.paths, ts);
    const text = (0, format_1.formatForAgent)(files, {
        level: file?.hook.feedback ?? "errorsAndWarnings",
        displayPath: (p) => (0, paths_1.displayPath)(p, root),
    });
    const output = (0, output_1.renderHookOutput)(args.agent, text, args.event);
    if (output) {
        process.stdout.write(`${output}\n`);
    }
}
if (require.main === module) {
    main().then(() => process.exit(0), () => process.exit(0));
}
//# sourceMappingURL=hook.js.map