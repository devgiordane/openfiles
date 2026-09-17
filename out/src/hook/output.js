"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportsFeedback = supportsFeedback;
exports.renderHookOutput = renderHookOutput;
/** Agents whose post-edit hook can hand text back to the model. */
function supportsFeedback(agent, event) {
    switch (agent) {
        case "claude":
        case "codex":
        case "qwen":
        case "kimi":
        case "droid":
        case "gemini":
        case "copilot":
        case "vscode":
            return true;
        case "cursor":
            // afterFileEdit has no output channel; postToolUse does.
            return event !== "afterFileEdit";
        default:
            return false;
    }
}
/** JSON the agent expects on stdout, or undefined to print nothing. */
function renderHookOutput(agent, text, event) {
    if (!text || !supportsFeedback(agent, event)) {
        return undefined;
    }
    switch (agent) {
        case "gemini":
            return JSON.stringify({ hookSpecificOutput: { hookEventName: "AfterTool", additionalContext: text } });
        case "cursor":
            return JSON.stringify({ additional_context: text });
        case "copilot":
        case "vscode":
            // Copilot CLI reads the top-level field; VS Code agent hooks use the Claude-compatible shape.
            return JSON.stringify({
                additionalContext: text,
                hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text },
            });
        default:
            return JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: text } });
    }
}
//# sourceMappingURL=output.js.map