---
title: FAQ
description: Common questions about OpenFiles, privacy, tabs, hooks and editors.
---

## Does OpenFiles send my code anywhere?

No. It makes no network requests and has no telemetry. It writes under `.openfiles/` in your workspace, and to `~/.openfiles/hook.js` once you install hooks.

## Will it flood me with tabs?

It tries hard not to:

- files open in the background;
- it waits while you're typing;
- it stops after 15 files per session;
- bulk changes (installs, builds, checkouts) are listed, not opened.

If you still prefer no tabs at all, set `openfiles.mode` to `queue`.

## My agent says it's done, but the problems list is empty. Is the code clean?

Maybe. Check three things:

- Is there a linter for that language? **Run Doctor** tells you.
- Are you in `queue` mode? Files that aren't open usually aren't checked.
- Some language servers need a few seconds on first start. `checkedAt` in `diagnostics.json` tells you whether the editor has looked yet.

## Why Node.js for the hook?

The hook has to parse each agent's JSON, wait for diagnostics, and reply in that agent's format. Doing that in both `sh` and PowerShell without extra tools was fragile. Most people running coding agents already have Node. **Run Doctor** checks it.

## Should I commit the hook config?

Usually not. The command contains your home directory path. For Claude Code, OpenFiles uses `.claude/settings.local.json`, which is already local. For other agents, either keep the file local or have each teammate run **Install Agent Hooks** (it's idempotent). When VS Code isn't running, a teammate's hook simply does nothing.

## Does it work over Remote SSH, WSL or in Dev Containers?

The extension runs on the remote side (`extensionKind: workspace`), next to the files and the agents, so it should. File watchers can be unreliable on some network drives; the hook queue is polled as a fallback. Please report issues with the Doctor output.

## Does it replace lint in CI?

No. Keep CI. OpenFiles moves the feedback earlier, to the moment the agent writes the file.

## What happened to profiles?

They still work. `.openfiles.json` profiles open a named set of files. See **OpenFiles: Open Profile…** and the Profiles view.

## Can I use it without an AI agent?

Yes. It flags any file changed outside the editor: a code generator, a script, a teammate's `git stash pop`. It's just most useful with agents.
