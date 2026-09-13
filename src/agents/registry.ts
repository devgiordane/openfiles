import type { AgentId } from "../hook/parse";

export type HookFormat =
  /** `{ hooks: { <event>: [{ matcher, hooks: [{ type: "command", command, timeout }] }] } }` */
  | { kind: "matcher-groups"; file: string; event: string; matcher?: string; timeout: number; timeoutUnit: "s" | "ms" }
  /** Copilot CLI / VS Code agent hooks: a standalone file we own. */
  | { kind: "copilot"; file: string }
  /** `{ version: 1, hooks: { <event>: [{ command }] } }` */
  | { kind: "flat-list"; file: string; events: { event: string; feedback: boolean }[] }
  /** A JS plugin file we own. */
  | { kind: "opencode-plugin"; file: string };

export interface AgentDefinition {
  id: AgentId;
  name: string;
  homepage: string;
  hookDocs?: string;
  /** Workspace-relative files or folders that suggest this agent is used here. */
  markers: string[];
  hook?: HookFormat;
  feedback: boolean;
  /** Hook support we could not verify end-to-end yet. */
  beta?: boolean;
}

export const AGENTS: readonly AgentDefinition[] = [
  {
    id: "claude",
    name: "Claude Code",
    homepage: "https://code.claude.com/docs",
    hookDocs: "https://code.claude.com/docs/en/hooks",
    markers: [".claude", "CLAUDE.md"],
    hook: {
      kind: "matcher-groups",
      // The hook points at a per-user path, so it belongs in the uncommitted local settings.
      file: ".claude/settings.local.json",
      event: "PostToolUse",
      matcher: "Edit|Write|MultiEdit|NotebookEdit",
      timeout: 15,
      timeoutUnit: "s",
    },
    feedback: true,
  },
  {
    id: "codex",
    name: "Codex CLI",
    homepage: "https://github.com/openai/codex",
    hookDocs: "https://learn.chatgpt.com/docs/hooks",
    markers: [".codex", "AGENTS.md"],
    hook: {
      kind: "matcher-groups",
      file: ".codex/hooks.json",
      event: "PostToolUse",
      matcher: "apply_patch|Edit|Write",
      timeout: 15,
      timeoutUnit: "s",
    },
    feedback: true,
  },
  {
    id: "copilot",
    name: "GitHub Copilot (CLI & agent mode)",
    homepage: "https://github.com/github/copilot-cli",
    hookDocs: "https://docs.github.com/en/copilot/reference/hooks-reference",
    markers: [".github/copilot-instructions.md", ".github/hooks", ".github/agents"],
    hook: { kind: "copilot", file: ".github/hooks/openfiles.json" },
    feedback: true,
  },
  {
    id: "gemini",
    name: "Gemini CLI",
    homepage: "https://geminicli.com",
    hookDocs: "https://geminicli.com/docs/hooks/reference/",
    markers: [".gemini", "GEMINI.md"],
    hook: {
      kind: "matcher-groups",
      file: ".gemini/settings.json",
      event: "AfterTool",
      matcher: "write_file|replace",
      timeout: 15000,
      timeoutUnit: "ms",
    },
    feedback: true,
  },
  {
    id: "cursor",
    name: "Cursor",
    homepage: "https://cursor.com",
    hookDocs: "https://cursor.com/docs/hooks",
    markers: [".cursor", ".cursorrules"],
    hook: {
      kind: "flat-list",
      file: ".cursor/hooks.json",
      events: [
        { event: "afterFileEdit", feedback: false },
        { event: "postToolUse", feedback: true },
      ],
    },
    feedback: true,
  },
  {
    id: "windsurf",
    name: "Windsurf / Devin Desktop",
    homepage: "https://windsurf.com",
    hookDocs: "https://docs.devin.ai/desktop/cascade/hooks",
    markers: [".windsurf", ".windsurfrules"],
    hook: { kind: "flat-list", file: ".windsurf/hooks.json", events: [{ event: "post_write_code", feedback: false }] },
    feedback: false,
    beta: true,
  },
  {
    id: "opencode",
    name: "OpenCode",
    homepage: "https://opencode.ai",
    hookDocs: "https://opencode.ai/docs/plugins/",
    markers: [".opencode", "opencode.json", "opencode.jsonc"],
    hook: { kind: "opencode-plugin", file: ".opencode/plugins/openfiles.js" },
    feedback: false,
    beta: true,
  },
  {
    id: "qwen",
    name: "Qwen Code",
    homepage: "https://github.com/QwenLM/qwen-code",
    hookDocs: "https://qwenlm.github.io/qwen-code-docs/en/users/features/hooks/",
    markers: [".qwen", "QWEN.md"],
    feedback: true,
  },
  {
    id: "kiro",
    name: "Kiro",
    homepage: "https://kiro.dev",
    hookDocs: "https://kiro.dev/docs/hooks/types/",
    markers: [".kiro"],
    feedback: false,
  },
  {
    id: "cline",
    name: "Cline",
    homepage: "https://cline.bot",
    hookDocs: "https://docs.cline.bot/features/hooks/hook-reference",
    markers: [".clinerules"],
    feedback: false,
  },
  {
    id: "droid",
    name: "Factory Droid",
    homepage: "https://factory.ai",
    hookDocs: "https://docs.factory.ai/reference/hooks-reference",
    markers: [".factory"],
    feedback: true,
  },
  {
    id: "goose",
    name: "Goose",
    homepage: "https://goose-docs.ai",
    markers: [".goosehints"],
    feedback: false,
  },
];

export function agentById(id: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

export function installableAgents(): AgentDefinition[] {
  return AGENTS.filter((agent) => agent.hook);
}
