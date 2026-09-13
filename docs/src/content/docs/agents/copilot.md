---
title: GitHub Copilot
description: Connect Copilot CLI and VS Code agent mode to OpenFiles with a postToolUse hook.
---

**Support:** detection and feedback.

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **GitHub Copilot**. OpenFiles creates its own file, `.github/hooks/openfiles.json`:

```json
{
  "version": 1,
  "hooks": {
    "postToolUse": [
      {
        "type": "command",
        "bash": "node \"/Users/you/.openfiles/hook.js\" --agent copilot --tag openfiles-hook",
        "powershell": "node \"/Users/you/.openfiles/hook.js\" --agent copilot --tag openfiles-hook",
        "timeoutSec": 15
      }
    ]
  }
}
```

There's no matcher. The hook script checks the tool name itself and ignores tools that don't write files. VS Code agent mode reads the same folder but doesn't apply matchers, so doing the check in the script covers both.

`.github/hooks/` is usually committed. Because the command points at your home directory, either keep this file out of Git or have each teammate run the install.

## What Copilot sees

Copilot CLI appends `additionalContext` to the tool result, so the model reads it in the same turn. Output is capped at 10 KB across hooks, and OpenFiles keeps its message under 9 KB.

Reference: [Copilot hooks](https://docs.github.com/en/copilot/reference/hooks-reference).
