import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";
import { applyEdits, modify, parse } from "jsonc-parser";
import { pathKey, toPosix } from "../core/paths";
import { isOpenInTab } from "../bridge/tabs";
import { exists } from "../shared/openfilesDir";
import { log } from "../shared/log";

export interface Profile {
  include?: string[];
  exclude?: string[];
  files?: string[];
  roots?: string[];
  maxFiles?: number;
}

export interface ProfilesConfig {
  defaultProfile?: string;
  profiles?: Record<string, Profile>;
}

const DEFAULT_EXCLUDES = [
  "**/.git/**",
  "**/.openfiles/**",
  "**/node_modules/**",
  "**/.dart_tool/**",
  "**/build/**",
  "**/dist/**",
  "**/coverage/**",
];

export function profilesFileUri(folder: vscode.WorkspaceFolder, configFile: string): vscode.Uri {
  return vscode.Uri.joinPath(folder.uri, toPosix(configFile));
}

export async function readProfiles(configFile: string): Promise<{ folder: vscode.WorkspaceFolder; config: ProfilesConfig } | undefined> {
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    try {
      const raw = await fs.readFile(profilesFileUri(folder, configFile).fsPath, "utf8");
      const config = parse(raw) as ProfilesConfig;
      if (config && typeof config.profiles === "object") {
        return { folder, config };
      }
    } catch {
      // Not in this folder.
    }
  }
  return undefined;
}

function list(value: string[] | undefined): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
}

export async function filesForProfile(folder: vscode.WorkspaceFolder, profile: Profile): Promise<vscode.Uri[]> {
  const roots = list(profile.roots);
  const exclude = `{${[...DEFAULT_EXCLUDES, ...list(profile.exclude)].join(",")}}`;
  const files = new Map<string, vscode.Uri>();

  for (const root of roots.length > 0 ? roots : [""]) {
    const prefix = toPosix(root).replace(/^\.\//, "").replace(/\/$/, "");
    for (const explicit of list(profile.files)) {
      const uri = vscode.Uri.joinPath(folder.uri, prefix, toPosix(explicit));
      if (await exists(uri.fsPath)) {
        files.set(pathKey(uri.fsPath), uri);
      } else {
        log.warn(`Profile file not found: ${uri.fsPath}`);
      }
    }
    for (const include of list(profile.include)) {
      const pattern = new vscode.RelativePattern(folder, prefix ? `${prefix}/${include}` : include);
      for (const uri of await vscode.workspace.findFiles(pattern, exclude)) {
        files.set(pathKey(uri.fsPath), uri);
      }
    }
  }

  const result = [...files.values()].sort((a, b) => a.fsPath.localeCompare(b.fsPath));
  return profile.maxFiles && result.length > profile.maxFiles ? result.slice(0, profile.maxFiles) : result;
}

export async function openProfile(configFile: string, name?: string): Promise<void> {
  const found = await readProfiles(configFile);
  if (!found) {
    const create = vscode.l10n.t("Create .openfiles.json");
    const choice = await vscode.window.showWarningMessage(vscode.l10n.t("No profiles file found in this workspace."), create);
    if (choice === create) {
      await vscode.commands.executeCommand("openfiles.openConfig");
    }
    return;
  }

  const names = Object.keys(found.config.profiles ?? {}).sort();
  const selected =
    name ??
    (names.length === 1
      ? names[0]
      : await vscode.window.showQuickPick(names, {
          placeHolder: vscode.l10n.t("Profile to open (default: {0})", found.config.defaultProfile ?? names[0] ?? "-"),
        }));
  if (!selected) {
    return;
  }

  const profile = found.config.profiles?.[selected];
  if (!profile) {
    void vscode.window.showErrorMessage(vscode.l10n.t("Profile '{0}' not found.", selected));
    return;
  }

  const configured = await filesForProfile(found.folder, profile);
  const missing = configured.filter((uri) => !isOpenInTab(uri.fsPath));
  for (const uri of missing) {
    try {
      await vscode.window.showTextDocument(uri, { preview: false, preserveFocus: true });
    } catch (error) {
      log.warn(`Could not open ${uri.fsPath}: ${String(error)}`);
    }
  }
  void vscode.window.showInformationMessage(
    vscode.l10n.t("Profile '{0}': opened {1} file(s), {2} were already open.", selected, missing.length, configured.length - missing.length),
  );
}

export async function openDefaultProfile(configFile: string): Promise<void> {
  const found = await readProfiles(configFile);
  const names = Object.keys(found?.config.profiles ?? {}).sort();
  await openProfile(configFile, found?.config.defaultProfile ?? names[0]);
}

export async function openOrCreateConfig(context: vscode.ExtensionContext, configFile: string): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showWarningMessage(vscode.l10n.t("Open a folder first."));
    return;
  }
  const uri = profilesFileUri(folder, configFile);
  if (!(await exists(uri.fsPath))) {
    const template = await fs.readFile(context.asAbsolutePath("templates/.openfiles.json"), "utf8");
    await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });
    await fs.writeFile(uri.fsPath, template, "utf8");
  }
  await vscode.window.showTextDocument(uri, { preview: false });
}

export async function addToProfile(configFile: string, target: vscode.Uri | undefined): Promise<void> {
  const uri = target ?? vscode.window.activeTextEditor?.document.uri;
  const folder = uri && vscode.workspace.getWorkspaceFolder(uri);
  if (!uri || !folder) {
    return;
  }
  const file = profilesFileUri(folder, configFile).fsPath;
  let raw = "{\n  \"profiles\": {}\n}\n";
  try {
    raw = await fs.readFile(file, "utf8");
  } catch {
    // Created below.
  }
  const config = (parse(raw) ?? {}) as ProfilesConfig;
  const names = Object.keys(config.profiles ?? {}).sort();
  const newProfile = vscode.l10n.t("New profile…");
  let name = await vscode.window.showQuickPick([...names, newProfile], { placeHolder: vscode.l10n.t("Add to which profile?") });
  if (name === newProfile) {
    name = await vscode.window.showInputBox({ prompt: vscode.l10n.t("Profile name"), validateInput: (v) => (v.trim() ? undefined : " ") });
  }
  if (!name) {
    return;
  }
  const relative = toPosix(path.relative(folder.uri.fsPath, uri.fsPath));
  const current = config.profiles?.[name]?.files ?? [];
  if (current.includes(relative)) {
    return;
  }
  const edits = modify(raw, ["profiles", name, "files"], [...current, relative], { formattingOptions: { insertSpaces: true, tabSize: 2 } });
  await fs.writeFile(file, applyEdits(raw, edits), "utf8");
  void vscode.window.showInformationMessage(vscode.l10n.t("Added {0} to profile '{1}'.", relative, name));
}
