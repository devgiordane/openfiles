import * as vscode from "vscode";
import { agentById } from "../agents/registry";
import type { EditEntry } from "../session/store";

export function agentLabel(entry: Pick<EditEntry, "agent" | "source">): string {
  if (entry.agent && entry.agent !== "unknown") {
    return agentById(entry.agent)?.name ?? entry.agent;
  }
  return entry.source === "git" ? vscode.l10n.t("Uncommitted changes") : vscode.l10n.t("Changed outside the editor");
}

export function problemsSuffix(errors: number, warnings: number): string {
  const parts: string[] = [];
  if (errors > 0) {
    parts.push(`${errors}✕`);
  }
  if (warnings > 0) {
    parts.push(`${warnings}⚠`);
  }
  return parts.join(" ");
}
