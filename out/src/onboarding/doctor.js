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
exports.usesOpenVsx = usesOpenVsx;
exports.runDoctor = runDoctor;
const node_child_process_1 = require("node:child_process");
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const detect_1 = require("../agents/detect");
const installFlow_1 = require("../agents/installFlow");
const openfilesDir_1 = require("../shared/openfilesDir");
const linters_1 = require("./linters");
const SCAN_LIMIT = 5000;
function nodeVersion() {
    return new Promise((resolve) => {
        (0, node_child_process_1.execFile)("node", ["--version"], { timeout: 3000, windowsHide: true }, (error, stdout) => resolve(error ? undefined : stdout.trim()));
    });
}
/** Cursor, Windsurf, VSCodium, Antigravity, Kiro… install extensions from Open VSX. */
function usesOpenVsx() {
    return !/visual studio code/i.test(vscode.env.appName);
}
function marketplaceLink(id, openVsx) {
    const [publisher, name] = id.split(".");
    return openVsx
        ? `https://open-vsx.org/extension/${publisher}/${name}`
        : `https://marketplace.visualstudio.com/items?itemName=${id}`;
}
const ok = (value) => (value ? "✅" : "⚠️");
async function runDoctor(settings, git, detector) {
    const report = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: vscode.l10n.t("OpenFiles: checking your setup…") }, () => buildReport(settings, git, detector));
    const doc = await vscode.workspace.openTextDocument({ language: "markdown", content: report });
    await vscode.window.showTextDocument(doc, { preview: false });
    await vscode.commands.executeCommand("markdown.showPreview", doc.uri).then(undefined, () => undefined);
}
async function buildReport(settings, git, detector) {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const openVsx = usesOpenVsx();
    const node = await nodeVersion();
    const hookScript = await (0, openfilesDir_1.exists)((0, installFlow_1.hookScriptTarget)());
    const lines = ["# OpenFiles Doctor", ""];
    lines.push("## Editor", "");
    lines.push(`- ${vscode.env.appName} ${vscode.version} · ${openVsx ? "Open VSX" : "Visual Studio Marketplace"}`);
    lines.push(`- ${ok(vscode.workspace.isTrusted)} Workspace trusted${vscode.workspace.isTrusted ? "" : " — hooks and diagnostics export are off until you trust it"}`);
    lines.push(`- ${ok(git.available)} Git extension ${git.available ? "available" : "not available — branch switches can't be filtered out"}`);
    lines.push(`- Mode: \`${settings.mode}\` · watcher ${settings.detection.watcher ? "on" : "off"} · hooks ${settings.detection.hooks ? "on" : "off"}${detector.isPaused ? " · **paused**" : ""}`);
    lines.push("");
    lines.push("## Agent hooks", "");
    lines.push(`- ${ok(!!node)} Node.js on PATH${node ? ` (${node})` : " — hooks run `node`, so they won't work until it is installed"}`);
    lines.push(`- ${ok(hookScript)} Hook script at \`${(0, installFlow_1.hookScriptTarget)()}\``);
    if (root) {
        const statuses = await (0, detect_1.agentStatuses)(root);
        const relevant = statuses.filter((s) => s.detected || s.hookInstalled);
        if (relevant.length === 0) {
            lines.push("- No agent config found in this workspace. The file watcher still catches edits from any agent.");
        }
        for (const status of relevant) {
            const hook = status.agent.hook
                ? status.hookInstalled
                    ? "hook installed"
                    : `no hook — run **OpenFiles: Install Agent Hooks…** (writes \`${status.agent.hook.file}\`)`
                : "no hook support yet — the watcher covers it";
            lines.push(`- ${ok(status.hookInstalled || !status.agent.hook)} **${status.agent.name}**: ${hook}`);
        }
    }
    lines.push("");
    lines.push("## Linters for this workspace", "");
    if (root) {
        const uris = await vscode.workspace.findFiles("**/*", "{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**,**/target/**,**/.venv/**}", SCAN_LIMIT);
        const counts = new Map();
        for (const uri of uris) {
            const ext = path.extname(uri.fsPath).toLowerCase();
            counts.set(ext, (counts.get(ext) ?? 0) + 1);
        }
        const installed = new Set(vscode.extensions.all.map((e) => e.id.toLowerCase()));
        const rows = (0, linters_1.coverage)(counts, (id) => installed.has(id.toLowerCase()), openVsx);
        if (rows.length === 0) {
            lines.push("No files OpenFiles has linter recommendations for.");
        }
        else {
            lines.push("| Language | Files | Checked by | Suggested |", "|---|---|---|---|");
            for (const row of rows) {
                const checkers = [row.builtIn, ...row.installed.map((e) => e.name)].filter(Boolean).join(", ");
                const suggestions = row.installed.length > 0 ? "" : row.suggestions.map((e) => `[${e.name}](${marketplaceLink(e.id, openVsx)})`).join(", ");
                lines.push(`| ${row.language} | ${row.files}${uris.length >= SCAN_LIMIT ? "+" : ""} | ${checkers ? `✅ ${checkers}` : "⚠️ nothing"} | ${suggestions} |`);
            }
        }
    }
    lines.push("");
    lines.push("## Settings that only check open files", "");
    lines.push("These are normal defaults. They're why agent edits go unchecked without OpenFiles opening the files.", "");
    for (const item of linters_1.OPEN_FILES_ONLY_SETTINGS) {
        const [section, ...rest] = item.setting.split(".");
        const value = vscode.workspace.getConfiguration(section).get(rest.join("."));
        if (value === undefined) {
            continue;
        }
        lines.push(`- \`${item.setting}\` = \`${JSON.stringify(value)}\`${JSON.stringify(value) === JSON.stringify(item.value) ? ` — ${item.note}` : ""}`);
    }
    lines.push("", "---", "Something off? https://github.com/devgiordane/openfiles/issues");
    return lines.join("\n");
}
//# sourceMappingURL=doctor.js.map