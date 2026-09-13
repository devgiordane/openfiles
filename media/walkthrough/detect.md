# Which agents are here?

OpenFiles checks this workspace for the usual traces:

| Agent | What it looks for |
|---|---|
| Claude Code | `.claude/`, `CLAUDE.md` |
| Codex CLI | `.codex/`, `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/hooks/` |
| Gemini CLI | `.gemini/`, `GEMINI.md` |
| Cursor | `.cursor/` |
| OpenCode | `.opencode/`, `opencode.json` |

Don't see yours? That's fine. The file watcher catches edits from any tool that writes to disk: Aider, Goose, Amp, a shell script, anything.
