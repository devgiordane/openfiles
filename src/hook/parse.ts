import * as path from "node:path";

export const AGENT_IDS = [
  "claude",
  "codex",
  "copilot",
  "vscode",
  "gemini",
  "qwen",
  "kimi",
  "cursor",
  "windsurf",
  "kiro",
  "cline",
  "droid",
  "goose",
  "opencode",
  "unknown",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export interface HookEvent {
  agent: AgentId;
  tool?: string;
  cwd?: string;
  paths: string[];
}

// Tool names that write files, across agents: Edit, Write, MultiEdit, NotebookEdit (Claude),
// apply_patch (Codex), edit/create (Copilot CLI), write_file/replace (Gemini),
// create_file/replace_string_in_file/editFiles (VS Code agent mode), Create/Edit/ApplyPatch (Droid).
const WRITE_TOOL = /edit|write|create|replace|patch|insert|notebook|rename|move/i;

const PATH_KEYS = [
  "file_path",
  "filePath",
  "path",
  "absolute_path",
  "absolutePath",
  "target_file",
  "targetFile",
  "notebook_path",
  "new_path",
  "newPath",
  "destination",
];

const PATH_LIST_KEYS = ["file_paths", "filePaths", "paths", "files"];

export function isAgentId(value: string | undefined): value is AgentId {
  return !!value && (AGENT_IDS as readonly string[]).includes(value);
}

/** Paths written by a Codex-style patch (`*** Add File:` / `*** Update File:` / `*** Move to:`) or a unified diff. */
export function parsePatchPaths(patch: string): string[] {
  const found: string[] = [];
  for (const rawLine of patch.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const codex = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/.exec(line);
    if (codex) {
      found.push(codex[1].trim());
      continue;
    }
    const unified = /^\+\+\+ (?:b\/)?(.+)$/.exec(line);
    if (unified && unified[1] !== "/dev/null") {
      found.push(unified[1].trim());
    }
  }
  return unique(found);
}

export function parseHookInput(agent: AgentId, input: unknown): HookEvent {
  const root = asRecord(input);
  const cwd = str(root.cwd) ?? str(root.workspace_root) ?? firstString(root.workspace_roots);
  const tool =
    str(root.tool_name) ?? str(root.toolName) ?? str(asRecord(root.tool_info).tool_name) ?? str(root.tool);

  if (tool && !WRITE_TOOL.test(tool)) {
    return { agent, tool, cwd, paths: [] };
  }

  const candidates: string[] = [];
  const containers = [
    root,
    asRecord(root.tool_input),
    asRecord(parseMaybeJson(root.toolArgs)),
    asRecord(root.tool_info),
    asRecord(root.input),
    asRecord(root.args),
  ];

  for (const container of containers) {
    for (const key of PATH_KEYS) {
      const value = str(container[key]);
      if (value) {
        candidates.push(value);
      }
    }
    for (const key of PATH_LIST_KEYS) {
      const list = container[key];
      if (Array.isArray(list)) {
        for (const item of list) {
          const value = str(item) ?? str(asRecord(item).path) ?? str(asRecord(item).file_path);
          if (value) {
            candidates.push(value);
          }
        }
      }
    }
    for (const key of ["command", "patch", "input"]) {
      const value = str(container[key]);
      if (value && (value.includes("*** Begin Patch") || value.includes("\n+++ "))) {
        candidates.push(...parsePatchPaths(value));
      }
    }
  }

  const paths = unique(
    candidates
      .filter((candidate) => !candidate.includes("\n") && candidate.length < 4096)
      .map((candidate) => (cwd && !path.isAbsolute(candidate) ? path.resolve(cwd, candidate) : candidate)),
  );

  return { agent, tool, cwd, paths };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function firstString(value: unknown): string | undefined {
  return Array.isArray(value) ? str(value[0]) : undefined;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
