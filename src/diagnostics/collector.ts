import * as path from "node:path";
import * as vscode from "vscode";
import { pathKey, toPosix } from "../core/paths";
import type { EditEntry, EditSession } from "../session/store";
import type { Settings } from "../shared/settings";
import { atomicWrite, ensureOpenfilesDir } from "../shared/openfilesDir";
import { log } from "../shared/log";
import type { DiagnosticItem, DiagnosticsFile, FileDiagnostics, Severity } from "./format";

/** Wait this long after an edit before calling a file "checked" if no diagnostics arrive. */
const SETTLE_MS = 1500;
/** Language servers often publish in rounds (syntax, then semantic, then ESLint). */
const QUIET_MS = 700;

const SEVERITY: Record<vscode.DiagnosticSeverity, Severity> = {
  [vscode.DiagnosticSeverity.Error]: "error",
  [vscode.DiagnosticSeverity.Warning]: "warning",
  [vscode.DiagnosticSeverity.Information]: "info",
  [vscode.DiagnosticSeverity.Hint]: "hint",
};

export interface ProblemCounts {
  errors: number;
  warnings: number;
}

export class DiagnosticsCollector implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changed.event;

  private readonly checkedAt = new Map<string, number>();
  private readonly settleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private exportTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly disposables: vscode.Disposable[] = [this.changed];

  constructor(
    private readonly session: EditSession,
    private readonly settings: () => Settings,
  ) {
    this.disposables.push(
      vscode.languages.onDidChangeDiagnostics((event) => {
        let touched = false;
        for (const uri of event.uris) {
          if (uri.scheme === "file" && this.session.has(uri.fsPath)) {
            touched = true;
            const key = pathKey(uri.fsPath);
            if (this.settleTimers.has(key)) {
              this.schedule(key, QUIET_MS);
            }
          }
        }
        if (touched) {
          this.changed.fire();
          this.scheduleExport();
        }
      }),
    );
    this.session.onDidChange(() => {
      this.changed.fire();
      this.scheduleExport();
    });
  }

  /** Call after an edit: the file counts as checked once diagnostics settle. */
  track(fsPath: string): void {
    this.schedule(pathKey(fsPath), SETTLE_MS);
  }

  private schedule(key: string, delay: number): void {
    const existing = this.settleTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }
    this.settleTimers.set(
      key,
      setTimeout(() => {
        this.settleTimers.delete(key);
        this.checkedAt.set(key, Date.now());
        this.scheduleExport(0);
      }, delay),
    );
  }

  diagnostics(fsPath: string, minSeverity = vscode.DiagnosticSeverity.Warning): vscode.Diagnostic[] {
    return vscode.languages
      .getDiagnostics(vscode.Uri.file(fsPath))
      .filter((d) => d.severity <= minSeverity)
      .sort((a, b) => a.severity - b.severity || a.range.start.line - b.range.start.line);
  }

  counts(fsPath: string): ProblemCounts {
    let errors = 0;
    let warnings = 0;
    for (const d of vscode.languages.getDiagnostics(vscode.Uri.file(fsPath))) {
      if (d.severity === vscode.DiagnosticSeverity.Error) {
        errors += 1;
      } else if (d.severity === vscode.DiagnosticSeverity.Warning) {
        warnings += 1;
      }
    }
    return { errors, warnings };
  }

  totals(entries: readonly EditEntry[] = this.session.all()): ProblemCounts & { files: number } {
    return entries.reduce(
      (sum, entry) => {
        const c = this.counts(entry.fsPath);
        return {
          errors: sum.errors + c.errors,
          warnings: sum.warnings + c.warnings,
          files: sum.files + (c.errors + c.warnings > 0 ? 1 : 0),
        };
      },
      { errors: 0, warnings: 0, files: 0 },
    );
  }

  toFileDiagnostics(entry: EditEntry): FileDiagnostics {
    const all = vscode.languages.getDiagnostics(vscode.Uri.file(entry.fsPath));
    const items: DiagnosticItem[] = all
      .filter((d) => d.severity <= vscode.DiagnosticSeverity.Information)
      .map((d) => ({
        line: d.range.start.line + 1,
        column: d.range.start.character + 1,
        severity: SEVERITY[d.severity],
        message: d.message,
        source: d.source,
        code: typeof d.code === "object" ? String(d.code.value) : d.code === undefined ? undefined : String(d.code),
      }));
    const { errors, warnings } = this.counts(entry.fsPath);
    return { path: entry.fsPath, checkedAt: this.checkedAt.get(entry.key) ?? 0, errors, warnings, items };
  }

  private scheduleExport(delay = 300): void {
    if (this.exportTimer) {
      clearTimeout(this.exportTimer);
    }
    this.exportTimer = setTimeout(() => void this.export(), delay);
  }

  async export(): Promise<void> {
    const settings = this.settings();
    if (!settings.diagnosticsExport || !vscode.workspace.isTrusted) {
      return;
    }
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
      const root = folder.uri.fsPath;
      const files: DiagnosticsFile["files"] = {};
      for (const entry of this.session.all()) {
        const relative = path.relative(root, entry.fsPath);
        if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
          files[toPosix(relative)] = this.toFileDiagnostics(entry);
        }
      }
      const content: DiagnosticsFile = {
        version: 1,
        updatedAt: Date.now(),
        hook: { feedback: settings.hooks.feedback, timeoutMs: settings.hooks.feedbackTimeoutMs },
        files,
      };
      try {
        const dir = await ensureOpenfilesDir(root);
        await atomicWrite(path.join(dir, "diagnostics.json"), `${JSON.stringify(content, null, 2)}\n`);
      } catch (error) {
        log.warn(`Could not write diagnostics for ${root}: ${String(error)}`);
      }
    }
  }

  dispose(): void {
    this.settleTimers.forEach((timer) => clearTimeout(timer));
    if (this.exportTimer) {
      clearTimeout(this.exportTimer);
    }
    this.disposables.forEach((d) => d.dispose());
  }
}
