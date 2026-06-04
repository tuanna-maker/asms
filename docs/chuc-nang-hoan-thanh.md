# Tổng hợp chức năng đã chạy ổn & hoàn thành

| Thuộc tính | Nội dung |
|---|---|
| **Phiên bản** | 1.0 |
| **Cập nhật** | 03/06/2026 |
| **Phạm vi** | Toàn bộ ERP ASMS — theo rà soát code, UAT checklist và mapping API |
| **Nguồn** | [ra-soat-chuc-nang-he-thong.md](./ra-soat-chuc-nang-he-thong.md), [uat-checklist.md](./uat-checklist.md), [frontend-backend-mapping.md](./frontend-backend-mapping.md) |
| **Bảng sửa/mới sau họp** | [chuc-nang-sua-va-moi-sau-hop.md](./chuc-nang-sua-va-moi-sau-hop.md) — **một bảng** có cột **Đã hoàn thành** |

**Chú thích trạng thái**

| Ký hiệu | Ý nghĩa |
|--------|---------|
| ✅ | Luồng FE ↔ BE hoàn chỉnh cho mục đích chính của màn; có thể thao tác CRUD/đọc theo RBAC |
| ⚠️ | Có UI/API nhưng còn mock, chỉ đọc, hoặc thiếu nhánh nghiệp vụ — xem [mục 4](#4-chức-năng-hoàn-thành-một-phần-) |

**Lưu ý:** Hoàn thành **theo code** không đồng nghĩa đã UAT nghiệp vụ VTX đầy đủ. Trước release cần chạy [uat-checklist.md](./uat-checklist.md) theo từng role.

---

## 1. Theo module (bảng chính)

| STT | Module | Route FE | Chức năng đã hoàn thành | API / module BE | Ghi chú giới hạn |
|:---:|--------|----------|-------------------------|-----------------|------------------|
| 1 | **Xác thực** | `/login` | Đăng nhập JWT, refresh token tự động, đăng xuất, chặn route khi hết phiên | `auth` | Production: không đăng ký công khai |
| 2 | **Dashboard** | `/` | Tab Tổng quan, Doanh thu, Dự án, Sản phẩm, Bảo hành, Vật tư — dữ liệu live; lọc năm/KH | contracts, reports, products, warranties, materials, handovers, training | Tab KH tổng hợp ⚠️; Cảnh báo rule-based ⚠️ |
| 3 | **Khách hàng / CRM** | `/khach-hang` | CRUD khách hàng; CRUD liên hệ; CRUD hoạt độ CRM (call/email/meeting/note); lọc theo KH | `customers`, `contacts`, `crm-activities` | Chưa có màn 360° tài chính (CRM-04 backlog) |
| 4 | **Hợp đồng** | `/hop-dong` | Danh sách, tạo, sửa, xóa mềm; `customerId`; tab điều khoản (`clauseIds` + legacy `terms`); tab BG/HL + workflow; nhật ký trên chi tiết; 1 BG + 1 HL/HĐ | `contracts`, `contract-clauses` | Tab SP/tài liệu trong sheet chi tiết chỉ đọc ⚠️ |
| 5 | **Phản ánh KH** | `/phan-anh` (+ con) | CRUD; wizard tạo; chi tiết + workflow; comment issue/fix; thống kê; phân công; liên kết HĐ/SP/VT; lọc theo quyền | `customer-feedbacks`, `feedback-execution-units` | Module mới sau họp — đã nối BE đầy đủ |
| 6 | **Bàn giao** | `/ban-giao` | CRUD; filter; gắn HĐ eligible; workflow runtime; `stepPayloads` | `handovers`, `workflows` | Huấn luyện (coaching) qua tab HĐ/BG, không list `/dao-tao` |
| 7 | **Bảo hành / SC** | `/bao-hanh` | CRUD phiếu; form động theo quy trình; phê duyệt/trả lại bước; đổi quy trình | `warranties`, `workflows` | Không còn 5 tab form cố định cũ |
| 8 | **Sản phẩm** | `/san-pham` | CRUD; phân loại từ Definitions; ảnh qua documents; quy trình SP; cột bước QT; BOM editor | `products`, `workflows`, `documents` | Dialog chi tiết: BOM/lịch sử một phần mock ⚠️ |
| 9 | **Vật tư** | `/vat-tu` | CRUD; điều chuyển; validation tồn; quét mã (UI); chi tiết + lịch sử chuyển | `materials` | Dialog chi tiết có fallback mock ⚠️ |
| 10 | **Quy trình** | `/quy-trinh` | Overview theo module; list workflow; editor bước (fieldSchema, SLA, role); reorder; runtime trên BG/BH/ĐT/HL/SP | `workflows`, `workflow-documents` | Chưa bắt buộc file trước phê duyệt (WF-06 backlog) |
| 11 | **Đào tạo** | `/dao-tao`, `/dao-tao/:id` | CRUD khóa (`courseKind=training`); học viên; buổi học; stepPayloads + phê duyệt bước | `training` | Huấn luyện (`coaching`) không list ở đây |
| 12 | **Báo cáo** | `/bao-cao` | 5 tab (KH, HĐ, dòng SP, Phản ánh 3 sub, Đơn vị TH); lọc năm/khoảng ngày; xuất Excel/PDF | `reports` | Tab phản ánh báo cáo chủ yếu từ warranty |
| 13 | **Công việc** | `/cong-viec` | Kanban / List / Lịch; CRUD task; cập nhật tiến độ/trạng thái | `tasks` | Nhãn màu từ file constants, data từ API |
| 14 | **Đề tài NCKH** | `/de-tai`, `/de-tai/:id` | CRUD; chi tiết; task con map từ API | `research-projects` | Label UI type từ `researchData` ⚠️ |
| 15 | **Tài liệu** | `/tai-lieu` | CRUD metadata; upload multipart | `documents` | Module quản lý tài liệu tổng — ưu tiên thấp so với doc trên HĐ/bước QT |
| 16 | **Thông báo** | `/thong-bao` | Danh sách; đếm chưa đọc; đánh dấu đã đọc; bell header điều hướng | `notifications`, `notification-preferences` | — |
| 17 | **Cài đặt** | `/cai-dat` | Users; Roles; Phân quyền (ma trận CRUD); Notifications prefs; Hệ thống (SLA, cron…); Phiên đăng nhập; Nhật ký audit | `users`, `roles`, `role-permissions`, `system-settings`, `audit-logs` | Manager: read-only tùy matrix |
| 18 | **Thuộc tính** | `/cai-dat/thuoc-tinh/:moduleKey` | CRUD định nghĩa theo module; kéo thả thứ tự; xóa có breakdown; điều khoản HĐ + nhóm điều khoản | `definitions`, `contract-clauses` | — |

### Route phản ánh (chi tiết)

| Route | Chức năng |
|-------|-----------|
| `/phan-anh` | Danh sách, lọc, tạo nhanh, mở chi tiết/sửa |
| `/phan-anh/moi` | Wizard tiếp nhận đa bước |
| `/phan-anh/:id` | Chi tiết, timeline, comment, panel quy trình |
| `/phan-anh/:id/sua` | Form sửa đầy đủ |
| `/phan-anh/thong-ke` | Báo cáo thống kê theo KH / SP / vật tư |

### Route quy trình (chi tiết)

| Route | Chức năng |
|-------|-----------|
| `/quy-trinh` | Thẻ module: handover, warranty, training, coaching, contract, product |
| `/quy-trinh/:moduleKey` | Danh sách workflow của module |
| `/quy-trinh/:moduleKey/:workflowId` | Editor: thông tin, header fields, bước, reorder, lưu |

---

## 2. Theo vai trò (tóm tắt RBAC)

| Role | Truy cập menu (điển hình) | Thao tác ghi (điển hình) |
|------|--------------------------|---------------------------|
| `admin` | Toàn bộ màn | CRUD mọi module; sửa ma trận phân quyền; cấu hình hệ thống |
| `manager` | Gần như admin, trừ một số module write | CRUD nghiệp vụ; đọc nhật ký; không xóa role hệ thống |
| `sales` | KH, HĐ, báo cáo, CRM… | Tạo/sửa HĐ, KH theo matrix |
| `technician` | BG, BH, VT, SP (không HĐ) | Xử lý bàn giao, bảo hành, vật tư; phê duyệt bước đúng role |
| `viewer` | Đọc hầu hết (không Đề tài) | Không nút Tạo/Sửa/Xóa trên module read-only |

- Menu: `use-role` → `canAccess(path)` theo `ROUTE_PERMISSIONS`.
- Nút & API: `canDo(moduleKey, action)` ↔ `role_permissions` DB; API trả **403** khi không đủ quyền.
- Chi tiết ma trận: [SRS-ASMS.md](./SRS-ASMS.md) §8, [uat-checklist.md](./uat-checklist.md) § RBAC.

---

## 3. Module backend (đối chiếu UI)

| Module BE | Có màn FE | Ghi chú |
|-----------|-----------|---------|
| `auth` | ✅ | Login |
| `users`, `roles`, `role-permissions` | ✅ | Cài đặt |
| `customers`, `contacts`, `crm-activities` | ✅ | CRM |
| `contracts`, `contract-clauses` | ✅ | Hợp đồng |
| `customer-feedbacks`, `feedback-execution-units` | ✅ | Phản ánh |
| `handovers`, `warranties` | ✅ | BG, BH |
| `products`, `materials` | ✅ | SP, VT |
| `workflows`, `workflow-documents` | ✅ | Quy trình |
| `training` | ✅ | Đào tạo + HL (coaching) |
| `tasks`, `research-projects` | ✅ | CV, Đề tài |
| `documents`, `reports` | ✅ | Tài liệu, Báo cáo |
| `definitions`, `system-settings` | ✅ | Thuộc tính, Hệ thống |
| `audit-logs` | ✅ | Nhật ký (tab Cài đặt) |
| `notifications`, `notification-preferences` | ✅ | Bell + Cài đặt |
| `customer-anniversaries`, `anniversary-subscriptions` | ⚠️ | API có; UI nhắc kỷ niệm chưa đầy đủ (CRM-08 backlog) |

---

## 4. Chức năng hoàn thành một phần (⚠️)

*Không liệt vào bảng mục 1 là “xong hết”; chỉ tham chiếu để tránh kỳ vọng sai.*

| Khu vực | Thiếu / hạn chế | Backlog tham chiếu |
|---------|-----------------|-------------------|
| Dashboard tab **Khách hàng** | Tổng hợp aggregate, chưa CRM 360° | CRM-04, DSH-02 |
| Dashboard tab **Cảnh báo** | Rule trên `dashboard-alerts`, không API alarm riêng | UI-05, HD-02 |
| `ContractDetailDialog` tab **SP / Tài liệu** | Chỉ xem; CRUD gắn HĐ qua form khác | HD (gap ra-soat §3) |
| `ProductDetailDialog` | BOM, lịch sử, tài liệu mẫu từ `productsData` | SP-04 |
| `MaterialDetailDialog` | Fallback mock khi thiếu detail | VT-01 |
| `ResearchProjects` | Type/label màu từ file data | OUT-01 |
| Workflow | Chưa chặn phê duyệt khi thiếu tài liệu bước | WF-06 |
| Nhắc hạn HĐ theo loại | Rule tập trung Cài đặt chưa đủ | HD-03 → HD-05 |
| CRM 360°, chi phí, kỷ niệm | Chưa màn tổng quan KH đầy đủ | CRM-04, CRM-08 |

Chi tiết: [ra-soat-chuc-nang-he-thong.md](./ra-soat-chuc-nang-he-thong.md) mục 4–5, 9.

---

## 5. Kiểm chứng (chất lượng & release)

| Hạng mục | Lệnh / tài liệu | Kỳ vọng |
|----------|-----------------|--------|
| Test frontend | `npm run test` (Vitest) | Suite pass (UAT ghi ~44 case; chạy lại khi release) |
| Build FE | `npm run build` | Không lỗi TypeScript |
| Build BE | `cd backend && npm run build` | `tsc` pass (image Docker dùng cùng bước) |
| Lint | `npm run lint` | Pass trên file đổi |
| UAT tay | [uat-checklist.md](./uat-checklist.md) | Auth, RBAC 5 role, CRUD từng module, workflow runtime |
| Smoke sau deploy | [production-smoke.md](./production-smoke.md) | Health API, login, 1 luồng CRUD |
| Release | [release-readiness.md](./release-readiness.md) | Env, migrate, bootstrap user |

### Test tự động có trong repo (tiêu biểu)

- Phản ánh: `assignee`, `comments`, `routing`, `linkage-options`, `analytics`
- Hợp đồng: `display-status`, `execution-sla`, `execution-sla-notify`, `build-terms`
- FE: `api-errors`, `contract-display-status`, `customer-feedback-linkage`, `product-bom-editor`, `role-matrix`
- Khác: `reports-service`, `training-service`, `materials-service`, `formatValidationError`

---

## 6. Liên kết tài liệu

| Tài liệu | Mục đích |
|----------|----------|
| [chuc-nang-sua-va-moi-sau-hop.md](./chuc-nang-sua-va-moi-sau-hop.md) | Chỉ thay đổi **sau cuộc họp** |
| [ra-soat-chuc-nang-he-thong.md](./ra-soat-chuc-nang-he-thong.md) | Rà soát ✅/⚠️ theo route |
| [uat-checklist.md](./uat-checklist.md) | Kịch bản kiểm thử |
| [hop-bang-cong-viec-chi-tiet.md](./hop-bang-cong-viec-chi-tiet.md) | Backlog ~97 hạng mục VTX |
| [huong-dan-su-dung-asms.md](./huong-dan-su-dung-asms.md) | Hướng dẫn người dùng |

---

*Tạo: 03/06/2026 — tổng hợp từ rà soát mã nguồn. Cập nhật lại khi thêm route, migration hoặc hoàn tất backlog cuộc họp.*
