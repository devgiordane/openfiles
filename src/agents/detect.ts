import * as fs from "node:fs/promises";
import * as path from "node:path";
import { parse, type ParseError } from "jsonc-parser";
import { exists } from "../shared/openfilesDir";
import { hasHook } from "./hookConfig";
import { AGENTS, type AgentDefinition } from "./registry";

export interface AgentStatus {
  agent: AgentDefinition;
  detected: boolean;
  hookInstalled: boolean;
}

export interface ConfigFile {
  path: string;
  exists: boolean;
  raw?: string;
  /** Parsed JSON(C), or the raw text for plugin files. */
  value?: unknown;
  error?: string;
}

export async function readAgentConfig(root: string, agent: AgentDefinition): Promise<ConfigFile | undefined> {
  if (!agent.hook) {
    return undefined;
  }
  const file = path.join(root, agent.hook.file);
  let raw: string;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    return { path: file, exists: false };
  }
  if (agent.hook.kind === "opencode-plugin") {
    return { path: file, exists: true, raw, value: raw };
  }
  const errors: ParseError[] = [];
  const value = raw.trim() === "" ? {} : parse(raw, errors, { allowTrailingComma: true });
  return {
    path: file,
    exists: true,
    raw,
    value,
    error: errors.length > 0 ? `invalid JSON at offset ${errors[0].offset}` : undefined,
  };
}

export async function agentStatuses(root: string): Promise<AgentStatus[]> {
  return Promise.all(
    AGENTS.map(async (agent) => {
      const markers = await Promise.all(agent.markers.map((marker) => exists(path.join(root, marker))));
      const config = await readAgentConfig(root, agent);
      return {
        agent,
        detected: markers.some(Boolean),
        hookInstalled: !!config?.exists && hasHook(config.value),
      };
    }),
  );
}
