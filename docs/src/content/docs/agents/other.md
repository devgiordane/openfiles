---
title: Other agents
description: Aider, Goose, Amp, Crush, Qwen Code, Kiro, Cline, Warp and anything else that writes files.
---

Any tool that writes to disk is detected by the file watcher. You lose attribution ("changed outside the editor" instead of the agent's name) and automatic feedback, but you keep the auto-open, badges, review list and `.openfiles/diagnostics.json`.

To have those agents read the problems, add the [AGENTS.md section](../../guides/prompts/).

| Agent | Today | Possible hook |
|---|---|---|
| Aider | watcher + auto-commits (use **Add Uncommitted Git Changes**) | none |
| Goose | watcher | `PostToolUse` via Open Plugins |
| Amp | watcher | `tool:post-execute` (actions limited) |
| Crush | watcher (it has its own LSP client) | none |
| Qwen Code | watcher | `PostToolUse` in `.qwen/settings.json` |
| Kimi CLI | watcher | `PostToolUse` (beta) |
| Kiro | watcher | Post Tool Use / File Save hooks in `.kiro/hooks/` |
| Cline | watcher | `PostToolUse` in `.clinerules/hooks/` |
| Factory Droid | watcher | `PostToolUse`, matcher `Create\|Edit\|ApplyPatch` |
| Warp | watcher | none |

## Wiring one up by hand

The hook script reads JSON on stdin and looks for a file path in the usual places (`tool_input.file_path`, `file_path`, `path`, `tool_info.file_path`, Codex patches, Copilot `toolArgs`). For most agents with a Claude-style hook, this works:

```sh
node ~/.openfiles/hook.js --agent unknown
```

Add `--agent claude` if the agent accepts Claude Code's `hookSpecificOutput.additionalContext` output, so the problems go back to it.

If you get an agent working, please open an [agent support issue](https://github.com/devgiordane/openfiles/issues/new?template=agent_support.yml) with a sample payload, so it can become a one-click install.
