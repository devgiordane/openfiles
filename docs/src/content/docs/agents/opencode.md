---
title: OpenCode
description: Connect OpenCode to OpenFiles with a small plugin (beta).
---

**Support:** detection (beta).

## Install

Run **OpenFiles: Install Agent Hooks…** and pick **OpenCode**. OpenFiles creates `.opencode/plugins/openfiles.js`. The plugin listens for `file.edited` events and passes each path to the hook script:

```js
// openfiles-hook: added by the OpenFiles VS Code extension. Delete this file to remove it.
import { spawn } from "node:child_process";

export const OpenFiles = async ({ directory }) => ({
  event: async ({ event }) => {
    if (event.type !== "file.edited") return;
    const file = event.properties?.file;
    if (!file) return;
    const child = spawn("node", ["/Users/you/.openfiles/hook.js", "--agent", "opencode", "--no-feedback"], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    child.on("error", () => {});
    child.stdin.end(JSON.stringify({ tool_name: "edit", file_path: file, cwd: directory }));
  },
});
```

OpenCode plugins can't add text to the model's context from this event, so add the [AGENTS.md section](../../guides/prompts/) to have OpenCode read `.openfiles/diagnostics.json`.

Reference: [OpenCode plugins](https://opencode.ai/docs/plugins/).
