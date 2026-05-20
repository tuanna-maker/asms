# UAT Checklist

## Scope
- Roles: `admin`, `manager`, `technician`, `viewer`, `sales` (ma trận RBAC đầy đủ: [SRS-ASMS.md §8 (Phần B — RBAC)](SRS-ASMS.md#srs-muc-8-rbac))
- Modules: Auth, Users, Customers/CRM, Contracts, Handovers, Products, Warranty, Materials, Tasks, Documents, Reports, Training, Research projects, Definitions, Notification preferences

## Authentication
- Login succeeds with seeded users.
- `POST /auth/register` is forbidden in production; in lower envs either admin JWT is required or public registration is intentionally enabled via env (see [`docs/release-readiness.md`](docs/release-readiness.md)).
- Invalid credentials return error message.
- Expired token triggers refresh automatically.
- Missing/invalid refresh token clears session and returns to `/login`.
- Logout clears local session and blocks protected routes.

## RBAC
- `viewer` can access read-only pages and cannot execute write actions.
- `technician` can access operational modules per role matrix.
- `manager` can access managerial modules and write actions allowed by backend.
- `admin` can access all routes including settings.

## Module CRUD
- Users (Settings): list/create/update/delete works with RBAC (`admin` write, `manager` read).
- Settings - Roles tab: list system + custom roles; cannot edit code / disable / delete system roles; cannot delete a role still assigned to users; admin can create custom role and audit log records the action.
- Settings - Phân quyền tab: read-only matrix loads for each role and reflects current code-level RBAC.
- Settings - Notifications tab: each preference key toggles persist per user.
- Settings - Hệ thống tab: defaults are seeded on first load; admin can update SLA / threshold / remind days / grace hours / cron hour / channels; non-admin sees disabled inputs.
- Settings - Phiên đăng nhập tab: current device is marked, other sessions can be revoked, "Đăng xuất tất cả thiết bị khác" leaves the current session alive.
- Settings - Nhật ký tab (admin only): filters by entity / action / search / date range; pagination works; entries appear after create/update/delete on users, roles, contracts, handovers, warranties, materials, definitions, system settings, login/logout/session revoke.
- Settings - Thuộc tính (mỗi module: hop-dong, ban-giao, bao-hanh, san-pham, vat-tu, khach-hang, de-tai, cong-viec, dao-tao, tai-lieu):
  - Bảng hiển thị đủ cột: STT, Mã, Tên, Người sửa, Ngày sửa, Trạng thái, Thao tác (không badge "Hệ thống").
  - Tìm theo mã hoặc tên đều ra kết quả; bộ lọc trạng thái (Tất cả / Hoạt động / Ngừng) hoạt động.
  - Tạo mới: nhập mã không thuộc regex `^[A-Za-z0-9._-]+$` bị chặn ngay phía client.
  - Sửa mọi mục (kể cả seed): đổi được Mã, Tên, Thứ tự, Hoạt động.
  - Xoá mục đang được dùng: dialog liệt kê breakdown và chỉ cho "Tắt"; mục không ai dùng: cho phép xoá.
  - Xoá mục thường đang được record dùng: dialog liệt kê breakdown các bảng và chỉ cho "Tắt".
  - Xoá mục thường không ai dùng: cho phép xoá; danh sách cập nhật.
  - Kéo thả (khi không filter/phân trang) → nút "Lưu thứ tự" hiện; sau khi lưu, reload trang vẫn giữ thứ tự mới.
  - Nút "Lịch sử" trên mỗi dòng điều hướng sang `/cai-dat?tab=audit&entity=definition&entityId=<id>` và tab Nhật ký nạp sẵn lọc theo `entityId`.
- DataDefinition - chuyển đổi enum: tạo / cập nhật Bảo hành (priority, status), Công việc (priority), Đề tài (stage), Đào tạo (type), Tài liệu (category), Bàn giao (typeCode), Khách hàng (source, companyType), Sản phẩm (category) bằng `*Code`; chọn mã đã bị tắt → API báo 422 và FE hiển thị lỗi rõ ràng.
- Header bell: unread count refreshes; clicking item navigates and marks it as read; "Đánh dấu đã đọc" clears all.
- Customers: create, update, delete, list refresh.
- CRM contacts/activities: create, update, delete, customer filter works.
- Contracts: create, update status/progress, delete, list refresh; **không** còn field/tab quy trình cấp HĐ; mỗi HĐ tối đa **1 bàn giao + 1 khóa huấn luyện** (API 400 nếu tạo thêm); tab **Bàn giao** / **Huấn luyện** trên sửa HĐ: chọn quy trình riêng, form động + `WorkflowInstancePanel`; chi tiết HĐ read-only + nút mở sửa đúng tab; `GET /contracts/:id` trả `linkedHandover` / `linkedTraining` (kèm `workflowName`); lịch sử tab Thông tin chung từ Nhật ký (`audit-logs`).
- Contracts - Điều khoản & điều kiện:
  - Cài đặt → Thuộc tính → Hợp đồng: CRUD **Điều khoản và điều kiện** (mã, tiêu đề, nội dung); CRUD **Nhóm điều khoản** + dialog **Gán điều khoản** (multi-select).
  - Tạo/sửa HĐ tab **Điều khoản & Điều kiện**: tích nhóm (chọn/bỏ tất cả) hoặc từng mục; xem trước nội dung; lưu gửi `clauseIds` — BE ghép `terms` snapshot.
  - HĐ cũ chỉ có `terms` text: vẫn xem được; khi sửa hiện cảnh báo legacy + picker để chọn lại từ danh mục.
  - Xóa điều khoản đang có trên HĐ → API 409; seed: `npm run bootstrap:auth` hoặc `seed:demo` (mục `seedContractClauses`).
  - Migration: `20260520130000_contract_clauses`.
- Handovers: create/update/delete/list + filters work; tạo BG gắn HĐ đã có BG → 400; quy trình chỉ từ `workflowId` phiếu (không kế thừa HĐ). Màn **Bàn giao & Huấn luyện**: dropdown HĐ khi **tạo mới** chỉ HĐ chưa có bàn giao **và** chưa có huấn luyện (`GET /contracts?eligibleFor=handover` hoặc lọc FE); sửa giữ HĐ hiện tại; gắn HL cho HĐ đã có BG → tab Huấn luyện trên sheet Hợp đồng.
- Products: create/list works; tạo SP dùng phân loại từ Definitions (`product_category`); ảnh SP upload qua API tài liệu (`product_image`); tab Lịch sử gộp audit log; warranty product selector loads data correctly.
- Warranty: create ticket, update workflow/status, delete, list refresh; form động theo quy trình (không còn 5 tab legacy); đổi quy trình khi sửa (attach + xác nhận); lưu xóa orphan payload khi có cảnh báo.
- Materials: create/import, update stock metadata, delete, list refresh; chi tiết vật tư (`MaterialDetailDialog`) nạp `GET /materials/:id` và lịch sử điều chuyển thật.
- Materials transfers: create transfer, quantity validation, available stock decrement, transfer list refresh.
- Tasks: create, update progress/status, delete, board/list/calendar refresh.
- Documents: upload/create metadata, update, delete, list refresh.
- Reports (`/bao-cao`):
  - 5 tab: Khách hàng, Hợp đồng, Dòng sản phẩm (`Product.category`), Phản ánh (3 sub-tab), Đơn vị thực hiện (theo vai trò Task).
  - Lọc năm hoặc Từ ngày/Đến ngày + Áp dụng; query string `?year=&from=&to=&tab=&feedbackTab=`.
  - Tab Dòng SP: bar SX / giao / phiếu BH theo category (không map loại phiếu BH).
  - Tab Phản ánh: chỉ Warranty — theo KH, theo dòng SP, vật tư/LK (`material-defects`, ghi chú heuristic BOM).
  - Xuất Excel/PDF theo tab đang xem; empty dataset không crash.
- Training:
  - **Đào tạo** (`courseKind=training`, `/dao-tao`): tab Tổng quan có tab bước + `stepPayloads` + phê duyệt bước; quy trình module `training`.
  - **Huấn luyện** (`courseKind=coaching`): chỉ trên tab HL Hợp đồng / Bàn giao — không list trên `/dao-tao`; tối đa 1 khóa HL/HĐ; `stepPayloads` + nút «Xử lý quy trình» trên list HL.
  - Trainees create/update/delete and attendance toggle persist.
  - Sessions create/update/delete and status quick-update persist.

## Quy trình (Workflow)
- `/quy-trinh` hiển thị thẻ Bàn giao / Bảo hành / **Đào tạo** / **Huấn luyện** / Hợp đồng / Sản phẩm kèm số workflow.
- Vào `/quy-trinh/handover` thấy bảng workflow với cột Mã / Tên / Bước / Tổng SLA / Trạng thái / Cập nhật. Mỗi dòng có nút Lịch sử, Sửa, Xoá. Workflow seed `WF_HANDOVER_DEFAULT` đánh `Hệ thống` và không cho xoá.
- Tạo workflow mới (`Thêm quy trình`): nhập tên + mã + mô tả + Hoạt động → mở thẳng editor mới.
- Trang editor `/quy-trinh/handover/:id`: cột trái hiển thị Thông tin cấu hình + **Trường header phiếu** (`entityFieldSchema`, tuỳ chọn) + Tổng quát (số bước, tổng SLA); cột phải có dải `BẮT ĐẦU` / `KẾT THÚC`, mỗi bước có chỉ số tròn, tên + badge hành động, dòng phụ vai trò + SLA, 4 nút (Lên, Xuống, Sửa, Xoá).
- Thêm/sửa bước qua dialog `StepUpsertDialog` (tên, hành động, vai trò, SLA, mô tả, **fieldSchema** từng bước). Lưu bước → `fieldSchema` persist DB (PUT/POST step gửi `fieldSchema`). Sau khi lưu, danh sách step và «Tổng quát» cập nhật ngay.
- Bấm Lên/Xuống đổi thứ tự, gọi `PUT /workflows/:id/steps/reorder`, audit log ghi nhận `reorder`.
- Sửa "Tên" + "Trạng thái" + "Mô tả" workflow rồi bấm `Cập nhật quy trình` → toast `Đã lưu quy trình`. Với workflow `Hệ thống`, input `Mã` bị disable, không cho đổi.
- Bấm `Lịch sử` ở list hoặc editor → mở `/cai-dat?tab=audit&entity=workflow&entityId=<id>` đã pre-filter các hành động liên quan.

## Workflow runtime
- Tạo mới một bàn giao → hệ thống tự đính kèm `WorkflowInstance` (kiểm tra: trong dialog Sửa bàn giao thấy panel `Tiến trình xử lý` với bước đầu được highlight).
- Đăng nhập đúng vai trò bước hiện tại (`technician` cho bước 1 của workflow handover mặc định) → bấm `Phê duyệt` → bước hiện tại di chuyển sang bước kế, log mới hiện trong nhật ký panel.
- Vai trò sai bấm Phê duyệt → toast lỗi `Bước này yêu cầu vai trò …` (HTTP 403).
- Hoàn tất bước cuối → instance đóng (`Hoàn tất`), Handover.status = `completed`.
- Bấm `Trả lại` ở bước bất kỳ → instance `cancelled`, Handover.status đổi `late`, panel hiển thị badge `Đã trả lại`.
- Tạo phiếu bảo hành / khoá đào tạo / khoá huấn luyện: có quy trình runtime. Hoàn tất workflow bảo hành → `statusCode = completed`. List **Sản phẩm** có cột «Bước QT».
- Migration: `course_kind`, `training_course_step_payloads`; seed `WF_TRAINING_DEFAULT` + `WF_COACHING_DEFAULT` (restart backend sau migrate).
- Dữ liệu cũ: HĐ có `contracts.workflow_id` / `contract_step_payloads` vẫn trong DB nhưng UI không chỉnh; quy trình mới gắn tại phiếu Bàn giao / Huấn luyện. Nhiều khóa HL cùng `contractId` → gỡ thừa trước khi bật ràng buộc 1:1.

## Reliability
- Build frontend/backend passes.
- Lint passes on changed files.
- Test suite passes.
