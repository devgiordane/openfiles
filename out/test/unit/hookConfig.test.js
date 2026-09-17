"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const hookConfig_1 = require("../../src/agents/hookConfig");
const registry_1 = require("../../src/agents/registry");
const script = "C:\\Users\\me\\.openfiles\\hook.js";
function setup(id) {
    const agent = (0, registry_1.agentById)(id);
    return { agent, format: agent.hook };
}
(0, vitest_1.describe)("installHook", () => {
    (0, vitest_1.it)("adds a Claude Code PostToolUse hook and keeps existing settings", () => {
        const { agent, format } = setup("claude");
        const existing = {
            permissions: { allow: ["Bash(npm test)"] },
            hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }] },
        };
        const result = (0, hookConfig_1.installHook)(format, agent, existing, script);
        const config = JSON.parse(result.content);
        (0, vitest_1.expect)(result.changed).toBe(true);
        (0, vitest_1.expect)(config.permissions).toEqual(existing.permissions);
        (0, vitest_1.expect)(config.hooks.PostToolUse).toHaveLength(2);
        (0, vitest_1.expect)(config.hooks.PostToolUse[1].matcher).toBe("Edit|Write|MultiEdit|NotebookEdit");
        (0, vitest_1.expect)(config.hooks.PostToolUse[1].hooks[0].command).toBe(`node "C:/Users/me/.openfiles/hook.js" --agent claude --tag ${hookConfig_1.HOOK_MARKER}`);
    });
    (0, vitest_1.it)("is idempotent", () => {
        const { agent, format } = setup("gemini");
        const first = (0, hookConfig_1.installHook)(format, agent, undefined, script);
        const second = (0, hookConfig_1.installHook)(format, agent, JSON.parse(first.content), script);
        (0, vitest_1.expect)(second.changed).toBe(false);
        (0, vitest_1.expect)(JSON.parse(second.content).hooks.AfterTool).toHaveLength(1);
    });
    (0, vitest_1.it)("writes both Cursor events, with feedback only on postToolUse", () => {
        const { agent, format } = setup("cursor");
        const config = JSON.parse((0, hookConfig_1.installHook)(format, agent, undefined, script).content);
        (0, vitest_1.expect)(config.version).toBe(1);
        (0, vitest_1.expect)(config.hooks.afterFileEdit[0].command).toContain("--no-feedback");
        (0, vitest_1.expect)(config.hooks.postToolUse[0].command).not.toContain("--no-feedback");
    });
    (0, vitest_1.it)("writes a standalone Copilot hooks file", () => {
        const { agent, format } = setup("copilot");
        const config = JSON.parse((0, hookConfig_1.installHook)(format, agent, undefined, script).content);
        (0, vitest_1.expect)(config.hooks.postToolUse[0].bash).toContain("--agent copilot");
    });
});
(0, vitest_1.describe)("removeHook", () => {
    (0, vitest_1.it)("removes only our entries", () => {
        const { agent, format } = setup("claude");
        const installed = JSON.parse((0, hookConfig_1.installHook)(format, agent, { hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }] } }, script).content);
        (0, vitest_1.expect)((0, hookConfig_1.hasHook)(installed)).toBe(true);
        const removed = JSON.parse((0, hookConfig_1.removeHook)(format, installed).content);
        (0, vitest_1.expect)(removed.hooks.PostToolUse).toEqual([{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }]);
        (0, vitest_1.expect)((0, hookConfig_1.hasHook)(removed)).toBe(false);
    });
    (0, vitest_1.it)("drops an empty hooks object", () => {
        const { agent, format } = setup("codex");
        const installed = JSON.parse((0, hookConfig_1.installHook)(format, agent, undefined, script).content);
        (0, vitest_1.expect)(JSON.parse((0, hookConfig_1.removeHook)(format, installed).content)).toEqual({});
    });
    (0, vitest_1.it)("deletes files we own", () => {
        const { agent, format } = setup("copilot");
        const installed = JSON.parse((0, hookConfig_1.installHook)(format, agent, undefined, script).content);
        (0, vitest_1.expect)((0, hookConfig_1.removeHook)(format, installed)).toEqual({ content: undefined, changed: true });
    });
});
//# sourceMappingURL=hookConfig.test.js.map