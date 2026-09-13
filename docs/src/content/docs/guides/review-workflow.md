---
title: Reviewing AI edits
description: The sidebar, badges, status bar and commands for going through what an agent changed.
---

## The sidebar

Click the OpenFiles icon in the Activity Bar.

- **AI Edits.** Every file changed in this session, grouped by agent when more than one was involved. Each row shows the folder and a problem count (`2✕ 1⚠`) and has a checkbox. Checking it marks the file reviewed. Inline buttons open the diff against HEAD and toggle reviewed.
- **Problems in AI Edits.** Errors and warnings, but only for those files, with errors first. Click one to jump to it.
- **Agents & Hooks.** Agents detected in this workspace and whether their hook is installed.
- **Profiles.** Named sets of files from `.openfiles.json`, opened with one click.

A file that changes again after you reviewed it becomes unreviewed again.

## Badges

Unreviewed files get an **AI** badge in the Explorer and on editor tabs. The color is `openfiles.unreviewedForeground`, and you can override it in `workbench.colorCustomizations`.

## A typical pass

1. The agent finishes. The status bar shows `👁 6  ⊗ 2  ⚠ 1`.
2. Run **Review Next Changed File**. It opens the file with the most errors.
3. Read it, or use **Open Diff vs HEAD** to see only what changed.
4. Run **Review Next Changed File** again. The current file is marked reviewed and the next one opens.
5. If problems remain, run **Copy "Fix These Problems" Prompt** and paste it to the agent.
6. When you commit, **Clear AI Edits** starts fresh. Reviewed files older than a day are also dropped automatically.

## Context menus

Right-click a file in the Explorer, an editor tab, or the editor itself for **Mark as Reviewed**, **Open Diff vs HEAD** and **Add to Profile…**. Multi-select works in the Explorer and the AI Edits view.

## Pausing

Doing a big refactor yourself, or running a codegen step? **Pause / Resume Watching** (also in the status bar menu) stops detection until you resume.
