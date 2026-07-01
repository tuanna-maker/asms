/**
 * Import ma trận phân quyền A2 (JSON) lên API.
 * Chạy: node scripts/import-role-permissions.mjs config/role-permissions-vtx.template.json
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@demo.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Password123!";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-role-permissions.mjs <permissions.json>");
  process.exit(2);
}

const raw = JSON.parse(readFileSync(resolve(file), "utf8"));
const items = raw.items ?? raw;
if (!Array.isArray(items) || items.length === 0) {
  console.error("JSON must contain items[] array");
  process.exit(2);
}

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const json = await res.json();
  if (!res.ok || !json?.success) throw new Error(json?.message ?? "Login failed");
  return json.data.token;
}

const token = await login();
const res = await fetch(`${BASE}/role-permissions`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ items }),
});

const json = await res.json().catch(() => null);
if (!res.ok || !json?.success) {
  console.error("Import failed:", json?.message ?? res.status);
  process.exit(1);
}

console.log(JSON.stringify({ success: true, updated: items.length, message: json.message }, null, 2));
