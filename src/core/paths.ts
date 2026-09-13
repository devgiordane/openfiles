import * as path from "node:path";

/** Stable map key for a filesystem path (case-insensitive on Windows). */
export function pathKey(fsPath: string, platform: NodeJS.Platform = process.platform): string {
  const normalized = path.normalize(fsPath);
  return platform === "win32" ? normalized.toLowerCase() : normalized;
}

export function toPosix(value: string): string {
  return value.replaceAll("\\", "/");
}

export function isInside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

/** Workspace-relative posix path when inside `root`, otherwise the absolute path. */
export function displayPath(fsPath: string, root: string | undefined): string {
  if (root && isInside(root, fsPath)) {
    return toPosix(path.relative(root, fsPath));
  }
  return fsPath;
}
