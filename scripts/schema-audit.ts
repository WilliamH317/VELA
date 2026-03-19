/**
 * Schema Audit Script — Encodes Day 18 lessons as machine-checkable invariants.
 *
 * Run: npx tsx scripts/schema-audit.ts
 * Exit code: 0 if all pass, 1 if any fail.
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT, "convex", "schema.ts");
const LAMINAR_DIR = path.join(ROOT, "convex", "laminar");

const PURE_FILES = [
  "tfidf.ts",
  "kmeans.ts",
  "confidence.ts",
  "pipeline.ts",
  "processors.ts",
];

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function readLaminarFiles(): Map<string, string> {
  const files = new Map<string, string>();
  if (!fs.existsSync(LAMINAR_DIR)) return files;
  for (const file of fs.readdirSync(LAMINAR_DIR)) {
    if (file.endsWith(".ts") && !file.endsWith(".test.ts")) {
      const fullPath = path.join(LAMINAR_DIR, file);
      if (fs.statSync(fullPath).isFile()) {
        files.set(file, readFile(fullPath));
      }
    }
  }
  return files;
}

interface Check {
  name: string;
  test: () => boolean;
}

const schema = readFile(SCHEMA_PATH);
const laminarFiles = readLaminarFiles();

const checks: Check[] = [
  {
    name: "1. clusteringRuns uses 'startedAt' (not createdAt)",
    test: () => schema.includes("startedAt"),
  },
  {
    name: "2. clusters uses 'topKeywords' (not topTerms)",
    test: () => schema.includes("topKeywords"),
  },
  {
    name: '3. Status literals: "completed" and "failed" present',
    test: () =>
      schema.includes('"completed"') && schema.includes('"failed"'),
  },
  {
    name: "4. Table name is 'knowledgeEdges' (not bare 'edges')",
    test: () => schema.includes("knowledgeEdges"),
  },
  {
    name: "5. tfidf.ts has zero Convex imports",
    test: () => {
      const content = laminarFiles.get("tfidf.ts");
      if (!content) return false;
      return !content.match(/from ["']convex\//) && !content.match(/from ["']\.\.?\/_generated\//);
    },
  },
  {
    name: "6. kmeans.ts has zero Convex imports",
    test: () => {
      const content = laminarFiles.get("kmeans.ts");
      if (!content) return false;
      return !content.match(/from ["']convex\//) && !content.match(/from ["']\.\.?\/_generated\//);
    },
  },
  {
    name: "7. confidence.ts has zero Convex imports",
    test: () => {
      const content = laminarFiles.get("confidence.ts");
      if (!content) return false;
      return !content.match(/from ["']convex\//) && !content.match(/from ["']\.\.?\/_generated\//);
    },
  },
  {
    name: "8. pipeline.ts has zero Convex imports",
    test: () => {
      const content = laminarFiles.get("pipeline.ts");
      if (!content) return false;
      return !content.match(/from ["']convex\//) && !content.match(/from ["']\.\.?\/_generated\//);
    },
  },
  {
    name: '9. No laminar/*.ts file contains ctx.db.query("documents")',
    test: () => {
      for (const [filename, content] of laminarFiles) {
        // Skip comments — check for actual code usage
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
          if (line.includes('ctx.db.query("documents")')) {
            console.log(`    Found in ${filename}`);
            return false;
          }
        }
      }
      return true;
    },
  },
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  const result = check.test();
  const status = result ? "PASS" : "FAIL";
  console.log(`  [${status}] ${check.name}`);
  if (result) passed++;
  else failed++;
}

console.log(`\nSchema audit: ${passed}/${checks.length} checks passed`);
process.exit(failed > 0 ? 1 : 0);
