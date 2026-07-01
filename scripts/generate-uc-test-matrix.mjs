/**
 * Sinh docs/uc-test-matrix.md từ uc-smoke-report.json + use-case-asms.md.
 * Chạy: node scripts/generate-uc-test-matrix.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const ucDoc = resolve(root, "docs/file docs/use-case-asms.md");
const reportPath = resolve(__dirname, "uc-smoke-report.json");
const outPath = resolve(root, "docs/uc-test-matrix.md");

const MANUAL_UC = new Set([
  "UC-DASH-10",
  "UC-BC-08",
  "UC-BC-09",
  "UC-TL-04",
  "UC-TB-04",
  "UC-TB-05",
]);

const E2E_MODULES = {
  AUTH: "e2e/auth.spec.ts",
  dashboard: "e2e/dashboard.spec.ts",
  "hop-dong": "e2e/contracts.spec.ts",
  "hop-dong.dieu-khoan": "e2e/contracts.spec.ts",
  "ban-giao": "e2e/smoke-modules.spec.ts",
  "bao-hanh": "e2e/smoke-modules.spec.ts",
  "san-pham": "e2e/smoke-modules.spec.ts",
  "vat-tu": "e2e/smoke-modules.spec.ts",
  "khach-hang": "e2e/customers-crm.spec.ts",
  "phan-anh": "e2e/smoke-modules.spec.ts",
  "bao-cao": "e2e/smoke-modules.spec.ts",
  "de-tai": "e2e/smoke-modules.spec.ts",
  "cong-viec": "e2e/smoke-modules.spec.ts",
  "dao-tao": "e2e/smoke-modules.spec.ts",
  "tai-lieu": "e2e/smoke-modules.spec.ts",
  "quy-trinh": "e2e/smoke-modules.spec.ts",
  "cai-dat": "e2e/smoke-modules.spec.ts",
  "thong-bao": "e2e/smoke-modules.spec.ts",
};

function moduleFromId(id) {
  if (id.startsWith("UC-HD-DK")) return "hop-dong.dieu-khoan";
  const key = id.replace(/^UC-/, "").split("-")[0];
  const map = {
    AUTH: "AUTH",
    DASH: "dashboard",
    HD: "hop-dong",
    BG: "ban-giao",
    BH: "bao-hanh",
    SP: "san-pham",
    VT: "vat-tu",
    KH: "khach-hang",
    PA: "phan-anh",
    BC: "bao-cao",
    DT: "de-tai",
    CV: "cong-viec",
    DTao: "dao-tao",
    TL: "tai-lieu",
    QT: "quy-trinh",
    CD: "cai-dat",
    TB: "thong-bao",
  };
  return map[key] ?? key.toLowerCase();
}

function rowMeta(id, name, mod, status = "pending", note = "") {
  let testType = "API";
  let script = "uc-smoke-test.mjs";
  if (MANUAL_UC.has(id)) {
    testType = "Manual";
    script = "uc-manual-ui-checklist.md";
  } else if (E2E_MODULES[mod]) {
    testType = "API+E2E";
    script = `uc-smoke-test.mjs + ${E2E_MODULES[mod]}`;
  }
  return { id, name, mod, testType, script, status, note };
}

const rows = [];
const seen = new Set();

if (existsSync(reportPath)) {
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  for (const r of report.results ?? []) {
    seen.add(r.id);
    let status = r.status ?? "pending";
    let note = r.skipReason ?? r.reason ?? "";
    if (status === "skipped") {
      status = "manual";
      note = note || "UI-only";
    }
    if (status === "no_data") note = note || "Cần seed";
    rows.push(rowMeta(r.id, r.name ?? r.id, r.module ?? moduleFromId(r.id), status, note));
  }
}

const md = readFileSync(ucDoc, "utf8");
const re = /^\| (UC-[A-Z0-9-]+) \| ([^|]+) \|/gm;
let m;
while ((m = re.exec(md)) !== null) {
  const id = m[1];
  if (seen.has(id)) continue;
  const mod = moduleFromId(id);
  rows.push(rowMeta(id, m[2].trim(), mod));
}

rows.sort((a, b) => a.id.localeCompare(b.id));

const lines = [
  "# Ma trận kiểm tra Use Case — ASMS",
  "",
  `> Tự sinh: \`node scripts/generate-uc-test-matrix.mjs\` — **${rows.length} UC**`,
  "",
  "| UC_ID | Tên | Module | Loại test | Script/Spec | Trạng thái | Ghi chú |",
  "|-------|-----|--------|-----------|-------------|------------|---------|",
];

for (const r of rows) {
  lines.push(
    `| ${r.id} | ${r.name} | ${r.mod} | ${r.testType} | ${r.script} | ${r.status} | ${r.note} |`,
  );
}

writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
console.log(`Wrote ${rows.length} rows to ${outPath}`);
