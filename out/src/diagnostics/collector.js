"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticsCollector = void 0;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
const openfilesDir_1 = require("../shared/openfilesDir");
const log_1 = require("../shared/log");
/** Wait this long after an edit before calling a file "checked" if no diagnostics arrive. */
const SETTLE_MS = 1500;
/** Language servers often publish in rounds (syntax, then semantic, then ESLint). */
const QUIET_MS = 700;
const SEVERITY = {
    [vscode.DiagnosticSeverity.Error]: "error",
    [vscode.DiagnosticSeverity.Warning]: "warning",
    [vscode.DiagnosticSeverity.Information]: "info",
    [vscode.DiagnosticSeverity.Hint]: "hint",
};
class DiagnosticsCollector {
    session;
    settings;
    changed = new vscode.EventEmitter();
    onDidChange = this.changed.event;
    checkedAt = new Map();
    settleTimers = new Map();
    exportTimer;
    disposables = [this.changed];
    constructor(session, settings) {
        this.session = session;
        this.settings = settings;
        this.disposables.push(vscode.languages.onDidChangeDiagnostics((event) => {
            let touched = false;
            for (const uri of event.uris) {
                if (uri.scheme === "file" && this.session.has(uri.fsPath)) {
                    touched = true;
                    const key = (0, paths_1.pathKey)(uri.fsPath);
                    if (this.settleTimers.has(key)) {
                        this.schedule(key, QUIET_MS);
                    }
                }
            }
            if (touched) {
                this.changed.fire();
                this.scheduleExport();
            }
        }));
        this.session.onDidChange(() => {
            this.changed.fire();
            this.scheduleExport();
        });
    }
    /** Call after an edit: the file counts as checked once diagnostics settle. */
    track(fsPath) {
        this.schedule((0, paths_1.pathKey)(fsPath), SETTLE_MS);
    }
    schedule(key, delay) {
        const existing = this.settleTimers.get(key);
        if (existing) {
            clearTimeout(existing);
        }
        this.settleTimers.set(key, setTimeout(() => {
            this.settleTimers.delete(key);
            this.checkedAt.set(key, Date.now());
            this.scheduleExport(0);
        }, delay));
    }
    diagnostics(fsPath, minSeverity = vscode.DiagnosticSeverity.Warning) {
        return vscode.languages
            .getDiagnostics(vscode.Uri.file(fsPath))
            .filter((d) => d.severity <= minSeverity)
            .sort((a, b) => a.severity - b.severity || a.range.start.line - b.range.start.line);
    }
    counts(fsPath) {
        let errors = 0;
        let warnings = 0;
        for (const d of vscode.languages.getDiagnostics(vscode.Uri.file(fsPath))) {
            if (d.severity === vscode.DiagnosticSeverity.Error) {
                errors += 1;
            }
            else if (d.severity === vscode.DiagnosticSeverity.Warning) {
                warnings += 1;
            }
        }
        return { errors, warnings };
    }
    totals(entries = this.session.all()) {
        return entries.reduce((sum, entry) => {
            const c = this.counts(entry.fsPath);
            return {
                errors: sum.errors + c.errors,
                warnings: sum.warnings + c.warnings,
                files: sum.files + (c.errors + c.warnings > 0 ? 1 : 0),
            };
        }, { errors: 0, warnings: 0, files: 0 });
    }
    toFileDiagnostics(entry) {
        const all = vscode.languages.getDiagnostics(vscode.Uri.file(entry.fsPath));
        const items = all
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
    scheduleExport(delay = 300) {
        if (this.exportTimer) {
            clearTimeout(this.exportTimer);
        }
        this.exportTimer = setTimeout(() => void this.export(), delay);
    }
    async export() {
        const settings = this.settings();
        if (!settings.diagnosticsExport || !vscode.workspace.isTrusted) {
            return;
        }
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            const root = folder.uri.fsPath;
            const files = {};
            for (const entry of this.session.all()) {
                const relative = path.relative(root, entry.fsPath);
                if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
                    files[(0, paths_1.toPosix)(relative)] = this.toFileDiagnostics(entry);
                }
            }
            const content = {
                version: 1,
                updatedAt: Date.now(),
                hook: { feedback: settings.hooks.feedback, timeoutMs: settings.hooks.feedbackTimeoutMs },
                files,
            };
            try {
                const dir = await (0, openfilesDir_1.ensureOpenfilesDir)(root);
                await (0, openfilesDir_1.atomicWrite)(path.join(dir, "diagnostics.json"), `${JSON.stringify(content, null, 2)}\n`);
            }
            catch (error) {
                log_1.log.warn(`Could not write diagnostics for ${root}: ${String(error)}`);
            }
        }
    }
    dispose() {
        this.settleTimers.forEach((timer) => clearTimeout(timer));
        if (this.exportTimer) {
            clearTimeout(this.exportTimer);
        }
        this.disposables.forEach((d) => d.dispose());
    }
}
exports.DiagnosticsCollector = DiagnosticsCollector;
//# sourceMappingURL=collector.js.map