// Renders the logo intro to PNG frames, then encodes them with ffmpeg (see ../README.md).
//   node brand/video/source/render.mjs <land|vert> <light|dark> <0|1 transparent> <outDir>
import { chromium } from "playwright";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , orient = "land", theme = "light", alpha = "0", outDir = "frames"] = process.argv;
const here = path.dirname(fileURLToPath(import.meta.url));
const fontDir = path.dirname(createRequire(import.meta.url).resolve("@fontsource/outfit/package.json")) + "/files";
const html = readFileSync(path.join(here, "intro.html"), "utf8").replaceAll("FONTDIR", fontDir);
const page = path.join(here, ".intro.render.html");
writeFileSync(page, html);

const size = orient === "vert" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
await p.goto(`file://${page}?o=${orient}&theme=${theme}&alpha=${alpha}`);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const fps = 30;
const duration = await p.evaluate(() => window.DURATION);
const n = process.env.FRAMES ? Number(process.env.FRAMES) : Math.round(fps * duration);
for (let i = 0; i < n; i++) {
  await p.evaluate((t) => window.setT(t), (i * (fps * duration)) / n / fps);
  await p.locator("#stage").screenshot({ path: `${outDir}/f${String(i).padStart(4, "0")}.png`, omitBackground: alpha === "1" });
}
await browser.close();
rmSync(page, { force: true });
console.log(`${orient}-${theme}-alpha${alpha}: ${n} frames in ${outDir}`);
