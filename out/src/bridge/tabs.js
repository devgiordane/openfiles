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
exports.urisFromTabInput = urisFromTabInput;
exports.openTabUris = openTabUris;
exports.tabsFor = tabsFor;
exports.isOpenInTab = isOpenInTab;
const vscode = __importStar(require("vscode"));
const paths_1 = require("../core/paths");
function urisFromTabInput(input) {
    if (input instanceof vscode.TabInputText || input instanceof vscode.TabInputNotebook) {
        return [input.uri];
    }
    if (input instanceof vscode.TabInputTextDiff || input instanceof vscode.TabInputNotebookDiff) {
        return [input.original, input.modified];
    }
    return [];
}
function openTabUris() {
    const files = new Map();
    for (const group of vscode.window.tabGroups.all) {
        for (const tab of group.tabs) {
            for (const uri of urisFromTabInput(tab.input)) {
                if (uri.scheme === "file") {
                    files.set((0, paths_1.pathKey)(uri.fsPath), uri);
                }
            }
        }
    }
    return [...files.values()].sort((a, b) => a.fsPath.localeCompare(b.fsPath));
}
function tabsFor(fsPath) {
    const key = (0, paths_1.pathKey)(fsPath);
    return vscode.window.tabGroups.all.flatMap((group) => group.tabs.filter((tab) => urisFromTabInput(tab.input).some((uri) => uri.scheme === "file" && (0, paths_1.pathKey)(uri.fsPath) === key)));
}
function isOpenInTab(fsPath) {
    return tabsFor(fsPath).length > 0;
}
//# sourceMappingURL=tabs.js.map