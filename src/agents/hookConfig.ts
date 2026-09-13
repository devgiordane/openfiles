import type { AgentDefinition, HookFormat } from "./registry";

/** Every command we write contains this, so we can find (and remove) our own entries later. */
export const HOOK_MARKER = "openfiles-hook";

export function hookCommand(nodeScript: string, agent: string, extra: string[] = []): string {
  const script = nodeScript.replaceAll("\\", "/");
  return [`node "${script}"`, "--agent", agent, ...extra, `--tag ${HOOK_MARKER}`].join(" ");
}

type Json = Record<string, unknown>;

export interface MergeResult {
  /** File content to write, or undefined to delete the file. */
  content: string | undefined;
  changed: boolean;
}

function isOurs(value: unknown): boolean {
  return JSON.stringify(value ?? "").includes(HOOK_MARKER);
}

function clone(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? structuredClone(value as Json) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringify(value: Json): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/**
 * Add our hook to an agent config without touching anything else in it.
 * `existing` is the parsed current file (undefined when it doesn't exist).
 */
export function installHook(format: HookFormat, agent: AgentDefinition, existing: unknown, nodeScript: string): MergeResult {
  switch (format.kind) {
    case "matcher-groups": {
      const config = clone(existing);
      const hooks = clone(config.hooks);
      const groups = asArray(hooks[format.event]).filter((group) => !isOurs(group));
      const command: Json = {
        type: "command",
        command: hookCommand(nodeScript, agent.id),
        timeout: format.timeout,
      };
      if (agent.id === "gemini") {
        command.name = "OpenFiles";
      }
      const group: Json = { hooks: [command] };
      if (format.matcher) {
        group.matcher = format.matcher;
      }
      hooks[format.event] = [...groups, group];
      config.hooks = hooks;
      return finish(existing, config);
    }
    case "copilot": {
      const command = hookCommand(nodeScript, agent.id);
      const config: Json = {
        version: 1,
        hooks: {
          postToolUse: [{ type: "command", bash: command, powershell: command, timeoutSec: 15 }],
        },
      };
      return finish(existing, config);
    }
    case "flat-list": {
      const config = clone(existing);
      config.version ??= 1;
      const hooks = clone(config.hooks);
      for (const { event, feedback } of format.events) {
        const extra = ["--event", event, ...(feedback ? [] : ["--no-feedback"])];
        const kept = asArray(hooks[event]).filter((entry) => !isOurs(entry));
        hooks[event] = [...kept, { command: hookCommand(nodeScript, agent.id, extra) }];
      }
      config.hooks = hooks;
      return finish(existing, config);
    }
    case "opencode-plugin":
      return { content: opencodePlugin(nodeScript), changed: typeof existing !== "string" || existing !== opencodePlugin(nodeScript) };
  }
}

export function removeHook(format: HookFormat, existing: unknown): MergeResult {
  if (existing === undefined) {
    return { content: undefined, changed: false };
  }
  switch (format.kind) {
    case "copilot":
    case "opencode-plugin":
      return { content: undefined, changed: isOurs(existing) };
    case "matcher-groups":
    case "flat-list": {
      const config = clone(existing);
      const hooks = clone(config.hooks);
      for (const [event, entries] of Object.entries(hooks)) {
        const kept = asArray(entries).filter((entry) => !isOurs(entry));
        if (kept.length > 0) {
          hooks[event] = kept;
        } else {
          delete hooks[event];
        }
      }
      if (Object.keys(hooks).length > 0) {
        config.hooks = hooks;
      } else {
        delete config.hooks;
      }
      return finish(existing, config);
    }
  }
}

export function hasHook(existing: unknown): boolean {
  return existing !== undefined && isOurs(existing);
}

function finish(existing: unknown, next: Json): MergeResult {
  const content = stringify(next);
  const before = existing === undefined ? undefined : typeof existing === "string" ? existing : stringify(existing as Json);
  return { content, changed: before !== content };
}

export function opencodePlugin(nodeScript: string): string {
  const script = JSON.stringify(nodeScript.replaceAll("\\", "/"));
  return `// ${HOOK_MARKER}: added by the OpenFiles VS Code extension. Delete this file to remove it.
import { spawn } from "node:child_process";

export const OpenFiles = async ({ directory }) => ({
  event: async ({ event }) => {
    if (event.type !== "file.edited") return;
    const file = event.properties?.file;
    if (!file) return;
    const child = spawn("node", [${script}, "--agent", "opencode", "--no-feedback"], { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", () => {});
    child.stdin.end(JSON.stringify({ tool_name: "edit", file_path: file, cwd: directory }));
  },
});
`;
}
