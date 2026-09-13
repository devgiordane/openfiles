export interface PromptContext {
  docsUrl: string;
  /** Output of formatForAgent for unreviewed files, or "" when clean. */
  problems: string;
  changedFiles: string[];
}

export interface PromptTemplate {
  id: "agents-md" | "fix-problems" | "small-steps" | "review-handoff" | "setup";
  build(context: PromptContext): string;
}

export const AGENT_INSTRUCTIONS_START = "<!-- openfiles:start -->";
export const AGENT_INSTRUCTIONS_END = "<!-- openfiles:end -->";

export const PROMPTS: readonly PromptTemplate[] = [
  {
    id: "agents-md",
    build: () =>
      [
        AGENT_INSTRUCTIONS_START,
        "## Checking your edits",
        "",
        "This project uses OpenFiles in VS Code. Files you edit get opened in the editor, so the project's linters and type checkers run on them.",
        "",
        "- After editing files, read `.openfiles/diagnostics.json`. It lists errors and warnings for every file you touched, with line and column.",
        "- Each file has `checkedAt` (epoch ms). If it's older than your last edit, wait a moment and read it again.",
        "- Fix errors in files you changed before saying the task is done. Don't silence rules, add `any`, or add ignore comments to make them go away unless you're asked to.",
        "- If a hook already added an \"OpenFiles opened the files you just edited\" message after your edit, that's the same list.",
        AGENT_INSTRUCTIONS_END,
      ].join("\n"),
  },
  {
    id: "fix-problems",
    build: ({ problems }) =>
      problems
        ? [
            problems,
            "",
            "Fix them one file at a time and keep each fix as small as the error allows. Don't change behavior the error doesn't require.",
            "When you're done, read `.openfiles/diagnostics.json` again and tell me what's left, if anything.",
          ].join("\n")
        : "The editor doesn't report any errors or warnings in the files you changed. Double-check `.openfiles/diagnostics.json` and move on.",
  },
  {
    id: "small-steps",
    build: () =>
      [
        "Work in small steps. After each group of edits, read `.openfiles/diagnostics.json` and fix any errors in the files you touched before moving on.",
        "Don't change twenty files and hope the type checker agrees at the end.",
      ].join("\n"),
  },
  {
    id: "review-handoff",
    build: ({ changedFiles, problems }) =>
      [
        "Write a pull request description for these changes: what changed, why, and what a reviewer should look at closely.",
        "",
        "Changed files:",
        ...changedFiles.map((file) => `- ${file}`),
        "",
        problems ? `Problems the editor still reports:\n${problems}` : "The editor reports no problems in these files.",
      ].join("\n"),
  },
  {
    id: "setup",
    build: ({ docsUrl }) =>
      [
        `Set up OpenFiles for this repository. The docs for agents are at ${docsUrl}/llms.txt.`,
        "1. Add the OpenFiles section to AGENTS.md (or CLAUDE.md / GEMINI.md, whichever this project uses). Keep it between the openfiles:start and openfiles:end markers.",
        "2. Don't write hook configuration yourself; tell me to run \"OpenFiles: Install Agent Hooks…\" in VS Code, which shows a preview first.",
        "3. Tell me what you changed.",
      ].join("\n"),
  },
];

/** Insert or replace the OpenFiles block in an instructions file. */
export function upsertInstructions(existing: string, block: string): string {
  const start = existing.indexOf(AGENT_INSTRUCTIONS_START);
  const end = existing.indexOf(AGENT_INSTRUCTIONS_END);
  if (start >= 0 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + AGENT_INSTRUCTIONS_END.length);
  }
  const separator = existing.trim() === "" ? "" : existing.endsWith("\n\n") ? "" : existing.endsWith("\n") ? "\n" : "\n\n";
  return `${existing}${separator}${block}\n`;
}
