---
title: Cursor
description: Connect Cursor's agent to OpenFiles with afterFileEdit and postToolUse hooks.
---

**Support:** detection and feedback. Install OpenFiles in Cursor from [Open VSX](https://open-vsx.org/extension/devgiordane/openfiles).

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **Cursor**. OpenFiles adds two entries to `.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      { "command": "node \"/Users/you/.openfiles/hook.js\" --agent cursor --event afterFileEdit --no-feedback --tag openfiles-hook" }
    ],
    "postToolUse": [
      { "command": "node \"/Users/you/.openfiles/hook.js\" --agent cursor --event postToolUse --tag openfiles-hook" }
    ]
  }
}
```

- `afterFileEdit` reports every file the agent edits. It can't send anything back, so it runs with `--no-feedback`.
- `postToolUse` can return `additional_context` to the conversation, so that's where the problems go. The hook skips tools that don't write files.

Cursor also runs Claude Code hooks. If you installed both, the same edit gets reported twice; OpenFiles merges the two.

## A note on in-editor agents

Cursor's agent edits files through the editor, so many of those files are already open and checked. What OpenFiles adds here is the review list, the badges, and the problems handed back to the agent.

Reference: [Cursor hooks](https://cursor.com/docs/hooks).
