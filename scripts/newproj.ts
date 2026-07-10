#!/usr/bin/env bun
// Scaffold a new project preconfigured with the TypeScript 7 + oxc toolchain
// (oxlint + oxfmt), a `check` gate, and a starter file + test.
//
//   newproj <name> [--preset bun-lib|hono|vite-react|tanstack-start|astro] [--no-git] [--no-install]
//
// Omit the name or preset and you'll be prompted.

import { $ } from "bun";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Preset = "bun-lib" | "hono" | "vite-react" | "tanstack-start" | "astro";
const PRESETS = ["bun-lib", "hono", "vite-react", "tanstack-start", "astro"] as const;
const PRESET_LABELS: Record<Preset, string> = {
  "bun-lib": "Bun CLI / library (plain Bun + TS7)",
  hono: "Hono API (Hono on Bun)",
  "vite-react": "Vite + React SPA",
  "tanstack-start": "TanStack Start (full-stack React, Vite + Nitro, TS7)",
  astro: "Astro site (astro check, TS5)",
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

const oxlintrc = (opts: { react?: boolean } = {}) => {
  const framework = Boolean(opts.react);
  const plugins = ["import", "typescript"];
  if (framework) plugins.push("react");
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

const pkg = (obj: Record<string, unknown>) => JSON.stringify(obj, null, 2) + "\n";

const CHECK_DESC: Record<Preset, string> = {
  "bun-lib": "oxlint + tsc --noEmit + bun test",
  hono: "oxlint + tsc --noEmit + bun test",
  "vite-react": "oxlint + tsc --noEmit + vitest",
  "tanstack-start": "oxlint + tsc --noEmit + vitest",
  astro: "oxlint + astro check",
};

const TYPECHECK_DESC: Record<Preset, string> = {
  "bun-lib": "TypeScript 7 (`tsc --noEmit`)",
  hono: "TypeScript 7 (`tsc --noEmit`)",
  "vite-react": "TypeScript 7 (`tsc --noEmit`)",
  "tanstack-start": "TypeScript 7 (`tsc --noEmit`) — Vite-native, no embedder caveat",
  astro: "`astro check` on typescript@5 (Volar embeds the TS API — no TS7)",
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

  if (preset === "astro") {
    return {
      "package.json": pkg({
        name,
        type: "module",
        private: true,
        scripts: {
          dev: "astro dev",
          build: "astro build",
          preview: "astro preview",
          lint: "oxlint",
          // astro check embeds the TS API via Volar → typescript@5, not TS7
          typecheck: "astro check",
          format: "oxfmt --write .",
          "format:check": "oxfmt --check .",
          check: "oxlint && astro check",
        },
        dependencies: { astro: "^7" },
        devDependencies: {
          "@astrojs/check": "^0.9.9",
          oxfmt: TOOLING.oxfmt,
          oxlint: TOOLING.oxlint,
          typescript: "^5",
        },
      }),
      // Astro ships tsconfig presets; extend the strict one.
      "tsconfig.json":
        JSON.stringify(
          {
            extends: "astro/tsconfigs/strict",
            include: [".astro/types.d.ts", "**/*"],
            exclude: ["dist"],
          },
          null,
          2,
        ) + "\n",
      "astro.config.ts": `import { defineConfig } from "astro/config";

export default defineConfig({});
`,
      ".oxlintrc.json": oxlintrc(),
      ".gitignore": gitignore + `.astro/\n.output/\n`,
      "README.md": readme(name, preset, "bun run dev"),
      "src/pages/index.astro": `---
const title = "${name}";
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
  </head>
  <body>
    <main>
      <h1>{title}</h1>
      <p>Astro + TypeScript — checked by astro check, linted by oxlint.</p>
    </main>
  </body>
</html>
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
  const answer = prompt("Preset [1-5]?")?.trim() ?? "";
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

// TanStack Start is delegated to the official CLI (its structure evolves and is
// non-trivial), then we overlay the TS7 + oxc toolchain. It's Vite-native, so —
// unlike Next — real typescript@7 works (verified: tsc --noEmit + build clean).
const tssOxlintrc =
  JSON.stringify(
    {
      $schema:
        "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
      plugins: ["import", "typescript", "react"],
      categories: { correctness: "error", suspicious: "warn", perf: "warn" },
      rules: {
        "react/react-in-jsx-scope": "off",
        "import/no-unassigned-import": "off",
      },
      ignorePatterns: [
        "node_modules/",
        "dist/",
        ".output/",
        ".nitro/",
        ".tanstack/",
        "src/routeTree.gen.ts",
        "**/*.d.ts",
      ],
    },
    null,
    2,
  ) + "\n";

const scaffoldTanstackStart = async (projName: string, projDir: string) => {
  console.log("📥 Running the official TanStack Start scaffold…");
  await $`bunx @tanstack/cli@latest create ${projName} -y`.nothrow();

  // Overlay: TS7 + oxc on top of the official scaffold (which ships TS ~6 + vitest).
  const pkgPath = resolve(projDir, "package.json");
  const p = JSON.parse(await Bun.file(pkgPath).text());
  p.devDependencies = p.devDependencies ?? {};
  p.devDependencies.typescript = "^7.0.0";
  p.devDependencies.oxlint = TOOLING.oxlint;
  p.devDependencies.oxfmt = TOOLING.oxfmt;
  p.scripts = p.scripts ?? {};
  p.scripts.lint = "oxlint";
  p.scripts.typecheck = "tsc --noEmit";
  p.scripts.format = "oxfmt --write .";
  p.scripts["format:check"] = "oxfmt --check .";
  p.scripts.check = "oxlint && tsc --noEmit && vitest run";
  await Bun.write(pkgPath, JSON.stringify(p, null, 2) + "\n");
  await Bun.write(resolve(projDir, ".oxlintrc.json"), tssOxlintrc);
  // A sample test so the scaffold's vitest (and `check`) has something to run.
  await Bun.write(
    resolve(projDir, "src/smoke.test.ts"),
    `import { expect, test } from "vitest";\n\ntest("smoke", () => {\n  expect(1 + 1).toBe(2);\n});\n`,
  );
  await $`rm -f ${resolve(projDir, ".cta.json")}`.nothrow(); // create-tool metadata

  console.log("📥 Installing toolchain overlay…");
  await $`bun install`.cwd(projDir).nothrow();
  await $`bun run format`.cwd(projDir).nothrow();
};

const dir = resolve(process.cwd(), name);
if (existsSync(dir)) {
  console.error(`Directory already exists: ${dir}`);
  process.exit(1);
}

console.log(`\n📦 Scaffolding ${name} (${preset})…`);

if (preset === "tanstack-start") {
  await scaffoldTanstackStart(name, dir);
} else {
  const tree = files(name, preset);
  for (const [rel, content] of Object.entries(tree)) {
    await Bun.write(resolve(dir, rel), content);
  }
  if (!noInstall) {
    console.log("📥 Installing dependencies…");
    await $`bun install`.cwd(dir).nothrow();
    // Format the freshly-written files to the current oxfmt style, so a fresh
    // scaffold is oxfmt-clean regardless of template/formatter drift.
    await $`bun run format`.cwd(dir).nothrow();
  }
}

if (!noGit) {
  await $`git init -q`.cwd(dir).nothrow();
  await $`git add -A`.cwd(dir).nothrow();
  await $`git commit -q -m ${`chore: scaffold ${name} (${preset}) — TS7 + oxc`}`
    .cwd(dir)
    .nothrow();
}

console.log(`\n✅ Done.

  cd ${name}
  bun run dev
  bun run check\n`);
