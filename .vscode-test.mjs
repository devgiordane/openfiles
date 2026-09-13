import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/integration/**/*.test.js",
  workspaceFolder: "./test/fixtures/workspace-ts",
  version: "stable",
  mocha: { ui: "tdd", timeout: 30_000 },
  launchArgs: ["--disable-extensions"],
});
