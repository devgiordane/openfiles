# Security

OpenFiles writes hook entries into agent config files, and those agents run the hook command on your machine. If you find a way to make OpenFiles write something unexpected, run a command it shouldn't, or read outside the workspace, please report it privately.

**Report:** use [GitHub private vulnerability reporting](https://github.com/devgiordane/openfiles/security/advisories/new). Please don't open a public issue.

I'll acknowledge within a few days and keep you posted on the fix.

## What OpenFiles does on your machine

- Writes `.openfiles/` in each workspace folder (with its own `.gitignore`).
- Copies its hook script to `~/.openfiles/hook.js` when you install hooks.
- Edits agent config files **only** when you run *Install Agent Hooks* or *Remove Agent Hooks* and confirm the preview.
- Makes no network requests and collects no telemetry.
- In untrusted workspaces, it doesn't write anything.
