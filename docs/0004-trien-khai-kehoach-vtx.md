# Triển khai kế hoạch của anh Thành (VTX) — 4 phase

Tài liệu này ghi lại toàn bộ chức năng đã làm theo kế hoạch trong `docs/DOCKER/kehoachchoAI.md`. Mục tiêu: viết bằng từ đơn giản, người không chuyên cũng đọc hiểu.

## 1. Tóm tắt nhanh

Hệ thống được nâng cấp thành 4 nhóm việc lớn:

1. **Quy trình (Workflow)**: cho phép cấu hình từng bước, kéo thả thứ tự, đính kèm tài liệu, và áp quy trình theo hợp đồng / dòng sản phẩm.
2. **Hợp đồng & Sản phẩm**: đổi mặc định trạng thái sản phẩm, thêm nhắc lịch bảo hành / huấn luyện / sửa chữa, cấu hình nhắc theo giá trị hợp đồng.
3. **CRM 360**: chi tiết khách hàng có nhiều tab (tổng quan, liên hệ, hợp đồng, phản hồi, kỷ niệm); bộ lọc nâng cao cho danh sách khách hàng và hợp đồng.
4. **Báo cáo & Cảnh báo**: dashboard riêng cho từng menu, thống kê vật tư hay hỏng, dòng quá hạn nhấp nháy đỏ, badge số trên icon sidebar.

---

## 2. Phase 1 — Quy trình (Workflow)

### 2.1 Quy trình theo hợp đồng & dòng sản phẩm
- Mỗi **hợp đồng** giờ có thể chọn một **quy trình áp dụng** riêng (trường mới `Contract.workflowId`). Khi tạo handover / bảo hành / huấn luyện từ hợp đồng đó, hệ thống lấy đúng quy trình của hợp đồng.
- Nếu hợp đồng chưa chọn quy trình, hệ thống nhìn xuống **dòng sản phẩm chính của hợp đồng** (mapping `ProductCategoryWorkflowDefault`).
- Nếu vẫn chưa có, hệ thống dùng **quy trình mặc định của module** như trước.
- Thứ tự ưu tiên: `Hợp đồng → Dòng sản phẩm → Mặc định module`.

### 2.2 Bước có giai đoạn & yêu cầu tài liệu
- Mỗi bước (`WorkflowStep`) thêm 2 thuộc tính:
  - **`phaseCode`**: gắn vào 1 trong các giai đoạn `Bàn giao / Huấn luyện / Bảo hành / Khác`.
  - **`requireDocument`**: bật/tắt yêu cầu phải có tài liệu đính kèm mới được duyệt bước.
- Khi bấm "Phê duyệt" mà bước đang ở chế độ yêu cầu tài liệu nhưng chưa upload → server trả lỗi 400 "Cần đính kèm tài liệu trước khi chuyển bước".

### 2.3 Kéo thả sắp xếp bước
- Trang **chỉnh sửa quy trình** (`/quy-trinh/.../editor`) cho phép kéo các bước để đổi thứ tự (dùng `@dnd-kit/sortable`). Nút Lên/Xuống cũ vẫn còn cho ai quen thao tác cũ.
- Mỗi bước có badge "Giai đoạn" và icon kẹp giấy khi yêu cầu tài liệu, để dễ nhìn.

### 2.4 Tài liệu cho từng bước
- Module mới `workflow-documents` quản lý file đính kèm theo `WorkflowInstance + stepId`. File được lưu local trong `backend/uploads/workflow/<instanceId>/`.
- 3 API mới dưới `/api/v1/workflow-instances/:id/documents`:
  - `GET` — liệt kê tài liệu.
  - `POST` (multipart `file`) — upload tài liệu mới.
  - `DELETE /:docId` — xoá tài liệu.
- Panel "Tiến trình xử lý" trên màn chi tiết Handover / Warranty / Training có thêm khu **Tài liệu của bước hiện tại** kèm nút Upload / Xoá.

### 2.5 Mapping "dòng sản phẩm → quy trình"
- Trang `WorkflowOverviewPage` có khối **Áp dụng theo dòng sản phẩm** để quản lý cặp `categoryCode → workflowId`.
- 3 API mới dưới `/api/v1/product-category-workflows`: `GET`, `PUT` (`{ categoryCode, workflowId }`), `DELETE`.

### 2.6 Bổ sung dữ liệu
- Seed `DataDefinition` mới `workflow_phase` với 4 giá trị: `handover`, `training`, `warranty`, `other`.
- Thêm sẵn 1 quy trình hệ thống cho hợp đồng (`WF_CONTRACT_DEFAULT`).
- Script `backend/scripts/backfill-contract-workflow.ts` để gán workflow cho các hợp đồng cũ chưa có.

---

## 3. Phase 2 — Hợp đồng & Sản phẩm

### 3.1 Mặc định trạng thái sản phẩm
- `Product.status` đổi mặc định từ `developing` (Đang phát triển) sang `producing` (Đang sản xuất).
- Tạo sản phẩm mới mà không chọn trạng thái → tự động là **Đang sản xuất**.
- Dữ liệu cũ giữ nguyên, chỉ áp với bản ghi mới.

### 3.2 Nhắc lịch nâng cao (cron 24h)
Thêm 4 loại thông báo:
| Key | Quét gì | Cấu hình |
|---|---|---|
| `warranty_expiry` | Hợp đồng có `warrantyEnd` sắp hết | `warranty_expiry_remind_days` (mặc định 14 ngày) |
| `training_upcoming` | `TrainingCourse.startDate` sắp tới + `status = planned` | `training_upcoming_remind_days` (mặc định 7 ngày) |
| `repair_scheduled` | `Warranty` sắp đến hạn SLA | `repair_scheduled_remind_days` (mặc định 1 ngày) |
| `customer_anniversary` | Ngày kỷ niệm khách hàng | từng kỷ niệm có `reminderDays` riêng |

### 3.3 Nhắc hết hạn hợp đồng theo giá trị
- Hợp đồng giá trị **cao** (≥ `contract_value_high_threshold`, mặc định 500 triệu) → nhắc trước **90 ngày**.
- Hợp đồng giá trị thấp → nhắc trước **14 ngày**.
- Các ngưỡng này chỉnh trong `Cài đặt → Hệ thống` (`contract_value_high_threshold`, `contract_remind_days_high`, `contract_remind_days_low`).

### 3.4 Preferences thông báo
- 4 loại thông báo mới trên đây được thêm vào `UserNotificationPreference` để mỗi người có thể bật/tắt riêng.

---

## 4. Phase 3 — CRM 360

### 4.1 Trường mới cho khách hàng
- `Customer.foundedAt` (ngày thành lập đối tác).
- `Customer.revenueTotal`, `Customer.expenseTotal` (snapshot doanh thu / chi phí — phục vụ KPI nhanh).

### 4.2 API chi tiết khách hàng `GET /api/v1/customers/:id`
Trả về gộp:
- `summary`: tổng hợp đồng, đang thực hiện, doanh thu (HĐ active + completed), giá trị HĐ đang chạy, số phiếu bảo hành mở, chi phí.
- `contacts`: danh sách liên hệ.
- `contracts`: danh sách hợp đồng + tiến độ.
- `warranties`: phiếu bảo hành.
- `crmActivities`: 10 tương tác CRM gần nhất.
- `anniversaries`: danh sách ngày kỷ niệm.

### 4.3 Ngày kỷ niệm khách hàng
- Model mới `CustomerAnniversary { label, occursAt, recurringYearly, reminderDays, notes }`.
- Module API mới `/api/v1/customer-anniversaries` (CRUD + query `?upcoming=30`).
- Có thể đặt **lặp hàng năm**: hệ thống tự tính ngày xảy ra trong năm hiện tại.
- Cron `customer_anniversary` quét các kỷ niệm còn ≤ `reminderDays` ngày → đẩy notification cho admin/manager/sales.

### 4.4 Bộ lọc nâng cao
- **Khách hàng** (`/khach-hang`): thêm filter `Tạo từ ... đến ...` (`createdFrom`, `createdTo`).
- **Hợp đồng** (`/hop-dong`): thêm bộ lọc nâng cao:
  - Đa trạng thái (`statuses`) — bấm nhiều nút trạng thái cùng lúc.
  - `Ký từ ... đến ...` (`signedFrom`, `signedTo`).
  - `Tạo từ ... đến ...` (`createdFrom`, `createdTo`).
  - Nút "Xoá bộ lọc".

### 4.5 Màn chi tiết khách hàng đã được chia tab
`CustomerDetailDialog` giờ là sheet bên phải có 5 tab:
1. **Tổng quan**: 6 thẻ KPI (tổng hợp đồng, đang thực hiện, phiếu bảo hành mở, doanh thu, giá trị HĐ đang chạy, chi phí) + khối thông tin liên hệ.
2. **Liên hệ**: danh sách `Contact` của khách hàng.
3. **Hợp đồng**: bảng hợp đồng (mã, tiêu đề, giá trị, thời gian, tiến độ %, trạng thái).
4. **Phản hồi**: phiếu bảo hành gần đây + tương tác CRM.
5. **Kỷ niệm**: form thêm kỷ niệm (tên, ngày, nhắc trước, lặp hàng năm, ghi chú) + list với badge "Còn N ngày" + nút xoá.

---

## 5. Phase 4 — Báo cáo / Cảnh báo / Badge

### 5.1 API báo cáo mới
- `GET /api/v1/reports/material-defects?from=&to=&limit=`:
  - Đếm số phiếu bảo hành theo `productId`, join `ProductBom` để ra danh sách **vật tư hay hỏng**.
  - Trả về: `code`, `name`, `defects` (số lần hỏng), `affectedProducts` (số SP bị ảnh hưởng), `estimateQty` (số lượng ước lượng cần thay thế).
- `GET /api/v1/reports/badges`: trả 6 con số đếm để badge sidebar dùng:
  - `overdueHandovers` — bàn giao chưa hoàn thành + đã quá hạn.
  - `openWarranties` — phiếu bảo hành đang mở/đang xử lý.
  - `lateTasks` — task chưa xong + quá hạn.
  - `upcomingTrainings` — khoá đào tạo `planned` trong vòng 7 ngày tới.
  - `unreadNotifications` — thông báo chưa đọc của user hiện tại.
  - `overdueContracts` — hợp đồng trạng thái `late`.

### 5.2 Badge số trên menu
- Hook mới `useSidebarBadges` (`/api/v1/reports/badges`, refresh 60s/lần).
- **AppSidebar** (PC) và **BottomNav** (mobile) đều render badge đỏ nhỏ ở góc icon:
  - Hợp đồng → `overdueContracts`
  - Bàn giao → `overdueHandovers`
  - Bảo hành → `openWarranties`
  - Công việc → `lateTasks`
  - Đào tạo → `upcomingTrainings`
- Số > 99 hiển thị `99+`.

### 5.3 Cảnh báo nhấp nháy cho dòng quá hạn
- Thêm utility CSS `animate-pulse-soft` trong `src/index.css` (keyframes 1.8s).
- Áp class này cho row trong bảng nếu:
  - **Tasks**: chưa hoàn thành và `deadline < now`.
  - **Handover**: chưa hoàn thành và `dueDate < now`.
  - **Warranty**: đang xử lý + ưu tiên `urgent` hoặc `high`.

### 5.4 Tab Dashboard cho từng menu nghiệp vụ
- **Bảo hành (`/bao-hanh`)** có tab **Dashboard**:
  - 4 thẻ KPI: tổng phiếu, đang xử lý, hoàn thành, phân bố theo loại (bảo hành / sửa chữa / bảo trì).
  - Khối "Phân bố trạng thái" có thanh tiến độ.
  - Khối **Top vật tư hay hỏng** lấy từ `/reports/material-defects?limit=5`.
- **Bàn giao & Huấn luyện (`/ban-giao`)** có tab **Dashboard**:
  - 4 thẻ KPI: tổng bàn giao, đang thực hiện, hoàn thành, quá hạn.
  - Danh sách "Khoá huấn luyện sắp diễn ra".

---

## 6. Danh sách file thay đổi chính

### Backend
- `prisma/schema.prisma` — thêm trường/model mới.
- `prisma/migrations/`:
  - `20260513150000_workflow_phase_doc_contract/`
  - `20260513150100_product_category_workflow/`
  - `20260513160000_product_status_default_producing/`
  - `20260513170000_customer_360/`
- `src/modules/workflows/{schema,service,runtime,controller}.ts`
- `src/modules/workflow-documents/` (mới)
- `src/modules/product-category-workflows/` (mới)
- `src/modules/customer-anniversaries/` (mới)
- `src/modules/contracts/{schema,service,controller}.ts`
- `src/modules/customers/{schema,service}.ts`
- `src/modules/products/service.ts`
- `src/modules/system-settings/defaults.ts`
- `src/modules/notification-preferences/{schema,service}.ts`
- `src/modules/reports/{schema,service,controller,route}.ts`
- `src/jobs/notify.ts`
- `src/config/seed-definitions.ts`, `src/config/seed-workflows.ts`
- `src/routes/v1/index.ts`
- `scripts/backfill-contract-workflow.ts` (mới)

### Frontend
- `src/hooks/use-workflows-api.ts`, `use-contracts-api.ts`, `use-customers-api.ts`
- `src/hooks/use-anniversaries-api.ts` (mới)
- `src/hooks/use-sidebar-badges.ts` (mới)
- `src/hooks/use-material-defects.ts` (mới)
- `src/components/workflow/{WorkflowStepCard,StepUpsertDialog,WorkflowInstancePanel}.tsx`
- `src/pages/WorkflowEditorPage.tsx`, `WorkflowOverviewPage.tsx`, `WorkflowListPage.tsx`
- `src/components/details/ContractEditDialog.tsx`, `CreateProductDialog.tsx`, `CustomerDetailDialog.tsx`
- `src/pages/Contracts.tsx`, `Customers.tsx`, `Warranty.tsx`, `Handover.tsx`, `Tasks.tsx`
- `src/components/layout/AppSidebar.tsx`, `BottomNav.tsx`
- `src/index.css` (keyframes `pulse-soft`)

---

## 7. Cách chạy / kiểm tra

1. **Áp migration mới**:
   ```bash
   pnpm --filter backend exec prisma migrate deploy
   ```
2. (Tuỳ chọn) Backfill workflow cho hợp đồng cũ:
   ```bash
   pnpm --filter backend exec tsx scripts/backfill-contract-workflow.ts
   ```
3. Khởi động lại backend và frontend:
   ```bash
   pnpm dev:all
   ```
4. Kiểm tra nhanh:
   - Vào **Cài đặt → Hệ thống** chỉnh các key nhắc lịch mới.
   - Vào **Quy trình → Bàn giao/Huấn luyện/Bảo hành/Hợp đồng**, mở editor, kéo thả bước, bật "Yêu cầu tài liệu".
   - Tạo / sửa **Hợp đồng** — chọn "Quy trình áp dụng".
   - Mở chi tiết **Khách hàng** — xem 5 tab, thêm "Kỷ niệm".
   - Lọc **Hợp đồng** theo nhiều trạng thái + ngày ký.
   - Vào **Bảo hành** → tab Dashboard xem "Top vật tư hỏng".
   - Để ý **badge số đỏ** trên icon sidebar khi có phiếu quá hạn.

---

## 8. Một số lưu ý

- File tài liệu upload theo bước được lưu **local** trong `backend/uploads/workflow/`. Đảm bảo thư mục này được loại khỏi Git và backup khi triển khai thực tế.
- Cron `runNotificationScan` chạy ngầm khi backend khởi động (mặc định 24h/lần) — không phụ thuộc người dùng.
- Badge sidebar gọi `/reports/badges` 60s/lần, endpoint chỉ trả số đếm nên rất nhẹ.
- Khi thay đổi schema (chạy `prisma migrate dev`/`deploy`), nếu backend dev server đang chạy có thể giữ file `query_engine-windows.dll.node` — chỉ cần khởi động lại `pnpm dev:all` là xong.
