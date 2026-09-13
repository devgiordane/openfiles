export interface ExtensionRef {
  id: string;
  name: string;
}

export interface LinterRecommendation {
  language: string;
  fileExtensions: string[];
  /** Any one of these counts as covered. */
  extensions: ExtensionRef[];
  /** Built into VS Code, so the language is always covered at least partly. */
  builtIn?: string;
  /** Use instead of `extensions` in editors that install from Open VSX (Cursor, Windsurf, VSCodium…). */
  openVsx?: ExtensionRef[];
}

export const LINTERS: readonly LinterRecommendation[] = [
  {
    language: "TypeScript / JavaScript",
    fileExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"],
    builtIn: "TypeScript language service",
    extensions: [
      { id: "dbaeumer.vscode-eslint", name: "ESLint" },
      { id: "biomejs.biome", name: "Biome" },
      { id: "oxc.oxc-vscode", name: "Oxc" },
    ],
  },
  {
    language: "Python",
    fileExtensions: [".py"],
    extensions: [
      { id: "ms-python.vscode-pylance", name: "Pylance" },
      { id: "charliermarsh.ruff", name: "Ruff" },
      { id: "ms-python.mypy-type-checker", name: "Mypy" },
    ],
    openVsx: [
      { id: "detachhead.basedpyright", name: "basedpyright" },
      { id: "charliermarsh.ruff", name: "Ruff" },
    ],
  },
  {
    language: "C#",
    fileExtensions: [".cs"],
    extensions: [{ id: "ms-dotnettools.csharp", name: "C#" }],
    openVsx: [{ id: "muhammad-sammy.csharp", name: "C# (free/open)" }],
  },
  { language: "Java", fileExtensions: [".java"], extensions: [{ id: "redhat.java", name: "Language Support for Java" }] },
  { language: "Go", fileExtensions: [".go"], extensions: [{ id: "golang.go", name: "Go" }] },
  { language: "Rust", fileExtensions: [".rs"], extensions: [{ id: "rust-lang.rust-analyzer", name: "rust-analyzer" }] },
  {
    language: "C / C++",
    fileExtensions: [".c", ".cc", ".cpp", ".cxx", ".h", ".hpp"],
    extensions: [
      { id: "ms-vscode.cpptools", name: "C/C++" },
      { id: "llvm-vs-code-extensions.vscode-clangd", name: "clangd" },
    ],
    openVsx: [{ id: "llvm-vs-code-extensions.vscode-clangd", name: "clangd" }],
  },
  {
    language: "PHP",
    fileExtensions: [".php"],
    extensions: [
      { id: "bmewburn.vscode-intelephense-client", name: "Intelephense" },
      { id: "devsense.phptools-vscode", name: "PHP Tools" },
    ],
  },
  { language: "Ruby", fileExtensions: [".rb"], extensions: [{ id: "shopify.ruby-lsp", name: "Ruby LSP" }] },
  { language: "Dart / Flutter", fileExtensions: [".dart"], extensions: [{ id: "dart-code.dart-code", name: "Dart" }] },
  { language: "Swift", fileExtensions: [".swift"], extensions: [{ id: "swiftlang.swift-vscode", name: "Swift" }] },
  { language: "Kotlin", fileExtensions: [".kt", ".kts"], extensions: [{ id: "jetbrains.kotlin-server", name: "Kotlin LSP" }, { id: "fwcd.kotlin", name: "Kotlin" }] },
  { language: "Vue", fileExtensions: [".vue"], extensions: [{ id: "vue.volar", name: "Vue - Official" }] },
  { language: "Svelte", fileExtensions: [".svelte"], extensions: [{ id: "svelte.svelte-vscode", name: "Svelte for VS Code" }] },
  { language: "Astro", fileExtensions: [".astro"], extensions: [{ id: "astro-build.astro-vscode", name: "Astro" }] },
  {
    language: "CSS / SCSS / Less",
    fileExtensions: [".css", ".scss", ".less"],
    builtIn: "CSS language service",
    extensions: [{ id: "stylelint.vscode-stylelint", name: "Stylelint" }],
  },
  { language: "Shell", fileExtensions: [".sh", ".bash", ".zsh"], extensions: [{ id: "timonwong.shellcheck", name: "ShellCheck" }, { id: "mads-hartmann.bash-ide-vscode", name: "Bash IDE" }] },
  { language: "PowerShell", fileExtensions: [".ps1", ".psm1"], extensions: [{ id: "ms-vscode.powershell", name: "PowerShell" }] },
  { language: "YAML", fileExtensions: [".yml", ".yaml"], extensions: [{ id: "redhat.vscode-yaml", name: "YAML" }] },
  { language: "Markdown", fileExtensions: [".md", ".mdx"], extensions: [{ id: "davidanson.vscode-markdownlint", name: "markdownlint" }] },
  { language: "Terraform", fileExtensions: [".tf", ".tfvars"], extensions: [{ id: "hashicorp.terraform", name: "HashiCorp Terraform" }] },
  { language: "Lua", fileExtensions: [".lua"], extensions: [{ id: "sumneko.lua", name: "Lua" }] },
  {
    language: "Elixir",
    fileExtensions: [".ex", ".exs"],
    extensions: [
      { id: "jakebecker.elixir-ls", name: "ElixirLS" },
      { id: "lexical-lsp.lexical", name: "Lexical" },
    ],
    openVsx: [{ id: "elixir-lsp.elixir-ls", name: "ElixirLS" }],
  },
  { language: "SQL", fileExtensions: [".sql"], extensions: [{ id: "sqlfluff.vscode-sqlfluff", name: "SQLFluff" }] },
  { language: "TOML", fileExtensions: [".toml"], extensions: [{ id: "tamasfe.even-better-toml", name: "Even Better TOML" }] },
  { language: "Scala", fileExtensions: [".scala", ".sc"], extensions: [{ id: "scalameta.metals", name: "Metals" }] },
  { language: "Haskell", fileExtensions: [".hs"], extensions: [{ id: "haskell.haskell", name: "Haskell" }] },
  { language: "Zig", fileExtensions: [".zig"], extensions: [{ id: "ziglang.vscode-zig", name: "Zig" }] },
  { language: "Solidity", fileExtensions: [".sol"], extensions: [{ id: "nomicfoundation.hardhat-solidity", name: "Solidity (Hardhat)" }, { id: "juanblanco.solidity", name: "Solidity" }] },
];

/** Settings that make a language server check only open files — the reason OpenFiles exists. */
export const OPEN_FILES_ONLY_SETTINGS: readonly { setting: string; value: unknown; note: string }[] = [
  { setting: "python.analysis.diagnosticMode", value: "openFilesOnly", note: "Pylance only checks open files." },
  { setting: "typescript.tsserver.experimental.enableProjectDiagnostics", value: false, note: "TypeScript only reports errors for open files." },
  { setting: "eslint.run", value: "onType", note: "ESLint lints files as you type in them." },
  { setting: "dotnet.backgroundAnalysis.analyzerDiagnosticsScope", value: "openFiles", note: "C# analyzers only run on open documents." },
  { setting: "intelephense.diagnostics.run", value: "onType", note: "Intelephense only checks files as they change in the editor." },
];

export interface CoverageRow {
  language: string;
  files: number;
  installed: ExtensionRef[];
  suggestions: ExtensionRef[];
  builtIn?: string;
}

export function coverage(
  fileCounts: ReadonlyMap<string, number>,
  isInstalled: (id: string) => boolean,
  useOpenVsx: boolean,
): CoverageRow[] {
  const rows: CoverageRow[] = [];
  for (const linter of LINTERS) {
    const files = linter.fileExtensions.reduce((sum, ext) => sum + (fileCounts.get(ext) ?? 0), 0);
    if (files === 0) {
      continue;
    }
    const candidates = useOpenVsx && linter.openVsx ? linter.openVsx : linter.extensions;
    const all = [...linter.extensions, ...(linter.openVsx ?? [])];
    rows.push({
      language: linter.language,
      files,
      builtIn: linter.builtIn,
      installed: all.filter((ext, i) => isInstalled(ext.id) && all.findIndex((e) => e.id === ext.id) === i),
      suggestions: candidates,
    });
  }
  return rows.sort((a, b) => b.files - a.files);
}
