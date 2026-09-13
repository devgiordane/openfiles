# OpenFiles opens files. Your extensions check them.

Most language servers only report problems for files that are open:

- TypeScript: project-wide errors are off by default
- ESLint: lints a file as you type in it
- Pylance: `python.analysis.diagnosticMode` is `openFilesOnly`
- C#: analyzers run on open documents
- PHP Intelephense, Ruby LSP: per open document

That's why an agent can edit twenty files and the Problems panel stays empty.

**Run Doctor** to see which languages in this repo have nothing checking them, with links to extensions that do. In Cursor, Windsurf and VSCodium it suggests Open VSX alternatives where needed (for example basedpyright instead of Pylance).
