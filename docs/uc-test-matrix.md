# Ma trận kiểm tra Use Case — ASMS

> Tự sinh: `node scripts/generate-uc-test-matrix.mjs` — **171 UC**

| UC_ID | Tên | Module | Loại test | Script/Spec | Trạng thái | Ghi chú |
|-------|-----|--------|-----------|-------------|------------|---------|
| UC-AUTH-01 | Đăng nhập | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-02 | Đăng xuất | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-03 | Làm mới phiên | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-04 | Xem danh sách phiên | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-05 | Thu hồi phiên | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-06 | Đăng xuất tất cả | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-AUTH-07 | Tạo tài khoản | AUTH | API+E2E | uc-smoke-test.mjs + e2e/auth.spec.ts | pass |  |
| UC-BC-01 | Báo cáo theo khách hàng | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-02 | Báo cáo theo hợp đồng | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-03 | Báo cáo theo dòng SP | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-04 | Báo cáo phản ánh | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-05 | Báo cáo đơn vị thực hiện | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-06 | Báo cáo lỗi vật tư | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-07 | Lọc báo cáo | bao-cao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BC-08 | Xuất Excel | bao-cao | Manual | uc-manual-ui-checklist.md | manual | UI export client-side |
| UC-BC-09 | In báo cáo | bao-cao | Manual | uc-manual-ui-checklist.md | manual | UI print client-side |
| UC-BG-01 | Xem danh sách bàn giao | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-02 | Xem chi tiết phiếu BG | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-03 | Tạo phiếu bàn giao | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-04 | Sửa phiếu bàn giao | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-05 | Xóa phiếu bàn giao | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-06 | Xử lý quy trình bàn giao | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-07 | Đính kèm tài liệu bước BG | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-08 | Xem danh sách khóa HL | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-09 | Tạo khóa huấn luyện | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-10 | Sửa/xóa khóa HL | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-11 | Xử lý quy trình HL | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BG-12 | Điền payload từng bước HL | ban-giao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-01 | Xem danh sách phiếu BH/SC | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-02 | Xem chi tiết phiếu | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-03 | Tạo phiếu BH/SC | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-04 | Sửa phiếu | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-05 | Xóa phiếu | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-06 | Xử lý quy trình BH | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-07 | Điền form động theo bước | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-BH-08 | Đính kèm tài liệu bước BH | bao-hanh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-01 | Quản lý người dùng | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-02 | Quản lý vai trò | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-03 | Ma trận phân quyền | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-04 | Cấu hình TB cá nhân | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-05 | Cấu hình đơn vị PA | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-06 | Cấu hình hệ thống | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-07 | Quản lý phiên đăng nhập | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-08 | Xem nhật ký audit | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-09 | Quản lý danh mục thuộc tính | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-10 | Sắp xếp danh mục | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CD-11 | Kiểm tra danh mục đang dùng | cai-dat | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-01 | Xem Kanban | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-02 | Xem danh sách | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-03 | Xem lịch | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-04 | Tạo công việc | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-05 | Sửa công việc | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-06 | Xóa công việc | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-CV-07 | Lọc theo ưu tiên/loại | cong-viec | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DASH-01 | Xem tổng quan | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-02 | Xem theo khách hàng | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-03 | Xem doanh thu | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-04 | Xem dự án / tiến độ | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-05 | Xem sản phẩm | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-06 | Xem bảo hành | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-07 | Xem vật tư | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-08 | Xem cảnh báo | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-09 | Lọc theo năm/quý/KH | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DASH-10 | Luân chuyển tab tự động | dashboard | Manual | uc-manual-ui-checklist.md | manual | UI-only (auto-rotate/fullscreen) |
| UC-DASH-11 | Xem badge menu | dashboard | API+E2E | uc-smoke-test.mjs + e2e/dashboard.spec.ts | pass |  |
| UC-DT-01 | Xem danh sách đề tài | de-tai | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DT-02 | Xem chi tiết đề tài | de-tai | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | no_data | Không có dữ liệu mẫu (researchProjectId) |
| UC-DT-03 | Tạo đề tài | de-tai | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DT-04 | Sửa đề tài | de-tai | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | no_data | Không có dữ liệu mẫu (researchProjectId) |
| UC-DT-05 | Xóa đề tài | de-tai | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-01 | Xem danh sách khóa | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-02 | Xem chi tiết khóa | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | no_data | Không có dữ liệu mẫu (trainingId) |
| UC-DTao-03 | Tạo khóa | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-04 | Sửa/xóa khóa | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-05 | Quản lý học viên | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-06 | Quản lý lịch học | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-DTao-07 | Xử lý quy trình khóa | dao-tao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-HD-01 | Xem danh sách HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-02 | Xem chi tiết HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-03 | Tạo HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-04 | Sửa HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-05 | Xóa HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-06 | Gán danh mục SP | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-07 | Sửa SP trong HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-08 | Xem SP thuộc HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-09 | Chọn điều khoản mẫu | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-10 | Điền nội dung điều khoản | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-11 | Xem phản ánh liên quan | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-12 | Xem tài liệu HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-13 | Xử lý quy trình HĐ | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-14 | Đính kèm tài liệu bước QT | hop-dong | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-01 | Xem danh sách điều khoản mẫu | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-02 | Tạo/sửa/xóa điều khoản | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-03 | Sắp xếp điều khoản | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-04 | Xem nhóm điều khoản | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-05 | Tạo/sửa/xóa nhóm | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-06 | Gán điều khoản vào nhóm | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-HD-DK-07 | Kiểm tra điều khoản đang dùng | hop-dong.dieu-khoan | API+E2E | uc-smoke-test.mjs + e2e/contracts.spec.ts | pass |  |
| UC-KH-01 | Xem danh sách KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-02 | Xem chi tiết KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-03 | Tạo KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-04 | Sửa KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-05 | Xóa KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-06 | Quản lý liên hệ | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-07 | Quản lý hoạt động CRM | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-08 | Quản lý kỷ niệm KH | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-KH-09 | Đăng ký nhận TB kỷ niệm | khach-hang | API+E2E | uc-smoke-test.mjs + e2e/customers-crm.spec.ts | pass |  |
| UC-PA-01 | Xem danh sách phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-02 | Xem chi tiết phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | no_data | Không có dữ liệu mẫu (feedbackId) |
| UC-PA-03 | Tạo phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-04 | Sửa phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | no_data | Không có dữ liệu mẫu (feedbackId) |
| UC-PA-05 | Xóa phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-06 | Phân công người/vai trò | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-07 | Phân luồng theo SP/đơn vị | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-08 | Cập nhật xử lý đơn vị | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-09 | Bình luận phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-10 | Yêu cầu đóng | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-11 | Đóng phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-12 | Hoàn tất sửa chữa & đóng | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-13 | Mở lại phản ánh | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-14 | Xem tóm tắt công việc PA | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-15 | Thống kê theo KH/SP/VT | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-16 | Lọc theo đơn vị của tôi | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-17 | Cấu hình đơn vị thực hiện | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-PA-18 | Cấu hình quy tắc routing | phan-anh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-01 | Xem tổng quan nhóm QT | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-02 | Xem QT theo module | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-03 | Tạo quy trình | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-04 | Sửa thông tin QT | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-05 | Xóa quy trình | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-06 | Thêm/sửa/xóa bước | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-07 | Sắp xếp lại bước | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-08 | Cấu hình trường nhập bước | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-09 | Tạo bộ bước chuẩn | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-10 | Gắn QT cho entity | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-11 | Chuyển bước QT | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-12 | Xem lịch sử bước | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-QT-13 | Đính kèm tài liệu instance | quy-trinh | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-01 | Xem danh sách SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-02 | Xem chi tiết SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-03 | Tạo SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-04 | Sửa SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-05 | Xóa SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-06 | Quản lý BOM | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-07 | Quản lý thông số kỹ thuật | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-08 | Quản lý serial linh kiện | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-09 | Xem/gắn tài liệu SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-10 | Xem lịch sử thay đổi | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-11 | Xử lý quy trình SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-SP-12 | Tab đào tạo trên SP | san-pham | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TB-01 | Xem danh sách thông báo | thong-bao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TB-02 | Đánh dấu đã đọc | thong-bao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TB-03 | Đánh dấu tất cả đã đọc | thong-bao | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TB-04 | Điều hướng từ thông báo | thong-bao | Manual | uc-manual-ui-checklist.md | manual | UI routing |
| UC-TB-05 | Nhận thông báo tự động | thong-bao | Manual | uc-manual-ui-checklist.md | manual | Hệ thống tự phát sinh |
| UC-TL-01 | Xem danh sách tài liệu | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-02 | Xem chi tiết/tải file | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-03 | Tạo metadata tài liệu | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-04 | Upload file | tai-lieu | Manual | uc-manual-ui-checklist.md | manual | Multipart upload — cần file thật |
| UC-TL-05 | Sửa tài liệu | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-06 | Xóa tài liệu | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-07 | Lọc theo loại | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-TL-08 | Liên kết HĐ/SP/đề tài | tai-lieu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-01 | Xem danh sách vật tư | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-02 | Xem chi tiết vật tư | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-03 | Nhập vật tư mới | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-04 | Sửa vật tư | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-05 | Xóa vật tư | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-06 | Xem phiếu điều chuyển | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-07 | Tạo phiếu điều chuyển | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
| UC-VT-08 | Sửa/xóa phiếu điều chuyển | vat-tu | API+E2E | uc-smoke-test.mjs + e2e/smoke-modules.spec.ts | pass |  |
