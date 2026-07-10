#!/usr/bin/env bun
// Scaffold a new project preconfigured with the TypeScript 7 + oxc toolchain
// (oxlint + oxfmt), a `check` gate, and a starter file + test.
//
//   newproj <name> [--preset bun-lib|hono|vite-react|next] [--no-git] [--no-install]
//
// Omit the name or preset and you'll be prompted.

import { $ } from "bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Preset = "bun-lib" | "hono" | "vite-react" | "next";
const PRESETS = ["bun-lib", "hono", "vite-react", "next"] as const;
const PRESET_LABELS: Record<Preset, string> = {
  "bun-lib": "Bun CLI / library (plain Bun + TS7)",
  hono: "Hono API (Hono on Bun)",
  "vite-react": "Vite + React SPA",
  next: "Next.js app (React 19, tsgo typecheck)",
};

const TOOLING = {
  typescript: "^7.0.0",
  oxlint: "^1.73.0",
  oxfmt: "^0.58.0",
} as const;

// Shared test-runner deps for the non-Bun presets (vite-react, next).
const VITEST_DEPS = {
  "@testing-library/dom": "^10",
  "@testing-library/react": "^16",
  jsdom: "^29",
  vitest: "^4",
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

const oxlintrc = (opts: { react?: boolean; next?: boolean } = {}) => {
  const framework = Boolean(opts.react || opts.next);
  const plugins = ["import", "typescript"];
  if (framework) plugins.push("react");
  if (opts.next) plugins.push("nextjs");
  return (
    JSON.stringify(
      {
        $schema:
          "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
        plugins,
        categories: { correctness: "error", suspicious: "warn", perf: "warn" },
        ...(framework
          ? {
              rules: {
                "react/react-in-jsx-scope": "off",
                // side-effect CSS imports (import "./globals.css")
                "import/no-unassigned-import": "off",
              },
            }
          : {}),
        ignorePatterns: ["node_modules/", "dist/", ".next/", "**/*.d.ts"],
      },
      null,
      2,
    ) + "\n"
  );
};

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

// Next.js: TS7 breaks `next build` (it probes the removed legacy TS API), so we
// keep typescript@5 for the build and type-check with tsgo (the TS7 engine).
const nextTsconfig =
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        // No baseUrl — removed in TS7; explicit relative paths resolve fine.
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  ) + "\n";

const nextGitignore = gitignore + `.next/\n/out/\nnext-env.d.ts\n.vercel\n`;

const pkg = (obj: Record<string, unknown>) => JSON.stringify(obj, null, 2) + "\n";

const CHECK_DESC: Record<Preset, string> = {
  "bun-lib": "oxlint + tsc --noEmit + bun test",
  hono: "oxlint + tsc --noEmit + bun test",
  "vite-react": "oxlint + tsc --noEmit + vitest",
  next: "oxlint + tsgo --noEmit + vitest",
};

const TYPECHECK_DESC: Record<Preset, string> = {
  "bun-lib": "TypeScript 7 (`tsc --noEmit`)",
  hono: "TypeScript 7 (`tsc --noEmit`)",
  "vite-react": "TypeScript 7 (`tsc --noEmit`)",
  next: "TypeScript 7 via `tsgo` (typescript@5 kept for `next build`)",
};

const readme = (name: string, preset: Preset, run: string) =>
  `# ${name}

Scaffolded with the TypeScript 7 + oxc toolchain (\`${preset}\`).

\`\`\`sh
bun install
${run}
bun run check   # ${CHECK_DESC[preset]}
\`\`\`

- **Type-check:** ${TYPECHECK_DESC[preset]}
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
      ".oxlintrc.json": oxlintrc(),
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
      ".oxlintrc.json": oxlintrc(),
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

  if (preset === "next") {
    return {
      "package.json": pkg({
        name,
        private: true,
        scripts: {
          dev: "next dev --turbopack",
          build: "next build",
          start: "next start",
          lint: "oxlint",
          typecheck: "tsgo --noEmit",
          test: "vitest run",
          format: "oxfmt --write .",
          "format:check": "oxfmt --check .",
          check: "oxlint && tsgo --noEmit && vitest run",
        },
        dependencies: { next: "^16", react: "^19", "react-dom": "^19" },
        devDependencies: {
          "@types/node": "^24",
          "@types/react": "^19",
          "@types/react-dom": "^19",
          // tsgo = the TS7 engine, run alongside typescript@5 (next build needs it)
          "@typescript/native-preview": "latest",
          // @vitejs/plugin-react lets vitest transform JSX (Next doesn't use Vite)
          "@vitejs/plugin-react": "^6",
          oxfmt: TOOLING.oxfmt,
          oxlint: TOOLING.oxlint,
          typescript: "^5",
          ...VITEST_DEPS,
        },
      }),
      "tsconfig.json": nextTsconfig,
      "next.config.ts": `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`,
      ".oxlintrc.json": oxlintrc({ next: true }),
      ".gitignore": nextGitignore,
      "README.md": readme(name, preset, "bun run dev"),
      "vitest.config.ts": `import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom" },
});
`,
      "app/page.test.tsx": `import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("renders the project heading", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { name: "${name}" })).toBeDefined();
});
`,
      // ambient decl so tsgo matches Turbopack's CSS handling
      "types/css.d.ts": `declare module "*.css";\n`,
      "next-env.d.ts": `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited. Next regenerates it.
`,
      "app/globals.css": `:root {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
  padding: 2rem;
}
`,
      "app/layout.tsx": `import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "${name}",
  description: "Next.js + TypeScript 7 (tsgo) + oxc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`,
      "app/page.tsx": `export default function Home() {
  return (
    <main>
      <h1>${name}</h1>
      <p>Next.js + React 19 — type-checked by tsgo (TS7), linted by oxlint.</p>
    </main>
  );
}
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
        test: "vitest run",
        format: "oxfmt --write .",
        "format:check": "oxfmt --check .",
        check: "oxlint && tsc --noEmit && vitest run",
      },
      dependencies: { react: "^19", "react-dom": "^19" },
      devDependencies: {
        "@types/node": "^24",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@vitejs/plugin-react": "^6",
        oxfmt: TOOLING.oxfmt,
        oxlint: TOOLING.oxlint,
        typescript: TOOLING.typescript,
        vite: "^8",
        ...VITEST_DEPS,
      },
    }),
    "tsconfig.json": viteTsconfig,
    ".oxlintrc.json": oxlintrc({ react: true }),
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
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  test: { environment: "jsdom" },
});
`,
    "src/App.test.tsx": `import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "@/App";

test("renders the project heading", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "${name}" })).toBeDefined();
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
  const answer = prompt("Preset [1-4]?")?.trim() ?? "";
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
