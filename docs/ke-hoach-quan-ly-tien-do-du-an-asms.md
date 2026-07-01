# Kế hoạch quản lý tiến độ dự án ASMS

| Thuộc tính | Nội dung |
|---|---|
| **Tên dự án** | ASMS — Hệ thống quản lý hậu mãi |
| **Phiên bản** | 4.1 |
| **Ngày cập nhật** | 24/06/2026 |
| **Phạm vi** | **152 Use Case vận hành** (14 phân hệ có menu) — loại 19 UC màn ẩn menu |
| **Bản in A4** | [ke-hoach-quan-ly-tien-do-du-an-asms.html](./ke-hoach-quan-ly-tien-do-du-an-asms.html) |

> Thời gian là **ước tính ngày công dev**. Phạm vi 152 UC đồng bộ BRD / `export-asms-uc-excel.py`. Sinh: `node scripts/generate-uc-progress-doc.mjs`

---

## 1. Chỉ số tổng hợp

| Chỉ số | Giá trị |
|--------|--------:|
| Tổng Use Case (phạm vi 152) | **152** |
| Đã hoàn thành | **152** (pass 144, manual 6, no_data 2) |
| Tổng ngày công (ước tính) | **102.25** |

---

## 2. Tổng hợp theo phân hệ

| Phân hệ | Module | Số UC | Đã xong | Tổng thời gian |
|---------|--------|------:|--------:|---------------:|
| Xác thực | `AUTH` | 7 | 7 | 4 ngày |
| Dashboard | `dashboard` | 11 | 11 | 10.5 ngày |
| Hợp đồng | `hop-dong` | 14 | 14 | 9 ngày |
| Hợp đồng — Điều khoản | `hop-dong.dieu-khoan` | 7 | 7 | 4.5 ngày |
| Bàn giao | `ban-giao` | 12 | 12 | 9.5 ngày |
| Bảo hành | `bao-hanh` | 8 | 8 | 5.75 ngày |
| Sản phẩm | `san-pham` | 12 | 12 | 7.75 ngày |
| Vật tư | `vat-tu` | 8 | 8 | 5 ngày |
| Khách hàng | `khach-hang` | 9 | 9 | 5.25 ngày |
| Phản ánh | `phan-anh` | 18 | 18 | 10 ngày |
| Báo cáo | `bao-cao` | 9 | 9 | 4.5 ngày |
| Tài liệu | `tai-lieu` | 8 | 8 | 4.75 ngày |
| Quy trình | `quy-trinh` | 13 | 13 | 13.75 ngày |
| Cài đặt | `cai-dat` | 11 | 11 | 5.5 ngày |
| Thông báo | `thong-bao` | 5 | 5 | 2.5 ngày |

---

## 3. Danh sách Use Case chi tiết

### 3. Xác thực (`AUTH`) — 4 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-AUTH-01 | Đăng nhập | Hoàn thành | 0.5 ngày |
| 2 | UC-AUTH-02 | Đăng xuất | Hoàn thành | 0.5 ngày |
| 3 | UC-AUTH-03 | Làm mới phiên | Hoàn thành | 0.5 ngày |
| 4 | UC-AUTH-04 | Xem danh sách phiên | Hoàn thành | 0.5 ngày |
| 5 | UC-AUTH-05 | Thu hồi phiên | Hoàn thành | 0.5 ngày |
| 6 | UC-AUTH-06 | Đăng xuất tất cả | Hoàn thành | 0.5 ngày |
| 7 | UC-AUTH-07 | Tạo tài khoản | Hoàn thành | 1 ngày |

### 4. Dashboard (`dashboard`) — 10.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-DASH-01 | Xem tổng quan | Hoàn thành | 1 ngày |
| 2 | UC-DASH-02 | Xem theo khách hàng | Hoàn thành | 1 ngày |
| 3 | UC-DASH-03 | Xem doanh thu | Hoàn thành | 1 ngày |
| 4 | UC-DASH-04 | Xem dự án / tiến độ | Hoàn thành | 1 ngày |
| 5 | UC-DASH-05 | Xem sản phẩm | Hoàn thành | 1 ngày |
| 6 | UC-DASH-06 | Xem bảo hành | Hoàn thành | 1 ngày |
| 7 | UC-DASH-07 | Xem vật tư | Hoàn thành | 1 ngày |
| 8 | UC-DASH-08 | Xem cảnh báo | Hoàn thành | 1 ngày |
| 9 | UC-DASH-09 | Lọc theo năm/quý/KH | Hoàn thành | 0.5 ngày |
| 10 | UC-DASH-10 | Luân chuyển tab tự động *(UI-only (auto-rotate/fullscreen))* | Hoàn thành (thủ công) | 1 ngày |
| 11 | UC-DASH-11 | Xem badge menu | Hoàn thành | 1 ngày |

### 5. Hợp đồng (`hop-dong`) — 9 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-HD-01 | Xem danh sách HĐ | Hoàn thành | 0.5 ngày |
| 2 | UC-HD-02 | Xem chi tiết HĐ | Hoàn thành | 0.5 ngày |
| 3 | UC-HD-03 | Tạo HĐ | Hoàn thành | 1 ngày |
| 4 | UC-HD-04 | Sửa HĐ | Hoàn thành | 0.75 ngày |
| 5 | UC-HD-05 | Xóa HĐ | Hoàn thành | 0.5 ngày |
| 6 | UC-HD-06 | Gán danh mục SP | Hoàn thành | 0.5 ngày |
| 7 | UC-HD-07 | Sửa SP trong HĐ | Hoàn thành | 0.75 ngày |
| 8 | UC-HD-08 | Xem SP thuộc HĐ | Hoàn thành | 0.5 ngày |
| 9 | UC-HD-09 | Chọn điều khoản mẫu | Hoàn thành | 0.5 ngày |
| 10 | UC-HD-10 | Điền nội dung điều khoản | Hoàn thành | 0.5 ngày |
| 11 | UC-HD-11 | Xem phản ánh liên quan | Hoàn thành | 0.5 ngày |
| 12 | UC-HD-12 | Xem tài liệu HĐ | Hoàn thành | 0.5 ngày |
| 13 | UC-HD-13 | Xử lý quy trình HĐ | Hoàn thành | 1.5 ngày |
| 14 | UC-HD-14 | Đính kèm tài liệu bước QT | Hoàn thành | 0.5 ngày |

### 6. Hợp đồng — Điều khoản (`hop-dong.dieu-khoan`) — 4.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-HD-DK-01 | Xem danh sách điều khoản mẫu | Hoàn thành | 0.5 ngày |
| 2 | UC-HD-DK-02 | Tạo/sửa/xóa điều khoản | Hoàn thành | 1 ngày |
| 3 | UC-HD-DK-03 | Sắp xếp điều khoản | Hoàn thành | 0.5 ngày |
| 4 | UC-HD-DK-04 | Xem nhóm điều khoản | Hoàn thành | 0.5 ngày |
| 5 | UC-HD-DK-05 | Tạo/sửa/xóa nhóm | Hoàn thành | 1 ngày |
| 6 | UC-HD-DK-06 | Gán điều khoản vào nhóm | Hoàn thành | 0.5 ngày |
| 7 | UC-HD-DK-07 | Kiểm tra điều khoản đang dùng | Hoàn thành | 0.5 ngày |

### 7. Bàn giao (`ban-giao`) — 9.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-BG-01 | Xem danh sách bàn giao | Hoàn thành | 0.5 ngày |
| 2 | UC-BG-02 | Xem chi tiết phiếu BG | Hoàn thành | 0.5 ngày |
| 3 | UC-BG-03 | Tạo phiếu bàn giao | Hoàn thành | 1 ngày |
| 4 | UC-BG-04 | Sửa phiếu bàn giao | Hoàn thành | 0.75 ngày |
| 5 | UC-BG-05 | Xóa phiếu bàn giao | Hoàn thành | 0.5 ngày |
| 6 | UC-BG-06 | Xử lý quy trình bàn giao | Hoàn thành | 1.5 ngày |
| 7 | UC-BG-07 | Đính kèm tài liệu bước BG | Hoàn thành | 0.5 ngày |
| 8 | UC-BG-08 | Xem danh sách khóa HL | Hoàn thành | 0.5 ngày |
| 9 | UC-BG-09 | Tạo khóa huấn luyện | Hoàn thành | 1 ngày |
| 10 | UC-BG-10 | Sửa/xóa khóa HL | Hoàn thành | 0.75 ngày |
| 11 | UC-BG-11 | Xử lý quy trình HL | Hoàn thành | 1.5 ngày |
| 12 | UC-BG-12 | Điền payload từng bước HL | Hoàn thành | 0.5 ngày |

### 8. Bảo hành (`bao-hanh`) — 5.75 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-BH-01 | Xem danh sách phiếu BH/SC | Hoàn thành | 0.5 ngày |
| 2 | UC-BH-02 | Xem chi tiết phiếu | Hoàn thành | 0.5 ngày |
| 3 | UC-BH-03 | Tạo phiếu BH/SC | Hoàn thành | 1 ngày |
| 4 | UC-BH-04 | Sửa phiếu | Hoàn thành | 0.75 ngày |
| 5 | UC-BH-05 | Xóa phiếu | Hoàn thành | 0.5 ngày |
| 6 | UC-BH-06 | Xử lý quy trình BH | Hoàn thành | 1.5 ngày |
| 7 | UC-BH-07 | Điền form động theo bước | Hoàn thành | 0.5 ngày |
| 8 | UC-BH-08 | Đính kèm tài liệu bước BH | Hoàn thành | 0.5 ngày |

### 9. Sản phẩm (`san-pham`) — 7.75 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-SP-01 | Xem danh sách SP | Hoàn thành | 0.5 ngày |
| 2 | UC-SP-02 | Xem chi tiết SP | Hoàn thành | 0.5 ngày |
| 3 | UC-SP-03 | Tạo SP | Hoàn thành | 1 ngày |
| 4 | UC-SP-04 | Sửa SP | Hoàn thành | 0.75 ngày |
| 5 | UC-SP-05 | Xóa SP | Hoàn thành | 0.5 ngày |
| 6 | UC-SP-06 | Quản lý BOM | Hoàn thành | 0.5 ngày |
| 7 | UC-SP-07 | Quản lý thông số kỹ thuật | Hoàn thành | 0.5 ngày |
| 8 | UC-SP-08 | Quản lý serial linh kiện | Hoàn thành | 0.5 ngày |
| 9 | UC-SP-09 | Xem/gắn tài liệu SP | Hoàn thành | 0.5 ngày |
| 10 | UC-SP-10 | Xem lịch sử thay đổi | Hoàn thành | 0.5 ngày |
| 11 | UC-SP-11 | Xử lý quy trình SP | Hoàn thành | 1.5 ngày |
| 12 | UC-SP-12 | Tab đào tạo trên SP | Hoàn thành | 0.5 ngày |

### 10. Vật tư (`vat-tu`) — 5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-VT-01 | Xem danh sách vật tư | Hoàn thành | 0.5 ngày |
| 2 | UC-VT-02 | Xem chi tiết vật tư | Hoàn thành | 0.5 ngày |
| 3 | UC-VT-03 | Nhập vật tư mới | Hoàn thành | 0.5 ngày |
| 4 | UC-VT-04 | Sửa vật tư | Hoàn thành | 0.75 ngày |
| 5 | UC-VT-05 | Xóa vật tư | Hoàn thành | 0.5 ngày |
| 6 | UC-VT-06 | Xem phiếu điều chuyển | Hoàn thành | 0.5 ngày |
| 7 | UC-VT-07 | Tạo phiếu điều chuyển | Hoàn thành | 1 ngày |
| 8 | UC-VT-08 | Sửa/xóa phiếu điều chuyển | Hoàn thành | 0.75 ngày |

### 11. Khách hàng (`khach-hang`) — 5.25 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-KH-01 | Xem danh sách KH | Hoàn thành | 0.5 ngày |
| 2 | UC-KH-02 | Xem chi tiết KH | Hoàn thành | 0.5 ngày |
| 3 | UC-KH-03 | Tạo KH | Hoàn thành | 1 ngày |
| 4 | UC-KH-04 | Sửa KH | Hoàn thành | 0.75 ngày |
| 5 | UC-KH-05 | Xóa KH | Hoàn thành | 0.5 ngày |
| 6 | UC-KH-06 | Quản lý liên hệ | Hoàn thành | 0.5 ngày |
| 7 | UC-KH-07 | Quản lý hoạt động CRM | Hoàn thành | 0.5 ngày |
| 8 | UC-KH-08 | Quản lý kỷ niệm KH | Hoàn thành | 0.5 ngày |
| 9 | UC-KH-09 | Đăng ký nhận TB kỷ niệm | Hoàn thành | 0.5 ngày |

### 12. Phản ánh (`phan-anh`) — 10 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-PA-01 | Xem danh sách phản ánh | Hoàn thành | 0.5 ngày |
| 2 | UC-PA-02 | Xem chi tiết phản ánh *(Không có dữ liệu mẫu (feedbackId))* | Hoàn thành (thiếu seed) | 0.5 ngày |
| 3 | UC-PA-03 | Tạo phản ánh | Hoàn thành | 1 ngày |
| 4 | UC-PA-04 | Sửa phản ánh *(Không có dữ liệu mẫu (feedbackId))* | Hoàn thành (thiếu seed) | 0.75 ngày |
| 5 | UC-PA-05 | Xóa phản ánh | Hoàn thành | 0.5 ngày |
| 6 | UC-PA-06 | Phân công người/vai trò | Hoàn thành | 0.5 ngày |
| 7 | UC-PA-07 | Phân luồng theo SP/đơn vị | Hoàn thành | 0.5 ngày |
| 8 | UC-PA-08 | Cập nhật xử lý đơn vị | Hoàn thành | 0.75 ngày |
| 9 | UC-PA-09 | Bình luận phản ánh | Hoàn thành | 0.5 ngày |
| 10 | UC-PA-10 | Yêu cầu đóng | Hoàn thành | 0.5 ngày |
| 11 | UC-PA-11 | Đóng phản ánh | Hoàn thành | 0.5 ngày |
| 12 | UC-PA-12 | Hoàn tất sửa chữa & đóng | Hoàn thành | 0.5 ngày |
| 13 | UC-PA-13 | Mở lại phản ánh | Hoàn thành | 0.5 ngày |
| 14 | UC-PA-14 | Xem tóm tắt công việc PA | Hoàn thành | 0.5 ngày |
| 15 | UC-PA-15 | Thống kê theo KH/SP/VT | Hoàn thành | 0.5 ngày |
| 16 | UC-PA-16 | Lọc theo đơn vị của tôi | Hoàn thành | 0.5 ngày |
| 17 | UC-PA-17 | Cấu hình đơn vị thực hiện | Hoàn thành | 0.5 ngày |
| 18 | UC-PA-18 | Cấu hình quy tắc routing | Hoàn thành | 0.5 ngày |

### 13. Báo cáo (`bao-cao`) — 4.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-BC-01 | Báo cáo theo khách hàng | Hoàn thành | 0.5 ngày |
| 2 | UC-BC-02 | Báo cáo theo hợp đồng | Hoàn thành | 0.5 ngày |
| 3 | UC-BC-03 | Báo cáo theo dòng SP | Hoàn thành | 0.5 ngày |
| 4 | UC-BC-04 | Báo cáo phản ánh | Hoàn thành | 0.5 ngày |
| 5 | UC-BC-05 | Báo cáo đơn vị thực hiện | Hoàn thành | 0.5 ngày |
| 6 | UC-BC-06 | Báo cáo lỗi vật tư | Hoàn thành | 0.5 ngày |
| 7 | UC-BC-07 | Lọc báo cáo | Hoàn thành | 0.5 ngày |
| 8 | UC-BC-08 | Xuất Excel *(UI export client-side)* | Hoàn thành (thủ công) | 0.5 ngày |
| 9 | UC-BC-09 | In báo cáo *(UI print client-side)* | Hoàn thành (thủ công) | 0.5 ngày |

### 14. Tài liệu (`tai-lieu`) — 4.75 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-TL-01 | Xem danh sách tài liệu | Hoàn thành | 0.5 ngày |
| 2 | UC-TL-02 | Xem chi tiết/tải file | Hoàn thành | 0.5 ngày |
| 3 | UC-TL-03 | Tạo metadata tài liệu | Hoàn thành | 1 ngày |
| 4 | UC-TL-04 | Upload file *(Multipart upload — cần file thật)* | Hoàn thành (thủ công) | 0.5 ngày |
| 5 | UC-TL-05 | Sửa tài liệu | Hoàn thành | 0.75 ngày |
| 6 | UC-TL-06 | Xóa tài liệu | Hoàn thành | 0.5 ngày |
| 7 | UC-TL-07 | Lọc theo loại | Hoàn thành | 0.5 ngày |
| 8 | UC-TL-08 | Liên kết HĐ/SP/đề tài | Hoàn thành | 0.5 ngày |

### 15. Quy trình (`quy-trinh`) — 13.75 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-QT-01 | Xem tổng quan nhóm QT | Hoàn thành | 1 ngày |
| 2 | UC-QT-02 | Xem QT theo module | Hoàn thành | 1 ngày |
| 3 | UC-QT-03 | Tạo quy trình | Hoàn thành | 1.5 ngày |
| 4 | UC-QT-04 | Sửa thông tin QT | Hoàn thành | 0.75 ngày |
| 5 | UC-QT-05 | Xóa quy trình | Hoàn thành | 1.5 ngày |
| 6 | UC-QT-06 | Thêm/sửa/xóa bước | Hoàn thành | 1 ngày |
| 7 | UC-QT-07 | Sắp xếp lại bước | Hoàn thành | 1 ngày |
| 8 | UC-QT-08 | Cấu hình trường nhập bước | Hoàn thành | 1 ngày |
| 9 | UC-QT-09 | Tạo bộ bước chuẩn | Hoàn thành | 1 ngày |
| 10 | UC-QT-10 | Gắn QT cho entity | Hoàn thành | 1 ngày |
| 11 | UC-QT-11 | Chuyển bước QT | Hoàn thành | 1 ngày |
| 12 | UC-QT-12 | Xem lịch sử bước | Hoàn thành | 1 ngày |
| 13 | UC-QT-13 | Đính kèm tài liệu instance | Hoàn thành | 1 ngày |

### 16. Cài đặt (`cai-dat`) — 5.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-CD-01 | Quản lý người dùng | Hoàn thành | 0.5 ngày |
| 2 | UC-CD-02 | Quản lý vai trò | Hoàn thành | 0.5 ngày |
| 3 | UC-CD-03 | Ma trận phân quyền | Hoàn thành | 0.5 ngày |
| 4 | UC-CD-04 | Cấu hình TB cá nhân | Hoàn thành | 0.5 ngày |
| 5 | UC-CD-05 | Cấu hình đơn vị PA | Hoàn thành | 0.5 ngày |
| 6 | UC-CD-06 | Cấu hình hệ thống | Hoàn thành | 0.5 ngày |
| 7 | UC-CD-07 | Quản lý phiên đăng nhập | Hoàn thành | 0.5 ngày |
| 8 | UC-CD-08 | Xem nhật ký audit | Hoàn thành | 0.5 ngày |
| 9 | UC-CD-09 | Quản lý danh mục thuộc tính | Hoàn thành | 0.5 ngày |
| 10 | UC-CD-10 | Sắp xếp danh mục | Hoàn thành | 0.5 ngày |
| 11 | UC-CD-11 | Kiểm tra danh mục đang dùng | Hoàn thành | 0.5 ngày |

### 17. Thông báo (`thong-bao`) — 2.5 ngày

| STT | Mã UC | Tên | Trạng thái | Thời gian |
|----:|-------|-----|------------|----------:|
| 1 | UC-TB-01 | Xem danh sách thông báo | Hoàn thành | 0.5 ngày |
| 2 | UC-TB-02 | Đánh dấu đã đọc | Hoàn thành | 0.5 ngày |
| 3 | UC-TB-03 | Đánh dấu tất cả đã đọc | Hoàn thành | 0.5 ngày |
| 4 | UC-TB-04 | Điều hướng từ thông báo *(UI routing)* | Hoàn thành (thủ công) | 0.5 ngày |
| 5 | UC-TB-05 | Nhận thông báo tự động *(Hệ thống tự phát sinh)* | Hoàn thành (thủ công) | 0.5 ngày |

---

## Lịch sử phiên bản

| Phiên bản | Nội dung |
|-----------|----------|
| 4.1 | Phạm vi 152 UC vận hành — loại màn ẩn menu |
| 4.0 | Liệt kê 171 UC (gồm màn ẩn menu) |
| 3.1 | Chỉ hạng mục đã xong (theo màn/phân hệ) |
| 3.0 | Chi tiết kiểu BATECO |
