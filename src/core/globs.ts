import picomatch from "picomatch";

export type PathMatcher = (relativePosixPath: string) => boolean;

export function createMatcher(
  patterns: readonly string[],
  platform: NodeJS.Platform = process.platform,
): PathMatcher {
  const cleaned = patterns.filter((pattern) => typeof pattern === "string" && pattern.trim() !== "");
  if (cleaned.length === 0) {
    return () => false;
  }
  const isMatch = picomatch(cleaned, { dot: true, nocase: platform === "win32" });
  return (relativePosixPath) => isMatch(relativePosixPath);
}
