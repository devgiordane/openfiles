---
title: Codex CLI
description: Connect OpenAI Codex CLI to OpenFiles with a PostToolUse hook on apply_patch.
---

**Support:** detection and feedback.

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **Codex CLI**. OpenFiles writes `.codex/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "apply_patch|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/Users/you/.openfiles/hook.js\" --agent codex --tag openfiles-hook",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

Codex edits files through `apply_patch`. The hook reads the patch in `tool_input.command` and takes every `*** Add File:`, `*** Update File:` and `*** Move to:` path. Deleted files are skipped.

If the hook doesn't fire, check that hooks are enabled in your Codex configuration: [Codex hooks documentation](https://learn.chatgpt.com/docs/hooks).

## What Codex sees

The problems come back as `hookSpecificOutput.additionalContext`, which Codex adds as developer context.
