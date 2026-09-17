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
exports.readAgentConfig = readAgentConfig;
exports.agentStatuses = agentStatuses;
const fs = __importStar(require("node:fs/promises"));
const path = __importStar(require("node:path"));
const jsonc_parser_1 = require("jsonc-parser");
const openfilesDir_1 = require("../shared/openfilesDir");
const hookConfig_1 = require("./hookConfig");
const registry_1 = require("./registry");
async function readAgentConfig(root, agent) {
    if (!agent.hook) {
        return undefined;
    }
    const file = path.join(root, agent.hook.file);
    let raw;
    try {
        raw = await fs.readFile(file, "utf8");
    }
    catch {
        return { path: file, exists: false };
    }
    if (agent.hook.kind === "opencode-plugin") {
        return { path: file, exists: true, raw, value: raw };
    }
    const errors = [];
    const value = raw.trim() === "" ? {} : (0, jsonc_parser_1.parse)(raw, errors, { allowTrailingComma: true });
    return {
        path: file,
        exists: true,
        raw,
        value,
        error: errors.length > 0 ? `invalid JSON at offset ${errors[0].offset}` : undefined,
    };
}
async function agentStatuses(root) {
    return Promise.all(registry_1.AGENTS.map(async (agent) => {
        const markers = await Promise.all(agent.markers.map((marker) => (0, openfilesDir_1.exists)(path.join(root, marker))));
        const config = await readAgentConfig(root, agent);
        return {
            agent,
            detected: markers.some(Boolean),
            hookInstalled: !!config?.exists && (0, hookConfig_1.hasHook)(config.value),
        };
    }));
}
//# sourceMappingURL=detect.js.map