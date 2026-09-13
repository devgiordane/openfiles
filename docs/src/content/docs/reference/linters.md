---
title: Linter reference (50 languages)
description: The best VS Code extension for diagnostics in 50 languages, whether it's on Open VSX, and whether it only checks open files.
---

OpenFiles doesn't lint anything itself. It opens files so the extensions below can do their job. **Run Doctor** checks which of these your workspace needs.

**Scope column:**
- **Open**: diagnostics only for open files by default.
- **Workspace**: analyzes the whole project.
- **Verified** means we found the default in the extension's own settings or docs (see [Evidence](#evidence)).
- The rest is what we expect from how the tool works.

| # | Language | Extension | Open VSX | Scope |
|---|---|---|---|---|
| 1 | TypeScript | built-in + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | ✅ | Open (verified) |
| 2 | JavaScript | built-in + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome), [Oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) | ✅ | Open (verified) |
| 3 | Python | [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance), [Ruff](https://marketplace.visualstudio.com/items?itemName=charliermarsh.ruff), [Mypy](https://marketplace.visualstudio.com/items?itemName=ms-python.mypy-type-checker) | Pylance ❌ → [basedpyright](https://open-vsx.org/extension/detachhead/basedpyright) | Open (verified) |
| 4 | Java | [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java) | ✅ | Workspace |
| 5 | C# | [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) / [C# Dev Kit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit) | ❌ → [muhammad-sammy.csharp](https://open-vsx.org/extension/muhammad-sammy/csharp) | Open (verified) |
| 6 | C / C++ | [C/C++](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools), [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) | cpptools ❌, clangd ✅ | Open |
| 7 | HTML | built-in + [HTMLHint](https://marketplace.visualstudio.com/items?itemName=HTMLHint.vscode-htmlhint) | ✅ | Open |
| 8 | CSS / SCSS / Less | built-in + [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint) | ✅ | Open |
| 9 | SQL | [SQLFluff](https://marketplace.visualstudio.com/items?itemName=sqlfluff.vscode-sqlfluff), [MSSQL](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) | ✅ | Open |
| 10 | Bash / Shell | [ShellCheck](https://marketplace.visualstudio.com/items?itemName=timonwong.shellcheck), [Bash IDE](https://marketplace.visualstudio.com/items?itemName=mads-hartmann.bash-ide-vscode) | ✅ | Open |
| 11 | PowerShell | [PowerShell](https://marketplace.visualstudio.com/items?itemName=ms-vscode.powershell) | ✅ | Open |
| 12 | PHP | [Intelephense](https://marketplace.visualstudio.com/items?itemName=bmewburn.vscode-intelephense-client), [PHPStan](https://marketplace.visualstudio.com/items?itemName=SanderRonde.phpstan-vscode), [PHP Tools](https://marketplace.visualstudio.com/items?itemName=DEVSENSE.phptools-vscode) | ✅ | Open (verified, Intelephense) |
| 13 | Go | [Go](https://marketplace.visualstudio.com/items?itemName=golang.Go) | ✅ | Workspace (verified) |
| 14 | Rust | [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) | ✅ | Workspace, on save in the editor (verified) |
| 15 | Kotlin | [Kotlin LSP](https://marketplace.visualstudio.com/items?itemName=JetBrains.kotlin-server), [fwcd.kotlin](https://marketplace.visualstudio.com/items?itemName=fwcd.kotlin) | ✅ | ? |
| 16 | Lua | [Lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua) | ✅ | Workspace after a delay |
| 17 | Ruby | [Ruby LSP](https://marketplace.visualstudio.com/items?itemName=Shopify.ruby-lsp) | ✅ | Open (verified) |
| 18 | Dart / Flutter | [Dart](https://marketplace.visualstudio.com/items?itemName=Dart-Code.dart-code) | ✅ | Workspace (verified) |
| 19 | Swift | [Swift](https://marketplace.visualstudio.com/items?itemName=swiftlang.swift-vscode) | ✅ | Open |
| 20 | JSON / JSONC | built-in (schemas) | built-in | Open |
| 21 | YAML | [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) | ✅ | Open |
| 22 | Markdown | [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) | ✅ | Open |
| 23 | Dockerfile | [Docker DX](https://marketplace.visualstudio.com/items?itemName=docker.docker), [hadolint](https://marketplace.visualstudio.com/items?itemName=exiasr.hadolint) | ✅ | Open |
| 24 | Terraform / HCL | [HashiCorp Terraform](https://marketplace.visualstudio.com/items?itemName=hashicorp.terraform) | ✅ | Open / module |
| 25 | R | [R](https://marketplace.visualstudio.com/items?itemName=REditorSupport.r) | ✅ | Open |
| 26 | Julia | [Julia](https://marketplace.visualstudio.com/items?itemName=julialang.language-julia) | ✅ | ? |
| 27 | Scala | [Metals](https://marketplace.visualstudio.com/items?itemName=scalameta.metals) | ✅ | Workspace (compile) |
| 28 | Haskell | [Haskell](https://marketplace.visualstudio.com/items?itemName=haskell.haskell) | ✅ | Open |
| 29 | Elixir | [ElixirLS](https://marketplace.visualstudio.com/items?itemName=JakeBecker.elixir-ls), [Lexical](https://marketplace.visualstudio.com/items?itemName=lexical-lsp.lexical) | [elixir-lsp.elixir-ls](https://open-vsx.org/extension/elixir-lsp/elixir-ls) | Workspace (mix compile) |
| 30 | Erlang | [Erlang LS](https://marketplace.visualstudio.com/items?itemName=erlang-ls.erlang-ls) | ✅ | ? |
| 31 | Clojure | [Calva](https://marketplace.visualstudio.com/items?itemName=betterthantomorrow.calva) | ✅ | Workspace on startup |
| 32 | F# | [Ionide](https://marketplace.visualstudio.com/items?itemName=Ionide.Ionide-fsharp) | ✅ | Open |
| 33 | OCaml | [OCaml Platform](https://marketplace.visualstudio.com/items?itemName=ocamllabs.ocaml-platform) | ✅ | Open |
| 34 | Zig | [Zig](https://marketplace.visualstudio.com/items?itemName=ziglang.vscode-zig) | ✅ | Open |
| 35 | Perl | [Perl Navigator](https://marketplace.visualstudio.com/items?itemName=bscan.perlnavigator) | ✅ | Open |
| 36 | Fortran | [Modern Fortran](https://marketplace.visualstudio.com/items?itemName=fortran-lang.linter-gfortran) | ✅ | Open |
| 37 | MATLAB | [MATLAB](https://marketplace.visualstudio.com/items?itemName=MathWorks.language-matlab) | ✅ | Open |
| 38 | Objective-C | [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) | ✅ | Open |
| 39 | Delphi / Object Pascal | [DelphiLSP](https://marketplace.visualstudio.com/items?itemName=embarcaderotechnologies.delphilsp) | ❌ | ? |
| 40 | Ada | [Ada & SPARK](https://marketplace.visualstudio.com/items?itemName=AdaCore.ada) | ✅ | ? |
| 41 | COBOL | [COBOL Language Support](https://marketplace.visualstudio.com/items?itemName=broadcomMFD.cobol-language-support) | ✅ | Open |
| 42 | Solidity | [Hardhat Solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity), [Solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) | ✅ | Open |
| 43 | Vue | [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | ✅ | Open |
| 44 | Svelte | [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) | ✅ | Open |
| 45 | Astro | [Astro](https://marketplace.visualstudio.com/items?itemName=astro-build.astro-vscode) | ✅ | Open |
| 46 | GraphQL | [GraphQL](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql) | ✅ | Open |
| 47 | TOML | [Even Better TOML](https://marketplace.visualstudio.com/items?itemName=tamasfe.even-better-toml) | ✅ | Open |
| 48 | XML | [XML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-xml) | ✅ | Open |
| 49 | Prisma | [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma) | ✅ | Open |
| 50 | Protobuf | [Buf](https://marketplace.visualstudio.com/items?itemName=bufbuild.vscode-buf) | ✅ | Open |

More languages with good extensions: LaTeX ([LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)), Gleam, Nim, Elm, Crystal, V, Mojo, Groovy, Nix, Ansible, CMake, GitHub Actions, Tailwind CSS.

Languages were chosen from the [Stack Overflow 2025 survey](https://survey.stackoverflow.co/2025/technology), [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) and the [TIOBE index](https://www.tiobe.com/tiobe-index/), plus common config formats. Extension IDs were checked against both registries in September 2026.

## Evidence

**Open files only by default:**

- **TypeScript:** `typescript.tsserver.experimental.enableProjectDiagnostics` is `false`, described as "Enables project wide error reporting". [package.json](https://github.com/microsoft/vscode/blob/main/extensions/typescript-language-features/package.json)
- **ESLint:** `eslint.run` is `onType`, and `eslint.lintTask.enable` ("a task for linting the whole workspace") is `false`. [package.json](https://github.com/microsoft/vscode-eslint/blob/main/package.json)
- **Pylance / Pyright:** `python.analysis.diagnosticMode` is `openFilesOnly`. "If this option is set to 'openFilesOnly', pyright analyzes only open files." [Pyright settings](https://github.com/microsoft/pyright/blob/main/docs/settings.md)
- **C#:** `dotnet.backgroundAnalysis.analyzerDiagnosticsScope` and `compilerDiagnosticsScope` are `openFiles`. [package.json](https://github.com/dotnet/vscode-csharp/blob/main/package.json)
- **PHP Intelephense:** `intelephense.diagnostics.run` is `onType`, with no workspace mode ([#1467](https://github.com/bmewburn/vscode-intelephense/issues/1467)). [package.json](https://github.com/bmewburn/vscode-intelephense/blob/master/package.json)
- **Ruby LSP:** pull diagnostics per document; the server registers `workspace_diagnostics: false`. [server.rb](https://github.com/Shopify/ruby-lsp/blob/main/lib/ruby_lsp/server.rb)

**Whole workspace by default:**

- **Dart:** `onlyAnalyzeProjectsWithOpenFiles` defaults to `false`. [LSP spec](https://github.com/dart-lang/sdk/blob/main/pkg/analysis_server/tool/lsp_spec/README.md)
- **gopls:** workspace diagnostics are recomputed after about 1 s idle. [diagnostics.md](https://github.com/golang/tools/blob/master/gopls/doc/features/diagnostics.md)
- **rust-analyzer:** `checkOnSave` and `check.workspace` are `true`, but the check only runs on save in the editor. [package.json](https://github.com/rust-lang/rust-analyzer/blob/master/editors/code/package.json)
- **Java:** `java.autobuild.enabled` is `true`. [package.json](https://github.com/redhat-developer/vscode-java/blob/master/package.json)

Found something out of date? [Open an issue](https://github.com/devgiordane/openfiles/issues/new?template=feature_request.yml), since defaults change.
