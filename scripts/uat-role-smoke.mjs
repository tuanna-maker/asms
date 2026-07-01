/**
 * Smoke UAT theo 5 vai trò — kiểm tra login + endpoint đại diện + RBAC 403.
 * Chạy: node scripts/uat-role-smoke.mjs
 */
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";

const ROLES = [
  {
    key: "admin",
    email: "admin@demo.local",
    password: "Password123!",
    expectOk: ["/contracts", "/customers", "/materials", "/reports/dashboard-summary"],
    expectForbidden: [],
  },
  {
    key: "manager",
    email: "manager@demo.local",
    password: "Password123!",
    expectOk: ["/contracts", "/reports"],
    expectForbidden: [],
  },
  {
    key: "technician",
    email: "technician@demo.local",
    password: "Password123!",
    expectOk: ["/handovers", "/warranties", "/materials"],
    expectForbidden: ["/contracts"],
  },
  {
    key: "sales",
    email: "sales@demo.local",
    password: "Password123!",
    expectOk: ["/contracts", "/customers", "/reports"],
    expectForbidden: ["/materials"],
  },
  {
    key: "viewer",
    email: "viewer@demo.local",
    password: "Password123!",
    expectOk: ["/contracts", "/customers"],
    expectForbidden: [],
  },
];

async function api(method, path, { token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
  const res = await api("POST", "/auth/login", {});
  const body = { email, password };
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (r.status !== 200 || !json?.success) {
    throw new Error(`Login failed ${email}: ${json?.message ?? r.status}`);
  }
  return json.data.token;
}

const results = [];
let failed = 0;

for (const role of ROLES) {
  const row = { role: role.key, login: "pass", checks: [] };
  try {
    const token = await login(role.email, role.password);
    for (const path of role.expectOk) {
      const res = await api("GET", path, { token });
      const ok = res.status === 200 && res.json?.success !== false;
      row.checks.push({ path, expect: "200", status: res.status, ok });
      if (!ok) failed++;
    }
    for (const path of role.expectForbidden) {
      const res = await api("GET", path, { token });
      const ok = res.status === 403;
      row.checks.push({ path, expect: "403", status: res.status, ok });
      if (!ok) failed++;
    }
  } catch (e) {
    row.login = "fail";
    row.error = String(e.message ?? e);
    failed++;
  }
  results.push(row);
}

const summary = {
  roles: ROLES.length,
  failed,
  pass: failed === 0,
  results,
};

console.log(JSON.stringify(summary, null, 2));
process.exit(failed > 0 ? 1 : 0);
