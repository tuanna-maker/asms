/**
 * Smoke-test toàn bộ Use Case trong docs/file docs/use-case-asms.md qua API.
 * - Read UC: GET → kỳ vọng 200 + success
 * - Write UC: POST/PUT/PATCH/DELETE probe (body rỗng) → kỳ vọng 400/404, không 500
 * - Không tạo dữ liệu mới hợp lệ (tránh ghi DB)
 *
 * Chạy: node scripts/uc-smoke-test.mjs
 */
import { writeFileSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";
const PROBE_ID = "00000000-0000-4000-8000-000000000099";
const LOG_PATH = resolve(__dirname, "..", "debug-5e2296.log");

const ROLES = [
  { key: "admin", email: "admin@demo.local", password: "Password123!" },
  { key: "manager", email: "manager@demo.local", password: "Password123!" },
  { key: "technician", email: "technician@demo.local", password: "Password123!" },
  { key: "sales", email: "sales@demo.local", password: "Password123!" },
  { key: "viewer", email: "viewer@demo.local", password: "Password123!" },
];

function log(entry) {
  const line = JSON.stringify({ sessionId: "5e2296", timestamp: Date.now(), runId: "uc-smoke", ...entry });
  try {
    appendFileSync(LOG_PATH, line + "\n");
  } catch {
    /* ignore */
  }
}

async function api(method, path, { token, body, query } = {}) {
  const url = new URL(`${BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function login(email, password) {
  const res = await api("POST", "/auth/login", { body: { email, password } });
  if (res.status !== 200 || !res.json?.success || !res.json?.data?.token) {
    throw new Error(`Login failed ${email}: ${res.json?.message ?? res.status}`);
  }
  return {
    token: res.json.data.token,
    refreshToken: res.json.data.refreshToken,
    user: res.json.data.user,
  };
}

function firstId(listRes, keys = ["id"]) {
  const data = listRes?.json?.data;
  let items = null;
  if (Array.isArray(data)) items = data;
  else if (data && typeof data === "object") {
    items = data.items ?? data.rows ?? data.data;
  }
  if (!Array.isArray(items) || items.length === 0) return null;
  for (const k of keys) {
    if (items[0]?.[k]) return items[0][k];
  }
  return null;
}

function markRealIds(ctx) {
  const real = {};
  for (const [k, v] of Object.entries(ctx)) {
    real[k] = Boolean(v && !String(v).startsWith("00000000-"));
  }
  return real;
}

async function pickValidId(token, listPath, detailPath, query) {
  const res = await api("GET", listPath, { token, query: { limit: 30, page: 1, ...(query ?? {}) } });
  const data = res.json?.data;
  const items = Array.isArray(data) ? data : data?.items ?? data?.rows ?? [];
  for (const item of items) {
    const id = item?.id;
    if (!id) continue;
    const det = await api("GET", `${detailPath}/${id}`, { token });
    if (det.status === 200 && det.json?.success) return id;
  }
  return null;
}

async function pickContractId(token) {
  const res = await api("GET", "/contracts", { token, query: { limit: 30 } });
  const data = res.json?.data;
  const items = Array.isArray(data) ? data : data?.items ?? [];
  for (const item of items) {
    const id = item?.id;
    if (!id) continue;
    const det = await api("GET", `/contracts/${id}`, { token });
    const prod = await api("GET", `/contracts/${id}/products`, { token });
    if (det.status === 200 && prod.status === 200 && det.json?.success) return id;
  }
  return null;
}

async function pickWorkflowInstanceId(token, ctx) {
  if (ctx.contractId) {
    const cd = await api("GET", `/contracts/${ctx.contractId}`, { token });
    const wid = cd.json?.data?.workflowInstanceId;
    if (wid) {
      const chk = await api("GET", `/workflows/instances/${wid}`, { token });
      if (chk.status === 200) return wid;
    }
  }
  const pairs = [
    ["handover", ctx.handoverId],
    ["warranty", ctx.warrantyId],
    ["product", ctx.productId],
    ["training", ctx.trainingId],
    ["coaching", ctx.coachingId],
  ];
  for (const [moduleKey, entityId] of pairs) {
    if (!entityId) continue;
    const wf = await api("GET", "/workflows/instances", { token, query: { moduleKey, entityId } });
    const wid = wf.json?.data?.id ?? wf.json?.data?.instance?.id;
    if (wid) return wid;
  }
  return null;
}

async function buildContext(token) {
  const ctx = {};
  ctx.customerId = await pickValidId(token, "/customers", "/customers");
  ctx.contractId = await pickContractId(token);
  ctx.productId = await pickValidId(token, "/products", "/products");
  ctx.materialId = await pickValidId(token, "/materials", "/materials");
  ctx.handoverId = await pickValidId(token, "/handovers", "/handovers");
  ctx.warrantyId = await pickValidId(token, "/warranties", "/warranties");
  ctx.taskId = await pickValidId(token, "/tasks", "/tasks");
  ctx.trainingId = await pickValidId(token, "/training", "/training", { courseKind: "training" });
  ctx.coachingId = await pickValidId(token, "/training", "/training", { courseKind: "coaching" });
  ctx.researchProjectId = await pickValidId(token, "/research-projects", "/research-projects");
  ctx.documentId = await pickValidId(token, "/documents", "/documents");
  ctx.feedbackId = await pickValidId(token, "/customer-feedbacks", "/customer-feedbacks");
  ctx.workflowId = await pickValidId(token, "/workflows", "/workflows");
  ctx.clauseId = firstId(await api("GET", "/contract-clauses", { token }));
  ctx.clauseGroupId = firstId(await api("GET", "/contract-clause-groups", { token }));
  ctx.userId = firstId(await api("GET", "/users", { token }));
  ctx.unitId = firstId(await api("GET", "/feedback-execution-units", { token }));
  ctx.contactId = firstId(await api("GET", "/contacts", { token }));
  ctx.notificationId = firstId(await api("GET", "/notifications", { token }));
  ctx.transferId = firstId(await api("GET", "/materials/transfers", { token }));
  const defRes = await api("GET", "/definitions", { token, query: { category: "customer_source" } });
  ctx.definitionId = firstId(defRes);
  const sessRes = await api("GET", "/auth/sessions", { token });
  ctx.sessionId = firstId(sessRes, ["id", "sessionId"]);

  if (ctx.feedbackId) {
    const detail = await api("GET", `/customer-feedbacks/${ctx.feedbackId}`, { token });
    const assignments = detail.json?.data?.assignments ?? [];
    ctx.assignmentId = assignments[0]?.id ?? null;
  }
  ctx.workflowInstanceId = await pickWorkflowInstanceId(token, ctx);
  ctx._real = markRealIds(ctx);
  return ctx;
}

function replacePath(path, ctx) {
  return path
    .replace("{customerId}", ctx.customerId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{contractId}", ctx.contractId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{productId}", ctx.productId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{materialId}", ctx.materialId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{handoverId}", ctx.handoverId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{warrantyId}", ctx.warrantyId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{taskId}", ctx.taskId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{trainingId}", ctx.trainingId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{coachingId}", ctx.coachingId ?? ctx.trainingId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{researchProjectId}", ctx.researchProjectId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{documentId}", ctx.documentId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{feedbackId}", ctx.feedbackId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{workflowId}", ctx.workflowId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{workflowInstanceId}", ctx.workflowInstanceId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{clauseId}", ctx.clauseId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{clauseGroupId}", ctx.clauseGroupId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{userId}", ctx.userId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{definitionId}", ctx.definitionId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{sessionId}", ctx.sessionId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{assignmentId}", ctx.assignmentId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{unitId}", ctx.unitId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{contactId}", ctx.contactId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{notificationId}", ctx.notificationId ?? "00000000-0000-0000-0000-000000000001")
    .replace("{transferId}", ctx.transferId ?? "00000000-0000-0000-0000-000000000001");
}

/** @type {Array<{id:string, name:string, module:string, mode:'read'|'write_probe'|'skip'|'auth', method?:string, path?:string, query?:Record<string,string>, body?:unknown, expectStatus?:number[], skipReason?:string, role?:string}>} */
const UC_CASES = [
  // AUTH
  { id: "UC-AUTH-01", name: "Đăng nhập", module: "AUTH", mode: "auth", method: "POST", path: "/auth/login", body: { email: "admin@demo.local", password: "Password123!" }, expectStatus: [200] },
  { id: "UC-AUTH-02", name: "Đăng xuất", module: "AUTH", mode: "write_probe", method: "POST", path: "/auth/logout", body: { refreshToken: "invalid-probe-token" }, expectStatus: [200, 400] },
  { id: "UC-AUTH-03", name: "Làm mới phiên", module: "AUTH", mode: "auth_refresh", method: "POST", path: "/auth/refresh", expectStatus: [200] },
  { id: "UC-AUTH-04", name: "Xem danh sách phiên", module: "AUTH", mode: "read", method: "GET", path: "/auth/sessions" },
  { id: "UC-AUTH-05", name: "Thu hồi phiên", module: "AUTH", mode: "write_probe", method: "DELETE", path: "/auth/sessions/{sessionId}", expectStatus: [200, 404] },
  { id: "UC-AUTH-06", name: "Đăng xuất tất cả", module: "AUTH", mode: "write_probe", method: "POST", path: "/auth/logout-all", body: {}, expectStatus: [200] },
  { id: "UC-AUTH-07", name: "Tạo tài khoản", module: "AUTH", mode: "write_probe", method: "POST", path: "/users", body: {}, expectStatus: [400] },

  // DASH
  { id: "UC-DASH-01", name: "Xem tổng quan", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-02", name: "Xem theo khách hàng", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary", query: { customerId: "{customerId}" } },
  { id: "UC-DASH-03", name: "Xem doanh thu", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary", query: { year: "2025" } },
  { id: "UC-DASH-04", name: "Xem dự án / tiến độ", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-05", name: "Xem sản phẩm", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-06", name: "Xem bảo hành", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-07", name: "Xem vật tư", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-08", name: "Xem cảnh báo", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary" },
  { id: "UC-DASH-09", name: "Lọc theo năm/quý/KH", module: "dashboard", mode: "read", method: "GET", path: "/reports/dashboard-summary", query: { year: "2025", from: "2025-01-01", to: "2025-12-31" } },
  { id: "UC-DASH-10", name: "Luân chuyển tab tự động", module: "dashboard", mode: "skip", skipReason: "UI-only (auto-rotate/fullscreen)" },
  { id: "UC-DASH-11", name: "Xem badge menu", module: "dashboard", mode: "read", method: "GET", path: "/reports/badges" },

  // HD
  { id: "UC-HD-01", name: "Xem danh sách HĐ", module: "hop-dong", mode: "read", method: "GET", path: "/contracts" },
  { id: "UC-HD-02", name: "Xem chi tiết HĐ", module: "hop-dong", mode: "read", method: "GET", path: "/contracts/{contractId}", requiresId: "contractId" },
  { id: "UC-HD-03", name: "Tạo HĐ", module: "hop-dong", mode: "write_probe", method: "POST", path: "/contracts", body: {}, expectStatus: [400] },
  { id: "UC-HD-04", name: "Sửa HĐ", module: "hop-dong", mode: "write_probe", method: "PUT", path: "/contracts/{contractId}", body: {}, expectStatus: [400] },
  { id: "UC-HD-05", name: "Xóa HĐ", module: "hop-dong", mode: "write_probe", method: "DELETE", path: "/contracts/{contractId}", expectStatus: [404] },
  { id: "UC-HD-06", name: "Gán danh mục SP", module: "hop-dong", mode: "write_probe", method: "PUT", path: "/contracts/{contractId}/products", body: {}, expectStatus: [400] },
  { id: "UC-HD-07", name: "Sửa SP trong HĐ", module: "hop-dong", mode: "write_probe", method: "PUT", path: "/contracts/{contractId}/products/{productId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-HD-08", name: "Xem SP thuộc HĐ", module: "hop-dong", mode: "read", method: "GET", path: "/contracts/{contractId}/products", requiresId: "contractId" },
  { id: "UC-HD-09", name: "Chọn điều khoản mẫu", module: "hop-dong", mode: "read", method: "GET", path: "/contract-clauses" },
  { id: "UC-HD-10", name: "Điền nội dung điều khoản", module: "hop-dong", mode: "write_probe", method: "PUT", path: "/contracts/{contractId}", body: {}, expectStatus: [400] },
  { id: "UC-HD-11", name: "Xem phản ánh liên quan", module: "hop-dong", mode: "read", method: "GET", path: "/customer-feedbacks", query: { contractId: "{contractId}" }, requiresId: "contractId" },
  { id: "UC-HD-12", name: "Xem tài liệu HĐ", module: "hop-dong", mode: "read", method: "GET", path: "/documents", query: { contractId: "{contractId}" } },
  { id: "UC-HD-13", name: "Xử lý quy trình HĐ", module: "hop-dong", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "contract", entityId: "{contractId}" } },
  { id: "UC-HD-14", name: "Đính kèm tài liệu bước QT", module: "hop-dong", mode: "read", method: "GET", path: "/workflow-instances/{workflowInstanceId}/documents", expectStatus: [200, 404], requiresId: "workflowInstanceId" },
  { id: "UC-HD-DK-01", name: "Xem danh sách điều khoản mẫu", module: "hop-dong.dieu-khoan", mode: "read", method: "GET", path: "/contract-clauses" },
  { id: "UC-HD-DK-02", name: "Tạo/sửa/xóa điều khoản", module: "hop-dong.dieu-khoan", mode: "write_probe", method: "POST", path: "/contract-clauses", body: {}, expectStatus: [400] },
  { id: "UC-HD-DK-03", name: "Sắp xếp điều khoản", module: "hop-dong.dieu-khoan", mode: "write_probe", method: "PUT", path: "/contract-clauses/reorder", body: {}, expectStatus: [400] },
  { id: "UC-HD-DK-04", name: "Xem nhóm điều khoản", module: "hop-dong.dieu-khoan", mode: "read", method: "GET", path: "/contract-clause-groups" },
  { id: "UC-HD-DK-05", name: "Tạo/sửa/xóa nhóm", module: "hop-dong.dieu-khoan", mode: "write_probe", method: "POST", path: "/contract-clause-groups", body: {}, expectStatus: [400] },
  { id: "UC-HD-DK-06", name: "Gán điều khoản vào nhóm", module: "hop-dong.dieu-khoan", mode: "write_probe", method: "PUT", path: "/contract-clause-groups/{clauseGroupId}/members", body: {}, expectStatus: [400] },
  { id: "UC-HD-DK-07", name: "Kiểm tra điều khoản đang dùng", module: "hop-dong.dieu-khoan", mode: "read", method: "GET", path: "/contract-clauses/{clauseId}/usage", expectStatus: [200, 404] },

  // BG
  { id: "UC-BG-01", name: "Xem danh sách bàn giao", module: "ban-giao", mode: "read", method: "GET", path: "/handovers" },
  { id: "UC-BG-02", name: "Xem chi tiết phiếu BG", module: "ban-giao", mode: "read", method: "GET", path: "/handovers/{handoverId}", requiresId: "handoverId" },
  { id: "UC-BG-03", name: "Tạo phiếu bàn giao", module: "ban-giao", mode: "write_probe", method: "POST", path: "/handovers", body: {}, expectStatus: [400] },
  { id: "UC-BG-04", name: "Sửa phiếu bàn giao", module: "ban-giao", mode: "write_probe", method: "PUT", path: "/handovers/{handoverId}", body: { currentStep: 999 }, expectStatus: [400, 404], requiresId: "handoverId" },
  { id: "UC-BG-05", name: "Xóa phiếu bàn giao", module: "ban-giao", mode: "write_probe", method: "DELETE", path: "/handovers/{handoverId}", expectStatus: [200, 404] },
  { id: "UC-BG-06", name: "Xử lý quy trình bàn giao", module: "ban-giao", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "handover", entityId: "{handoverId}" } },
  { id: "UC-BG-07", name: "Đính kèm tài liệu bước BG", module: "ban-giao", mode: "read", method: "GET", path: "/workflow-instances/{workflowInstanceId}/documents", expectStatus: [200, 404], requiresId: "workflowInstanceId" },
  { id: "UC-BG-08", name: "Xem danh sách khóa HL", module: "ban-giao", mode: "read", method: "GET", path: "/training", query: { courseKind: "coaching" } },
  { id: "UC-BG-09", name: "Tạo khóa huấn luyện", module: "ban-giao", mode: "write_probe", method: "POST", path: "/training", body: {}, expectStatus: [400] },
  { id: "UC-BG-10", name: "Sửa/xóa khóa HL", module: "ban-giao", mode: "write_probe", method: "PUT", path: "/training/{trainingId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-BG-11", name: "Xử lý quy trình HL", module: "ban-giao", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "coaching", entityId: "{trainingId}" } },
  { id: "UC-BG-12", name: "Điền payload từng bước HL", module: "ban-giao", mode: "write_probe", method: "PUT", path: "/training/{coachingId}", body: { title: "" }, expectStatus: [400, 404], requiresId: "coachingId" },

  // BH
  { id: "UC-BH-01", name: "Xem danh sách phiếu BH/SC", module: "bao-hanh", mode: "read", method: "GET", path: "/warranties" },
  { id: "UC-BH-02", name: "Xem chi tiết phiếu", module: "bao-hanh", mode: "read", method: "GET", path: "/warranties/{warrantyId}", requiresId: "warrantyId" },
  { id: "UC-BH-03", name: "Tạo phiếu BH/SC", module: "bao-hanh", mode: "write_probe", method: "POST", path: "/warranties", body: {}, expectStatus: [400] },
  { id: "UC-BH-04", name: "Sửa phiếu", module: "bao-hanh", mode: "write_probe", method: "PUT", path: "/warranties/{warrantyId}", body: { type: "invalid_type" }, expectStatus: [400, 404], requiresId: "warrantyId" },
  { id: "UC-BH-05", name: "Xóa phiếu", module: "bao-hanh", mode: "write_probe", method: "DELETE", path: "/warranties/{warrantyId}", expectStatus: [200, 404] },
  { id: "UC-BH-06", name: "Xử lý quy trình BH", module: "bao-hanh", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "warranty", entityId: "{warrantyId}" } },
  { id: "UC-BH-07", name: "Điền form động theo bước", module: "bao-hanh", mode: "write_probe", method: "PUT", path: "/warranties/{warrantyId}", body: { stepPayloads: {} }, expectStatus: [400, 404] },
  { id: "UC-BH-08", name: "Đính kèm tài liệu bước BH", module: "bao-hanh", mode: "read", method: "GET", path: "/workflow-instances/{workflowInstanceId}/documents", expectStatus: [200, 404], requiresId: "workflowInstanceId" },

  // SP
  { id: "UC-SP-01", name: "Xem danh sách SP", module: "san-pham", mode: "read", method: "GET", path: "/products" },
  { id: "UC-SP-02", name: "Xem chi tiết SP", module: "san-pham", mode: "read", method: "GET", path: "/products/{productId}", requiresId: "productId" },
  { id: "UC-SP-03", name: "Tạo SP", module: "san-pham", mode: "write_probe", method: "POST", path: "/products", body: {}, expectStatus: [400] },
  { id: "UC-SP-04", name: "Sửa SP", module: "san-pham", mode: "write_probe", method: "PUT", path: "/products/{productId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-SP-05", name: "Xóa SP", module: "san-pham", mode: "write_probe", method: "DELETE", path: "/products/{productId}", expectStatus: [200, 404] },
  { id: "UC-SP-06", name: "Quản lý BOM", module: "san-pham", mode: "write_probe", method: "POST", path: "/products/{productId}/bom", body: {}, expectStatus: [400, 404] },
  { id: "UC-SP-07", name: "Quản lý thông số kỹ thuật", module: "san-pham", mode: "read", method: "GET", path: "/products/{productId}", requiresId: "productId" },
  { id: "UC-SP-08", name: "Quản lý serial linh kiện", module: "san-pham", mode: "write_probe", method: "PUT", path: "/products/{productId}/bom/{materialId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-SP-09", name: "Xem/gắn tài liệu SP", module: "san-pham", mode: "read", method: "GET", path: "/documents", query: { productId: "{productId}" } },
  { id: "UC-SP-10", name: "Xem lịch sử thay đổi", module: "san-pham", mode: "read", method: "GET", path: "/audit-logs", query: { entity: "product" } },
  { id: "UC-SP-11", name: "Xử lý quy trình SP", module: "san-pham", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "product", entityId: "{productId}" } },
  { id: "UC-SP-12", name: "Tab đào tạo trên SP", module: "san-pham", mode: "read", method: "GET", path: "/training" },

  // VT
  { id: "UC-VT-01", name: "Xem danh sách vật tư", module: "vat-tu", mode: "read", method: "GET", path: "/materials" },
  { id: "UC-VT-02", name: "Xem chi tiết vật tư", module: "vat-tu", mode: "read", method: "GET", path: "/materials/{materialId}", expectStatus: [200, 404] },
  { id: "UC-VT-03", name: "Nhập vật tư mới", module: "vat-tu", mode: "write_probe", method: "POST", path: "/materials", body: {}, expectStatus: [400] },
  { id: "UC-VT-04", name: "Sửa vật tư", module: "vat-tu", mode: "write_probe", method: "PUT", path: "/materials/{materialId}", body: { type: "invalid_type" }, expectStatus: [400, 404], requiresId: "materialId" },
  { id: "UC-VT-05", name: "Xóa vật tư", module: "vat-tu", mode: "write_probe", method: "DELETE", path: "/materials/{materialId}", expectStatus: [200, 404] },
  { id: "UC-VT-06", name: "Xem phiếu điều chuyển", module: "vat-tu", mode: "read", method: "GET", path: "/materials/transfers" },
  { id: "UC-VT-07", name: "Tạo phiếu điều chuyển", module: "vat-tu", mode: "write_probe", method: "POST", path: "/materials/transfers", body: {}, expectStatus: [400] },
  { id: "UC-VT-08", name: "Sửa/xóa phiếu điều chuyển", module: "vat-tu", mode: "write_probe", method: "PUT", path: "/materials/transfers/{transferId}", body: {}, expectStatus: [400, 404] },

  // KH
  { id: "UC-KH-01", name: "Xem danh sách KH", module: "khach-hang", mode: "read", method: "GET", path: "/customers" },
  { id: "UC-KH-02", name: "Xem chi tiết KH", module: "khach-hang", mode: "read", method: "GET", path: "/customers/{customerId}", expectStatus: [200, 404] },
  { id: "UC-KH-03", name: "Tạo KH", module: "khach-hang", mode: "write_probe", method: "POST", path: "/customers", body: {}, expectStatus: [400] },
  { id: "UC-KH-04", name: "Sửa KH", module: "khach-hang", mode: "write_probe", method: "PUT", path: "/customers/{customerId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-KH-05", name: "Xóa KH", module: "khach-hang", mode: "write_probe", method: "DELETE", path: "/customers/{customerId}", expectStatus: [200, 404] },
  { id: "UC-KH-06", name: "Quản lý liên hệ", module: "khach-hang", mode: "read", method: "GET", path: "/contacts" },
  { id: "UC-KH-07", name: "Quản lý hoạt động CRM", module: "khach-hang", mode: "read", method: "GET", path: "/crm-activities" },
  { id: "UC-KH-08", name: "Quản lý kỷ niệm KH", module: "khach-hang", mode: "read", method: "GET", path: "/customer-anniversaries" },
  { id: "UC-KH-09", name: "Đăng ký nhận TB kỷ niệm", module: "khach-hang", mode: "write_probe", method: "POST", path: "/anniversary-subscriptions", body: {}, expectStatus: [400] },

  // PA
  { id: "UC-PA-01", name: "Xem danh sách phản ánh", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks" },
  { id: "UC-PA-02", name: "Xem chi tiết phản ánh", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks/{feedbackId}", requiresId: "feedbackId" },
  { id: "UC-PA-03", name: "Tạo phản ánh", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks", body: {}, expectStatus: [400] },
  { id: "UC-PA-04", name: "Sửa phản ánh", module: "phan-anh", mode: "write_probe", method: "PUT", path: "/customer-feedbacks/{feedbackId}", body: { title: "" }, expectStatus: [400, 404], requiresId: "feedbackId" },
  { id: "UC-PA-05", name: "Xóa phản ánh", module: "phan-anh", mode: "write_probe", method: "DELETE", path: "/customer-feedbacks/{feedbackId}", expectStatus: [200, 404] },
  { id: "UC-PA-06", name: "Phân công người/vai trò", module: "phan-anh", mode: "write_probe", method: "PUT", path: "/customer-feedbacks/{feedbackId}", body: { assignees: {} }, expectStatus: [400, 404] },
  { id: "UC-PA-07", name: "Phân luồng theo SP/đơn vị", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks/routing-preview", query: { productIds: "{productId}" }, requiresId: "productId" },
  { id: "UC-PA-08", name: "Cập nhật xử lý đơn vị", module: "phan-anh", mode: "write_probe", method: "PATCH", path: "/customer-feedbacks/{feedbackId}/assignments/{assignmentId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-09", name: "Bình luận phản ánh", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks/{feedbackId}/comments", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-10", name: "Yêu cầu đóng", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks/{feedbackId}/request-close", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-11", name: "Đóng phản ánh", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks/{feedbackId}/close", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-12", name: "Hoàn tất sửa chữa & đóng", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks/{feedbackId}/complete-repair-close", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-13", name: "Mở lại phản ánh", module: "phan-anh", mode: "write_probe", method: "POST", path: "/customer-feedbacks/{feedbackId}/reopen", body: {}, expectStatus: [400, 404] },
  { id: "UC-PA-14", name: "Xem tóm tắt công việc PA", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks/summary" },
  { id: "UC-PA-15", name: "Thống kê theo KH/SP/VT", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks/analytics/by-customer" },
  { id: "UC-PA-16", name: "Lọc theo đơn vị của tôi", module: "phan-anh", mode: "read", method: "GET", path: "/customer-feedbacks", query: { myUnits: "true" } },
  { id: "UC-PA-17", name: "Cấu hình đơn vị thực hiện", module: "phan-anh", mode: "read", method: "GET", path: "/feedback-execution-units" },
  { id: "UC-PA-18", name: "Cấu hình quy tắc routing", module: "phan-anh", mode: "read", method: "GET", path: "/feedback-execution-units/routing-rules/list" },

  // BC
  { id: "UC-BC-01", name: "Báo cáo theo khách hàng", module: "bao-cao", mode: "read", method: "GET", path: "/reports" },
  { id: "UC-BC-02", name: "Báo cáo theo hợp đồng", module: "bao-cao", mode: "read", method: "GET", path: "/reports" },
  { id: "UC-BC-03", name: "Báo cáo theo dòng SP", module: "bao-cao", mode: "read", method: "GET", path: "/reports/by-product-line" },
  { id: "UC-BC-04", name: "Báo cáo phản ánh", module: "bao-cao", mode: "read", method: "GET", path: "/reports/feedback/by-customer" },
  { id: "UC-BC-05", name: "Báo cáo đơn vị thực hiện", module: "bao-cao", mode: "read", method: "GET", path: "/reports" },
  { id: "UC-BC-06", name: "Báo cáo lỗi vật tư", module: "bao-cao", mode: "read", method: "GET", path: "/reports/material-defects" },
  { id: "UC-BC-07", name: "Lọc báo cáo", module: "bao-cao", mode: "read", method: "GET", path: "/reports", query: { year: "2025", from: "2025-01-01", to: "2025-12-31" } },
  { id: "UC-BC-08", name: "Xuất Excel", module: "bao-cao", mode: "skip", skipReason: "UI export client-side" },
  { id: "UC-BC-09", name: "In báo cáo", module: "bao-cao", mode: "skip", skipReason: "UI print client-side" },

  // DT
  { id: "UC-DT-01", name: "Xem danh sách đề tài", module: "de-tai", mode: "read", method: "GET", path: "/research-projects" },
  { id: "UC-DT-02", name: "Xem chi tiết đề tài", module: "de-tai", mode: "read", method: "GET", path: "/research-projects/{researchProjectId}", requiresId: "researchProjectId" },
  { id: "UC-DT-03", name: "Tạo đề tài", module: "de-tai", mode: "write_probe", method: "POST", path: "/research-projects", body: {}, expectStatus: [400] },
  { id: "UC-DT-04", name: "Sửa đề tài", module: "de-tai", mode: "write_probe", method: "PUT", path: "/research-projects/{researchProjectId}", body: { progress: 999 }, expectStatus: [400, 404], requiresId: "researchProjectId" },
  { id: "UC-DT-05", name: "Xóa đề tài", module: "de-tai", mode: "write_probe", method: "DELETE", path: "/research-projects/{researchProjectId}", expectStatus: [200, 404] },

  // CV
  { id: "UC-CV-01", name: "Xem Kanban", module: "cong-viec", mode: "read", method: "GET", path: "/tasks" },
  { id: "UC-CV-02", name: "Xem danh sách", module: "cong-viec", mode: "read", method: "GET", path: "/tasks" },
  { id: "UC-CV-03", name: "Xem lịch", module: "cong-viec", mode: "read", method: "GET", path: "/tasks" },
  { id: "UC-CV-04", name: "Tạo công việc", module: "cong-viec", mode: "write_probe", method: "POST", path: "/tasks", body: {}, expectStatus: [400] },
  { id: "UC-CV-05", name: "Sửa công việc", module: "cong-viec", mode: "write_probe", method: "PUT", path: "/tasks/{taskId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-CV-06", name: "Xóa công việc", module: "cong-viec", mode: "write_probe", method: "DELETE", path: "/tasks/{taskId}", expectStatus: [200, 404] },
  { id: "UC-CV-07", name: "Lọc theo ưu tiên/loại", module: "cong-viec", mode: "read", method: "GET", path: "/tasks", query: { priorityCode: "high", type: "research" } },

  // DTao
  { id: "UC-DTao-01", name: "Xem danh sách khóa", module: "dao-tao", mode: "read", method: "GET", path: "/training", query: { courseKind: "training" } },
  { id: "UC-DTao-02", name: "Xem chi tiết khóa", module: "dao-tao", mode: "read", method: "GET", path: "/training/{trainingId}", expectStatus: [200, 404], requiresId: "trainingId" },
  { id: "UC-DTao-03", name: "Tạo khóa", module: "dao-tao", mode: "write_probe", method: "POST", path: "/training", body: {}, expectStatus: [400] },
  { id: "UC-DTao-04", name: "Sửa/xóa khóa", module: "dao-tao", mode: "write_probe", method: "PUT", path: "/training/{trainingId}", body: {}, expectStatus: [400, 404] },
  { id: "UC-DTao-05", name: "Quản lý học viên", module: "dao-tao", mode: "write_probe", method: "POST", path: "/training/{trainingId}/trainees", body: {}, expectStatus: [400, 404] },
  { id: "UC-DTao-06", name: "Quản lý lịch học", module: "dao-tao", mode: "write_probe", method: "POST", path: "/training/{trainingId}/sessions", body: {}, expectStatus: [400, 404] },
  { id: "UC-DTao-07", name: "Xử lý quy trình khóa", module: "dao-tao", mode: "read", method: "GET", path: "/workflows/instances", query: { moduleKey: "training", entityId: "{trainingId}" } },

  // TL
  { id: "UC-TL-01", name: "Xem danh sách tài liệu", module: "tai-lieu", mode: "read", method: "GET", path: "/documents" },
  { id: "UC-TL-02", name: "Xem chi tiết/tải file", module: "tai-lieu", mode: "read", method: "GET", path: "/documents/{documentId}", requiresId: "documentId" },
  { id: "UC-TL-03", name: "Tạo metadata tài liệu", module: "tai-lieu", mode: "write_probe", method: "POST", path: "/documents", body: {}, expectStatus: [400] },
  { id: "UC-TL-04", name: "Upload file", module: "tai-lieu", mode: "skip", skipReason: "Multipart upload — cần file thật" },
  { id: "UC-TL-05", name: "Sửa tài liệu", module: "tai-lieu", mode: "write_probe", method: "PUT", path: "/documents/{documentId}", body: { name: "" }, expectStatus: [400, 404], requiresId: "documentId" },
  { id: "UC-TL-06", name: "Xóa tài liệu", module: "tai-lieu", mode: "write_probe", method: "DELETE", path: "/documents/{documentId}", expectStatus: [200, 404] },
  { id: "UC-TL-07", name: "Lọc theo loại", module: "tai-lieu", mode: "read", method: "GET", path: "/documents", query: { fileType: "pdf" } },
  { id: "UC-TL-08", name: "Liên kết HĐ/SP/đề tài", module: "tai-lieu", mode: "write_probe", method: "POST", path: "/documents", body: { contractId: "{contractId}" }, expectStatus: [400] },

  // QT
  { id: "UC-QT-01", name: "Xem tổng quan nhóm QT", module: "quy-trinh", mode: "read", method: "GET", path: "/workflows" },
  { id: "UC-QT-02", name: "Xem QT theo module", module: "quy-trinh", mode: "read", method: "GET", path: "/workflows", query: { moduleKey: "handover" } },
  { id: "UC-QT-03", name: "Tạo quy trình", module: "quy-trinh", mode: "write_probe", method: "POST", path: "/workflows", body: {}, expectStatus: [400] },
  { id: "UC-QT-04", name: "Sửa thông tin QT", module: "quy-trinh", mode: "write_probe", method: "PUT", path: "/workflows/{workflowId}", body: { moduleKey: "invalid_module" }, expectStatus: [400, 404], requiresId: "workflowId" },
  { id: "UC-QT-05", name: "Xóa quy trình", module: "quy-trinh", mode: "write_probe", method: "DELETE", path: "/workflows/{workflowId}", expectStatus: [200, 400, 404], requiresId: "workflowId" },
  { id: "UC-QT-06", name: "Thêm/sửa/xóa bước", module: "quy-trinh", mode: "write_probe", method: "POST", path: "/workflows/{workflowId}/steps", body: {}, expectStatus: [400, 404] },
  { id: "UC-QT-07", name: "Sắp xếp lại bước", module: "quy-trinh", mode: "write_probe", method: "PUT", path: "/workflows/{workflowId}/steps/reorder", body: {}, expectStatus: [400, 404] },
  { id: "UC-QT-08", name: "Cấu hình trường nhập bước", module: "quy-trinh", mode: "write_probe", method: "PUT", path: "/workflows/{workflowId}/steps/fake-step", body: {}, expectStatus: [400, 404] },
  { id: "UC-QT-09", name: "Tạo bộ bước chuẩn", module: "quy-trinh", mode: "write_probe", method: "POST", path: "/workflows/{workflowId}/steps", body: {}, expectStatus: [400, 404] },
  { id: "UC-QT-10", name: "Gắn QT cho entity", module: "quy-trinh", mode: "write_probe", method: "POST", path: "/workflows/instances/attach", body: {}, expectStatus: [400] },
  { id: "UC-QT-11", name: "Chuyển bước QT", module: "quy-trinh", mode: "write_probe", method: "POST", path: "/workflows/instances/{workflowInstanceId}/advance", body: {}, expectStatus: [400, 404] },
  { id: "UC-QT-12", name: "Xem lịch sử bước", module: "quy-trinh", mode: "read", method: "GET", path: "/workflows/instances/{workflowInstanceId}", expectStatus: [200, 404], requiresId: "workflowInstanceId" },
  { id: "UC-QT-13", name: "Đính kèm tài liệu instance", module: "quy-trinh", mode: "read", method: "GET", path: "/workflow-instances/{workflowInstanceId}/documents", expectStatus: [200, 404], requiresId: "workflowInstanceId" },

  // CD
  { id: "UC-CD-01", name: "Quản lý người dùng", module: "cai-dat", mode: "read", method: "GET", path: "/users" },
  { id: "UC-CD-02", name: "Quản lý vai trò", module: "cai-dat", mode: "read", method: "GET", path: "/roles" },
  { id: "UC-CD-03", name: "Ma trận phân quyền", module: "cai-dat", mode: "read", method: "GET", path: "/role-permissions" },
  { id: "UC-CD-04", name: "Cấu hình TB cá nhân", module: "cai-dat", mode: "read", method: "GET", path: "/notification-preferences" },
  { id: "UC-CD-05", name: "Cấu hình đơn vị PA", module: "cai-dat", mode: "read", method: "GET", path: "/feedback-execution-units" },
  { id: "UC-CD-06", name: "Cấu hình hệ thống", module: "cai-dat", mode: "read", method: "GET", path: "/system-settings" },
  { id: "UC-CD-07", name: "Quản lý phiên đăng nhập", module: "cai-dat", mode: "read", method: "GET", path: "/auth/sessions" },
  { id: "UC-CD-08", name: "Xem nhật ký audit", module: "cai-dat", mode: "read", method: "GET", path: "/audit-logs" },
  { id: "UC-CD-09", name: "Quản lý danh mục thuộc tính", module: "cai-dat", mode: "read", method: "GET", path: "/definitions", query: { category: "customer_source" } },
  { id: "UC-CD-10", name: "Sắp xếp danh mục", module: "cai-dat", mode: "write_probe", method: "PUT", path: "/definitions/reorder", body: {}, expectStatus: [400] },
  { id: "UC-CD-11", name: "Kiểm tra danh mục đang dùng", module: "cai-dat", mode: "read", method: "GET", path: "/definitions/{definitionId}/usage", expectStatus: [200, 404] },

  // TB
  { id: "UC-TB-01", name: "Xem danh sách thông báo", module: "thong-bao", mode: "read", method: "GET", path: "/notifications" },
  { id: "UC-TB-02", name: "Đánh dấu đã đọc", module: "thong-bao", mode: "write_probe", method: "POST", path: "/notifications/{notificationId}/read", body: {}, expectStatus: [200, 404] },
  { id: "UC-TB-03", name: "Đánh dấu tất cả đã đọc", module: "thong-bao", mode: "write_probe", method: "POST", path: "/notifications/read-all", body: {}, expectStatus: [200] },
  { id: "UC-TB-04", name: "Điều hướng từ thông báo", module: "thong-bao", mode: "skip", skipReason: "UI routing" },
  { id: "UC-TB-05", name: "Nhận thông báo tự động", module: "thong-bao", mode: "skip", skipReason: "Hệ thống tự phát sinh" },
];

function probeContext(ctx) {
  const p = { ...ctx };
  for (const key of Object.keys(p)) {
    if (key.endsWith("Id") && key !== "sessionId") p[key] = PROBE_ID;
  }
  return p;
}

function resolveQuery(query, ctx) {
  if (!query) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(query)) {
    out[k] = replacePath(String(v), ctx);
  }
  return out;
}

function resolveBody(body, ctx, refreshToken) {
  if (body === undefined) return undefined;
  const raw = JSON.stringify(body).replace("__REFRESH__", refreshToken ?? "invalid");
  return JSON.parse(replacePath(raw, ctx));
}

async function runCase(uc, token, ctx, refreshToken) {
  if (uc.mode === "skip") {
    return { status: "skipped", reason: uc.skipReason };
  }

  if (uc.requiresId && !ctx._real?.[uc.requiresId]) {
    return { status: "no_data", reason: `Không có dữ liệu mẫu (${uc.requiresId})` };
  }

  const pathCtx =
    uc.mode === "write_probe" && uc.method === "DELETE" && uc.id !== "UC-AUTH-05"
      ? probeContext(ctx)
      : ctx;
  const path = replacePath(uc.path, pathCtx);
  const query = resolveQuery(uc.query, ctx);
  let body = resolveBody(uc.body, ctx, refreshToken);

  const useToken = uc.id === "UC-AUTH-01" ? undefined : token;

  if (uc.mode === "auth_refresh") {
    const res = await api(uc.method, path, { body: { refreshToken } });
    const ok = (uc.expectStatus ?? [200]).includes(res.status) && res.json?.success === true;
    return { status: ok ? "pass" : "fail", http: res.status, message: res.json?.message ?? null };
  }

  const res = await api(uc.method, path, { token: useToken, body, query });

  const resultBase = { http: res.status, message: res.json?.message ?? null, path, query: query ?? null };

  if (uc.mode === "read") {
    const ok = res.status === 200 && res.json?.success === true;
    return {
      status: ok ? "pass" : "fail",
      http: res.status,
      message: res.json?.message ?? null,
    };
  }

  if (uc.mode === "auth") {
    const ok = (uc.expectStatus ?? [200]).includes(res.status) && res.json?.success === true;
    return { status: ok ? "pass" : "fail", http: res.status, message: res.json?.message ?? null };
  }

  if (uc.mode === "write_probe") {
    const allowed = uc.expectStatus ?? [400];
    const ok = allowed.includes(res.status) && res.status !== 500;
    if (res.status === 403) {
      return { status: "fail", http: 403, message: res.json?.message ?? "Forbidden" };
    }
    return {
      status: ok ? "pass" : "fail",
      http: res.status,
      message: res.json?.message ?? null,
    };
  }

  return { status: "fail", http: res.status, message: "Unknown mode" };
}

async function main() {
  log({ message: "uc-smoke-start", data: { base: BASE, total: UC_CASES.length } });

  const health = await api("GET", "/health");
  if (health.status !== 200) {
    console.error("Backend không sẵn sàng:", health.status);
    process.exit(1);
  }

  const adminAuth = await login(ROLES[0].email, ROLES[0].password);
  const ctx = await buildContext(adminAuth.token);

  const results = [];
  for (const uc of UC_CASES) {
    const r = await runCase(uc, adminAuth.token, ctx, adminAuth.refreshToken);
    results.push({ id: uc.id, name: uc.name, module: uc.module, mode: uc.mode, ...r });
    log({ message: "uc-case", hypothesisId: r.status === "pass" ? "H1" : "H2", data: { id: uc.id, ...r } });
  }

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.status === "pass").length,
    fail: results.filter((r) => r.status === "fail").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    no_data: results.filter((r) => r.status === "no_data").length,
    testedAt: new Date().toISOString(),
  };

  const byModule = {};
  for (const r of results) {
    if (!byModule[r.module]) byModule[r.module] = { pass: 0, fail: 0, skipped: 0, no_data: 0, fails: [] };
    const bucket =
      r.status === "pass" ? "pass" : r.status === "skipped" ? "skipped" : r.status === "no_data" ? "no_data" : "fail";
    byModule[r.module][bucket]++;
    if (r.status === "fail") {
      byModule[r.module].fails.push({ id: r.id, name: r.name, http: r.http, message: r.message });
    }
  }

  const report = { summary, byModule, results };
  const outPath = resolve(__dirname, "uc-smoke-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  log({ message: "uc-smoke-done", data: summary });
  console.log(JSON.stringify({ summary, failures: results.filter((r) => r.status === "fail") }, null, 2));
  process.exit(summary.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
