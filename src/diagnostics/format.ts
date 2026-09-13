export type Severity = "error" | "warning" | "info" | "hint";

export interface DiagnosticItem {
  line: number;
  column: number;
  severity: Severity;
  message: string;
  source?: string;
  code?: string;
}

export interface FileDiagnostics {
  path: string;
  /** Epoch ms of the last time the editor looked at this file (diagnostics settled). */
  checkedAt: number;
  errors: number;
  warnings: number;
  items: DiagnosticItem[];
}

export type FeedbackLevel = "errors" | "errorsAndWarnings" | "off";

export interface DiagnosticsFile {
  version: 1;
  updatedAt: number;
  hook: {
    feedback: FeedbackLevel;
    timeoutMs: number;
  };
  files: Record<string, FileDiagnostics>;
}

export interface FormatOptions {
  level: FeedbackLevel;
  displayPath?: (fsPath: string) => string;
  maxItemsPerFile?: number;
  maxChars?: number;
}

/** Text handed back to an agent after it edits files. Empty string means "nothing to say". */
export function formatForAgent(files: readonly FileDiagnostics[], options: FormatOptions): string {
  if (options.level === "off") {
    return "";
  }
  const includeWarnings = options.level === "errorsAndWarnings";
  const maxItems = options.maxItemsPerFile ?? 20;
  const maxChars = options.maxChars ?? 9000;
  const show = options.displayPath ?? ((p: string) => p);

  const lines: string[] = [];
  let errors = 0;
  let warnings = 0;

  for (const file of files) {
    const relevant = file.items.filter(
      (item) => item.severity === "error" || (includeWarnings && item.severity === "warning"),
    );
    if (relevant.length === 0) {
      continue;
    }
    errors += file.errors;
    warnings += includeWarnings ? file.warnings : 0;
    const name = show(file.path);
    for (const item of relevant.slice(0, maxItems)) {
      const code = item.code ? ` ${item.code}` : "";
      const source = item.source ? ` (${item.source})` : "";
      lines.push(`- ${name}:${item.line}:${item.column} ${item.severity}${code}${source}: ${oneLine(item.message)}`);
    }
    if (relevant.length > maxItems) {
      lines.push(`- ${name}: ${relevant.length - maxItems} more not shown`);
    }
  }

  if (lines.length === 0) {
    return "";
  }

  const counts = [plural(errors, "error"), includeWarnings ? plural(warnings, "warning") : undefined]
    .filter(Boolean)
    .join(", ");
  const header = `OpenFiles opened the files you just edited in the editor. The language servers report ${counts}:`;
  const footer = "Fix these before you report the task as done.";

  let text = [header, ...lines, footer].join("\n");
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars - 40)}\n… (truncated)\n${footer}`;
  }
  return text;
}

function oneLine(message: string): string {
  return message.replace(/\s+/g, " ").trim();
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
