import type { StatusItem } from "../shared/settings";

export interface StatusState {
  edited: number;
  unreviewed: number;
  errors: number;
  warnings: number;
  agent?: string;
  paused: boolean;
}

export function renderStatusText(items: readonly StatusItem[], state: StatusState): string {
  const parts: string[] = [];
  for (const item of items) {
    switch (item) {
      case "edited":
        parts.push(`$(files) ${state.edited}`);
        break;
      case "unreviewed":
        parts.push(`$(eye) ${state.unreviewed}`);
        break;
      case "errors":
        parts.push(`$(error) ${state.errors}`);
        break;
      case "warnings":
        parts.push(`$(warning) ${state.warnings}`);
        break;
      case "agent":
        if (state.agent) {
          parts.push(`$(hubot) ${state.agent}`);
        }
        break;
      case "paused":
        if (state.paused) {
          parts.push("$(debug-pause)");
        }
        break;
    }
  }
  if (state.edited === 0 && !state.paused) {
    return "$(eye) OpenFiles";
  }
  return parts.length > 0 ? parts.join("  ") : "$(eye) OpenFiles";
}
