# Hooks: who changed what, and a way to talk back

A hook is a command your agent runs after it edits a file. OpenFiles adds one that:

1. tells the editor exactly which files changed and which agent did it;
2. waits a few seconds for your linters to look at them;
3. hands any errors back to the agent, so it fixes them in the same turn.

Step 3 works in Claude Code, Codex CLI, Copilot CLI, Gemini CLI and Cursor.

Before anything is written, you'll see a diff of the config file. Existing hooks are kept. You can remove ours later with **OpenFiles: Remove Agent Hooks…**

The hook runs `node`, so Node.js needs to be on your PATH.
