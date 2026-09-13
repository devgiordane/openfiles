// Runs inside the agent's hook process, not inside VS Code.
// stdin: the agent's hook payload. Effects: appends to <workspace>/.openfiles/queue.jsonl,
// waits briefly for the editor to check the files, prints feedback for the agent.
// It must never break the agent: every failure path exits 0 silently.

import * as fs from "node:fs";
import * as path from "node:path";
import { formatForAgent, type DiagnosticsFile, type FileDiagnostics } from "../diagnostics/format";
import { displayPath, pathKey } from "../core/paths";
import { renderHookOutput, supportsFeedback } from "./output";
import { isAgentId, parseHookInput, type AgentId } from "./parse";

const STDIN_TIMEOUT_MS = 3000;
const POLL_MS = 150;
const LIVE_STATE_MAX_AGE_MS = 60_000;

interface Args {
  agent: AgentId;
  event?: string;
  feedback: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { agent: "unknown", feedback: true };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i + 1];
    if (argv[i] === "--agent" && isAgentId(value)) {
      args.agent = value;
      i += 1;
    } else if (argv[i] === "--event" && value) {
      args.event = value;
      i += 1;
    } else if (argv[i] === "--no-feedback") {
      args.feedback = false;
    }
  }
  return args;
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve("");
      return;
    }
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => resolve(Buffer.concat(chunks).toString("utf8")), STDIN_TIMEOUT_MS);
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
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
export function findWorkspaceRoot(start: string, now = Date.now()): string | undefined {
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
    } catch {
      // No live state here; keep walking up.
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

function readDiagnostics(root: string): DiagnosticsFile | undefined {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, ".openfiles", "diagnostics.json"), "utf8")) as DiagnosticsFile;
  } catch {
    return undefined;
  }
}

async function waitForCheck(root: string, paths: string[], since: number): Promise<{ files: FileDiagnostics[]; file?: DiagnosticsFile }> {
  const keys = paths.map((p) => pathKey(p));
  let file = readDiagnostics(root);
  const deadline = since + (file?.hook.timeoutMs ?? 4000);

  for (;;) {
    const byKey = new Map(Object.values(file?.files ?? {}).map((entry) => [pathKey(entry.path), entry]));
    const checked = keys.map((key) => byKey.get(key)).filter((entry): entry is FileDiagnostics => !!entry && entry.checkedAt >= since);
    if (checked.length === keys.length || Date.now() >= deadline) {
      return { files: checked, file };
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    file = readDiagnostics(root);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const raw = await readStdin();
  let payload: unknown;
  try {
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return;
  }

  const event = parseHookInput(args.agent, payload);
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

  if (!args.feedback || !supportsFeedback(args.agent, args.event)) {
    return;
  }

  const { files, file } = await waitForCheck(root, event.paths, ts);
  const text = formatForAgent(files, {
    level: file?.hook.feedback ?? "errorsAndWarnings",
    displayPath: (p) => displayPath(p, root),
  });
  const output = renderHookOutput(args.agent, text, args.event);
  if (output) {
    process.stdout.write(`${output}\n`);
  }
}

if (require.main === module) {
  main().then(
    () => process.exit(0),
    () => process.exit(0),
  );
}
