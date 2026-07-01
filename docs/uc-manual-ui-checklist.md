# Checklist kiểm tra thủ công — UC UI-only & Workflow

> Bổ sung cho smoke API tự động. Ghi pass/fail vào [uc-test-matrix.md](./uc-test-matrix.md).

## UC chỉ kiểm tra trên UI (6 UC)

| UC | Nội dung | Cách kiểm | Pass |
|----|----------|-----------|:----:|
| UC-DASH-10 | Luân chuyển tab dashboard tự động | Mở Dashboard → bật auto-rotate → xác nhận tab đổi sau interval | ☐ |
| UC-BC-08 | Xuất Excel báo cáo | Tab Báo cáo → Xuất Excel → file tải về mở được | ☐ |
| UC-BC-09 | In báo cáo | Tab Báo cáo → In → preview/print dialog | ☐ |
| UC-TL-04 | Upload file tài liệu | Tài liệu → upload PDF thật → hiển thị + tải được | ☐ |
| UC-TB-04 | Routing thông báo | Tạo sự kiện (kỷ niệm/hạn HĐ) → user nhận TB đúng | ☐ |
| UC-TB-05 | Cron thông báo | Kiểm tra job notify chạy (log server hoặc TB mới sau cron) | ☐ |

## Workflow runtime (UAT)

| # | Kịch bản | Pass |
|---|----------|:----:|
| 1 | Khởi tạo instance HĐ/BG/BH tự động khi tạo phiếu | ☐ |
| 2 | Advance bước đúng vai trò → thành công | ☐ |
| 3 | Advance sai vai trò → toast lỗi VN / 403 | ☐ |
| 4 | Trả lại bước → trạng thái cập nhật | ☐ |
| 5 | Đính kèm tài liệu bước QT → tải được (JWT upload) | ☐ |
| 6 | Field động bước BH — nhập sai → validation VN | ☐ |

## Regression validation (theo validation-audit.md)

| # | Kịch bản | Pass |
|---|----------|:----:|
| 1 | Tạo phản ánh thiếu tiêu đề → toast VN, không gọi API | ☐ |
| 2 | Tạo phản ánh có SP, không rule routing → dialog xác nhận | ☐ |
| 3 | Sửa phản ánh 404 → toast + quay list | ☐ |
| 4 | Lưu công việc thiếu tiêu đề → toast guard | ☐ |
| 5 | Body thiếu customerId (API) → message có "khách hàng" | ☐ |
| 6 | Cập nhật KH thiếu tên → toast guard | ☐ |

## Ghi chú

- Chạy trên staging với 5 tài khoản demo đã đổi mật khẩu
- Tham chiếu [uat-checklist.md](./uat-checklist.md) cho checklist đầy đủ
