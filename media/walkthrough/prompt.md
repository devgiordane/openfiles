# Tell your agent

OpenFiles writes the problems it finds to `.openfiles/diagnostics.json`. Agents with hooks get them automatically; the rest need to be told.

The **Instructions for AGENTS.md / CLAUDE.md** prompt adds a short section like this:

```markdown
## Checking your edits

- After editing files, read `.openfiles/diagnostics.json`.
- Fix errors in files you changed before saying the task is done.
```

There are also prompts to fix the current problems, work in small steps, and write a PR description for what changed.
