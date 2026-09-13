import * as fs from "node:fs/promises";
import * as path from "node:path";

/** Creates `<root>/.openfiles/` with a `.gitignore` of `*`, so the user's own .gitignore stays untouched. */
export async function ensureOpenfilesDir(root: string): Promise<string> {
  const dir = path.join(root, ".openfiles");
  await fs.mkdir(dir, { recursive: true });
  const gitignore = path.join(dir, ".gitignore");
  try {
    await fs.access(gitignore);
  } catch {
    await fs.writeFile(gitignore, "# Local state written by the OpenFiles extension.\n*\n", "utf8");
  }
  return dir;
}

export async function atomicWrite(file: string, content: string): Promise<void> {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, file);
}

export async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}
