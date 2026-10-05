// Regenerates the award catalog and challenge answers inside supabase/schema.sql
// from src/lib/challenges.ts and src/lib/content.ts, so the database grades and pays
// from the same content the site shows. Run after editing either file:
//   npm run gen:catalog
// then paste supabase/schema.sql into the Supabase SQL editor again.
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const strip = (src) => src.replace(/^import .*$/gm, "");

// The content files are plain data. Evaluate them with their TypeScript types removed.
async function load(path) {
  const { transform } = await import("node:module").then((m) => m);
  void transform;
  const ts = await import("typescript").then((m) => m.default ?? m);
  const js = ts.transpileModule(strip(read(path)), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}

const { challenges } = await load("src/lib/challenges.ts");
const { lessons } = await load("src/lib/content.ts");
const LESSON_POINTS = 5;

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const catalog = [
  ...lessons.map((l) => `  ('lesson', ${q(l.slug)}, ${LESSON_POINTS})`),
  ...challenges.map((c) => `  ('challenge', ${q(c.slug)}, ${c.points})`),
];
const answers = challenges.flatMap((c) => c.questions.map((qn, i) => `  (${q(c.slug)}, ${i}, ${qn.answer})`));

const block = [
  "-- BEGIN GENERATED CATALOG (run: npm run gen:catalog; do not edit by hand)",
  "insert into public.award_catalog (kind, ref, points) values",
  catalog.join(",\n"),
  "on conflict (kind, ref) do update set points = excluded.points;",
  "",
  "insert into public.challenge_answers (slug, idx, answer) values",
  answers.join(",\n"),
  "on conflict (slug, idx) do update set answer = excluded.answer;",
  "-- END GENERATED CATALOG",
].join("\n");

const file = new URL("../supabase/schema.sql", import.meta.url);
const sql = readFileSync(file, "utf8");
const next = sql.replace(/-- BEGIN GENERATED CATALOG[\s\S]*?-- END GENERATED CATALOG/, block);
if (next === sql && !sql.includes(block)) {
  console.error("Could not find the generated catalog markers in supabase/schema.sql");
  process.exit(1);
}
writeFileSync(file, next);
console.log(`catalog: ${lessons.length} lessons, ${challenges.length} challenges, ${answers.length} answers`);
