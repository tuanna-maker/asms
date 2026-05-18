/**
 * Smoke test API bàn giao (cần backend chạy + user demo).
 * Usage: cd backend && pnpm run smoke:handover
 */
import "dotenv/config";

const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001";
const EMAIL = process.env.SMOKE_EMAIL ?? "admin@demo.local";
const PASS = process.env.SMOKE_PASSWORD ?? "Password123!";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  const json = (await res.json()) as { success?: boolean; data?: T; message?: string };
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${json.message ?? res.statusText}`);
  return json.data as T;
}

void (async () => {
  const login = await req<{ token: string }>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const headers = { Authorization: `Bearer ${login.token}`, "Content-Type": "application/json" };

  const health = await req<{ database?: string }>("/api/v1/health");
  console.log("health:", health);

  const workflows = await req<Array<{ id: string; code: string; moduleKey: string; isActive: boolean }>>(
    "/api/v1/workflows?moduleKey=handover",
    { headers },
  );
  const sample = workflows.find((w) => w.isActive && w.code.includes("HANDOVER"));
  console.log("workflows handover:", workflows.map((w) => w.code).join(", "));

  const contracts = await req<Array<{ id: string; code: string }>>("/api/v1/contracts", { headers });
  if (!contracts[0]) throw new Error("Không có hợp đồng để test");
  const contractId = contracts[0].id;

  const listBefore = await req<unknown[]>("/api/v1/handovers", { headers });
  console.log("handovers count:", listBefore.length);

  if (!sample) throw new Error("Thiếu quy trình handover active — chạy pnpm run bootstrap:auth");

  const created = await req<{ id: string; code: string; stepPayloads?: Record<string, unknown> }>(
    "/api/v1/handovers",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        contractId,
        workflowId: sample.id,
        status: "pending",
        handoverPlan: "Smoke test KH BG",
      }),
    },
  );
  console.log("created:", created.code, "payloads:", Object.keys(created.stepPayloads ?? {}).length);

  const detail = await req<{ id: string; workflow?: { workflowCode?: string; workflowName?: string } }>(
    `/api/v1/handovers/${created.id}`,
    { headers },
  );
  console.log("detail workflow:", detail.workflow?.workflowName ?? "—");

  const filtered = await req<unknown[]>(`/api/v1/handovers?workflowCode=${encodeURIComponent(sample.code)}`, {
    headers,
  });
  console.log("filter by workflow:", filtered.length);

  await req(`/api/v1/handovers/${created.id}`, {
    method: "DELETE",
    headers,
  });
  console.log("deleted smoke handover OK");
  console.log("\n✓ Smoke handover API passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
