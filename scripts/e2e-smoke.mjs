/**
 * E2E smoke tối thiểu qua API: login, CRUD probe, RBAC sales/viewer.
 * Chạy: node scripts/e2e-smoke.mjs
 */
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(`Login ${email}: ${json?.message ?? res.status}`);
  return json.data.token;
}

async function get(token, path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const checks = [];
let failed = 0;

function record(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  if (!ok) failed++;
}

try {
  const adminToken = await login("admin@demo.local", "Password123!");
  const contracts = await get(adminToken, "/contracts");
  record("admin list contracts", contracts.status === 200 && contracts.json?.success !== false);

  const salesToken = await login("sales@demo.local", "Password123!");
  const salesContracts = await get(salesToken, "/contracts");
  record("sales list contracts", salesContracts.status === 200);

  const salesMaterials = await get(salesToken, "/materials");
  record("sales blocked materials", salesMaterials.status === 403, `status=${salesMaterials.status}`);

  const viewerToken = await login("viewer@demo.local", "Password123!");
  const viewerPost = await fetch(`${BASE}/contracts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${viewerToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ code: "PROBE", title: "x" }),
  });
  record("viewer cannot create contract", viewerPost.status === 403, `status=${viewerPost.status}`);
} catch (e) {
  record("setup", false, String(e.message ?? e));
}

console.log(JSON.stringify({ pass: failed === 0, failed, checks }, null, 2));
process.exit(failed > 0 ? 1 : 0);
