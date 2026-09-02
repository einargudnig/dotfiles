/**
 * Project Context Extension
 *
 * Loads project-specific context files and injects them into the system prompt.
 * Looks for context files in this priority order:
 *   1. .pi/context.md
 *   2. .pi/context/ directory (all .md files concatenated)
 *   3. CONTEXT.md (project root)
 *
 * Usage:
 *   /context        — show loaded context files and reload
 *   /context clear  — clear loaded context
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { CONFIG_DIR_NAME } from "@earendil-works/pi-coding-agent";

interface LoadedContext {
  source: string;    // relative path
  content: string;   // file contents
  mtime: number;     // for staleness detection
}

let loadedContexts: LoadedContext[] = [];
let projectDir = "";

function findContextFiles(dir: string): string[] {
  const candidates: string[] = [];

  // .pi/context.md (single file)
  const singleFile = path.join(dir, CONFIG_DIR_NAME, "context.md");
  if (fs.existsSync(singleFile)) candidates.push(singleFile);

  // .pi/context/ directory
  const contextDir = path.join(dir, CONFIG_DIR_NAME, "context");
  if (fs.existsSync(contextDir) && fs.statSync(contextDir).isDirectory()) {
    const entries = fs.readdirSync(contextDir).filter((e) => e.endsWith(".md")).sort();
    for (const entry of entries) {
      candidates.push(path.join(contextDir, entry));
    }
  }

  // CONTEXT.md (project root)
  const rootContext = path.join(dir, "CONTEXT.md");
  if (fs.existsSync(rootContext)) candidates.push(rootContext);

  return candidates;
}

function loadContextFiles(dir: string): LoadedContext[] {
  const files = findContextFiles(dir);
  return files.map((filePath) => {
    const stat = fs.statSync(filePath);
    return {
      source: path.relative(dir, filePath),
      content: fs.readFileSync(filePath, "utf-8"),
      mtime: stat.mtimeMs,
    };
  });
}

function formatContextBlock(contexts: LoadedContext[]): string {
  if (contexts.length === 0) return "";

  const blocks = contexts.map((ctx) => {
    return `### ${ctx.source}\n\n${ctx.content}`;
  });

  return `
## Project Context

The following project-specific context has been loaded for this session:

${blocks.join("\n\n---\n\n")}
`;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    projectDir = ctx.cwd;
    loadedContexts = loadContextFiles(ctx.cwd);

    if (loadedContexts.length > 0) {
      const names = loadedContexts.map((c) => c.source).join(", ");
      ctx.ui.notify(`Loaded project context: ${names}`, "info");
    }
  });

  pi.on("before_agent_start", async (event) => {
    if (loadedContexts.length === 0) return;

    // Check for staleness (files modified since load)
    const refreshed = loadContextFiles(projectDir);
    const hasChanged = refreshed.some((r, i) => {
      const old = loadedContexts[i];
      return !old || old.source !== r.source || old.mtime !== r.mtime;
    });

    if (hasChanged) {
      loadedContexts = refreshed;
    }

    const block = formatContextBlock(loadedContexts);
    if (!block) return;

    return {
      systemPrompt: event.systemPrompt + block,
    };
  });

  pi.registerCommand("context", {
    description: "Show loaded project context files, or 'context clear' to remove",
    handler: async (args, ctx) => {
      const arg = args.trim().toLowerCase();

      if (arg === "clear") {
        loadedContexts = [];
        ctx.ui.notify("Project context cleared", "info");
        return;
      }

      // Reload
      loadedContexts = loadContextFiles(ctx.cwd);

      if (loadedContexts.length === 0) {
        ctx.ui.notify(
          `No context files found. Create one at ${CONFIG_DIR_NAME}/context.md or ${CONFIG_DIR_NAME}/context/`,
          "info",
        );
        return;
      }

      const summary = loadedContexts
        .map((c) => `  ${c.source} (${c.content.length} chars)`)
        .join("\n");
      ctx.ui.notify(`Project context reloaded:\n${summary}`, "info");
    },
  });
}
