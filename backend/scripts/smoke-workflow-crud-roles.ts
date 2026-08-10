/**
 * Smoke CRUD quy trình + gắn QT + ma trận role.
 * Ghi NDJSON vào debug-b9a69a.log (session b9a69a).
 *
 * Usage: cd backend && pnpm exec tsx scripts/smoke-workflow-crud-roles.ts
 */
import fs from "fs";
import path from "path";

const BASE = process.env.SMOKE_API_BASE ?? "http://127.0.0.1:4001";
const LOG_PATH = path.resolve(__dirname, "../../debug-b9a69a.log");
const PASSWORD = "Password123!";

type Hyp =
  | "A_crud_admin"
  | "B_attach_coaching"
  | "C_step_crud"
  | "D_system_delete_blocked"
  | "E_role_matrix";

function log(hypothesisId: Hyp, location: string, message: string, data: Record<string, unknown>) {
  const line = JSON.stringify({
    sessionId: "b9a69a",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId: "smoke-api",
  });
  fs.appendFileSync(LOG_PATH, line + "\n", "utf8");
  // eslint-disable-next-line no-console
  console.log(`[${hypothesisId}] ${message}`, data);
}

async function api(
  method: string,
  urlPath: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function login(email: string) {
  const { status, json } = await api("POST", "/api/v1/auth/login", undefined, {
    email,
    password: PASSWORD,
  });
  const token = (json?.data?.token ?? json?.data?.accessToken) as string | undefined;
  const role = json?.data?.user?.role as string | undefined;
  return { status, token, role, message: json?.message };
}

async function main() {
  fs.writeFileSync(LOG_PATH, "", "utf8");

  const roles = ["admin", "manager", "technician", "viewer", "sales"] as const;
  const tokens: Record<string, string> = {};

  for (const role of roles) {
    const email = `${role}@demo.local`;
    const r = await login(email);
    log("E_role_matrix", "smoke:login", `login ${role}`, {
      email,
      status: r.status,
      hasToken: Boolean(r.token),
      role: r.role,
      message: r.message ?? null,
    });
    if (r.token) tokens[role] = r.token;
  }

  const admin = tokens.admin;
  if (!admin) {
    log("A_crud_admin", "smoke:abort", "no admin token", {});
    process.exit(1);
  }

  const code = `WF_SMOKE_${Date.now().toString(36).toUpperCase()}`;
  const created = await api("POST", "/api/v1/workflows", admin, {
    code,
    name: `Smoke coaching ${code}`,
    moduleKey: "coaching",
    description: "smoke test",
    isActive: true,
  });
  const wfId = created.json?.data?.id as string | undefined;
  log("A_crud_admin", "smoke:createWorkflow", "POST /workflows", {
    status: created.status,
    wfId: wfId ?? null,
    message: created.json?.message ?? null,
    success: created.json?.success ?? null,
  });

  if (!wfId) process.exit(1);

  const updated = await api("PUT", `/api/v1/workflows/${wfId}`, admin, {
    name: `Smoke coaching UPD ${code}`,
    description: "updated",
  });
  log("A_crud_admin", "smoke:updateWorkflow", "PUT /workflows/:id", {
    status: updated.status,
    name: updated.json?.data?.name ?? null,
    message: updated.json?.message ?? null,
  });

  const stepAdd = await api("POST", `/api/v1/workflows/${wfId}/steps`, admin, {
    name: "Bước smoke 1",
    actionCode: "submit",
    roleCode: "technician",
    phaseCode: "training",
    requireDocument: true,
    fieldSchema: [{ key: "note", label: "Ghi chu", type: "textarea" }],
  });
  const stepId = stepAdd.json?.data?.id as string | undefined;
  log("C_step_crud", "smoke:addStep", "POST /steps", {
    status: stepAdd.status,
    stepId: stepId ?? null,
    message: stepAdd.json?.message ?? null,
  });

  if (stepId) {
    const stepUpd = await api("PUT", `/api/v1/workflows/${wfId}/steps/${stepId}`, admin, {
      name: "Bước smoke 1 UPD",
      actionCode: "submit",
      roleCode: "manager",
      phaseCode: "training",
      requireDocument: false,
      fieldSchema: [{ key: "note", label: "Ghi chu", type: "text" }],
    });
    log("C_step_crud", "smoke:updateStep", "PUT /steps/:id", {
      status: stepUpd.status,
      name: stepUpd.json?.data?.name ?? null,
      message: stepUpd.json?.message ?? null,
    });

    const stepDel = await api("DELETE", `/api/v1/workflows/${wfId}/steps/${stepId}`, admin);
    log("C_step_crud", "smoke:deleteStep", "DELETE /steps/:id", {
      status: stepDel.status,
      message: stepDel.json?.message ?? null,
      success: stepDel.json?.success ?? null,
    });

    // Thêm lại bước để attach vẫn chạy được
    const stepRe = await api("POST", `/api/v1/workflows/${wfId}/steps`, admin, {
      name: "Bước smoke re",
      actionCode: "submit",
      roleCode: "technician",
      phaseCode: "training",
      requireDocument: false,
      fieldSchema: [{ key: "note", label: "Ghi chu", type: "text" }],
    });
    log("C_step_crud", "smoke:reAddStep", "POST /steps (re-add)", {
      status: stepRe.status,
      stepId: stepRe.json?.data?.id ?? null,
    });
  }

  const courses = await api("GET", "/api/v1/training?courseKind=coaching", admin);
  const courseId = (courses.json?.data as Array<{ id: string }> | undefined)?.[0]?.id;
  log("B_attach_coaching", "smoke:listCourses", "GET training coaching", {
    status: courses.status,
    count: Array.isArray(courses.json?.data) ? courses.json.data.length : 0,
    courseId: courseId ?? null,
  });

  let attachedInstanceId: string | undefined;
  if (courseId) {
    const attach = await api("POST", "/api/v1/workflows/instances/attach", admin, {
      moduleKey: "coaching",
      entityId: courseId,
      workflowId: wfId,
    });
    attachedInstanceId = attach.json?.data?.id as string | undefined;
    log("B_attach_coaching", "smoke:attach", "POST attach coaching", {
      status: attach.status,
      instanceId: attachedInstanceId ?? null,
      message: attach.json?.message ?? null,
      success: attach.json?.success ?? null,
    });

    const badAttach = await api("POST", "/api/v1/workflows/instances/attach", admin, {
      moduleKey: "training",
      entityId: courseId,
      workflowId: wfId,
    });
    log("B_attach_coaching", "smoke:attachWrongModule", "attach coaching WF as training", {
      status: badAttach.status,
      message: badAttach.json?.message ?? null,
    });
  }

  for (const role of roles) {
    const t = tokens[role];
    if (!t) continue;
    const list = await api("GET", "/api/v1/workflows?moduleKey=coaching", t);
    const create = await api("POST", "/api/v1/workflows", t, {
      name: `Denied? ${role} ${Date.now()}`,
      moduleKey: "coaching",
    });
    const createdId = create.json?.data?.id as string | undefined;
    if (createdId && role !== "admin") {
      await api("DELETE", `/api/v1/workflows/${createdId}`, admin);
    } else if (createdId && role === "admin") {
      await api("DELETE", `/api/v1/workflows/${createdId}`, admin);
    }
    log("E_role_matrix", "smoke:roleWorkflowAccess", `role ${role} workflow access`, {
      role,
      listStatus: list.status,
      listCount: Array.isArray(list.json?.data) ? list.json.data.length : null,
      createStatus: create.status,
      createMessage: create.json?.message ?? null,
      expectedListOk: role === "admin" || role === "manager" || role === "technician",
      expectedCreateOk: role === "admin" || role === "manager" || role === "technician",
    });
  }

  const perms = await api("GET", "/api/v1/role-permissions", admin);
  const rolesPayload = perms.json?.data?.roles as
    | Array<{ code: string; permissions: Record<string, Record<string, boolean>> }>
    | undefined;
  for (const r of rolesPayload ?? []) {
    log("E_role_matrix", "smoke:permSnapshot", `perms ${r.code}`, {
      role: r.code,
      quyTrinh: r.permissions?.["quy-trinh"] ?? null,
      banGiao: r.permissions?.["ban-giao"] ?? null,
      daoTao: r.permissions?.["dao-tao"] ?? null,
    });
  }

  if (attachedInstanceId) {
    // Không có API cancel riêng — cập nhật DB để kiểm tra xoá QT sau khi hết phiếu running
    const { prisma } = await import("../src/utils/prisma");
    await prisma.workflowInstance.update({
      where: { id: attachedInstanceId },
      data: { status: "cancelled", completedAt: new Date() },
    });
    log("A_crud_admin", "smoke:cancelInstance", "mark instance cancelled via prisma", {
      instanceId: attachedInstanceId,
    });
  }

  const del = await api("DELETE", `/api/v1/workflows/${wfId}`, admin);
  log("A_crud_admin", "smoke:deleteWorkflow", "DELETE smoke wf", {
    status: del.status,
    message: del.json?.message ?? null,
    success: del.json?.success ?? null,
  });

  if (stepId) {
    // đã xoá wf — skip step delete; test step delete trên wf tạm riêng nếu cần
  }

  const listAll = await api("GET", "/api/v1/workflows?moduleKey=coaching", admin);
  const systemWf = (listAll.json?.data as Array<{ id: string; isSystem?: boolean; code?: string }> | undefined)?.find(
    (w) => w.isSystem || w.code === "WF_COACHING_DEFAULT",
  );
  if (systemWf) {
    const delSys = await api("DELETE", `/api/v1/workflows/${systemWf.id}`, admin);
    log("D_system_delete_blocked", "smoke:deleteSystem", "DELETE system wf", {
      status: delSys.status,
      code: systemWf.code ?? null,
      message: delSys.json?.message ?? null,
      blocked: delSys.status >= 400,
    });
  }

  // eslint-disable-next-line no-console
  console.log("\nSmoke done →", LOG_PATH);
}

main().catch((e) => {
  log("A_crud_admin", "smoke:fatal", String(e), { error: String(e) });
  process.exit(1);
});
