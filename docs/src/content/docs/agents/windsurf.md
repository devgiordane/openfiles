---
title: Windsurf / Devin Desktop
description: Connect Windsurf's Cascade to OpenFiles with a post_write_code hook (beta).
---

**Support:** detection (beta). The `post_write_code` hook can't send context back to Cascade, so problems reach it through `.openfiles/diagnostics.json` and the [AGENTS.md prompt](../../guides/prompts/).

## Install

Install OpenFiles from [Open VSX](https://open-vsx.org/extension/devgiordane/openfiles), then run **OpenFiles: Install Agent Hooks…** and pick **Windsurf / Devin Desktop**. It adds this to `.windsurf/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "post_write_code": [
      { "command": "node \"/Users/you/.openfiles/hook.js\" --agent windsurf --event post_write_code --no-feedback --tag openfiles-hook" }
    ]
  }
}
```

This integration is marked beta until someone confirms it end to end. If you use Windsurf, please report how it went in an [agent support issue](https://github.com/devgiordane/openfiles/issues/new?template=agent_support.yml).

Reference: [Cascade hooks](https://docs.devin.ai/desktop/cascade/hooks).
