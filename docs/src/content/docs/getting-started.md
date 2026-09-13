---
title: Getting started
description: Install OpenFiles, connect your agent and review your first AI edit in about two minutes.
---

## 1. Install

- **VS Code:** [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=devgiordane.openfiles), or run `code --install-extension devgiordane.openfiles`
- **Cursor, Windsurf, VSCodium, Antigravity, Kiro:** [Open VSX](https://open-vsx.org/extension/devgiordane/openfiles). Search "OpenFiles" in the Extensions view.

OpenFiles needs VS Code 1.93 or a fork based on it.

## 2. Open the walkthrough

Run **OpenFiles: Get Started** from the Command Palette. It walks through the steps below, and you can skip any of them.

## 3. Pick a mode

| `openfiles.mode` | What happens when an agent writes a file |
|---|---|
| `open` (default) | Opens it in a background tab. Your language servers check it right away. |
| `queue` | Lists it in the sidebar only. Most linters won't check it until you open it. |
| `notify` | Shows a notification with an **Open** button. |

## 4. Connect your agent (optional, recommended)

Run **OpenFiles: Install Agent Hooks…**, then pick the agents you use. OpenFiles shows a diff of each config file and writes nothing until you confirm.

Hooks give you two things the watcher can't:

1. **Attribution.** You know which agent changed which file.
2. **Feedback.** After each edit, the agent receives the errors your linters found.

Hooks run `node`, so Node.js must be on your PATH. See the page for your agent: [Claude Code](../agents/claude-code/), [Codex CLI](../agents/codex/), [GitHub Copilot](../agents/copilot/), [Gemini CLI](../agents/gemini-cli/), [Cursor](../agents/cursor/), [other agents](../agents/other/).

## 5. Check your linters

Run **OpenFiles: Run Doctor**. It lists the languages in your repo that have no extension checking them, and links the ones to install. In Cursor, Windsurf and VSCodium it suggests Open VSX alternatives, because Pylance, C# Dev Kit and the Microsoft C/C++ extension aren't published there.

## 6. Let the agent work

Ask your agent to change something. You'll see:

- the changed files open without stealing focus;
- an **AI** badge on those files in the Explorer;
- the **AI Edits** view in the OpenFiles sidebar, with a checkbox and problem count per file;
- the status bar item showing unreviewed files, errors and warnings.

Run **OpenFiles: Review Next Changed File** to go through them. It marks the current file reviewed and opens the next one, with files that have errors first.
