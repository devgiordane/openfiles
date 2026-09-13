---
title: Gemini CLI
description: Connect Gemini CLI to OpenFiles with an AfterTool hook.
---

**Support:** detection and feedback.

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **Gemini CLI**. OpenFiles adds this to `.gemini/settings.json`:

```json
{
  "hooks": {
    "AfterTool": [
      {
        "matcher": "write_file|replace",
        "hooks": [
          {
            "type": "command",
            "name": "OpenFiles",
            "command": "node \"/Users/you/.openfiles/hook.js\" --agent gemini --tag openfiles-hook",
            "timeout": 15000
          }
        ]
      }
    ]
  }
}
```

Gemini CLI timeouts are in milliseconds. Gemini expects a hook's stdout to be pure JSON, and OpenFiles prints either one JSON object or nothing.

## What Gemini sees

`hookSpecificOutput.additionalContext` is appended to the tool result.

Reference: [Gemini CLI hooks](https://geminicli.com/docs/hooks/reference/).
