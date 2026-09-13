import * as vscode from "vscode";
import type { FeedbackLevel } from "../diagnostics/format";

export type Mode = "open" | "queue" | "notify";
export type StatusItem = "edited" | "unreviewed" | "errors" | "warnings" | "agent" | "paused";
export type ClickAction = "menu" | "reviewNext" | "openAiEdits" | "showProblems" | "focusSidebar";

export const STATUS_ITEMS: readonly StatusItem[] = ["edited", "unreviewed", "errors", "warnings", "agent", "paused"];
export const CLICK_ACTIONS: readonly ClickAction[] = ["menu", "reviewNext", "openAiEdits", "showProblems", "focusSidebar"];

export interface Settings {
  mode: Mode;
  openInBackground: boolean;
  maxAutoOpen: number;
  closeReviewedTabs: boolean;
  ignore: string[];
  sensitive: string[];
  detection: {
    watcher: boolean;
    git: boolean;
    hooks: boolean;
    burstLimit: number;
    editorSaveGraceMs: number;
  };
  diagnosticsExport: boolean;
  hooks: {
    feedback: FeedbackLevel;
    feedbackTimeoutMs: number;
  };
  statusBar: {
    enabled: boolean;
    items: StatusItem[];
    clickAction: ClickAction;
    alignment: "left" | "right";
  };
  configFile: string;
  heartbeatSeconds: number;
}

export function readSettings(): Settings {
  const config = vscode.workspace.getConfiguration("openfiles");
  const get = <T>(key: string, fallback: T): T => config.get<T>(key, fallback);
  return {
    mode: get<Mode>("mode", "open"),
    openInBackground: get("openInBackground", true),
    maxAutoOpen: get("maxAutoOpen", 15),
    closeReviewedTabs: get("closeReviewedTabs", false),
    ignore: get<string[]>("ignore", []),
    sensitive: get<string[]>("sensitive", []),
    detection: {
      watcher: get("detection.watcher", true),
      git: get("detection.git", true),
      hooks: get("detection.hooks", true),
      burstLimit: get("detection.burstLimit", 200),
      editorSaveGraceMs: get("detection.editorSaveGraceMs", 1500),
    },
    diagnosticsExport: get("diagnostics.export", true),
    hooks: {
      feedback: get<FeedbackLevel>("hooks.feedback", "errorsAndWarnings"),
      feedbackTimeoutMs: get("hooks.feedbackTimeoutMs", 4000),
    },
    statusBar: {
      enabled: get("statusBar.enabled", true),
      items: get<StatusItem[]>("statusBar.items", ["unreviewed", "errors", "warnings"]),
      clickAction: get<ClickAction>("statusBar.clickAction", "menu"),
      alignment: get<"left" | "right">("statusBar.alignment", "left"),
    },
    configFile: get("configFile", ".openfiles.json"),
    heartbeatSeconds: get("heartbeatSeconds", 5),
  };
}
