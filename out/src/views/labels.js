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
exports.agentLabel = agentLabel;
exports.problemsSuffix = problemsSuffix;
const vscode = __importStar(require("vscode"));
const registry_1 = require("../agents/registry");
function agentLabel(entry) {
    if (entry.agent && entry.agent !== "unknown") {
        return (0, registry_1.agentById)(entry.agent)?.name ?? entry.agent;
    }
    return entry.source === "git" ? vscode.l10n.t("Uncommitted changes") : vscode.l10n.t("Changed outside the editor");
}
function problemsSuffix(errors, warnings) {
    const parts = [];
    if (errors > 0) {
        parts.push(`${errors}✕`);
    }
    if (warnings > 0) {
        parts.push(`${warnings}⚠`);
    }
    return parts.join(" ");
}
//# sourceMappingURL=labels.js.map