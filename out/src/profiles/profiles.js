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
exports.profilesFileUri = profilesFileUri;
exports.readProfiles = readProfiles;
exports.filesForProfile = filesForProfile;
exports.openProfile = openProfile;
exports.openDefaultProfile = openDefaultProfile;
exports.openOrCreateConfig = openOrCreateConfig;
exports.addToProfile = addToProfile;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const jsonc_parser_1 = require("jsonc-parser");
const paths_1 = require("../core/paths");
const tabs_1 = require("../bridge/tabs");
const openfilesDir_1 = require("../shared/openfilesDir");
const log_1 = require("../shared/log");
const DEFAULT_EXCLUDES = [
    "**/.git/**",
    "**/.openfiles/**",
    "**/node_modules/**",
    "**/.dart_tool/**",
    "**/build/**",
    "**/dist/**",
    "**/coverage/**",
];
function profilesFileUri(folder, configFile) {
    return vscode.Uri.joinPath(folder.uri, (0, paths_1.toPosix)(configFile));
}
async function readProfiles(configFile) {
    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        try {
            const raw = await fs.readFile(profilesFileUri(folder, configFile).fsPath, "utf8");
            const config = (0, jsonc_parser_1.parse)(raw);
            if (config && typeof config.profiles === "object") {
                return { folder, config };
            }
        }
        catch {
            // Not in this folder.
        }
    }
    return undefined;
}
function list(value) {
    return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
}
async function filesForProfile(folder, profile) {
    const roots = list(profile.roots);
    const exclude = `{${[...DEFAULT_EXCLUDES, ...list(profile.exclude)].join(",")}}`;
    const files = new Map();
    for (const root of roots.length > 0 ? roots : [""]) {
        const prefix = (0, paths_1.toPosix)(root).replace(/^\.\//, "").replace(/\/$/, "");
        for (const explicit of list(profile.files)) {
            const uri = vscode.Uri.joinPath(folder.uri, prefix, (0, paths_1.toPosix)(explicit));
            if (await (0, openfilesDir_1.exists)(uri.fsPath)) {
                files.set((0, paths_1.pathKey)(uri.fsPath), uri);
            }
            else {
                log_1.log.warn(`Profile file not found: ${uri.fsPath}`);
            }
        }
        for (const include of list(profile.include)) {
            const pattern = new vscode.RelativePattern(folder, prefix ? `${prefix}/${include}` : include);
            for (const uri of await vscode.workspace.findFiles(pattern, exclude)) {
                files.set((0, paths_1.pathKey)(uri.fsPath), uri);
            }
        }
    }
    const result = [...files.values()].sort((a, b) => a.fsPath.localeCompare(b.fsPath));
    return profile.maxFiles && result.length > profile.maxFiles ? result.slice(0, profile.maxFiles) : result;
}
async function openProfile(configFile, name) {
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
    const selected = name ??
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
    const missing = configured.filter((uri) => !(0, tabs_1.isOpenInTab)(uri.fsPath));
    for (const uri of missing) {
        try {
            await vscode.window.showTextDocument(uri, { preview: false, preserveFocus: true });
        }
        catch (error) {
            log_1.log.warn(`Could not open ${uri.fsPath}: ${String(error)}`);
        }
    }
    void vscode.window.showInformationMessage(vscode.l10n.t("Profile '{0}': opened {1} file(s), {2} were already open.", selected, missing.length, configured.length - missing.length));
}
async function openDefaultProfile(configFile) {
    const found = await readProfiles(configFile);
    const names = Object.keys(found?.config.profiles ?? {}).sort();
    await openProfile(configFile, found?.config.defaultProfile ?? names[0]);
}
async function openOrCreateConfig(context, configFile) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
        void vscode.window.showWarningMessage(vscode.l10n.t("Open a folder first."));
        return;
    }
    const uri = profilesFileUri(folder, configFile);
    if (!(await (0, openfilesDir_1.exists)(uri.fsPath))) {
        const template = await fs.readFile(context.asAbsolutePath("templates/.openfiles.json"), "utf8");
        await fs.mkdir(path.dirname(uri.fsPath), { recursive: true });
        await fs.writeFile(uri.fsPath, template, "utf8");
    }
    await vscode.window.showTextDocument(uri, { preview: false });
}
async function addToProfile(configFile, target) {
    const uri = target ?? vscode.window.activeTextEditor?.document.uri;
    const folder = uri && vscode.workspace.getWorkspaceFolder(uri);
    if (!uri || !folder) {
        return;
    }
    const file = profilesFileUri(folder, configFile).fsPath;
    let raw = "{\n  \"profiles\": {}\n}\n";
    try {
        raw = await fs.readFile(file, "utf8");
    }
    catch {
        // Created below.
    }
    const config = ((0, jsonc_parser_1.parse)(raw) ?? {});
    const names = Object.keys(config.profiles ?? {}).sort();
    const newProfile = vscode.l10n.t("New profile…");
    let name = await vscode.window.showQuickPick([...names, newProfile], { placeHolder: vscode.l10n.t("Add to which profile?") });
    if (name === newProfile) {
        name = await vscode.window.showInputBox({ prompt: vscode.l10n.t("Profile name"), validateInput: (v) => (v.trim() ? undefined : " ") });
    }
    if (!name) {
        return;
    }
    const relative = (0, paths_1.toPosix)(path.relative(folder.uri.fsPath, uri.fsPath));
    const current = config.profiles?.[name]?.files ?? [];
    if (current.includes(relative)) {
        return;
    }
    const edits = (0, jsonc_parser_1.modify)(raw, ["profiles", name, "files"], [...current, relative], { formattingOptions: { insertSpaces: true, tabSize: 2 } });
    await fs.writeFile(file, (0, jsonc_parser_1.applyEdits)(raw, edits), "utf8");
    void vscode.window.showInformationMessage(vscode.l10n.t("Added {0} to profile '{1}'.", relative, name));
}
//# sourceMappingURL=profiles.js.map