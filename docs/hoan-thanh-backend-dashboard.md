# Hoàn thành kế hoạch backend + dashboard

Tài liệu này tổng hợp các phần đã hoàn thành theo plan `hoan_thien_backend_va_dashboard_1825be9a.plan.md`.

## 1) Contract `terms` (backend + frontend) - Hoàn thành

- Backend:
  - Đã thêm trường `terms String? @db.Text` trong `backend/prisma/schema.prisma`.
  - Đã cập nhật schema validate ở `backend/src/modules/contracts/schema.ts` cho create/update.
  - Đã cập nhật service ở `backend/src/modules/contracts/service.ts` để lưu, cập nhật, và trả về `terms`.
  - Đã cập nhật dữ liệu seed demo trong `backend/src/config/seed-demo-data.ts`.
- Frontend:
  - Đã bổ sung `terms?: string | null` trong `src/hooks/use-contracts-api.ts`.
  - Đã thêm ở popup tạo hợp đồng (`src/pages/Contracts.tsx`).
  - Đã thêm ở popup chỉnh sửa hợp đồng (`src/components/details/ContractEditDialog.tsx`).
  - Đã hiển thị `terms` từ dữ liệu thực trong chi tiết hợp đồng (`src/components/details/ContractDetailDialog.tsx`) kèm placeholder khi rỗng.

## 2) Contract Detail bỏ mock (products/docs/training) - Hoàn thành

- Đã bỏ sample data hardcode trong `src/components/details/ContractDetailDialog.tsx`.
- Đã lấy dữ liệu thực:
  - Products từ contract detail API.
  - Documents từ danh sách tài liệu theo `contractId`.
  - Training từ dữ liệu khóa đào tạo liên quan hợp đồng.
- Đã thêm empty state rõ ràng cho các tab khi không có dữ liệu.

## 3) Dashboard dùng dữ liệu API thực - Hoàn thành

- Đã tạo hook tổng hợp `src/hooks/use-dashboard-data.ts`.
- Đã thay các import/nguồn mock trong:
  - `src/pages/Index.tsx`
  - `src/components/dashboard/tabs/OverviewTab.tsx`
  - `src/components/dashboard/tabs/ProjectTab.tsx`
  - `src/components/dashboard/tabs/MaterialTab.tsx`
- Đã xử lý loading/error theo hướng dữ liệu thực, không fallback mock ở các tab trên.

## 4) Reports chuẩn hóa empty state - Hoàn thành

- Đã bỏ các mảng fallback static trong `src/pages/Reports.tsx`.
- Khi API trả mảng rỗng:
  - Biểu đồ hiện thông điệp "Không có dữ liệu".
  - Bảng hiện trạng thái không có dữ liệu.
- Đã tính dữ liệu trạng thái hợp đồng theo response API reports.

## 5) Dọn dẹp lint + warning (mục tiêu 0 errors) - Hoàn thành

- Đã sửa nhiều vị trí `any` sang type cụ thể (backend service/controller + frontend file liên quan).
- Đã sửa các lỗi như:
  - `no-require-imports`
  - `no-empty-object-type`
  - các vấn đề type với `exactOptionalPropertyTypes` ở backend.
- Đã cập nhật `eslint.config.js` để bỏ qua `backend/dist/**`.

## Kết quả xác nhận

- Backend build: PASS.
- Frontend build: PASS.
- Unit test: PASS (tất cả test đang có đều qua).
- `npm run lint`: 0 errors, còn warning (chấp nhận theo acceptance criteria của plan).

