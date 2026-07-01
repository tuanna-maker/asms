/**
 * Orchestrator: chạy toàn bộ audit UC + validation + lỗi HTTP.
 * Chạy: node scripts/uc-full-audit.mjs
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const steps = [
  { id: "uc-smoke", script: "uc-smoke-test.mjs", report: "uc-smoke-report.json" },
  { id: "uc-by-role", script: "uc-smoke-by-role.mjs", report: "uc-smoke-by-role-report.json" },
  { id: "crud-validation", script: "crud-validation-test.mjs", report: "crud-validation-report.json" },
  { id: "api-error-audit", script: "api-error-audit.mjs", report: "api-error-audit-report.json" },
  { id: "dashboard-audit", script: "dashboard-audit.mjs", report: null },
];

const stepResults = [];
let anyFail = false;

for (const step of steps) {
  console.log(`\n=== ${step.id} ===`);
  const r = spawnSync("node", [`scripts/${step.script}`], { cwd: root, stdio: "inherit", shell: false });
  const exitCode = r.status ?? 1;
  let summary = null;
  if (step.report) {
    const p = resolve(__dirname, step.report);
    if (existsSync(p)) {
      try {
        summary = JSON.parse(readFileSync(p, "utf8")).summary ?? null;
      } catch { /* ignore */ }
    }
  }
  stepResults.push({ id: step.id, exitCode, summary });
  if (exitCode !== 0) anyFail = true;
}

// Regenerate matrix from latest uc-smoke report
spawnSync("node", ["scripts/generate-uc-test-matrix.mjs"], { cwd: root, stdio: "inherit" });

const fullReport = {
  testedAt: new Date().toISOString(),
  pass: !anyFail,
  steps: stepResults,
};

writeFileSync(resolve(__dirname, "uc-full-audit-report.json"), JSON.stringify(fullReport, null, 2));
console.log("\n", JSON.stringify(fullReport, null, 2));
process.exit(anyFail ? 1 : 0);
