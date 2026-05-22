# Rà soát chức năng hệ thống (ERP ASMS)

Tài liệu được sinh sau khi quét **toàn bộ route frontend** (`src/App.tsx`), **menu sidebar** và **pattern gọi API/mock** trong mã nguồn.  
Mục đích: liệt kê **đã hoàn thiện / chỉ một phần / chưa khớp dữ liệu thực**, để **không bỏ sót chức năng đáng chú ý**.

**Chú thích trạng thái**

| Trạng thái | Ý nghĩa |
|-----------|---------|
| ✅ Hoàn thành | Luồng đọc/ghi backend có trong UI và phù hợp mục đích chính của màn |
| ⚠️ Một phần | Có API hoặc có UI nhưng thiếu nhánh quan trọng (mock, chỉ metadata, không sync field…) |
| ❌ Chưa / chỉ demo | UI mang tính minh họa, không gắn persistence đầy đủ |

**Lưu ý:** “Hoàn thành” không đồng nghĩa “đạt UAT nghiệp vụ” — chỉ có nghĩa **theo code hiện tại**, luồng được nối với backend cho phép thực hiện được.

---

## 1. Danh mục màn hình (theo route)

| Route | Màn | Dữ liệu chính | CRUD / thao tác | Trạng thái |
|-------|-----|---------------|-----------------|------------|
| `/login` | Đăng nhập | Auth JWT | Đăng nhập / refresh / đăng xuất | ✅ |
| `/` | Dashboard CEO | Aggregated API (`useDashboardData`) | Xem đa tab, lọc năm/KH từ CRM, carousel | ⚠️ (mục 4 — cảnh báo rule-based) |
| `/hop-dong` | Hợp đồng | `GET/POST/PUT/DELETE /contracts` | Danh sách + tạo + sửa (`customerId`, điều khoản) + xóa mềm | ⚠️ (tab chi tiết SP/tài liệu chỉ đọc — mục 3) |
| `/phan-anh` | Phản ánh KH | `GET/POST/PUT/DELETE /customer-feedbacks` | CRUD + lọc; gắn HĐ/BH trên form | ✅ |
| `/quy-trinh` | Quy trình | `/workflows` | Danh sách + editor bước + runtime trên phiếu | ✅ |
| `/ban-giao` | Bàn giao | `GET /handovers`, training list | CRUD handover qua dialog | ✅ |
| `/bao-hanh` | Bảo hành / SC | `GET /warranties`, customers/products options | Danh sách + tạo phiếu; chi tiết có cập nhật/xóa | ✅ |
| `/vat-tu` | Vật tư | `GET/POST/PUT/DELETE /materials`, transfers API | Vật tư + điều chuyển + quét mã (UI) | ⚠️ (chi tiết dialog mục 5) |
| `/san-pham` | Sản phẩm | `GET/POST/PUT/DELETE /products` | Danh sách + tạo/sửa/xóa; chi tiết | ⚠️ (chi tiết dialog mục 5) |
| `/khach-hang` | CRM | Customers, contacts, activities APIs | CRUD khách hàng, liên hệ, hoạt động | ✅ |
| `/bao-cao` | Báo cáo | `GET /reports?year=` | Biểu đồ/bảng, empty state | ✅ |
| `/de-tai` | Đề tài NCKH | `/research-projects` | Danh sách + tạo/sửa/xóa | ✅ |
| `/de-tai/:id` | Chi tiết đề tài | Detail API | Xem chi tiết (map sang type UI cố định) | ✅ |
| `/cong-viec` | Công việc | `/tasks` | Kanban/List/Lịch + CRUD task | ✅ (nhãn trạng thái UI lấy từ constants file) |
| `/dao-tao` | Khóa đào tạo | `/training` | CRUD khóa, link chi tiết | ✅ |
| `/dao-tao/:id` | Chi tiết đào tạo | Detail + trainee/session API | Học viên, lịch buổi học + CRUD | ✅ |
| `/tai-lieu` | Tài liệu | `/documents` | CRUD metadata + **upload multipart** (`POST /documents/upload`) | ✅ |
| `/cai-dat` | Cài đặt | Users, prefs, định nghĩa | CRUD người dùng (theo RBAC), cấu hình | ✅ |

Các đường dẫn không thuộc bảng trên chỉ có `*` → `NotFound`.

---

## 2. Sidebar & RBAC

- Menu được lọc theo **`use-role` → `canAccess(path)`**.
- ⚠️ Một số module backend có RBAC chi tiết hơn so với “ẩn/hiện menu” frontend — cần thử tay theo vai trò (xem `docs/uat-checklist.md`).
- ✅ Danh mụch route được gắn với vai trò: Đại thể có đầy đủ màn cho admin/manager/technician… theo ma trận `src/lib/role-nmatrix.ts` (đã tham chiếu trong Settings).

---

## 3. Màn Chi tiết hợp đồng (`ContractDetailDialog`) — 6 tab

Component: `src/components/details/ContractDetailDialog.tsx`, dữ liệu chi tiết: `GET /api/v1/contracts/:id`.

| Tab | Đọc dữ liệu thật | Ghi/Cập nhật trong tab | Trạng thái |
|-----|-------------------|-------------------------|------------|
| Thông tin chung | API detail + **nhật ký** (`useAuditLogs`, entity=contract) | **Chỉnh sửa** → `ContractEditDialog` → `PUT` (có `customerId` qua `CustomerSearchSelect`) | ✅ |
| Điều khoản | `terms` + `clauseIds` / `clauseItems` | Sửa qua dialog HĐ (picker + snapshot) | ✅ |
| Danh mục sản phẩm | `productsList` | Xem + mở `ContractProductDetailDialog`; không CRUD gắn HĐ trong tab | ⚠️ (chỉ đọc / xem chi tiết SP) |
| Tài liệu | `documents` trong detail | Tải về nếu có `fileUrl`; CRUD qua màn Tài liệu / sửa HĐ | ⚠️ (chỉ đọc trong tab) |
| Phản ánh | `CustomerFeedbackSection` (readonly) | CRUD trên màn `/phan-anh` hoặc khi sửa HĐ | ✅ |
| Bàn giao / Huấn luyện | `linkedHandover`, `linkedTraining` | Sửa qua tab BG/HL trong `ContractEditDialog` | ✅ |

**Lưu ý:** Tab SP/tài liệu trong sheet chi tiết vẫn **không** thay thế luồng gắn SP/tài liệu đầy đủ trên form sửa HĐ hoặc module riêng.

---

## 4. Dashboard (`/`) — từng tab

Hook tổng hợp: `src/hooks/use-dashboard-data.ts` — gộp contracts, handovers, training, materials, warranties, products, reports theo **năm**.

| Tab | Phần dùng API thật | Phần còn mock / cần lưu ý | Trạng thái |
|-----|--------------------|---------------------------|------------|
| Tổng quan (Overview) | Thống kê + bảng HĐ từ `liveContracts` | — | ✅ |
| Khách hàng | Chart/tổng hợp từ `useDashboardData` / reports | Bảng tổng hợp KH gộp từ aggregate (không phải CRM 360°) | ⚠️ |
| Doanh thu | Chart + **bảng HĐ từ `liveContracts`**; filter KH cột bảng theo tên KH thật | — | ✅ |
| Dự án (Project) | Bảng HĐ / bàn giao / đào tạo live | — | ✅ |
| Sản phẩm (Product) | Thẻ + **bảng SP từ `liveProducts`** | — | ✅ |
| Bảo hành (Warranty) | Widget + **bảng từ `liveWarranties`** | — | ✅ |
| Vật tư (Material) | Danh sách từ `liveMaterials` | — | ✅ |
| Cảnh báo (Alerts) | Rule trên `DashboardData` (`dashboard-alerts`) | Không có API alarm riêng | ⚠️ |

**Bộ lọc Dashboard:** toolbar KH lấy từ `useCustomersList()` (`Index.tsx`), không còn mảng tĩnh qk1….

---

## 5. Chi tiết / dialog phụ vẫn dùng dữ liệu mẫu hoặc fallback

Đây là các chỗ UI **đã có** nhưng **vẫn có nhánh mock** — cần ghi trong file rà soát để tránh kỳ vọng sai.

| Khu vực | File / ghi chú | Trạng thái |
|---------|----------------|------------|
| Chi tiết sản phẩm | `ProductDetailDialog.tsx` — BOM, lịch sử, tài liệu mẫu, đào tạo mẫu từ `productsData` | ⚠️ |
| Tạo/sửa sản phẩm | `CreateProductDialog`, `EditProductDialog` — type từ `productsData` | ⚠️ (payload API thật; phần rich detail có thể không đồng bộ) |
| Chi tiết vật tư | `MaterialDetailDialog.tsx` — có **mock/fallback** khi không có bản ghi chi tiết | ⚠️ |
| Đề tài NCKH | `researchData` — type + label màu; danh sách map từ API | ✅ list; ⚠️ type UI vẫn gắn file data |
| Công việc | `taskData2` — **chỉ nhãn/màu map**, dữ liệu task từ API | ✅ |
| Đào tạo | `trainingData` — type UI cho course/trainee/session; dữ liệu từ API | ✅ |

---

## 6. Hợp đồng — màn danh sách (`/hop-dong`)

| Chức năng | Backend | Trạng thái |
|-----------|---------|------------|
| Danh sách | `GET /contracts` | ✅ |
| Tạo | `POST /contracts` (có `customerId`, tiêu đề, dates, `terms`…) | ✅ |
| Sửa từ popup danh sách | `PUT /contracts/:code` | ✅ |
| Sửa từ chi tiết | `ContractEditDialog` → `PUT` (payload có `customerId`) | ✅ |
| Xóa | `DELETE /contracts/:code` (soft delete) | ✅ |

---

## 7. Tài liệu (`/tai-lieu`)

| Chức năng | Ghi chú | Trạng thái |
|-----------|---------|------------|
| CRUD metadata | `fileUrl`, `fileSize` là **chuỗi** gửi API | ✅ |
| Upload file (multipart) | `use-documents-api` → `POST /api/v1/documents/upload` | ✅ |

---

## 8. Các module backend tồn tại (đối chiếu nhanh)

Các module có `route.ts` trong `backend/src/modules/` (28 module), gồm thêm so với bản cũ:  
`workflows`, `workflow-documents`, `contract-clauses`, `customer-feedbacks`, `crm-activities`, `contacts`, `definitions`, `roles`, `role-permissions`, `audit-logs`, `notifications`, `notification-preferences`, `system-settings`, `customer-anniversaries`, `anniversary-subscriptions`, …

→ Trạng thái “hoàn thiện UI” phụ thuộc từng màn (bảng mục 1).

---

## 9. Việc nên làm tiếp (ưu tiên gắn với gap / backlog cuộc họp)

1. **CRM 360°:** màn tổng quan KH (doanh thu, chi phí, lãi/lỗ, phản ánh tồn) — xem `docs/hop-bang-cong-viec-chi-tiet.md` (CRM-04).
2. **Chi tiết HĐ:** CRUD gắn SP/tài liệu trực tiếp trong tab sheet (hoặc deep-link rõ ràng).
3. **Workflow:** bắt buộc tài liệu trước phê duyệt bước (WF-06); nội dung bước chi tiết từ VTX (WF-10).
4. **Nhắc hạn:** mở rộng rule theo loại HĐ + checkbox từng mốc (HD-03→HD-05) trên Cài đặt.
5. **UAT:** chạy đầy đủ `docs/uat-checklist.md` theo từng role; giữ `pnpm test` 44/44 pass.

---

## 10. Phương pháp rà soát (để tái kiểm)

- Quét route: `src/App.tsx`.
- Quét mock: import từ `src/data/*.ts` trong `pages/` và `components/dashboard/tabs/`.
- Quét API: `src/hooks/use-*-api.ts` và `backend/src/modules/*/route.ts`.

**Cập nhật tài liệu này** mỗi khi thêm route mới hoặc thay mock → API.

---

*Tạo/cập nhật: 21/05/2026 — đồng bộ sau sửa test reports, dashboard live data, migration `contract_clause_items`; khi merge nhánh khác cần chạy lại quét tương tự.*
