---
title: How it works
description: How OpenFiles detects agent edits, avoids false positives, and feeds diagnostics back to the agent.
---

## Why files need to be open

VS Code's language servers are fast because they mostly work on what you're looking at. The defaults say so:

| Language server | Setting | Default |
|---|---|---|
| TypeScript / JavaScript | `typescript.tsserver.experimental.enableProjectDiagnostics` | `false` |
| ESLint | `eslint.run` / `eslint.lintTask.enable` | `onType` / `false` |
| Pylance | `python.analysis.diagnosticMode` | `openFilesOnly` |
| C# | `dotnet.backgroundAnalysis.analyzerDiagnosticsScope` | `openFiles` |
| PHP Intelephense | `intelephense.diagnostics.run` | `onType` |
| Ruby LSP | pull diagnostics per document | — |

Some servers do analyze the whole workspace: gopls, the Dart analyzer, and Java (Red Hat). rust-analyzer runs `cargo check` only when you save inside the editor. For those languages OpenFiles still gives you the review list and puts the results where you and the agent can see them. See the [linter reference](../reference/linters/) for 50 languages.

## Detection

OpenFiles uses three sources:

1. **File watcher.** Picks up any file created or changed on disk inside the workspace.
2. **Agent hooks.** After an edit, the agent runs `node ~/.openfiles/hook.js --agent <id>`. The script appends a line to `.openfiles/queue.jsonl` with the file paths, the agent and the tool name.
3. **Git.** Used to ignore branch switches, and on request (**Add Uncommitted Git Changes**) to pull in files changed before OpenFiles was running.

### What doesn't count

- **Your own saves.** OpenFiles records saves and file operations done in the editor. A change within `openfiles.detection.editorSaveGraceMs` (1.5 s) of a save, where the disk still matches the buffer, is yours. Format-on-save is included.
- **Git operations.** Changes around a HEAD move (checkout, pull, rebase), or while `.git/index.lock` exists, are ignored.
- **Bursts.** More than `openfiles.detection.burstLimit` (200) files at once is probably an install or a build. OpenFiles asks before tracking them and never opens them.
- **Ignored paths.** `openfiles.ignore`, `files.exclude`, `.git/` and `.openfiles/`.
- **Sensitive files.** Anything matching `openfiles.sensitive` (`.env`, keys) is tracked but never opened automatically.

A hook report and a watcher event for the same write within 2 seconds count as one change. The hook's agent name wins.

## Opening

In `open` mode, files open with `preview: false` and without taking focus. OpenFiles waits while you're typing (up to 15 s) and stops auto-opening after `openfiles.maxAutoOpen` files in a session. Files that are already open just reload from disk.

## Feedback to the agent

```text
agent edits src/auth.ts
  └─ hook.js appends to .openfiles/queue.jsonl, notes the time T
       └─ extension opens src/auth.ts, language servers publish diagnostics
            └─ extension waits for diagnostics to go quiet (700 ms), sets checkedAt, writes .openfiles/diagnostics.json
                 └─ hook.js sees checkedAt ≥ T (or times out after 4 s)
                      └─ prints the errors in the agent's hook output format
```

The hook never blocks the agent:

- If no VS Code window has this workspace open (no fresh `.openfiles/vscode/*.json`), it exits immediately.
- On any error, it exits 0.
- When time runs out, it returns whatever is known, or nothing.

See [the diagnostics file](../reference/diagnostics-file/) for the formats.

## Files OpenFiles writes

| Path | What | When |
|---|---|---|
| `.openfiles/.gitignore` | `*`, so the folder ignores itself | on activation |
| `.openfiles/vscode/<id>.json` | open tabs of each window, refreshed every 5 s | on activation |
| `.openfiles/diagnostics.json` | problems in AI-edited files | when they change |
| `.openfiles/queue.jsonl` | edits reported by hooks (truncated as it's read) | by `hook.js` |
| `~/.openfiles/hook.js` | the hook script | when you install hooks, and on update |
| agent config files | the hook entry | only when you confirm **Install Agent Hooks** |

Nothing is written in untrusted workspaces. There are no network calls and no telemetry.
