"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOOK_MARKER = void 0;
exports.hookCommand = hookCommand;
exports.installHook = installHook;
exports.removeHook = removeHook;
exports.hasHook = hasHook;
exports.opencodePlugin = opencodePlugin;
/** Every command we write contains this, so we can find (and remove) our own entries later. */
exports.HOOK_MARKER = "openfiles-hook";
function hookCommand(nodeScript, agent, extra = []) {
    const script = nodeScript.replaceAll("\\", "/");
    return [`node "${script}"`, "--agent", agent, ...extra, `--tag ${exports.HOOK_MARKER}`].join(" ");
}
function isOurs(value) {
    return JSON.stringify(value ?? "").includes(exports.HOOK_MARKER);
}
function clone(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? structuredClone(value) : {};
}
function asArray(value) {
    return Array.isArray(value) ? value : [];
}
function stringify(value) {
    return `${JSON.stringify(value, null, 2)}\n`;
}
/**
 * Add our hook to an agent config without touching anything else in it.
 * `existing` is the parsed current file (undefined when it doesn't exist).
 */
function installHook(format, agent, existing, nodeScript) {
    switch (format.kind) {
        case "matcher-groups": {
            const config = clone(existing);
            const hooks = clone(config.hooks);
            const groups = asArray(hooks[format.event]).filter((group) => !isOurs(group));
            const command = {
                type: "command",
                command: hookCommand(nodeScript, agent.id),
                timeout: format.timeout,
            };
            if (agent.id === "gemini") {
                command.name = "OpenFiles";
            }
            const group = { hooks: [command] };
            if (format.matcher) {
                group.matcher = format.matcher;
            }
            hooks[format.event] = [...groups, group];
            config.hooks = hooks;
            return finish(existing, config);
        }
        case "copilot": {
            const command = hookCommand(nodeScript, agent.id);
            const config = {
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
function removeHook(format, existing) {
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
                }
                else {
                    delete hooks[event];
                }
            }
            if (Object.keys(hooks).length > 0) {
                config.hooks = hooks;
            }
            else {
                delete config.hooks;
            }
            return finish(existing, config);
        }
    }
}
function hasHook(existing) {
    return existing !== undefined && isOurs(existing);
}
function finish(existing, next) {
    const content = stringify(next);
    const before = existing === undefined ? undefined : typeof existing === "string" ? existing : stringify(existing);
    return { content, changed: before !== content };
}
function opencodePlugin(nodeScript) {
    const script = JSON.stringify(nodeScript.replaceAll("\\", "/"));
    return `// ${exports.HOOK_MARKER}: added by the OpenFiles VS Code extension. Delete this file to remove it.
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
//# sourceMappingURL=hookConfig.js.map