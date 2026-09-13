---
title: Claude Code
description: Connect Claude Code to OpenFiles with a PostToolUse hook, so the problems in files it edits go straight back to Claude.
---

**Support:** detection and feedback. Claude receives the errors in the same turn.

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **Claude Code**. OpenFiles adds this to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/Users/you/.openfiles/hook.js\" --agent claude --tag openfiles-hook",
            "timeout": 15
          }
        ]
      }
    ]
  }
}
```

It uses the **local** settings file on purpose. The command points at your home directory, and Claude Code keeps `settings.local.json` out of Git. If you want the whole team on it, each person runs the install once.

Restart any running `claude` session, then run `/hooks` to confirm it's listed.

## What Claude sees

When the edited file has problems, the hook returns:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "OpenFiles opened the files you just edited in the editor. The language servers report 1 error:\n- src/auth.ts:42:7 error 2322 (ts): Type 'string' is not assignable to type 'number'.\nFix these before you report the task as done."
  }
}
```

## Notes

- Claude Code's own IDE integration (`/ide`) shows diffs and lets Claude ask for diagnostics. OpenFiles complements it: it works when Claude runs headless (`claude -p`), in another terminal or in a worktree, and it keeps a review list across sessions.
- Settings reference: [Claude Code hooks](https://code.claude.com/docs/en/hooks).
