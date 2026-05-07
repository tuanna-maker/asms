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
| `/` | Dashboard CEO | Aggregated API (`useDashboardData`) | Xem đa tab, lọc năm, carousel | ⚠️ (chi tiết từng tab mục 4) |
| `/hop-dong` | Hợp đồng | `GET/POST/PUT/DELETE /contracts` | Danh sách + tạo + sửa popup + xóa mềm | ⚠️ (chi tiết mục 3, 6) |
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
| `/tai-lieu` | Tài liệu | `/documents` | Danh sách + tạo/sửa/xóa **metadata + URL** | ⚠️ (không upload file nhị phân qua multipart) |
| `/cai-dat` | Cài đặt | Users, prefs, định nghĩa | CRUD người dùng (theo RBAC), cấu hình | ✅ |

Các đường dẫn không thuộc bảng trên chỉ có `*` → `NotFound`.

---

## 2. Sidebar & RBAC

- Menu được lọc theo **`use-role` → `canAccess(path)`**.
- ⚠️ Một số module backend có RBAC chi tiết hơn so với “ẩn/hiện menu” frontend — cần thử tay theo vai trò (xem `docs/uat-checklist.md`).
- ✅ Danh mụch route được gắn với vai trò: Đại thể có đầy đủ màn cho admin/manager/technician… theo ma trận `src/lib/role-nmatrix.ts` (đã tham chiếu trong Settings).

---

## 3. Màn Chi tiết hợp đồng (`ContractDetailDialog`) — 5 tab

Component: `src/components/details/ContractDetailDialog.tsx`, dữ liệu chi tiết: `GET /api/v1/contracts/:id`.

| Tab | Đọc dữ liệu thật | Ghi/Cập nhật trong tab | Trạng thái |
|-----|-------------------|-------------------------|------------|
| Thông tin chung | Một phần từ prop `contract` (danh sách); không load lại đủ mọi trường contract từ API detail | Nút **Chỉnh sửa** → popup `ContractEditDialog` → `PUT /contracts/:id` (qua `Contracts.tsx` handler) | ⚠️ |
| Điều khoản chính | `terms` từ chi tiết API | Sửa qua popup chỉnh sửa (`terms` trong payload update) | ✅ |
| Danh mục sản phẩm | `productsList` trong response detail | Không có thêm/sửa/xóa trong tab | ❌ (chỉ đọc) |
| Tài liệu | `documents` trong detail (hoặc tương đương include) | Không CRUD trong tab; chỉ **Tải về** nếu có `fileUrl` | ❌ (chỉ đọc) |
| Đào tạo & Huấn luyện | `trainingCourses` trong detail | Không CRUD trong tab | ❌ (chỉ đọc) |

**Mục Thông tin chung — chỗ dễ lệch:**

- ⚠️ “Lịch sử hoạt động” trong tab là **dựng theo tiến độ** (UI), không phải nhật ký thật từ API.
- ⚠️ `ContractEditDialog` cho phép sửa tên khách hiển thị là **chuỗi**; **`handleSave` trên `Contracts.tsx` không gửi `customerId`** trong payload update — chỉnh sửa tên khách **có thể không được lưu** đúng nghiệp vụ (backend gắn khách qua FK).

---

## 4. Dashboard (`/`) — từng tab

Hook tổng hợp: `src/hooks/use-dashboard-data.ts` — gộp contracts, handovers, training, materials, warranties, products, reports theo **năm**.

| Tab | Phần dùng API thật | Phần còn mock / cần lưu ý | Trạng thái |
|-----|--------------------|---------------------------|------------|
| Tổng quan (Overview) | Thống kê + bảng hợp đồng từ `liveContracts` | — | ✅ |
| Khách hàng | Biểu đồ/ghi nhật ký từ `data.customerProducts`, `data.customerRevenue` | ⚠️ Cột/filter bảng vẫn giả định danh sách KH cố định trong code (Không đọc động từ API) | ⚠️ |
| Doanh thu | Thẻ/chart `/ trend` thật | **Bảng “Chi tiết DT theo HĐ” đang bind `contractsData`** (`src/data/tableData.ts`) — **KHÔNG phải dữ liệu live** | ❌ (bảng widget) |
| Dự án (Project) | Bảng hợp đồng / bàn giao / đào tạo live | — | ✅ |
| Sản phẩm (Product) | Thẻ/thống kê aggregated | **Bảng “Danh sách SP” đang bind `productsData`** — mock | ❌ (bảng widget) |
| Bảo hành (Warranty) | Widget Complaint/ghi nhật ký aggregated | **Bảng khiếu nại đang bind `complaintsData`** — mock | ❌ (bảng widget) |
| Vật tư (Material) | Danh sách từ `liveMaterials` | — | ✅ |
| Cảnh báo (Alerts) | Cảnh báo **tính từ các aggregate** của `DashboardData` | Không có API “alarm” riêng — chỉ rule trên chỉ số | ⚠️ |

**Bộ lọc Dashboard:** danh sách “khách hàng” trong toolbar (`src/pages/Index.tsx`) là **mảng tĩnh** (qk1…), không lấy từ CRM — chỉ là filter UI chứ chưa chắc khớp dữ liệu thực sau này.

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
| Sửa từ chi tiết | Cùng handler `handleSave` | ⚠️ (xem mục 3 — `customerId`) |
| Xóa | `DELETE /contracts/:code` (soft delete) | ✅ |

---

## 7. Tài liệu (`/tai-lieu`)

| Chức năng | Ghi chú | Trạng thái |
|-----------|---------|------------|
| CRUD metadata | `fileUrl`, `fileSize` là **chuỗi** gửi API | ✅ |
| Upload file thật (multipart) | Không thấy flow upload binary trong hook `use-documents-api` | ❌ (nếu nghiệp vụ cần upload) |

---

## 8. Các module backend tồn tại (đối chiếu nhanh)

Các module có file `routes.ts` trong `backend/src/modules/`:  
`auth`, `users`, `customers`, `contracts`, `handovers`, `products`, `warranties`, `materials`, `tasks`, `documents`, `reports`, `training`, `research-projects`.

→ Mọi module trên **đều có API**; trạng thái “hoàn thiện UI” phụ thuộc từng màn (bảng trên).

---

## 9. Việc nên làm tiếp (ưu tiên gắn với gap trên)

1. **Dashboard:** thay `contractsData` / `productsData` / `complaintsData` trong `RevenueTab`, `ProductTab`, `WarrantyTab` bằng dòng dữ liệu map từ `liveContracts`, `live` products/warranties hoặc từ `useDashboardData` (để không còn bảng mock).
2. **Chi tiết hợp đồng:** thêm luồng CRUD sản phẩm gắn hợp đồng, tài liệu theo `contractId`, khóa đào tạo theo `contractId` — hoặc deep-link sang màn module tương ứng.
3. **Sửa hợp đồng:** chọn khách qua `customerId` (Select) đồng bộ backend, tránh chỉnh tên text không lưu.
4. **Tài liệu:** nếu cần upload file, bổ sung API + FE upload (hoặc ghi rõ chỉ nhập URL).

---

## 10. Phương pháp rà soát (để tái kiểm)

- Quét route: `src/App.tsx`.
- Quét mock: import từ `src/data/*.ts` trong `pages/` và `components/dashboard/tabs/`.
- Quét API: `src/hooks/use-*-api.ts` và `backend/src/modules/*/routes.ts`.

**Cập nhật tài liệu này** mỗi khi thêm route mới hoặc thay mock → API.

---

*Tạo/cập nhật: rà soát theo snapshot mã nguồn workspace; khi merge nhánh khác cần chạy lại quét tương tự.*
