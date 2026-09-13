<div align="center">

<img src="media/icon.png" width="96" alt="OpenFiles logo">

# OpenFiles

### Your AI wrote it. Your linter never saw it.

Claude Code, Codex, Copilot, Gemini CLI and OpenCode edit files straight on disk.<br>
Most of VS Code's language servers only check files that are open in the editor.<br>
**OpenFiles opens every file your agent touches, lets your linters run, and hands the problems back to the agent.**

[![VS Marketplace](https://vsmarketplacebadges.dev/version-short/devgiordane.openfiles.svg?label=VS%20Marketplace&color=111111)](https://marketplace.visualstudio.com/items?itemName=devgiordane.openfiles)
[![Open VSX](https://img.shields.io/open-vsx/v/devgiordane/openfiles?label=Open%20VSX&color=111111)](https://open-vsx.org/extension/devgiordane/openfiles)
[![License: MIT](https://img.shields.io/badge/license-MIT-111111)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/devgiordane/openfiles?color=111111)](https://github.com/devgiordane/openfiles/stargazers)

[Install](#install) · [Why](#the-problem) · [How it works](#how-it-works) · [Agents](#works-with-your-agent) · [Prompts](#prompts) · [Docs](https://devgiordane.github.io/openfiles)

English · [Português](docs/readme/README.pt-BR.md)

</div>

---

## Install

**VS Code:** [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=devgiordane.openfiles)<br>
**Cursor, Windsurf, VSCodium, Antigravity, Kiro:** [Open VSX](https://open-vsx.org/extension/devgiordane/openfiles)

```sh
code --install-extension devgiordane.openfiles
```

Then run **OpenFiles: Get Started** from the Command Palette. It takes about two minutes.

<details>
<summary><b>Or paste this into your agent</b></summary>

```text
Set up OpenFiles for this repository. Read https://devgiordane.github.io/openfiles/llms.txt,
add the OpenFiles section to AGENTS.md (or CLAUDE.md / GEMINI.md), and tell me to run
"OpenFiles: Install Agent Hooks…" in VS Code. Don't write hook config yourself.
```

</details>

## The problem

I kept merging agent work that the agent swore was done, and then CI would find the type errors. The linters were installed. They just never looked.

VS Code's language servers are very good, and most of them only check **open** files by default:

- **TypeScript:** project-wide errors are behind `typescript.tsserver.experimental.enableProjectDiagnostics`, which is off.
- **ESLint:** lints a file as you type in it.
- **Pylance:** `python.analysis.diagnosticMode` defaults to `openFilesOnly`.
- **C#:** analyzer and compiler diagnostics default to `openFiles`.

So when an agent edits twenty files in a terminal, nothing checks them, and the Problems panel stays empty.

| Without OpenFiles | With OpenFiles |
|---|---|
| The agent says "Done ✅" | Every file the agent wrote opens in a background tab |
| The Problems panel is empty because nothing is open | ESLint, TypeScript, Pylance and friends check those files |
| You find 3 type errors in CI, or in production | The **AI Edits** sidebar lists the files with a checkbox each: `auth.ts 2✕ 1⚠` |
| You ask the agent to fix them and paste errors by hand | The hook hands those errors to the agent, so it fixes them in the same turn |

<details>
<summary>Fine print</summary>

Not every language server works this way. gopls, the Dart analyzer and Java (Red Hat) analyze the whole workspace. rust-analyzer checks the workspace, but only when you save *inside the editor*, so writes from outside don't trigger it. Even when results do exist, they sit in a panel nobody opened while the agent was working. The [linter reference](https://devgiordane.github.io/openfiles/reference/linters/) lists 50 languages with their default scope and the setting that controls it.

</details>

## Works with your agent

Every agent below writes files without opening them. Some ship an IDE bridge that shows diffs for their own edits while you watch. None of them gives you a lint-checked list of everything that changed when you run them headless, in another terminal, or side by side with another agent.

| Agent | Detected by | Problems sent back to the agent |
|---|---|---|
| **Claude Code** | `PostToolUse` hook | ✅ |
| **Codex CLI** | `PostToolUse` hook (parses `apply_patch`) | ✅ |
| **GitHub Copilot** (CLI & agent mode) | `postToolUse` hook | ✅ |
| **Gemini CLI** | `AfterTool` hook | ✅ |
| **Cursor** | `afterFileEdit` + `postToolUse` hooks | ✅ |
| **Windsurf / Devin Desktop** | `post_write_code` hook (beta) | — |
| **OpenCode** | plugin, `file.edited` (beta) | — |
| **Aider, Goose, Amp, Crush, Qwen Code, Kiro, Cline, anything else** | file watcher + Git | via `.openfiles/diagnostics.json` |

Hooks are optional. Without them, OpenFiles still catches every write through the file watcher; it just can't tell which agent made it.

**Editors:** VS Code, Cursor, Windsurf, VSCodium, Google Antigravity, Kiro, Trae, Positron. Anything built on VS Code 1.93 or newer.

## How it works

```text
 agent writes a file ──┬── hook ─────────▶ .openfiles/queue.jsonl ──┐
                       └── file watcher ─────────────────────────────┤  (skips your own saves,
                                                                     │   git checkouts, npm install)
                                                                     ▼
                                                            AI Edits session
                                                                     │
                              open in a background tab ◀─────────────┤
                                         │                           │
                     your language servers check it                  │
                                         │                           │
                                         ▼                           ▼
                     .openfiles/diagnostics.json ──▶ hook ──▶ "src/auth.ts:42 error TS2322 …" ──▶ agent
```

- **Detection.** OpenFiles uses a file watcher, Git (to ignore branch switches) and agent hooks. Saves you make in the editor, including format-on-save, don't count. A burst of 200 files (an install or a build) is listed, not opened.
- **Review.** The sidebar groups changes by agent with a checkbox per file. **Review Next Changed File** marks the current file reviewed and opens the next one, errors first. Changing a file again unchecks it.
- **Feedback.** The hook waits up to 4 seconds for diagnostics to settle, then returns them to the agent in the format that agent expects. If VS Code isn't running, the hook exits without doing anything and never blocks the agent.

Everything stays on your machine. No telemetry, no network calls, no account.

## What you get

**Sidebar.** Four views: *AI Edits* (checkbox per file, grouped by agent, problem counts), *Problems in AI Edits*, *Agents & Hooks*, and *Profiles*. Changed files also get an **AI** badge in the Explorer.

**Status bar.** Shows unreviewed files, errors and warnings by default. Run **OpenFiles: Configure Status Bar…** to choose what it shows (changed files, unreviewed, errors, warnings, last agent, paused) and what clicking does.

**Command Palette.** Everything starts with `OpenFiles:`:

| Command | What it does |
|---|---|
| Review Next Changed File | Marks the current file reviewed and opens the next one, errors first |
| Open AI-Edited Files | Opens every unreviewed file |
| Show Problems in AI-Edited Files | Focuses the problems view, scoped to agent edits |
| Open Diff vs HEAD | Shows exactly what changed |
| Copy "Fix These Problems" Prompt | Copies the current errors with file:line, ready to paste |
| Install Agent Hooks… | Picks your agents, previews the config diff, writes on confirm |
| Add Uncommitted Git Changes | Pulls in files an agent changed before you installed OpenFiles |
| Pause / Resume Watching | For when you're doing a big refactor yourself |
| Run Doctor | Lists which languages in this repo have no linter, plus hook and Node checks |

Right-click a file in the Explorer, editor tab or sidebar to mark it reviewed, open its diff, or add it to a profile.

**Onboarding.** A six-step walkthrough: find your agents, pick open/queue/notify, install hooks, check linters, tell your agent, done.

## Prompts

Agents without a feedback hook need to be told where the problems are. **OpenFiles: Copy a Prompt for Your Agent…** has these:

- **Instructions for AGENTS.md / CLAUDE.md.** Adds a short section telling the agent to read `.openfiles/diagnostics.json` and fix errors before it says it's done. OpenFiles can insert it for you between markers, so it's easy to update or remove.
- **Fix the problems in AI-edited files.** Copies the current errors and warnings with `file:line:col`.
- **Work in small steps and check as you go.**
- **Write a PR description for these changes.**
- **Ask your agent to set up OpenFiles.**

The file agents read looks like this:

```jsonc
// .openfiles/diagnostics.json
{
  "version": 1,
  "files": {
    "src/auth.ts": {
      "checkedAt": 1789322228723,
      "errors": 1,
      "warnings": 0,
      "items": [{ "line": 42, "column": 7, "severity": "error", "source": "ts", "code": "2322",
                  "message": "Type 'string' is not assignable to type 'number'." }]
    }
  }
}
```

## Compared to

| | OpenFiles | Trusting the agent | Agent's own IDE diff | `tsc` / lint in CI |
|---|---|---|---|---|
| Works with any agent | ✅ | — | one agent | ✅ |
| Uses the linters you already have in VS Code | ✅ | — | partly | only what CI runs |
| Catches problems before you commit | ✅ | — | if you're watching | ❌ after push |
| Tells the agent in the same turn | ✅ with hooks | — | some | ❌ |
| Review checklist across sessions | ✅ | — | — | — |

Keep running lint in CI. OpenFiles just makes CI boring.

## When not to use it

- **Agents that edit inside the editor** (Copilot agent mode, Cursor's agent) already open buffers, so linters run on those. OpenFiles still gives you the review list through hooks, but auto-opening adds little there.
- **You never read agent output.** Then nothing will help. Try queue mode anyway; the checkboxes are oddly motivating.
- **Very large monorepos with watcher limits.** The watcher follows `files.watcherExclude`. Use hooks, and run **Run Doctor** if edits go missing.

## Settings

| Setting | Default | |
|---|---|---|
| `openfiles.mode` | `open` | `open`, `queue` (list only) or `notify` |
| `openfiles.openInBackground` | `true` | Don't steal focus |
| `openfiles.maxAutoOpen` | `15` | After this many, list instead of open |
| `openfiles.hooks.feedback` | `errorsAndWarnings` | What hooks send back: `errors`, `errorsAndWarnings`, `off` |
| `openfiles.hooks.feedbackTimeoutMs` | `4000` | How long a hook waits for language servers |
| `openfiles.statusBar.items` | `["unreviewed","errors","warnings"]` | What the status bar shows |
| `openfiles.statusBar.clickAction` | `menu` | What clicking it does |
| `openfiles.ignore` | build output, lockfiles… | Never tracked |
| `openfiles.sensitive` | `.env`, keys… | Tracked but never auto-opened |

All settings are in the [docs](https://devgiordane.github.io/openfiles/reference/settings/).

## FAQ

**Does it send my code anywhere?**
No. It reads and writes files under `.openfiles/` in your workspace and `~/.openfiles/hook.js`. That's it.

**Will it spam me with tabs?**
It opens files in the background, waits while you're typing, stops after 15 files, and lists bulk changes (installs, checkouts) instead of opening them. Or set `openfiles.mode` to `queue`.

**Why does the hook need Node.js?**
Because it has to read the agent's JSON, wait for diagnostics, and write JSON back in each agent's format. Doing that reliably in `sh` and PowerShell without `jq` wasn't worth it. **Run Doctor** tells you whether `node` is on your PATH.

**What's in `.openfiles/`?**
Local state: the hook queue, `diagnostics.json`, and the list of open tabs. OpenFiles puts a `.gitignore` in there, so you don't need to touch yours.

**I also had `.openfiles.json` profiles from the old version.**
They still work: **OpenFiles: Open Profile…** and the Profiles view.

## Contributing

Adding an agent is usually one registry entry and a test fixture. See [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and ideas go in [issues](https://github.com/devgiordane/openfiles/issues); if your agent isn't listed, open an *agent support* issue with a sample hook payload.

## Star history

<a href="https://star-history.com/#devgiordane/openfiles&Date">
  <img src="https://api.star-history.com/svg?repos=devgiordane/openfiles&type=Date" alt="Star history" width="600">
</a>

If OpenFiles caught one error your agent swore wasn't there, a ⭐ helps other people find it.

## License

[MIT](LICENSE) © Giordane Oliveira
