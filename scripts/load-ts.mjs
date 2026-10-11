// Loads a plain-data TypeScript file from src/ in Node without a build, following its
// "@/lib/..." imports. Used by the catalog generator and the content tests.
import { readFileSync } from "node:fs";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const cache = new Map();

function toDataUrl(path) {
  const hit = cache.get(path);
  if (hit) return hit;
  let src = readFileSync(new URL(path, root), "utf8");
  // Value imports become data: URLs of the compiled dependency. Type-only imports are dropped by TypeScript.
  src = src.replace(/^import\s+(?!type\b)([^;]+?)\s+from\s+"@\/lib\/([^"]+)";?$/gm, (_m, names, dep) => `import ${names} from "${toDataUrl(`src/lib/${dep}.ts`)}";`);
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const url = `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`;
  cache.set(path, url);
  return url;
}

export function loadTs(path) {
  return import(toDataUrl(path));
}
