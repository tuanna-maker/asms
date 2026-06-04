# Bảng chức năng đã sửa, cập nhật mới & trạng thái màn hình

| Thuộc tính | Nội dung |
|---|---|
| **Cập nhật** | 03/06/2026 |
| **Phạm vi** | Sau cuộc họp ASMS (`27e313e` → `HEAD` + thay đổi local chưa commit) |
| **Tổng hợp toàn hệ thống** | [chuc-nang-hoan-thanh.md](./chuc-nang-hoan-thanh.md) |

**Chú thích cột**

| Cột | Ý nghĩa |
|-----|---------|
| **Loại** | `Sửa` = sửa chữa/cải tiến có sẵn; `Mới` = chức năng hoặc màn mới |
| **Đã hoàn thành** | `Có` = màn/luồng chạy ổn FE↔BE; `Một phần` = còn mock hoặc thiếu nhánh; `Đang làm` = chưa commit hoặc chưa UAT; `—` = không áp dụng (hạ tầng) |

---

## Bảng tổng hợp

| STT | Màn / Route | Module | Loại | Chức năng | Mô tả chi tiết | Mã backlog | Đã hoàn thành |
|:---:|-------------|--------|:----:|-----------|----------------|:----------:|:-------------:|
| **Phản ánh KH** |
| 1 | `/phan-anh` | Phản ánh | Mới | Module trang riêng | Danh sách, lọc, CRUD; thay popup bằng route | BH-10 | **Có** |
| 2 | `/phan-anh/moi` | Phản ánh | Mới | Wizard tiếp nhận | `FeedbackIntakeWizard` nhiều bước, validate, routing đơn vị | BH-10 | **Có** |
| 3 | `/phan-anh/:id` | Phản ánh | Mới + Sửa | Chi tiết & timeline | Comment `issue`/`fix`; gộp audit + comment; panel quy trình | BH-03 | **Có** |
| 4 | `/phan-anh/:id/sua` | Phản ánh | Sửa | Form sửa | Sửa lỗi 500 PUT (assignee connect/disconnect); phân công user/role | BH-03 | **Có** |
| 5 | `/phan-anh/thong-ke` | Phản ánh | Mới | Thống kê | Theo KH, SP, vật tư; lọc kỳ; analytics API | BH-08, RPT-01 | **Có** |
| 6 | `/phan-anh` (chung) | Phản ánh | Sửa | Picker liên kết HĐ/SP/VT | Chọn độc lập; VT lọc theo SP | BH-11 | **Có** |
| 7 | `/phan-anh` (chung) | Phản ánh | Sửa | Phân công & quyền xem | Thay "Mức độ" → "Phân công"; lọc list theo role | BH-11, RBAC-02 | **Có** |
| 8 | `/phan-anh` (chung) | Phản ánh | Mới | Workflow xử lý | Gán đơn vị, cập nhật assignment, runtime phiếu | BH-03 | **Có** |
| 9 | `/cai-dat` (tab Đơn vị PA) | Phản ánh | Mới | Đơn vị thực hiện | CRUD `feedback-execution-units` | BH-04 | **Có** |
| 10 | `/phan-anh` (chung) | Phản ánh | Sửa | Thông báo lỗi VN | `formatValidationError`, `toastApiError` | — | **Có** |
| 11 | `/phan-anh` (chung) | Phản ánh | Mới + Đang làm | Phân công nhiều người | Multi-assignee; migration local chưa commit | RBAC-03 | **Đang làm** |
| **Hợp đồng** |
| 12 | `/hop-dong` | Hợp đồng | Sửa | Danh sách & CRUD | Refactor form; `customerId`; tiến độ %, badge chậm/quá hạn | HD-01, HD-02, HD-07 | **Có** |
| 13 | `/hop-dong` (sheet chi tiết) | Hợp đồng | Sửa | Tab Thông tin / Điều khoản / BG-HL | Nhật ký audit; `clauseIds` + legacy `terms`; `linkedHandover`/`linkedTraining` | HD-08, HD-10 | **Có** |
| 14 | `/hop-dong` (sheet chi tiết) | Hợp đồng | Sửa | Tab SP / Tài liệu | Chỉ đọc; CRUD gắn HĐ qua form khác | — | **Một phần** |
| 15 | `/hop-dong` (chung) | Hợp đồng | Sửa | 1 BG + 1 HL / HĐ | API 400 nếu tạo thêm; dropdown HĐ eligible | HD-09 | **Có** |
| 16 | `/cai-dat/thuoc-tinh` (HĐ) | Hợp đồng | Mới | Điều khoản & nhóm | CRUD điều khoản; gán nhóm; picker trên HĐ | HD-08, SET-04 | **Có** |
| 17 | (job nền) | Hợp đồng | Mới | SLA thực thi & nhắc | `execution-sla`, thông báo qua `notify.ts` | HD-04, HD-05 | **Có** |
| **Bảo hành / SC** |
| 18 | `/bao-hanh` | Bảo hành | Sửa | Form động quy trình | Bỏ 5 tab legacy; `fieldSchema` + `WorkflowInstancePanel` | BH-06 | **Có** |
| 19 | `/bao-hanh` | Bảo hành | Sửa | stepPayloads | Lưu/reload bước; đổi QT có xác nhận; xóa orphan | WF-08 | **Có** |
| **Bàn giao & Huấn luyện** |
| 20 | `/ban-giao` | Bàn giao | Sửa | CRUD & workflow | Dropdown HĐ eligible; runtime; tách HL khỏi `/dao-tao` | WF-01, HL-04 | **Có** |
| 21 | Tab HL trên sửa HĐ | Huấn luyện | Sửa | Gắn khóa HL | `courseKind=coaching`; tối đa 1 HL/HĐ | HL-04 | **Có** |
| **Sản phẩm** |
| 22 | `/san-pham` | Sản phẩm | Mới + Sửa | Quy trình SP & BOM | Workflow `product`; cột «Bước QT»; `ProductBomEditor` | SP-05, SP-02 | **Có** |
| 23 | Dialog chi tiết SP | Sản phẩm | Sửa | Chi tiết SP | API thật; BOM/lịch sử một phần còn mock | SP-05 | **Một phần** |
| **Dashboard & Báo cáo** |
| 24 | `/` | Dashboard | Sửa | Dữ liệu live | Tab Tổng quan, Doanh thu, Dự án, SP, BH, VT từ API | DSH-01, DSH-02 | **Có** |
| 25 | `/` (tab KH) | Dashboard | — | Tổng hợp KH | Aggregate, chưa CRM 360° | CRM-04 | **Một phần** |
| 26 | `/` (tab Cảnh báo) | Dashboard | — | Cảnh báo | Rule `dashboard-alerts`, không API alarm riêng | UI-05 | **Một phần** |
| 27 | `/bao-cao` | Báo cáo | — | 5 tab báo cáo | KH, HĐ, dòng SP, Phản ánh, Đơn vị TH; xuất Excel/PDF | RPT-01 | **Có** |
| **Quy trình** |
| 28 | `/quy-trinh` | Quy trình | — | Overview module | Thẻ BG, BH, ĐT, HL, HĐ, SP | WF-02 | **Có** |
| 29 | `/quy-trinh/:moduleKey` | Quy trình | — | Danh sách workflow | CRUD list; workflow hệ thống không xóa | WF-02 | **Có** |
| 30 | `/quy-trinh/:moduleKey/:id` | Quy trình | Sửa | Editor bước | fieldSchema, SLA, role; reorder; validation tên | WF-05, WF-07 | **Có** |
| 31 | Panel trên phiếu | Quy trình | Sửa | Runtime phê duyệt | Phê duyệt/Trả lại theo role; stepPayloads | WF-08, WF-09 | **Có** |
| 32 | Editor / runtime | Quy trình | — | Tài liệu bắt buộc bước | Chưa chặn advance khi thiếu file | WF-06 | **Một phần** |
| **Khác (sau họp / hạ tầng)** |
| 33 | `/thong-bao` | Thông báo | Mới | Trang thông báo | Danh sách; đánh dấu đã đọc; bell header | — | **Có** |
| 34 | `/cai-dat/thuoc-tinh` | Cài đặt | Sửa | Thuộc tính | Tìm, lọc, kéo thả thứ tự, xóa breakdown | SET-02 | **Có** |
| 35 | Nhiều màn list | RBAC | Đang làm | `use-module-permissions` | Nút CRUD theo `canDo`; map API module | RBAC-02 | **Đang làm** |
| 36 | Toàn BE routes | RBAC | Đang làm | Middleware RBAC | `api-module-map`, `requireModulePermission` | RBAC-02 | **Đang làm** |
| 37 | — | Triển khai | Sửa | Build Docker | TS strict; exclude `*.test.ts` khi build image | — | **Có** |
| 38 | — | DevOps | Mới | Script kiểm thử | `live-flow-test`, smoke feedback | DOC-03 | **Có** |

---

## Các màn đã hoàn thành (chỉ liệt kê **Có**)

| Màn / Route | Module | Ghi chú ngắn |
|-------------|--------|--------------|
| `/login` | Xác thực | JWT, refresh, logout |
| `/` | Dashboard | Tab chính dùng API live (trừ tab KH/Cảnh báo: một phần) |
| `/khach-hang` | CRM | CRUD KH, liên hệ, hoạt động |
| `/hop-dong` | Hợp đồng | CRUD, điều khoản, BG/HL (tab SP/tài liệu: một phần) |
| `/phan-anh` (+ `/moi`, `/:id`, `/:id/sua`, `/thong-ke`) | Phản ánh | Module mới sau họp — đầy đủ |
| `/ban-giao` | Bàn giao | CRUD + workflow |
| `/bao-hanh` | Bảo hành | CRUD + form động QT |
| `/san-pham` | Sản phẩm | CRUD + QT + BOM (dialog chi tiết: một phần) |
| `/vat-tu` | Vật tư | CRUD + điều chuyển (dialog: một phần) |
| `/quy-trinh` (+ list, editor) | Quy trình | Cấu hình + runtime (WF-06: một phần) |
| `/dao-tao`, `/dao-tao/:id` | Đào tạo | CRUD khóa, học viên, buổi học |
| `/bao-cao` | Báo cáo | 5 tab, export |
| `/cong-viec` | Công việc | Kanban/List/Lịch + CRUD |
| `/de-tai`, `/de-tai/:id` | Đề tài | CRUD + chi tiết |
| `/tai-lieu` | Tài liệu | CRUD + upload |
| `/thong-bao` | Thông báo | Mới sau họp |
| `/cai-dat` | Cài đặt | Users, roles, phân quyền, hệ thống, phiên, nhật ký |
| `/cai-dat/thuoc-tinh/:moduleKey` | Thuộc tính | CRUD định nghĩa + điều khoản HĐ |

---

## Tóm tắt nhanh

| Đã hoàn thành | Số lượng (ước lượng) |
|---------------|----------------------|
| **Có** | 28 hạng mục trong bảng chính + 17 màn ở bảng phụ |
| **Một phần** | 5 (tab SP/tài liệu HĐ, dialog SP/VT, Dashboard KH/Cảnh báo, WF-06) |
| **Đang làm** | 3 (multi-assignee, RBAC route, FE permissions) |

---

*Chi tiết toàn hệ thống và mục ⚠️: [chuc-nang-hoan-thanh.md](./chuc-nang-hoan-thanh.md). Trước release: [uat-checklist.md](./uat-checklist.md).*
