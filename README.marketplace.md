# OpenFiles: Review & Lint AI Edits

**Your AI wrote it. Your linter never saw it.**

Claude Code, Codex, Copilot, Gemini CLI and OpenCode edit files straight on disk, and most of VS Code's language servers only check files that are open. OpenFiles opens every file your agent touches, lets your linters run, lists the changes for review, and hands the problems back to the agent.

[Documentation](https://devgiordane.github.io/openfiles) · [GitHub](https://github.com/devgiordane/openfiles) · [Issues](https://github.com/devgiordane/openfiles/issues)

## Why

- **TypeScript:** project-wide errors are off by default.
- **ESLint:** lints a file as you type in it.
- **Pylance:** `diagnosticMode` defaults to `openFilesOnly`.
- **C#:** analyzers default to open documents.

So when an agent changes twenty files from a terminal, the Problems panel stays empty and you find out in CI.

| Without OpenFiles | With OpenFiles |
|---|---|
| The agent says "Done ✅" | Every file it wrote opens in a background tab |
| Nothing is open, so nothing is checked | Your linters check those files |
| Errors show up in CI | The **AI Edits** sidebar lists each file with its problems |
| You paste errors back by hand | The hook sends them to the agent in the same turn |

## Getting started

1. Run **OpenFiles: Get Started** from the Command Palette.
2. Run **OpenFiles: Install Agent Hooks…** and pick your agents. You'll see a diff of each config file before anything is written.
3. Let your agent work. Changed files open in the background, get an **AI** badge, and show up in the OpenFiles sidebar.
4. Use **OpenFiles: Review Next Changed File** to go through them, errors first.

## Agents

| Agent | Detection | Problems sent back |
|---|---|---|
| Claude Code | `PostToolUse` hook | ✅ |
| Codex CLI | `PostToolUse` hook | ✅ |
| GitHub Copilot (CLI & agent mode) | `postToolUse` hook | ✅ |
| Gemini CLI | `AfterTool` hook | ✅ |
| Cursor | `afterFileEdit` + `postToolUse` hooks | ✅ |
| Windsurf, OpenCode | hook / plugin (beta) | via diagnostics file |
| Aider, Goose, Amp, Kiro, Cline, anything else | file watcher + Git | via diagnostics file |

## Features

- **Sidebar:** AI Edits with a checkbox per file, Problems in AI Edits, Agents & Hooks, Profiles.
- **Configurable status bar:** choose what it shows (changed files, unreviewed, errors, warnings, agent, paused) and what clicking does.
- **Command Palette & context menus:** review next, open diff vs HEAD, mark reviewed, copy a "fix these problems" prompt, pause watching, add uncommitted Git changes, run doctor.
- **Doctor:** lists languages in your repo with no linter installed, with Open VSX alternatives in Cursor, Windsurf and VSCodium.
- **Prompts:** instructions for AGENTS.md / CLAUDE.md, fix-problems, small steps, PR description.
- **`.openfiles/diagnostics.json`:** problems in AI-edited files, for any agent to read.

Everything runs locally. No telemetry, no network calls.

## Settings

| Setting | Default |
|---|---|
| `openfiles.mode` | `open` (`queue`, `notify`) |
| `openfiles.maxAutoOpen` | `15` |
| `openfiles.hooks.feedback` | `errorsAndWarnings` |
| `openfiles.statusBar.items` | `["unreviewed","errors","warnings"]` |
| `openfiles.statusBar.clickAction` | `menu` |

See the [full settings reference](https://devgiordane.github.io/openfiles/reference/settings/).

MIT licensed. Contributions welcome on [GitHub](https://github.com/devgiordane/openfiles).
