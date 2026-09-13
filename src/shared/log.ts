import * as vscode from "vscode";

let channel: vscode.LogOutputChannel | undefined;

export function initLog(): vscode.LogOutputChannel {
  channel ??= vscode.window.createOutputChannel("OpenFiles", { log: true });
  return channel;
}

export const log = {
  info: (message: string) => channel?.info(message),
  warn: (message: string) => channel?.warn(message),
  error: (message: string, error?: unknown) => channel?.error(error ? `${message}: ${String(error)}` : message),
  debug: (message: string) => channel?.debug(message),
  show: () => channel?.show(true),
};
