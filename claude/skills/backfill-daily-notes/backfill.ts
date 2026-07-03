#!/usr/bin/env node
/**
 * Backfill missing Obsidian daily notes and link them into the
 * yesterday/tomorrow chain.
 *
 * Reads the vault's own daily-notes config (.obsidian/daily-notes.json)
 * and the Templater template it points to, renders the tp.* placeholders
 * for each missing past date, and writes the note next to its neighbors.
 *
 * Runs directly on Node >= 23.6 (native type stripping):
 *   node backfill.ts            # dry run: list what would be created
 *   node backfill.ts --write    # actually create the notes
 *   node backfill.ts --write --mark      # set `type: backfill` on created notes
 *   node backfill.ts --from 2023-01-01   # override start of range
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

interface DailyNotesConfig {
  folder: string;
  template: string;
}

const VAULT = join(process.env.HOME ?? "", "personal/obsidian/second-brain");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const MARK = args.includes("--mark");
const fromArg = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;

const dailyConfig: DailyNotesConfig = JSON.parse(
  readFileSync(join(VAULT, ".obsidian/daily-notes.json"), "utf8"),
);
const PLANNER = join(VAULT, dailyConfig.folder);
const template = readFileSync(
  join(VAULT, dailyConfig.template.replace(/\.md$/, "") + ".md"),
  "utf8",
);

// ---- date helpers (all in local time, dates only) ----

const iso = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const parseIso = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayOfYear = (d: Date): number =>
  Math.round((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86_400_000) + 1;

// Minimal moment-style formatter covering the tokens the template uses.
const formatDate = (d: Date, fmt: string): string => {
  const tokens: Record<string, () => string> = {
    YYYY: () => String(d.getFullYear()),
    YY: () => String(d.getFullYear()).slice(-2),
    MMM: () => MONTHS[d.getMonth()],
    MM: () => String(d.getMonth() + 1).padStart(2, "0"),
    dddd: () => WEEKDAYS[d.getDay()],
    DDD: () => String(dayOfYear(d)),
    DD: () => String(d.getDate()).padStart(2, "0"),
    Q: () => String(Math.floor(d.getMonth() / 3) + 1),
  };
  return fmt.replace(/\[([^\]]*)\]|YYYY|dddd|DDD|MMM|MM|YY|DD|Q/g, (match, literal) =>
    literal !== undefined ? literal : tokens[match](),
  );
};

// ---- render the Templater template for a given date ----

const renderTemplate = (d: Date): string => {
  let out = template.replace(/<%\s*(tp\.[^%]*?)\s*%>/g, (whole, expr: string) => {
    let m: RegExpMatchArray | null;
    if ((m = expr.match(/^tp\.file\.creation_date\(\s*"([^"]*)"\s*\)$/))) return formatDate(d, m[1]);
    if (expr === "tp.file.creation_date()") return `${iso(d)} 00:00`;
    if ((m = expr.match(/^tp\.date\.yesterday\(\s*"([^"]*)"\s*\)$/))) return formatDate(addDays(d, -1), m[1]);
    if ((m = expr.match(/^tp\.date\.tomorrow\(\s*"([^"]*)"\s*\)$/))) return formatDate(addDays(d, 1), m[1]);
    console.error(`warning: unsupported template expression left as-is: ${whole}`);
    return whole;
  });
  if (MARK) out = out.replace(/^type:\s*$/m, "type: backfill");
  return out;
};

// ---- find existing daily notes ----

const DAILY_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;
const existing = new Map<string, string>(); // iso date -> directory the note lives in

const scan = (dir: string): void => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) scan(full);
    else if (DAILY_RE.test(entry)) existing.set(entry.slice(0, 10), dir);
  }
};
scan(PLANNER);

if (existing.size === 0) {
  console.error("No existing daily notes found — refusing to guess a start date.");
  process.exit(1);
}

const allDates = [...existing.keys()].sort();
const start = parseIso(fromArg ?? allDates[0]);
const today = new Date();

// A missing note goes where its nearest earlier neighbor lives, so it
// follows the vault's convention of archiving past years into subfolders.
const dirForDate = (d: Date): string => {
  for (let back = 1; back <= 366; back++) {
    const neighbor = existing.get(iso(addDays(d, -back)));
    if (neighbor) return neighbor;
  }
  return PLANNER;
};

// ---- main ----

const missing: Date[] = [];
for (let d = start; d <= today; d = addDays(d, 1)) {
  if (!existing.has(iso(d))) missing.push(new Date(d));
}

if (missing.length === 0) {
  console.log(`No gaps: every day from ${iso(start)} to ${iso(today)} has a note.`);
  process.exit(0);
}

console.log(`${missing.length} missing daily note(s) between ${iso(start)} and ${iso(today)}:\n`);
for (const d of missing) {
  const dir = dirForDate(d);
  const path = join(dir, `${iso(d)}.md`);
  if (WRITE) {
    if (existsSync(path)) {
      console.log(`  skip   ${path} (already exists)`);
      continue;
    }
    writeFileSync(path, renderTemplate(d), { flag: "wx" });
    console.log(`  created ${path.replace(VAULT + "/", "")}`);
  } else {
    console.log(`  would create ${path.replace(VAULT + "/", "")}`);
  }
}

if (!WRITE) console.log(`\nDry run. Re-run with --write to create these notes.`);
