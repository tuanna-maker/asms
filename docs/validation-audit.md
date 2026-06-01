# Ma trận kiểm tra validation & thông báo lỗi

Cập nhật theo kế hoạch chuẩn hóa lỗi ASMS. Trạng thái sau Phase 1 (nền tảng) và các đợt sửa.

## Chuẩn chung

| Lớp | Chuẩn |
|-----|--------|
| BE envelope | `{ success: false, message, data }` — `errorHandler.ts` |
| BE Zod | `formatValidationError` → message tiếng Việt + `data.fieldErrors` |
| FE API lỗi | `getApiErrorMessage` / `toastApiError` — `src/lib/api-errors.ts` |
| FE form | Guard client (toast/inline) **và** luôn hiển thị message từ API khi fail |

## Phản ánh (P0)

| Màn / API | Client guard | BE Zod | BE nghiệp vụ VN | FE lỗi | Gap / ghi chú |
|-----------|--------------|--------|----------------|--------|----------------|
| Wizard tạo `/phan-anh/tao` | `validateStep` (KH, tiêu đề, nội dung, lời KH, phân công, HĐ+SP) | `createCustomerFeedbackSchema` | linkage, assignee, HĐ thuộc KH | `toastApiError` | Cảnh báo xác nhận khi SP/VT nhưng không route được đơn vị |
| Sửa phản ánh | `CustomerFeedbackEditForm` guard | `updateCustomerFeedbackSchema` | tương tự create | `toastApiError` | — |
| Chi tiết / workflow | assignment status | `updateAssignmentSchema` | workflow VN | `toastApiError` | — |
| Bình luận | nội dung trống | `createFeedbackCommentSchema` | quyền comment | `toastApiError` | — |
| Đơn vị xử lý (Cài đặt) | mã/tên | unit schema | mã trùng, FK đơn vị | `toastApiError` | — |
| `GET/POST /customer-feedbacks` | — | query/body schemas | 404 → tiếng Việt | list invalidate sau 404 | — |

## Core vận hành

| Màn / API | Client guard | BE | FE lỗi | Gap |
|-----------|--------------|-----|--------|-----|
| Hợp đồng `ContractEditDialog` | một phần | Zod + service | `getApiErrorMessage` (shared) | catch generic còn vài chỗ |
| Bảo hành `WarrantyDetailDialog` | form fields | warranties schema | shared helper | — |
| Vật tư `Materials` | tên, SL, đích | materials schema | `toastApiError` / msg local | import batch |
| Đào tạo `Training*` | họ tên, đơn vị | training schema | `toastApiError` | — |
| Bàn giao `Handover*` | dialog guard | handovers schema | shared helper | — |

## CRM & master

| Màn | Client guard | FE lỗi | Gap |
|-----|--------------|--------|-----|
| `Customers.tsx` | thiếu tên (một số flow) | `toastApiError` | update path |
| `CustomerDetailDialog` | có | `toastApiError` | — |
| `Products` / `CreateProductDialog` | Zod BOM | `errMessage`→shared | — |
| `Tasks.tsx` | **thiếu** title guard | `toastApiError` | bổ sung guard tiêu đề |
| `ResearchProjects.tsx` | một phần | `toastApiError` | — |
| `Documents.tsx` | tên + người tạo | `toastApiError` | — |

## Cài đặt & quy trình

| Màn | Client guard | FE lỗi |
|-----|--------------|--------|
| `SettingsPage` users/roles | password 8+ | `errMessage` → `getApiErrorMessage` |
| `WorkflowEditorPage` | tên quy trình | shared |
| `StepUpsertDialog` | tên bước, vai trò, mã trường | guard local |
| Thuộc tính (attributes) | mã hợp lệ | shared |

## Regression (smoke)

1. Tạo phản ánh thiếu tiêu đề → toast VN, không gọi API (hoặc 400 message VN).
2. Tạo phản ánh có SP, không rule routing → dialog xác nhận; nếu hủy không tạo.
3. Sửa phản ánh 404 (đã xóa) → toast + quay list.
4. Lưu công việc thiếu tiêu đề → toast guard.
5. Zod BE: body thiếu `customerId` → message có "khách hàng".

## File nền tảng

- `src/lib/api-errors.ts`, `src/test/api-errors.test.ts`
- `backend/src/lib/errors/formatValidationError.ts`, `zodParse.ts`
- `backend/src/middleware/validate.ts` (dùng format Zod VN)
