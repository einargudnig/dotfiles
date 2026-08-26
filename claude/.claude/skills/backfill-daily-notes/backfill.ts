#!/usr/bin/env node
/**
 * Backfill missing Obsidian periodic notes (daily, weekly, monthly) and
 * link them into the vault's navigation chains.
 *
 * Reads the vault's own config (.obsidian/daily-notes.json and
 * .obsidian/plugins/periodic-notes/data.json) and the templates they point
 * to, renders Templater tp.* placeholders for each missing past period, and
 * writes the note next to its neighbors (year subfolders for archived years,
 * folder root for the current one).
 *
 * Linking: daily notes carry yesterday/tomorrow wikilinks via the template;
 * backfilled weekly notes link their 7 daily notes under the weekday
 * headings; backfilled monthly notes link their ISO weeks under the
 * `## Week N` headings.
 *
 * Runs directly on Node >= 23.6 (native type stripping):
 *   node backfill.ts                    # dry run, all note types
 *   node backfill.ts --type weekly      # only one type (daily|weekly|monthly)
 *   node backfill.ts --write            # actually create the notes
 *   node backfill.ts --write --mark     # set `type: backfill` on daily notes
 *   node backfill.ts --from 2023-01-01  # override start of range
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const VAULT = join(process.env.HOME ?? "", "personal/obsidian/second-brain");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const MARK = args.includes("--mark");
const fromArg = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;
const typeArg = args.includes("--type") ? args[args.indexOf("--type") + 1] : "all";

// Plugin configs sometimes hold stale template paths (missing the "50 "
// folder prefix) — resolve against what actually exists on disk.
const resolveVaultPath = (rel: string): string => {
  for (const candidate of [rel, `50 ${rel}`]) {
    const full = join(VAULT, candidate);
    if (existsSync(full)) return full;
  }
  throw new Error(`cannot resolve vault path: ${rel}`);
};

// ---- date helpers (all in local time, dates only) ----

const pad = (n: number): string => String(n).padStart(2, "0");
const iso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d ?? 1);
};
const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayOfYear = (d: Date): number =>
  Math.round((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86_400_000) + 1;

// ISO-8601 week: the week containing Thursday determines year and number.
const isoWeekKey = (d: Date): string => {
  const thursday = addDays(d, 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(thursday.getFullYear(), 0, 4);
  const week =
    1 + Math.round(((thursday.getTime() - week1.getTime()) / 86_400_000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${thursday.getFullYear()}-W${pad(week)}`;
};
const mondayOfWeekKey = (key: string): Date => {
  const [y, w] = key.split("-W").map(Number);
  const jan4 = new Date(y, 0, 4);
  const firstMonday = addDays(jan4, -((jan4.getDay() + 6) % 7));
  return addDays(firstMonday, (w - 1) * 7);
};

// Minimal moment-style formatter covering the tokens the templates use.
const formatDate = (d: Date, fmt: string): string => {
  const tokens: Record<string, () => string> = {
    YYYY: () => String(d.getFullYear()),
    YY: () => String(d.getFullYear()).slice(-2),
    MMM: () => MONTHS[d.getMonth()],
    MM: () => pad(d.getMonth() + 1),
    dddd: () => WEEKDAYS[d.getDay()],
    DDD: () => String(dayOfYear(d)),
    DD: () => pad(d.getDate()),
    Q: () => String(Math.floor(d.getMonth() / 3) + 1),
  };
  return fmt.replace(/\[([^\]]*)\]|YYYY|dddd|DDD|MMM|MM|YY|DD|Q/g, (match, literal) =>
    literal !== undefined ? literal : tokens[match](),
  );
};

// ---- Templater rendering, anchored to the period's date ----

const renderTemplate = (template: string, d: Date): string =>
  template.replace(/<%\s*(tp\.[^%]*?)\s*%>/g, (whole, expr: string) => {
    let m: RegExpMatchArray | null;
    if ((m = expr.match(/^tp\.file\.creation_date\(\s*"([^"]*)"\s*\)$/))) return formatDate(d, m[1]);
    if (expr === "tp.file.creation_date()") return `${iso(d)} 00:00`;
    if ((m = expr.match(/^tp\.date\.yesterday\(\s*"([^"]*)"\s*\)$/))) return formatDate(addDays(d, -1), m[1]);
    if ((m = expr.match(/^tp\.date\.tomorrow\(\s*"([^"]*)"\s*\)$/))) return formatDate(addDays(d, 1), m[1]);
    console.error(`warning: unsupported template expression left as-is: ${whole}`);
    return whole;
  });

// ---- period definitions ----

interface Period {
  name: string;
  folder: string;
  template: string;
  fileRe: RegExp;
  /** every key from `startKey` up to today, in order */
  allKeys: (startKey: string, today: Date) => string[];
  /** the date tp.* placeholders render against */
  anchor: (key: string) => Date;
  /** add the period's outbound wikilinks */
  enrich: (content: string, key: string) => string;
}

const dailyConfig = JSON.parse(readFileSync(join(VAULT, ".obsidian/daily-notes.json"), "utf8"));
const periodicConfig = JSON.parse(
  readFileSync(join(VAULT, ".obsidian/plugins/periodic-notes/data.json"), "utf8"),
);

const daily: Period = {
  name: "daily",
  folder: join(VAULT, dailyConfig.folder),
  template: resolveVaultPath(dailyConfig.template),
  fileRe: /^\d{4}-\d{2}-\d{2}\.md$/,
  allKeys: (startKey, today) => {
    const keys: string[] = [];
    for (let d = parseIso(startKey); d <= today; d = addDays(d, 1)) keys.push(iso(d));
    return keys;
  },
  anchor: parseIso,
  enrich: (content) =>
    MARK ? content.replace(/^tags:/m, "type: backfill\ntags:") : content,
};

const weekly: Period = {
  name: "weekly",
  folder: join(VAULT, periodicConfig.weekly.folder),
  template: resolveVaultPath(periodicConfig.weekly.template),
  fileRe: /^\d{4}-W\d{2}\.md$/,
  allKeys: (startKey, today) => {
    const keys: string[] = [];
    for (let d = mondayOfWeekKey(startKey); d <= today; d = addDays(d, 7)) keys.push(isoWeekKey(d));
    return keys;
  },
  anchor: mondayOfWeekKey,
  enrich: (content, key) => {
    const monday = mondayOfWeekKey(key);
    const linked = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].reduce(
      (out, day, i) =>
        out.replace(new RegExp(`^## ${day}$`, "m"), `## ${day}\n\n[[${iso(addDays(monday, i))}]]`),
      content,
    );
    return linked.replace(
      /^## Weekend$/m,
      `## Weekend\n\n[[${iso(addDays(monday, 5))}]] · [[${iso(addDays(monday, 6))}]]`,
    );
  },
};

const monthly: Period = {
  name: "monthly",
  folder: join(VAULT, periodicConfig.monthly.folder),
  template: resolveVaultPath(periodicConfig.monthly.template),
  fileRe: /^\d{4}-\d{2}\.md$/,
  allKeys: (startKey, today) => {
    const keys: string[] = [];
    let [y, m] = startKey.split("-").map(Number);
    while (y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth() + 1)) {
      keys.push(`${y}-${pad(m)}`);
      if (++m > 12) { m = 1; y++; }
    }
    return keys;
  },
  anchor: parseIso,
  enrich: (content, key) => {
    const [y, m] = key.split("-").map(Number);
    const weeks: string[] = [];
    for (let d = new Date(y, m - 1, 1); d.getMonth() === m - 1; d = addDays(d, 1)) {
      const wk = isoWeekKey(d);
      if (weeks.at(-1) !== wk) weeks.push(wk);
    }
    let out = content;
    weeks.forEach((wk, i) => {
      const heading = `## Week ${i + 1}`;
      if (out.includes(heading)) {
        out = out.replace(heading, `${heading}\n\n[[${wk}]]`);
      } else {
        // months spanning 5-6 ISO weeks outgrow the template's 4 headings
        const section = `${heading}\n\n[[${wk}]]\n\n`;
        out = out.includes("## Review") ? out.replace("## Review", section + "## Review") : out + "\n" + section;
      }
    });
    return out;
  },
};

// ---- generic backfill engine ----

const scan = (dir: string, fileRe: RegExp): Map<string, string> => {
  const found = new Map<string, string>(); // key -> directory the note lives in
  const walk = (d: string): void => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (fileRe.test(entry)) found.set(entry.replace(/\.md$/, ""), d);
    }
  };
  walk(dir);
  return found;
};

const backfill = (p: Period): number => {
  const existing = scan(p.folder, p.fileRe);
  if (existing.size === 0) {
    console.error(`${p.name}: no existing notes found — refusing to guess a start; skipping.`);
    return 0;
  }
  // scanning the shared planner root also matches weekly/monthly subfolders'
  // parents for daily — but the fileRe keeps each period to its own naming
  const startKey = [...existing.keys()].sort()[0];
  const today = new Date();
  const keys = p.allKeys(startKey, today).filter(
    (k) => !fromArg || p.anchor(k) >= parseIso(fromArg),
  );
  const missing = keys.filter((k) => !existing.has(k));

  if (missing.length === 0) {
    console.log(`${p.name}: no gaps between ${startKey} and today.`);
    return 0;
  }

  const template = readFileSync(p.template, "utf8");
  console.log(`${p.name}: ${missing.length} missing note(s):`);
  for (const key of missing) {
    // vault convention: archived years live in a year subfolder, the
    // current year at the folder root
    const yearDir = join(p.folder, key.slice(0, 4));
    const dir = existsSync(yearDir) ? yearDir : p.folder;
    const path = join(dir, `${key}.md`);
    if (!WRITE) {
      console.log(`  would create ${path.replace(VAULT + "/", "")}`);
      continue;
    }
    if (existsSync(path)) {
      console.log(`  skip    ${path} (already exists)`);
      continue;
    }
    writeFileSync(path, p.enrich(renderTemplate(template, p.anchor(key)), key), { flag: "wx" });
    console.log(`  created ${path.replace(VAULT + "/", "")}`);
  }
  return missing.length;
};

// ---- main ----

const periods = { daily, weekly, monthly };
const selected =
  typeArg === "all" ? Object.values(periods) : [periods[typeArg as keyof typeof periods]];
if (selected.some((p) => !p)) {
  console.error(`unknown --type "${typeArg}" (expected daily, weekly, monthly, or all)`);
  process.exit(1);
}

let total = 0;
for (const p of selected) total += backfill(p);
if (total > 0 && !WRITE) console.log(`\nDry run. Re-run with --write to create these notes.`);
