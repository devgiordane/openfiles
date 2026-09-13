---
title: Status bar
description: Choose what the OpenFiles status bar item shows and what clicking it does.
---

Run **OpenFiles: Configure Status Bar…**, or click the item and choose **Configure Status Bar…**. There are two quick steps.

## What it shows

`openfiles.statusBar.items` is a list, shown in this order:

| Item | Looks like | Meaning |
|---|---|---|
| `edited` | `$(files) 6` | files changed by agents this session |
| `unreviewed` | `$(eye) 4` | files you haven't checked off |
| `errors` | `$(error) 2` | errors in those files |
| `warnings` | `$(warning) 1` | warnings in those files |
| `agent` | `$(hubot) Claude Code` | the agent that edited most recently |
| `paused` | `$(debug-pause)` | shown only while watching is paused |

The default is `["unreviewed", "errors", "warnings"]`. With nothing to report, the item just reads **OpenFiles**. It turns yellow when unreviewed files have errors.

## What clicking does

`openfiles.statusBar.clickAction`:

| Value | Action |
|---|---|
| `menu` (default) | a quick menu with the most-used commands |
| `reviewNext` | review the next changed file |
| `openAiEdits` | open every unreviewed file |
| `showProblems` | focus Problems in AI Edits |
| `focusSidebar` | focus the AI Edits view |

The tooltip also has links for review next, problems, pause and configure.

## Other settings

```jsonc
{
  "openfiles.statusBar.enabled": true,
  "openfiles.statusBar.alignment": "left" // or "right"
}
```
