import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";

const root = () => vscode.workspace.workspaceFolders![0].uri.fsPath;

async function waitFor<T>(check: () => T | undefined | Promise<T | undefined>, timeoutMs = 10_000): Promise<T> {
  const started = Date.now();
  for (;;) {
    const value = await check();
    if (value !== undefined && value !== false) {
      return value;
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out");
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

async function readDiagnostics(): Promise<{ files: Record<string, { checkedAt: number }> } | undefined> {
  try {
    return JSON.parse(await fs.readFile(path.join(root(), ".openfiles", "diagnostics.json"), "utf8"));
  } catch {
    return undefined;
  }
}

suite("OpenFiles detection", () => {
  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension("devgiordane.openfiles")!;
    await extension.activate();
  });

  teardown(async () => {
    await vscode.commands.executeCommand("openfiles.clearSession");
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  test("a file written outside the editor opens and is exported", async () => {
    const file = path.join(root(), "src", `agent-${Date.now()}.ts`);
    await fs.writeFile(file, "export const answer: number = 42;\n", "utf8");

    await waitFor(() => vscode.window.tabGroups.all.some((g) => g.tabs.some((t) => t.input instanceof vscode.TabInputText && t.input.uri.fsPath === file)));
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
