# Contributing

Thanks for helping. Small PRs are easiest to review, so if you're planning something big, open an issue first so we can agree on the shape.

## Setup

```sh
git clone https://github.com/devgiordane/openfiles
cd openfiles
npm install
npm run build
```

Open the folder in VS Code and press <kbd>F5</kbd> (or run `code --extensionDevelopmentPath=.`) to start an Extension Development Host. `npm run watch` rebuilds on save.

## Checks

```sh
npm run typecheck
npm test                 # unit tests (vitest); hook tests need `npm run build` first
npm run test:integration # runs inside a real VS Code
```

## Layout

| Folder | What's there |
|---|---|
| `src/detect/` | File watcher, Git signals, hook queue, and the rules for what counts as an agent edit |
| `src/session/` | The list of changed files and their review state (no `vscode` import, unit-tested) |
| `src/hook/` | `hook.js`, the script agents run. It must never import `vscode` and must always exit 0 |
| `src/agents/` | Agent registry and hook config install/remove |
| `src/diagnostics/` | Collects problems for changed files and writes `.openfiles/diagnostics.json` |
| `src/views/`, `src/statusbar/`, `src/commands/` | UI |
| `src/onboarding/` | Doctor and linter recommendations |
| `docs/` | The documentation site (Astro Starlight) |

## Adding an agent

1. Add an entry to `src/agents/registry.ts`: markers that show the agent is used, the hook format, and whether it can take feedback.
2. If its payload has a new shape, teach `src/hook/parse.ts` to find the file paths and add a case to `test/unit/parse.test.ts` using a real payload (remove anything private).
3. If it can receive text back, add its output shape to `src/hook/output.ts`.
4. Add a docs page under `docs/src/content/docs/agents/`.
5. Mark it `beta: true` until someone has run it end to end.

Please link the agent's hook documentation in the PR.

## Translations

UI strings go through `vscode.l10n.t()`. After adding strings, run `npm run l10n:export` and add translations to `l10n/bundle.l10n.<locale>.json`. Strings from `package.json` live in `package.nls.<locale>.json`.

## Commit messages

Short and descriptive, e.g. `fix(detect): ignore saves from format-on-save`. No strict convention beyond that.
