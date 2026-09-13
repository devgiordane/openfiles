# Changelog

## 0.2.0

OpenFiles is now about reviewing what AI agents change.

- Detects files changed outside the editor (file watcher + Git), ignoring your own saves, branch switches and bulk installs.
- Agent hooks for Claude Code, Codex CLI, GitHub Copilot, Gemini CLI and Cursor, plus beta support for Windsurf and OpenCode. Installed with a diff preview; existing hooks are kept.
- Hooks send errors and warnings back to the agent after each edit.
- New sidebar: AI Edits (with review checkboxes), Problems in AI Edits, Agents & Hooks, Profiles.
- **AI** badge on unreviewed files in the Explorer.
- Configurable status bar item and quick menu.
- Commands for reviewing, diffing against HEAD, copying prompts, pausing, and a Doctor report with linter recommendations.
- `.openfiles/diagnostics.json` for agents to read.
- Get Started walkthrough.
- UI in English and Brazilian Portuguese.
- Profiles from 0.1 still work; `.openfiles.json` now has schema validation.

## 0.1.0

- First version: open files from `.openfiles.json` profiles and publish the open tabs to `.openfiles/vscode/`.
