import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightPageActions from "starlight-page-actions";

const description =
  "OpenFiles is a VS Code extension that opens every file an AI coding agent edits, so VS Code's linters and type checkers run on it, lists the changes for review, and hands the problems back to the agent through hooks.";

export default defineConfig({
  site: "https://devgiordane.github.io",
  base: "/openfiles",
  integrations: [
    starlight({
      title: "OpenFiles",
      description,
      logo: { src: "./src/assets/icon.png", alt: "OpenFiles" },
      favicon: "/favicon.png",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/devgiordane/openfiles" }],
      editLink: { baseUrl: "https://github.com/devgiordane/openfiles/edit/main/docs/" },
      lastUpdated: true,
      sidebar: [
        { label: "Start here", items: ["getting-started", "how-it-works"] },
        {
          label: "Agents",
          items: [
            "agents/claude-code",
            "agents/codex",
            "agents/copilot",
            "agents/gemini-cli",
            "agents/cursor",
            "agents/windsurf",
            "agents/opencode",
            "agents/other",
          ],
        },
        { label: "Guides", items: ["guides/review-workflow", "guides/status-bar", "guides/prompts"] },
        {
          label: "Reference",
          items: ["reference/commands", "reference/settings", "reference/diagnostics-file", "reference/linters"],
        },
        "faq",
      ],
      plugins: [
        // Owns /llms.txt, /llms-full.txt and /llms-small.txt.
        starlightLlmsTxt({
          projectName: "OpenFiles",
          description,
          details: [
            "- Install from the VS Code Marketplace (`devgiordane.openfiles`) or Open VSX for Cursor, Windsurf, VSCodium, Antigravity and Kiro.",
            "- Agents read problems from `.openfiles/diagnostics.json` in the workspace. The format is in the diagnostics file reference.",
            "- Hook configuration is installed by the user through the \"OpenFiles: Install Agent Hooks…\" command, which shows a preview. Agents should not write hook config themselves.",
          ].join("\n"),
          promote: ["index*", "getting-started", "how-it-works", "guides/prompts", "reference/diagnostics-file"],
          demote: ["reference/linters", "faq"],
        }),
        // No baseUrl on purpose: with one set, this plugin would overwrite llms.txt.
        starlightPageActions({
          prompt: "Read {url}. I want to set up and use OpenFiles in this project.",
          actions: { chatgpt: true, claude: true, cursor: true, githubCopilot: true, markdown: true },
        }),
      ],
    }),
  ],
});
