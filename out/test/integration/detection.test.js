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
const assert = __importStar(require("node:assert"));
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const root = () => vscode.workspace.workspaceFolders[0].uri.fsPath;
async function waitFor(check, timeoutMs = 30_000, onRetry) {
    const started = Date.now();
    let lastRetry = started;
    for (;;) {
        const value = await check();
        if (value !== undefined && value !== false) {
            return value;
        }
        if (Date.now() - started > timeoutMs) {
            throw new Error("Timed out");
        }
        if (onRetry && Date.now() - lastRetry > 3000) {
            lastRetry = Date.now();
            await onRetry();
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
}
async function readDiagnostics() {
    try {
        return JSON.parse(await fs.readFile(path.join(root(), ".openfiles", "diagnostics.json"), "utf8"));
    }
    catch {
        return undefined;
    }
}
suite("OpenFiles detection", () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension("devgiordane.openfiles");
        await extension.activate();
    });
    teardown(async () => {
        await vscode.commands.executeCommand("openfiles.clearSession");
        await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    });
    test("a file written outside the editor opens and is exported", async () => {
        const file = path.join(root(), "src", `agent-${Date.now()}.ts`);
        let writes = 0;
        const write = () => fs.writeFile(file, `export const answer: number = ${42 + writes++};\n`, "utf8");
        await write();
        // The macOS file watcher can take a few seconds to start on a cold CI runner and miss the
        // first write. Agents write repeatedly anyway, so keep writing until the editor notices.
        await waitFor(() => vscode.window.tabGroups.all.some((g) => g.tabs.some((t) => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === file)), 30_000, write);
        const exported = await waitFor(async () => {
            const diagnostics = await readDiagnostics();
            const entry = diagnostics?.files[`src/${path.basename(file)}`];
            return entry && entry.checkedAt > 0 ? entry : undefined;
        });
        assert.ok(exported.checkedAt > 0);
        await fs.unlink(file);
    });
    test("a save from the editor is not treated as an agent edit", async () => {
        const file = path.join(root(), "src", "user.ts");
        const doc = await vscode.workspace.openTextDocument(file);
        const editor = await vscode.window.showTextDocument(doc);
        await editor.edit((b) => b.insert(new vscode.Position(0, 0), "// typed by a human\n"));
        await doc.save();
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const diagnostics = await readDiagnostics();
        assert.strictEqual(diagnostics?.files["src/user.ts"], undefined);
        await editor.edit((b) => b.delete(new vscode.Range(0, 0, 1, 0)));
        await doc.save();
    });
});
//# sourceMappingURL=detection.test.js.map