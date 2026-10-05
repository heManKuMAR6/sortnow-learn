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
const { starterJobs } = await load("src/lib/jobs.ts");
const LESSON_POINTS = 5;

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
// position keeps the database in step with the order in challenges.ts, so the "daily"
// challenge (which moves the streak) is the same one the site features.
const catalog = [
  ...lessons.map((l, i) => `  ('lesson', ${q(l.slug)}, ${LESSON_POINTS}, ${i})`),
  ...challenges.map((c, i) => `  ('challenge', ${q(c.slug)}, ${c.points}, ${i})`),
];
const answers = challenges.flatMap((c) => c.questions.map((qn, i) => `  (${q(c.slug)}, ${i}, ${qn.answer})`));

const block = [
  "-- BEGIN GENERATED CATALOG (run: npm run gen:catalog; do not edit by hand)",
  "insert into public.award_catalog (kind, ref, points, position) values",
  catalog.join(",\n"),
  "on conflict (kind, ref) do update set points = excluded.points, position = excluded.position;",
  "",
  "insert into public.challenge_answers (slug, idx, answer) values",
  answers.join(",\n"),
  "on conflict (slug, idx) do update set answer = excluded.answer;",
  "-- END GENERATED CATALOG",
].join("\n");

const arr = (a) => `array[${a.map(q).join(", ")}]::text[]`;
const jobRows = starterJobs.map(
  (j) =>
    `  (${q(j.slug)}, ${q(j.title)}, ${j.company ? q(j.company) : "null"}, ${q(j.location)}, ${q(j.mode)}, ${q(j.level)}, null, date ${q(j.posted)}, ${q(j.summary)}, ${arr(j.about)}, ${arr(j.responsibilities)}, ${arr(j.requirements)}, ${arr(j.niceToHave)}, ${arr(j.benefits)}, ${arr(j.skills)}, 'open')`,
);
const jobsBlock = [
  "-- BEGIN GENERATED JOBS (run: npm run gen:catalog; do not edit by hand)",
  "-- Starter listings. Existing rows keep any edit made in /admin/jobs; a role's description is",
  "-- filled in here only while its responsibilities are still empty.",
  "insert into public.jobs (slug, title, company, location, mode, level, type, posted, summary, about, responsibilities, requirements, nice_to_have, benefits, skills, status) values",
  jobRows.join(",\n"),
  "on conflict (slug) do update set",
  "  about = case when public.jobs.responsibilities = '{}' then excluded.about else public.jobs.about end,",
  "  requirements = case when public.jobs.responsibilities = '{}' then excluded.requirements else public.jobs.requirements end,",
  "  nice_to_have = case when public.jobs.responsibilities = '{}' then excluded.nice_to_have else public.jobs.nice_to_have end,",
  "  responsibilities = case when public.jobs.responsibilities = '{}' then excluded.responsibilities else public.jobs.responsibilities end;",
  "-- END GENERATED JOBS",
].join("\n");

const file = new URL("../supabase/schema.sql", import.meta.url);
const sql = readFileSync(file, "utf8");
const next = sql
  .replace(/-- BEGIN GENERATED CATALOG[\s\S]*?-- END GENERATED CATALOG/, block)
  .replace(/-- BEGIN GENERATED JOBS[\s\S]*?-- END GENERATED JOBS/, jobsBlock);
if (next === sql && !sql.includes(block)) {
  console.error("Could not find the generated catalog markers in supabase/schema.sql");
  process.exit(1);
}
writeFileSync(file, next);
console.log(`catalog: ${lessons.length} lessons, ${challenges.length} challenges, ${answers.length} answers`);
