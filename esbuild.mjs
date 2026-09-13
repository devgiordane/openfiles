import * as esbuild from "esbuild";

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const shared = {
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  // jsonc-parser's default UMD build requires its own files at runtime, which a bundle can't satisfy.
  mainFields: ["module", "main"],
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

const contexts = await Promise.all([
  esbuild.context({
    ...shared,
    entryPoints: ["src/extension.ts"],
    outfile: "dist/extension.js",
    external: ["vscode"],
  }),
  // The hook runs outside VS Code, spawned by the agent. It must not import vscode.
  esbuild.context({
    ...shared,
    entryPoints: ["src/hook/hook.ts"],
    outfile: "dist/hook.js",
  }),
]);

if (watch) {
  await Promise.all(contexts.map((ctx) => ctx.watch()));
} else {
  await Promise.all(contexts.map((ctx) => ctx.rebuild()));
  await Promise.all(contexts.map((ctx) => ctx.dispose()));
}
