/**
 * Post-deploy smoke: UAT roles + UC smoke + dashboard audit.
 * Chạy: node scripts/post-deploy-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const steps = [
  { name: "e2e-smoke", cmd: "node", args: ["scripts/e2e-smoke.mjs"] },
  { name: "uat-role-smoke", cmd: "node", args: ["scripts/uat-role-smoke.mjs"] },
  { name: "uc-smoke-test", cmd: "node", args: ["scripts/uc-smoke-test.mjs"] },
  { name: "dashboard-audit", cmd: "node", args: ["scripts/dashboard-audit.mjs"] },
];

let failed = 0;

for (const step of steps) {
  console.log(`\n=== ${step.name} ===`);
  const result = spawnSync(step.cmd, step.args, { cwd: root, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`FAILED: ${step.name}`);
    failed++;
  } else {
    console.log(`PASSED: ${step.name}`);
  }
}

if (failed > 0) {
  console.error(`\nPost-deploy smoke: ${failed} step(s) failed`);
  process.exit(1);
}

console.log("\nPost-deploy smoke: all steps passed");
process.exit(0);
