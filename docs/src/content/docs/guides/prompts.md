---
title: Prompts for your agent
description: Copy-ready prompts that make agents read and fix the problems OpenFiles collects.
---

Agents with feedback hooks get problems automatically. For everyone else, and for starting a task on the right foot, run **OpenFiles: Copy a Prompt for Your Agent…**. The prompts are below so you can copy them from here too.

## Instructions for AGENTS.md / CLAUDE.md

OpenFiles can insert this section for you. It goes between markers, so it can be updated or removed cleanly later.

```markdown
<!-- openfiles:start -->
## Checking your edits

This project uses OpenFiles in VS Code. Files you edit get opened in the editor, so the project's linters and type checkers run on them.

- After editing files, read `.openfiles/diagnostics.json`. It lists errors and warnings for every file you touched, with line and column.
- Each file has `checkedAt` (epoch ms). If it's older than your last edit, wait a moment and read it again.
- Fix errors in files you changed before saying the task is done. Don't silence rules, add `any`, or add ignore comments to make them go away unless you're asked to.
- If a hook already added an "OpenFiles opened the files you just edited" message after your edit, that's the same list.
<!-- openfiles:end -->
```

## Fix the problems in AI-edited files

**Copy "Fix These Problems" Prompt** fills in the current problems:

```text
OpenFiles opened the files you just edited in the editor. The language servers report 2 errors, 1 warning:
- src/auth.ts:42:7 error 2322 (ts): Type 'string' is not assignable to type 'number'.
- src/auth.ts:57:3 error 2554 (ts): Expected 2 arguments, but got 1.
- src/api/user.ts:3:10 warning no-unused-vars (eslint): 'User' is defined but never used.
Fix these before you report the task as done.

Fix them one file at a time and keep each fix as small as the error allows. Don't change behavior the error doesn't require.
When you're done, read `.openfiles/diagnostics.json` again and tell me what's left, if anything.
```

## Work in small steps

```text
Work in small steps. After each group of edits, read `.openfiles/diagnostics.json` and fix any errors in the files you touched before moving on.
Don't change twenty files and hope the type checker agrees at the end.
```

## Write a PR description

```text
Write a pull request description for these changes: what changed, why, and what a reviewer should look at closely.

Changed files:
- src/auth.ts
- src/api/user.ts

The editor reports no problems in these files.
```

## Ask your agent to set up OpenFiles

```text
Set up OpenFiles for this repository. The docs for agents are at https://devgiordane.github.io/openfiles/llms.txt.
1. Add the OpenFiles section to AGENTS.md (or CLAUDE.md / GEMINI.md, whichever this project uses). Keep it between the openfiles:start and openfiles:end markers.
2. Don't write hook configuration yourself; tell me to run "OpenFiles: Install Agent Hooks…" in VS Code, which shows a preview first.
3. Tell me what you changed.
```
