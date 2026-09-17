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
exports.AGENT_IDS = void 0;
exports.isAgentId = isAgentId;
exports.parsePatchPaths = parsePatchPaths;
exports.parseHookInput = parseHookInput;
const path = __importStar(require("node:path"));
exports.AGENT_IDS = [
    "claude",
    "codex",
    "copilot",
    "vscode",
    "gemini",
    "qwen",
    "kimi",
    "cursor",
    "windsurf",
    "kiro",
    "cline",
    "droid",
    "goose",
    "opencode",
    "unknown",
];
// Tool names that write files, across agents: Edit, Write, MultiEdit, NotebookEdit (Claude),
// apply_patch (Codex), edit/create (Copilot CLI), write_file/replace (Gemini),
// create_file/replace_string_in_file/editFiles (VS Code agent mode), Create/Edit/ApplyPatch (Droid).
const WRITE_TOOL = /edit|write|create|replace|patch|insert|notebook|rename|move/i;
const PATH_KEYS = [
    "file_path",
    "filePath",
    "path",
    "absolute_path",
    "absolutePath",
    "target_file",
    "targetFile",
    "notebook_path",
    "new_path",
    "newPath",
    "destination",
];
const PATH_LIST_KEYS = ["file_paths", "filePaths", "paths", "files"];
function isAgentId(value) {
    return !!value && exports.AGENT_IDS.includes(value);
}
/** Paths written by a Codex-style patch (`*** Add File:` / `*** Update File:` / `*** Move to:`) or a unified diff. */
function parsePatchPaths(patch) {
    const found = [];
    for (const rawLine of patch.split(/\r?\n/)) {
        const line = rawLine.trimEnd();
        const codex = /^\*\*\* (?:Add File|Update File|Move to): (.+)$/.exec(line);
        if (codex) {
            found.push(codex[1].trim());
            continue;
        }
        const unified = /^\+\+\+ (?:b\/)?(.+)$/.exec(line);
        if (unified && unified[1] !== "/dev/null") {
            found.push(unified[1].trim());
        }
    }
    return unique(found);
}
function parseHookInput(agent, input) {
    const root = asRecord(input);
    const cwd = str(root.cwd) ?? str(root.workspace_root) ?? firstString(root.workspace_roots);
    const tool = str(root.tool_name) ?? str(root.toolName) ?? str(asRecord(root.tool_info).tool_name) ?? str(root.tool);
    if (tool && !WRITE_TOOL.test(tool)) {
        return { agent, tool, cwd, paths: [] };
    }
    const candidates = [];
    const containers = [
        root,
        asRecord(root.tool_input),
        asRecord(parseMaybeJson(root.toolArgs)),
        asRecord(root.tool_info),
        asRecord(root.input),
        asRecord(root.args),
    ];
    for (const container of containers) {
        for (const key of PATH_KEYS) {
            const value = str(container[key]);
            if (value) {
                candidates.push(value);
            }
        }
        for (const key of PATH_LIST_KEYS) {
            const list = container[key];
            if (Array.isArray(list)) {
                for (const item of list) {
                    const value = str(item) ?? str(asRecord(item).path) ?? str(asRecord(item).file_path);
                    if (value) {
                        candidates.push(value);
                    }
                }
            }
        }
        for (const key of ["command", "patch", "input"]) {
            const value = str(container[key]);
            if (value && (value.includes("*** Begin Patch") || value.includes("\n+++ "))) {
                candidates.push(...parsePatchPaths(value));
            }
        }
    }
    const paths = unique(candidates
        .filter((candidate) => !candidate.includes("\n") && candidate.length < 4096)
        .map((candidate) => (cwd && !path.isAbsolute(candidate) ? path.resolve(cwd, candidate) : candidate)));
    return { agent, tool, cwd, paths };
}
function unique(values) {
    return [...new Set(values)];
}
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function str(value) {
    return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
function firstString(value) {
    return Array.isArray(value) ? str(value[0]) : undefined;
}
function parseMaybeJson(value) {
    if (typeof value !== "string") {
        return value;
    }
    try {
        return JSON.parse(value);
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=parse.js.map