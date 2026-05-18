# Triển khai: Màn BH/SC theo 5 giai đoạn (đồng bộ sâu)

Tài liệu tóm tắt **những gì đã được cài đặt trong codebase** (không sửa file kế hoạch gốc). Tham chiếu kiến trúc: quy trình 5 bước nghiệp vụ, API/DB, workflow `WF_WARRANTY_DEFAULT`, UI và liên kết tài liệu theo phiếu.

---

## 1. Cơ sở dữ liệu (Prisma + migration)

### Enum mới

- `WarrantyReceiptCategory`: `incident` | `technical_support`
- `WarrantyRootCause`: `manufacturer` | `customer` | `unknown`
- `WarrantyExecutionMode`: `self` | `outsource`

### Bảng `warranties` — cột bổ sung

| Cột (Prisma / DB) | Ý nghĩa |
|-------------------|---------|
| `receiptCategory` | Phân loại tiếp nhận |
| `occurredAt` | Thời điểm phát sinh |
| `productSerialSnapshot` | Serial snapshot tại tiếp nhận |
| `rootCause` | Đánh giá nguyên nhân |
| `handlingPlan` | PA / KH BHSC (text) |
| `plannedHours` | Giờ xử lý dự kiến |
| `costEstimate` | Chi phí ước tính |
| `customerDisagreedClose` | KH không đồng ý PA → đóng |
| `executionMode` | Tự làm / thuê ngoài |
| `outsourcePartner`, `outsourceBudget`, `outsourceTimeline` | Thuê ngoài |
| `repairDetails` | Nội dung sửa chữa (tự làm) |
| `postRepairAssessment` | Đánh giá sau BHSC |
| `handoverNotes` | Ghi chú bàn giao |

### Bảng `documents`

- `warrantyId` (nullable, FK → `warranties`, `ON DELETE SET NULL`)
- Index `idx_documents_warranty_id`

### Quan hệ Prisma

- `Warranty.documents` ↔ `Document.warranty`

### Migration

- Thư mục: `backend/prisma/migrations/20260514120000_warranty_bhsc_5_phase/`
- Nội dung chính:
  - Tạo enum + thêm cột như trên.
  - Chuẩn hóa `workflow_step`: giá trị `> 5` được gán về `5`.
  - **Thay thế** toàn bộ `workflow_steps` của định nghĩa `WF_WARRANTY_DEFAULT` bằng **đúng 5 bước** mới (tên khớp nghiệp vụ).
  - Với `workflow_instances` đang `running`, `module_key = 'warranty'`, cùng `workflow_id` của `WF_WARRANTY_DEFAULT`: gắn lại `current_step_id` về bước đầu (sau khi insert step mới).
  - Cập nhật `warranties.workflow_step = 1` cho các phiếu gắn instance đang chạy như trên.

**Rủi ro / lưu ý vận hành:** Instance cũ đang chạy bị “kéo” về bước 1 sau migration — cần thông báo nội bộ nếu môi trường production đang có phiếu live.

Sau khi kéo code: chạy migration trên DB và `pnpm exec prisma generate` (nếu gặp lỗi `EPERM` trên Windows với file engine Prisma, đóng tiến trình đang giữ DLL rồi generate lại).

---

## 2. Backend — module `warranties`

- **`backend/src/modules/warranties/schema.ts`**: mở rộng `createWarrantySchema` / `updateWarrantySchema` (Zod) với toàn bộ field mới; `workflowStep` trong khoảng 1–5; `assigneeId` cho phép `null`.
- **`backend/src/modules/warranties/service.ts`**:
  - List: `select` thêm các field BH/SC.
  - Detail: `include` khách hàng, sản phẩm, hợp đồng, assignee, **`documents`** (tối đa 40 bản ghi, chưa xóa mềm).
  - Create / Update: map enum, text, boolean; chuỗi thời gian `occurredAt` → `DateTime`; `costEstimate` / `outsourceBudget` qua helper decimal dạng chuỗi cho Prisma.
- **`backend/src/modules/warranties/controller.ts`**: tạo phiếu dùng spread payload + gán `assigneeId` mặc định là user hiện tại nếu không gửi.

---

## 3. Backend — module `documents`

- **`backend/src/modules/documents/schema.ts`**: `warrantyId` trên create/update; query list có `warrantyId`.
- **`backend/src/modules/documents/service.ts`**: lọc theo `warrantyId`, ghi/đọc cột, detail kèm `warranty` (id, code, issue).
- **`backend/src/modules/documents/controller.ts`**: list query, create, update, upload — truyền `warrantyId` khi có.

---

## 4. Workflow seed (môi trường mới)

- **`backend/src/config/seed-workflows.ts`**: `WF_WARRANTY_DEFAULT` được định nghĩa lại thành **5 bước** với tên:

  1. Tiếp nhận yêu cầu  
  2. Phân tích, đề xuất PA và KH BHSC  
  3. Thực hiện BHSC  
  4. Kiểm tra sau BHSC  
  5. Bàn giao SP cho KH  

Lưu ý: seed thường **bỏ qua** nếu definition đã tồn tại; DB đã triển khai trước đó dựa vào **migration SQL** ở mục 1.

---

## 5. Frontend — cây 5 giai đoạn (single source)

- **`src/lib/warranty-process-tree.ts`**
  - `WARRANTY_PROCESS_PHASES`: mỗi phase có `id`, `key`, `title`, `docHints[]`, `dataBranches[]`.
  - `WARRANTY_PHASE_COUNT` (= 5), `warrantyPhaseTitle(step)`.

---

## 6. Frontend — trang & dialog

- **`src/pages/Warranty.tsx`**
  - Timeline “Quy trình…” dùng `WARRANTY_PROCESS_PHASES`.
  - Cột tiến độ trong bảng: `step / WARRANTY_PHASE_COUNT`.
  - Màu thanh tiến độ: dùng `backendStatus === "completed"` (sửa lỗi dùng field không tồn tại trên ticket UI).

- **`src/components/details/WarrantyDetailDialog.tsx`**
  - Tiến độ 5 bước đồng bộ với lib.
  - Accordion 5 section map trực tiếp field API.
  - `useWarrantyDetail` khi mở phiếu (không phải chế độ tạo mới).
  - Hiển thị danh sách tài liệu gắn `warrantyId`.
  - Lưu / tạo: gửi kèm payload BH/SC.

---

## 7. Frontend — hooks

- **`src/hooks/use-warranties-api.ts`**: type `WarrantyPayload`, `WarrantyListRow`, `WarrantyDetail`, `WarrantyDocumentRow`; hook `useWarrantyDetail`; invalidate query detail sau update/delete.
- **`src/hooks/use-documents-api.ts`**: `warrantyId` trên payload tạo tài liệu và upload (FormData).

---

## 8. Kiểm tra tĩnh

- Đã chạy `pnpm exec tsc --noEmit` cho **backend** và **frontend** (workspace) — không báo lỗi type tại thời điểm triển khai.

---

## 9. Gợi ý smoke test sau khi migrate DB

1. Tạo phiếu mới → kiểm tra instance workflow 5 bước trên `WorkflowInstancePanel`.
2. Sửa từng accordion → GET detail trả đúng dữ liệu.
3. Upload / tạo tài liệu có `warrantyId` → danh sách trong dialog phiếu hiển thị.

---

*Tệp này do quá trình triển khai tạo để tra cứu nhanh; có thể cập nhật thêm khi có thay đổi tiếp theo.*
