/**
 * RBAC smoke: write_probe endpoints với role bị cấm → 403; role có quyền + body rỗng → 400.
 * Chạy: node scripts/uc-smoke-by-role.mjs
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";

const ROLES = [
  { key: "admin", email: "admin@demo.local", password: "Password123!" },
  { key: "manager", email: "manager@demo.local", password: "Password123!" },
  { key: "technician", email: "technician@demo.local", password: "Password123!" },
  { key: "sales", email: "sales@demo.local", password: "Password123!" },
  { key: "viewer", email: "viewer@demo.local", password: "Password123!" },
];

/** endpoint → roles that should get 403 on POST empty body */
const FORBIDDEN_POST = [
  { path: "/materials", method: "POST", forbiddenRoles: ["sales", "viewer"], body: {} },
  { path: "/contracts", method: "POST", forbiddenRoles: ["technician", "viewer"], body: {} },
  { path: "/handovers", method: "POST", forbiddenRoles: ["sales", "viewer"], body: {} },
  { path: "/warranties", method: "POST", forbiddenRoles: ["sales", "viewer"], body: {} },
  { path: "/users", method: "POST", forbiddenRoles: ["manager", "technician", "sales", "viewer"], body: {} },
];

/** endpoint → roles that should get 400 (has create permission) on empty body */
const ALLOWED_POST_400 = [
  { path: "/contracts", method: "POST", allowedRoles: ["admin", "manager", "sales"], body: {} },
  { path: "/materials", method: "POST", allowedRoles: ["admin", "manager", "technician"], body: {} },
  { path: "/customers", method: "POST", allowedRoles: ["admin", "manager", "sales"], body: {} },
];

async function api(method, path, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
}

async function login(email, password) {
  const res = await api("POST", "/auth/login", null, { email, password });
  if (res.status !== 200 || !res.json?.success) throw new Error(`Login ${email} failed`);
  return res.json.data.token;
}

const tokens = {};
for (const r of ROLES) {
  tokens[r.key] = await login(r.email, r.password);
}

const results = [];
let failed = 0;

for (const probe of FORBIDDEN_POST) {
  for (const role of probe.forbiddenRoles) {
    const res = await api(probe.method, probe.path, tokens[role], probe.body);
    const ok = res.status === 403;
    results.push({ type: "forbidden", path: probe.path, role, expect: 403, status: res.status, ok });
    if (!ok) failed++;
  }
}

for (const probe of ALLOWED_POST_400) {
  for (const role of probe.allowedRoles) {
    const res = await api(probe.method, probe.path, tokens[role], probe.body);
    const ok = res.status === 400 && res.json?.success === false;
    results.push({ type: "validation", path: probe.path, role, expect: 400, status: res.status, ok });
    if (!ok) failed++;
  }
}

const report = {
  summary: { total: results.length, passed: results.length - failed, failed, testedAt: new Date().toISOString() },
  results,
};

writeFileSync(resolve(__dirname, "uc-smoke-by-role-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary, null, 2));
process.exit(failed > 0 ? 1 : 0);
