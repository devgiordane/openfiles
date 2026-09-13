---
title: Diagnostics file and hook protocol
description: The formats of .openfiles/diagnostics.json, .openfiles/queue.jsonl and the hook script's arguments and output.
---

These formats are how agents and scripts talk to OpenFiles. They are versioned; breaking changes bump `version`.

## `.openfiles/diagnostics.json`

Written by the extension, in each workspace folder, whenever problems in AI-edited files change.

```jsonc
{
  "version": 1,
  "updatedAt": 1789322228723,          // epoch ms
  "hook": {
    "feedback": "errorsAndWarnings",   // openfiles.hooks.feedback
    "timeoutMs": 4000                  // openfiles.hooks.feedbackTimeoutMs
  },
  "files": {
    "src/auth.ts": {                   // workspace-relative, forward slashes
      "path": "/home/me/app/src/auth.ts",
      "checkedAt": 1789322228700,      // when diagnostics settled after the last edit; 0 = not yet
      "errors": 1,
      "warnings": 0,
      "items": [
        {
          "line": 42,                  // 1-based
          "column": 7,                 // 1-based
          "severity": "error",         // error | warning | info | hint
          "source": "ts",
          "code": "2322",
          "message": "Type 'string' is not assignable to type 'number'."
        }
      ]
    }
  }
}
```

Reading it from an agent:

- Only files changed in the current session are listed.
- If `checkedAt` is older than your edit, the editor hasn't finished checking yet. Wait and read again.
- In `queue` mode files aren't opened, so many language servers won't have looked at them. An empty `items` there doesn't mean clean.

## `.openfiles/queue.jsonl`

Appended by `hook.js`, one JSON object per line. The extension reads new lines and truncates the file once it has read everything.

```json
{"v":1,"ts":1789322228384,"agent":"claude","tool":"Edit","paths":["/home/me/app/src/auth.ts"]}
```

Anything can write here: a script, a Makefile, another tool. Use absolute paths.

## `hook.js`

```text
node ~/.openfiles/hook.js --agent <id> [--event <name>] [--no-feedback]
```

| Argument | |
|---|---|
| `--agent` | `claude`, `codex`, `copilot`, `vscode`, `gemini`, `qwen`, `kimi`, `cursor`, `windsurf`, `kiro`, `cline`, `droid`, `goose`, `opencode`, `unknown` |
| `--event` | the hook event, when an agent has several (`afterFileEdit`, `postToolUse`) |
| `--no-feedback` | only report the edit; don't wait for or print diagnostics |

Behavior:

1. Reads the hook payload from stdin (3 s max).
2. Finds edited paths. Tools whose name doesn't look like a write (`Read`, `Grep`, `Bash`) are ignored.
3. Walks up from the edited file to the nearest folder with a fresh `.openfiles/vscode/*.json` (less than 60 s old). If there isn't one, it exits.
4. Appends to `queue.jsonl`.
5. Unless `--no-feedback` is set, it waits until every path has `checkedAt ≥` the time of step 4, or until `hook.timeoutMs` passes.
6. Prints feedback in the agent's format, or nothing:

| Agent | Output |
|---|---|
| claude, codex, qwen, kimi, droid | `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"…"}}` |
| gemini | `{"hookSpecificOutput":{"hookEventName":"AfterTool","additionalContext":"…"}}` |
| copilot, vscode | `{"additionalContext":"…","hookSpecificOutput":{…}}` |
| cursor (`postToolUse`) | `{"additional_context":"…"}` |
| everyone else | nothing |

It always exits `0`.

## `.openfiles/vscode/<id>.json`

One file per VS Code window, refreshed every `openfiles.heartbeatSeconds`. It's useful if an agent wants to know what you're looking at.

```json
{
  "version": 1,
  "workspaceRoot": "/home/me/app",
  "sessionId": "…",
  "appName": "Visual Studio Code",
  "updatedAt": 1789322228.72,
  "files": ["/home/me/app/src/auth.ts"]
}
```

`updatedAt` is in seconds, kept that way for compatibility with 0.1 clients.
