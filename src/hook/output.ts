import type { AgentId } from "./parse";

/** Agents whose post-edit hook can hand text back to the model. */
export function supportsFeedback(agent: AgentId, event?: string): boolean {
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
export function renderHookOutput(agent: AgentId, text: string, event?: string): string | undefined {
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
