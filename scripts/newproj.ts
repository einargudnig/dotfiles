#!/usr/bin/env bun
// Scaffold a new project preconfigured with the TypeScript 7 + oxc toolchain
// (oxlint + oxfmt), a `check` gate, and a starter file + test.
//
//   newproj <name> [--preset bun-lib|hono|vite-react] [--no-git] [--no-install]
//
// Omit the name or preset and you'll be prompted.

import { $ } from "bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Preset = "bun-lib" | "hono" | "vite-react";
const PRESETS = ["bun-lib", "hono", "vite-react"] as const;
const PRESET_LABELS: Record<Preset, string> = {
  "bun-lib": "Bun CLI / library (plain Bun + TS7)",
  hono: "Hono API (Hono on Bun)",
  "vite-react": "Vite + React SPA",
};

const TOOLING = {
  typescript: "^7.0.0",
  oxlint: "^1.73.0",
  oxfmt: "^0.20.0",
} as const;

// ---------- shared file fragments ----------

const gitignore = `node_modules/
dist/
*.log
.DS_Store
.env
.env.local
.env.*.local
`;

const oxlintrc = (react: boolean) =>
  JSON.stringify(
    {
      $schema:
        "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
      plugins: react
        ? ["import", "typescript", "react"]
        : ["import", "typescript"],
      categories: { correctness: "error", suspicious: "warn", perf: "warn" },
      ...(react
        ? {
            rules: {
              "react/react-in-jsx-scope": "off",
              // side-effect CSS imports (import "@/index.css")
              "import/no-unassigned-import": "off",
            },
          }
        : {}),
      ignorePatterns: ["node_modules/", "dist/", "**/*.d.ts"],
    },
    null,
    2,
  ) + "\n";

const bunTsconfig =
  JSON.stringify(
    {
      compilerOptions: {
        target: "ESNext",
        module: "Preserve",
        moduleResolution: "bundler",
        types: ["bun"],
        lib: ["ESNext"],
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        verbatimModuleSyntax: true,
        allowImportingTsExtensions: true,
        noUncheckedIndexedAccess: true,
      },
      include: ["src"],
    },
    null,
    2,
  ) + "\n";

const viteTsconfig =
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "bundler",
        jsx: "react-jsx",
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        // "node" so vite.config.ts (node:path, import.meta.dirname) type-checks.
        types: ["vite/client", "node"],
        // No baseUrl — removed in TS7; explicit relative paths resolve fine.
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src", "vite.config.ts"],
    },
    null,
    2,
  ) + "\n";

const pkg = (obj: Record<string, unknown>) => JSON.stringify(obj, null, 2) + "\n";

const readme = (name: string, preset: Preset, run: string) =>
  `# ${name}

Scaffolded with the TypeScript 7 + oxc toolchain (\`${preset}\`).

\`\`\`sh
bun install
${run}
bun run check   # oxlint + tsc --noEmit${preset === "vite-react" ? "" : " + bun test"}
\`\`\`

- **Type-check:** TypeScript 7 (\`tsc --noEmit\`)
- **Lint:** oxlint (\`.oxlintrc.json\`)
- **Format:** oxfmt (\`bun run format\`)
`;

// ---------- per-preset file maps ----------

const files = (name: string, preset: Preset): Record<string, string> => {
  if (preset === "bun-lib") {
    return {
      "package.json": pkg({
        name,
        type: "module",
        private: true,
        scripts: {
          dev: "bun run --watch src/index.ts",
          start: "bun run src/index.ts",
          lint: "oxlint",
          typecheck: "tsc --noEmit",
          test: "bun test",
          format: "oxfmt --write .",
          "format:check": "oxfmt --check .",
          check: "oxlint && tsc --noEmit && bun test",
        },
        devDependencies: {
          "@types/bun": "latest",
          oxfmt: TOOLING.oxfmt,
          oxlint: TOOLING.oxlint,
          typescript: TOOLING.typescript,
        },
      }),
      "tsconfig.json": bunTsconfig,
      ".oxlintrc.json": oxlintrc(false),
      ".gitignore": gitignore,
      "README.md": readme(name, preset, "bun run dev"),
      "src/index.ts": `export const greet = (name: string): string => \`Hello, \${name}!\`;

if (import.meta.main) {
  console.log(greet(Bun.argv[2] ?? "world"));
}
`,
      "src/index.test.ts": `import { expect, test } from "bun:test";
import { greet } from "./index.ts";

test("greet", () => {
  expect(greet("Einar")).toBe("Hello, Einar!");
});
`,
    };
  }

  if (preset === "hono") {
    return {
      "package.json": pkg({
        name,
        type: "module",
        private: true,
        scripts: {
          dev: "bun run --hot src/index.ts",
          start: "bun run src/index.ts",
          lint: "oxlint",
          typecheck: "tsc --noEmit",
          test: "bun test",
          format: "oxfmt --write .",
          "format:check": "oxfmt --check .",
          check: "oxlint && tsc --noEmit && bun test",
        },
        dependencies: { hono: "^4" },
        devDependencies: {
          "@types/bun": "latest",
          oxfmt: TOOLING.oxfmt,
          oxlint: TOOLING.oxlint,
          typescript: TOOLING.typescript,
        },
      }),
      "tsconfig.json": bunTsconfig,
      ".oxlintrc.json": oxlintrc(false),
      ".gitignore": gitignore,
      "README.md": readme(name, preset, "bun run dev   # serves on :3000"),
      "src/index.ts": `import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("${name} is running"));
app.get("/health", (c) => c.json({ status: "ok" }));

export default app;
`,
      "src/index.test.ts": `import { expect, test } from "bun:test";
import app from "./index.ts";

test("GET /health", async () => {
  const res = await app.request("/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
`,
    };
  }

  // vite-react
  return {
    "package.json": pkg({
      name,
      type: "module",
      private: true,
      scripts: {
        dev: "vite",
        build: "tsc --noEmit && vite build",
        preview: "vite preview",
        lint: "oxlint",
        typecheck: "tsc --noEmit",
        format: "oxfmt --write .",
        "format:check": "oxfmt --check .",
        check: "oxlint && tsc --noEmit",
      },
      dependencies: { react: "^19", "react-dom": "^19" },
      devDependencies: {
        "@types/node": "^24",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@vitejs/plugin-react": "^4",
        oxfmt: TOOLING.oxfmt,
        oxlint: TOOLING.oxlint,
        typescript: TOOLING.typescript,
        vite: "^6",
      },
    }),
    "tsconfig.json": viteTsconfig,
    ".oxlintrc.json": oxlintrc(true),
    ".gitignore": gitignore,
    "README.md": readme(name, preset, "bun run dev"),
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "vite.config.ts": `import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
});
`,
    "src/vite-env.d.ts": `/// <reference types="vite/client" />
`,
    "src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    "src/App.tsx": `export const App = () => {
  return (
    <main>
      <h1>${name}</h1>
      <p>Vite + React + TypeScript 7, linted by oxlint.</p>
    </main>
  );
};
`,
    "src/index.css": `:root {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
  padding: 2rem;
}
`,
  };
};

// ---------- arg parsing ----------

const argv = Bun.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(`newproj — scaffold a project with the TS7 + oxc toolchain

Usage:
  newproj <name> [--preset <preset>] [--no-git] [--no-install]

Presets:
${PRESETS.map((p) => `  ${p.padEnd(12)} ${PRESET_LABELS[p]}`).join("\n")}
`);
  process.exit(0);
}

const flag = (name: string) => argv.includes(name);
const noGit = flag("--no-git");
const noInstall = flag("--no-install");

const presetFromArgs = (): string | undefined => {
  const i = argv.indexOf("--preset");
  if (i !== -1) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith("--preset="));
  return eq?.split("=")[1];
};

const positional = argv.filter(
  (a, i) => !a.startsWith("-") && argv[i - 1] !== "--preset",
);

let name = positional[0];
if (!name) name = prompt("Project name?")?.trim() || "";
if (!name) {
  console.error("A project name is required.");
  process.exit(1);
}

let preset = presetFromArgs() as Preset | undefined;
if (!preset) {
  console.log("Choose a preset:");
  PRESETS.forEach((p, i) => console.log(`  ${i + 1}) ${PRESET_LABELS[p]}`));
  const answer = prompt("Preset [1-3]?")?.trim() ?? "";
  const byNumber = PRESETS[Number(answer) - 1];
  const byName = (PRESETS as readonly string[]).includes(answer)
    ? (answer as Preset)
    : undefined;
  preset = byNumber ?? byName;
}
if (!preset || !(PRESETS as readonly string[]).includes(preset)) {
  console.error(`Unknown preset. Choose one of: ${PRESETS.join(", ")}`);
  process.exit(1);
}

// ---------- scaffold ----------

const dir = resolve(process.cwd(), name);
if (existsSync(dir)) {
  console.error(`Directory already exists: ${dir}`);
  process.exit(1);
}

console.log(`\n📦 Scaffolding ${name} (${preset})…`);
const tree = files(name, preset);
for (const [rel, content] of Object.entries(tree)) {
  await Bun.write(resolve(dir, rel), content);
}

if (!noGit) {
  await $`git init -q`.cwd(dir).nothrow();
}

if (!noInstall) {
  console.log("📥 Installing dependencies…");
  await $`bun install`.cwd(dir).nothrow();
}

if (!noGit) {
  await $`git add -A`.cwd(dir).nothrow();
  await $`git commit -q -m ${`chore: scaffold ${name} (${preset}) — TS7 + oxc`}`
    .cwd(dir)
    .nothrow();
}

console.log(`\n✅ Done.

  cd ${name}
  bun run dev
  bun run check\n`);
