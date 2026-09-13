import { describe, expect, it } from "vitest";
import { hasHook, HOOK_MARKER, installHook, removeHook } from "../../src/agents/hookConfig";
import { agentById } from "../../src/agents/registry";

const script = "C:\\Users\\me\\.openfiles\\hook.js";

function setup(id: string) {
  const agent = agentById(id)!;
  return { agent, format: agent.hook! };
}

describe("installHook", () => {
  it("adds a Claude Code PostToolUse hook and keeps existing settings", () => {
    const { agent, format } = setup("claude");
    const existing = {
      permissions: { allow: ["Bash(npm test)"] },
      hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }] },
    };
    const result = installHook(format, agent, existing, script);
    const config = JSON.parse(result.content!);
    expect(result.changed).toBe(true);
    expect(config.permissions).toEqual(existing.permissions);
    expect(config.hooks.PostToolUse).toHaveLength(2);
    expect(config.hooks.PostToolUse[1].matcher).toBe("Edit|Write|MultiEdit|NotebookEdit");
    expect(config.hooks.PostToolUse[1].hooks[0].command).toBe(
      `node "C:/Users/me/.openfiles/hook.js" --agent claude --tag ${HOOK_MARKER}`,
    );
  });

  it("is idempotent", () => {
    const { agent, format } = setup("gemini");
    const first = installHook(format, agent, undefined, script);
    const second = installHook(format, agent, JSON.parse(first.content!), script);
    expect(second.changed).toBe(false);
    expect(JSON.parse(second.content!).hooks.AfterTool).toHaveLength(1);
  });

  it("writes both Cursor events, with feedback only on postToolUse", () => {
    const { agent, format } = setup("cursor");
    const config = JSON.parse(installHook(format, agent, undefined, script).content!);
    expect(config.version).toBe(1);
    expect(config.hooks.afterFileEdit[0].command).toContain("--no-feedback");
    expect(config.hooks.postToolUse[0].command).not.toContain("--no-feedback");
  });

  it("writes a standalone Copilot hooks file", () => {
    const { agent, format } = setup("copilot");
    const config = JSON.parse(installHook(format, agent, undefined, script).content!);
    expect(config.hooks.postToolUse[0].bash).toContain("--agent copilot");
  });
});

describe("removeHook", () => {
  it("removes only our entries", () => {
    const { agent, format } = setup("claude");
    const installed = JSON.parse(
      installHook(format, agent, { hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }] } }, script).content!,
    );
    expect(hasHook(installed)).toBe(true);
    const removed = JSON.parse(removeHook(format, installed).content!);
    expect(removed.hooks.PostToolUse).toEqual([{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }]);
    expect(hasHook(removed)).toBe(false);
  });

  it("drops an empty hooks object", () => {
    const { agent, format } = setup("codex");
    const installed = JSON.parse(installHook(format, agent, undefined, script).content!);
    expect(JSON.parse(removeHook(format, installed).content!)).toEqual({});
  });

  it("deletes files we own", () => {
    const { agent, format } = setup("copilot");
    const installed = JSON.parse(installHook(format, agent, undefined, script).content!);
    expect(removeHook(format, installed)).toEqual({ content: undefined, changed: true });
  });
});
