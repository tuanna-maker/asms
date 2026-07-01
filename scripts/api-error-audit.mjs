/**
 * Audit HTTP error responses: 401/403/404/409 + validation VN.
 * Chạy: node scripts/api-error-audit.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";
const FAKE_ID = "00000000-0000-4000-8000-000000000099";

const EN_PATTERNS = [
  /^invalid /i,
  /too small/i,
  /too big/i,
  /expected /i,
  /received /i,
  /^missing /i,
  /^forbidden$/i,
  /not found$/i,
  /invalid request input/i,
  /invalid or expired token/i,
  /missing authorization/i,
];

function looksEnglish(msg) {
  if (!msg || typeof msg !== "string") return false;
  return EN_PATTERNS.some((p) => p.test(msg.trim()));
}

async function api(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function login(email, password) {
  const res = await api("POST", "/auth/login", { body: { email, password } });
  if (res.status !== 200 || !res.json?.success) throw new Error(res.json?.message ?? "login fail");
  return res.json.data.token;
}

/** @type {Array<{name:string, run:()=>Promise<{ok:boolean, status?:number, message?:string, detail?:string}>}>} */
const CASES = [
  {
    name: "auth_wrong_password",
    run: async () => {
      const res = await api("POST", "/auth/login", {
        body: { email: "admin@demo.local", password: "wrong" },
      });
      const ok = res.status === 401 && res.json?.success === false;
      return { ok, status: res.status, message: res.json?.message, detail: looksEnglish(res.json?.message) ? "message EN" : "" };
    },
  },
  {
    name: "auth_no_token",
    run: async () => {
      const res = await api("GET", "/contracts");
      const ok = res.status === 401;
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "rbac_sales_materials",
    run: async () => {
      const token = await login("sales@demo.local", "Password123!");
      const res = await api("GET", "/materials", { token });
      const ok = res.status === 403;
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "rbac_viewer_create_contract",
    run: async () => {
      const token = await login("viewer@demo.local", "Password123!");
      const res = await api("POST", "/contracts", { token, body: { title: "x" } });
      const ok = res.status === 403;
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "not_found_contract",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("GET", `/contracts/${FAKE_ID}`, { token });
      const ok = res.status === 404;
      return { ok, status: res.status, message: res.json?.message, detail: looksEnglish(res.json?.message) ? "message EN" : "" };
    },
  },
  {
    name: "validation_contracts_empty",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("POST", "/contracts", { token, body: {} });
      const fe = res.json?.data?.fieldErrors ?? {};
      const msgs = Object.values(fe).flat();
      const ok = res.status === 400 && res.json?.success === false && !msgs.some((m) => looksEnglish(String(m)));
      return { ok, status: res.status, message: res.json?.message, detail: msgs.join("; ") };
    },
  },
  {
    name: "validation_reports_bad_year",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("GET", "/reports/dashboard-summary?year=abc", { token });
      const ok = res.status === 400 && res.json?.success === false && !looksEnglish(res.json?.message ?? "");
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "validation_role_permissions_empty",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("PUT", "/role-permissions", { token, body: { items: [] } });
      const ok = res.status === 400 && res.json?.success === false && !looksEnglish(res.json?.message ?? "");
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "validation_workflows_empty",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("POST", "/workflows", { token, body: {} });
      const ok = res.status === 400 && res.json?.success === false;
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "validation_definitions_empty",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const res = await api("POST", "/definitions", { token, body: {} });
      const ok = res.status === 400 && res.json?.success === false;
      return { ok, status: res.status, message: res.json?.message };
    },
  },
  {
    name: "no_500_probe",
    run: async () => {
      const token = await login("admin@demo.local", "Password123!");
      const paths = ["/customers", "/materials", "/warranties", "/reports"];
      for (const p of paths) {
        const res = await api("GET", p, { token });
        if (res.status >= 500) return { ok: false, status: res.status, message: res.json?.message, detail: p };
      }
      return { ok: true };
    },
  },
];

const results = [];
let failed = 0;
const englishMessages = [];

for (const tc of CASES) {
  try {
    const r = await tc.run();
    results.push({ name: tc.name, ...r });
    if (!r.ok) failed++;
    if (r.message && looksEnglish(r.message)) {
      englishMessages.push({ case: tc.name, message: r.message });
    }
  } catch (e) {
    results.push({ name: tc.name, ok: false, detail: String(e.message ?? e) });
    failed++;
  }
}

const report = {
  summary: { total: CASES.length, passed: CASES.length - failed, failed, englishMessages: englishMessages.length, testedAt: new Date().toISOString() },
  englishMessages,
  results,
};

writeFileSync(resolve(__dirname, "api-error-audit-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
process.exit(failed > 0 ? 1 : 0);
