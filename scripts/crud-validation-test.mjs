/**
 * Kiểm tra phản hồi lỗi validation khi gửi dữ liệu sai qua API CRUD (không insert DB trực tiếp).
 * Chạy: node scripts/crud-validation-test.mjs
 */
const BASE = process.env.API_BASE ?? "http://127.0.0.1:4001/api/v1";

async function api(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json;
  try {
    json = await res.json();
  } catch {
    json = { success: false, message: "Non-JSON response", data: null };
  }
  return { status: res.status, ...json };
}

async function login() {
  const res = await api("POST", "/auth/login", {
    email: "admin@demo.local",
    password: "Password123!",
  });
  if (!res.success || !res.data?.token) {
    throw new Error(`Login failed: ${res.message ?? res.status}`);
  }
  return res.data.token;
}

/** @type {Array<{screen:string, method:string, path:string, case:string, payload:unknown, expectStatus:number, noAuth?:boolean}>} */
const CASES = [
  { screen: "Đăng nhập", method: "POST", path: "/auth/login", case: "Email trống", payload: { email: "", password: "x" }, expectStatus: 400, noAuth: true },
  { screen: "Đăng nhập", method: "POST", path: "/auth/login", case: "Email sai định dạng", payload: { email: "not-email", password: "Password123!" }, expectStatus: 400, noAuth: true },
  { screen: "Khách hàng", method: "POST", path: "/customers", case: "Body rỗng", payload: {}, expectStatus: 400 },
  { screen: "Khách hàng", method: "POST", path: "/customers", case: "Tên trống + email sai", payload: { name: "", email: "abc" }, expectStatus: 400 },
  { screen: "Liên hệ (CRM)", method: "POST", path: "/contacts", case: "Thiếu khách hàng và họ tên", payload: {}, expectStatus: 400 },
  { screen: "Liên hệ (CRM)", method: "POST", path: "/contacts", case: "customerId rỗng", payload: { customerId: "", fullName: "Nguyễn A" }, expectStatus: 400 },
  { screen: "Hoạt động CRM", method: "POST", path: "/crm-activities", case: "Body rỗng", payload: {}, expectStatus: 400 },
  { screen: "Hoạt động CRM", method: "POST", path: "/crm-activities", case: "type/status enum sai", payload: { customerId: "x", type: "sms", title: "T", status: "open", activityAt: "2025-01-01" }, expectStatus: 400 },
  { screen: "Hợp đồng", method: "POST", path: "/contracts", case: "Thiếu trường bắt buộc", payload: {}, expectStatus: 400 },
  { screen: "Hợp đồng", method: "POST", path: "/contracts", case: "value không phải số", payload: { customerId: "c1", title: "HD", value: "abc", startDate: "2025-01-01", endDate: "2025-12-31" }, expectStatus: 400 },
  { screen: "Hợp đồng", method: "POST", path: "/contracts", case: "status enum sai", payload: { customerId: "c1", title: "HD", value: 100, startDate: "2025-01-01", endDate: "2025-12-31", status: "cancelled" }, expectStatus: 400 },
  { screen: "Sản phẩm", method: "POST", path: "/products", case: "Thiếu mã/tên/loại", payload: {}, expectStatus: 400 },
  { screen: "Sản phẩm", method: "POST", path: "/products", case: "yearReleased ngoài khoảng", payload: { code: "P1", name: "SP", category: "cat", yearReleased: 1700 }, expectStatus: 400 },
  { screen: "Sản phẩm", method: "PUT", path: "/products/fake-id", case: "Cập nhật body rỗng", payload: {}, expectStatus: 400 },
  { screen: "Vật tư", method: "POST", path: "/materials", case: "Body rỗng", payload: {}, expectStatus: 400 },
  { screen: "Vật tư", method: "POST", path: "/materials", case: "type sai + quantity âm", payload: { code: "VT1", name: "Vật tư", type: "other", quantity: -5, unit: "cái", warehouse: "K1" }, expectStatus: 400 },
  { screen: "Điều chuyển vật tư", method: "POST", path: "/materials/transfers", case: "Thiếu trường bắt buộc", payload: {}, expectStatus: 400 },
  { screen: "Điều chuyển vật tư", method: "POST", path: "/materials/transfers", case: "quantity = 0", payload: { materialId: "m1", quantity: 0, destination: "K2", type: "contract" }, expectStatus: 400 },
  { screen: "Bàn giao", method: "POST", path: "/handovers", case: "Thiếu contractId", payload: {}, expectStatus: 400 },
  { screen: "Bàn giao", method: "POST", path: "/handovers", case: "currentStep > 99", payload: { contractId: "c1", currentStep: 150 }, expectStatus: 400 },
  { screen: "Bảo hành", method: "POST", path: "/warranties", case: "Thiếu customerId/issue/type", payload: {}, expectStatus: 400 },
  { screen: "Bảo hành", method: "POST", path: "/warranties", case: "type enum sai", payload: { customerId: "c1", issue: "Lỗi", type: "broken" }, expectStatus: 400 },
  { screen: "Phản ánh khách hàng", method: "POST", path: "/customer-feedbacks", case: "Thiếu trường bắt buộc", payload: {}, expectStatus: 400 },
  { screen: "Phản ánh khách hàng", method: "POST", path: "/customer-feedbacks", case: "Không chọn người phân công", payload: { customerId: "c1", title: "PA", content: "Nội dung", feedbackAt: "2025-06-01" }, expectStatus: 400 },
  { screen: "Huấn luyện", method: "POST", path: "/training", case: "Thiếu title/typeCode/ngày", payload: {}, expectStatus: 400 },
  { screen: "Huấn luyện", method: "POST", path: "/training", case: "typeCode rỗng", payload: { title: "Khóa A", typeCode: "", startDate: "2025-01-01", endDate: "2025-01-02" }, expectStatus: 400 },
  { screen: "Nhiệm vụ", method: "POST", path: "/tasks", case: "Thiếu tiêu đề", payload: {}, expectStatus: 400 },
  { screen: "Nhiệm vụ", method: "POST", path: "/tasks", case: "progress > 100", payload: { title: "NV", progress: 150 }, expectStatus: 400 },
  { screen: "Nhiệm vụ", method: "POST", path: "/tasks", case: "status enum sai", payload: { title: "NV", status: "blocked" }, expectStatus: 400 },
  { screen: "Dự án nghiên cứu", method: "POST", path: "/research-projects", case: "Thiếu mã/tên/ngày", payload: {}, expectStatus: 400 },
  { screen: "Dự án nghiên cứu", method: "POST", path: "/research-projects", case: "Ngày không hợp lệ", payload: { code: "DA1", name: "DA", startDate: "invalid", endDate: "2025-12-31" }, expectStatus: 400 },
  { screen: "Tài liệu", method: "POST", path: "/documents", case: "Thiếu name/category/fileType", payload: {}, expectStatus: 400 },
  { screen: "Tài liệu", method: "POST", path: "/documents", case: "fileType enum sai", payload: { name: "file.pdf", categoryCode: "general", fileType: "zip" }, expectStatus: 400 },
  { screen: "Người dùng", method: "POST", path: "/users", case: "Thiếu trường bắt buộc", payload: {}, expectStatus: 400 },
  { screen: "Người dùng", method: "POST", path: "/users", case: "Mật khẩu ngắn + email sai", payload: { fullName: "User", email: "bad", password: "123", roleCode: "admin" }, expectStatus: 400 },
  { screen: "Người dùng", method: "POST", path: "/users", case: "roleCode không tồn tại", payload: { fullName: "User", email: "u@test.local", password: "Password123!", roleCode: "superadmin" }, expectStatus: 400 },
];

function flattenFieldErrors(data) {
  if (!data || typeof data !== "object") return [];
  const fe = data.fieldErrors ?? data.details?.fieldErrors;
  if (!fe) return [];
  return Object.entries(fe).flatMap(([field, msgs]) =>
    (Array.isArray(msgs) ? msgs : [msgs]).map((m) => ({ field, message: m })),
  );
}

function hasEnglishFieldErrors(fieldErrors) {
  return fieldErrors.some((f) =>
    /invalid |too small|too big|expected |received /i.test(f.message),
  );
}

async function main() {
  let token;
  try {
    token = await login();
  } catch (e) {
    console.error("Không đăng nhập được — backend có đang chạy?", e.message);
    process.exit(1);
  }

  const results = [];
  const issues = [];

  for (const tc of CASES) {
    const auth = tc.noAuth ? undefined : token;
    const res = await api(tc.method, tc.path, tc.payload, auth);
    const fieldErrors = flattenFieldErrors(res.data);
    const passed = res.status === tc.expectStatus && res.success === false && !hasEnglishFieldErrors(fieldErrors);

    results.push({
      screen: tc.screen,
      case: tc.case,
      passed,
      message: res.message ?? null,
      fieldErrors,
    });

    if (!passed) {
      issues.push({
        screen: tc.screen,
        case: tc.case,
        status: res.status,
        message: res.message,
        fieldErrors,
      });
    }
  }

  const report = {
    summary: {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: issues.length,
      testedAt: new Date().toISOString(),
    },
    issues,
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
