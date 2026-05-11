# BRD - Chức năng từng màn hình hệ thống ASMS

## 1. Thông tin tài liệu

- Tên tài liệu: Business Requirements Document (BRD) - ASMS
- Nguồn nghiệp vụ: `After-Sales20System%20ASMS.pdf`
- Mục tiêu: Chuẩn hóa yêu cầu chức năng theo từng màn hình để phát triển, kiểm thử, nghiệm thu.
- Tài liệu kèm theo: [BRD-ASMS.md](BRD-ASMS.md) (BRD tổng thể + ma trận vai trò UI), [SRS-ASMS.md](SRS-ASMS.md) (API, RBAC backend, FR/NFR), [frontend-backend-mapping.md](frontend-backend-mapping.md) (ánh xạ field FE–BE).

## 2. Mục tiêu hệ thống

ASMS quản lý vòng đời hậu mãi theo 4 luồng chính:

1. Tiếp nhận hợp đồng
2. Bàn giao và huấn luyện
3. Bảo hành, sửa chữa
4. Chăm sóc khách hàng

Kèm theo các nhóm quản trị:

- Master data (người dùng, khách hàng, sản phẩm, vật tư)
- Báo cáo, thống kê
- Quản lý chi phí/PAKD

---

## 3. Danh mục màn hình và yêu cầu chức năng

## 3.1 Dashboard

**Mục tiêu:** Cung cấp bức tranh điều hành tổng thể thời gian thực/gần thời gian thực.
**Yêu cầu chức năng chính:**

- Theo dõi tiến độ sản xuất sản phẩm:
  - Số lượng đang sản xuất
  - Số lượng sản xuất xong
  - Số đã trình nghiệm thu
  - Số đang nghiệm thu
  - Số nghiệm thu xong
- Theo dõi tiến độ thực hiện hợp đồng:
  - Tổng hợp đồng
  - Đang thực hiện
  - Hoàn thành
  - Đúng hạn/chậm tiến độ
- Theo dõi phản ánh, khiếu nại:
  - Tổng số ticket
  - Bảo hành/sửa chữa
  - Đang xử lý/đã hoàn thành
  - Đúng hạn/chậm SLA
- Theo dõi bàn giao và huấn luyện:
  - Tổng đợt
  - Đang thực hiện/hoàn thành
  - Đúng hạn/chậm tiến độ
- Theo dõi chăm sóc khách hàng:
  - Tổng khách hàng
  - Doanh thu/chi phí theo khách hàng
  - Số sản phẩm đã bàn giao
  - Số phản ánh/khiếu nại theo trạng thái
- Theo dõi PAKD:
  - Tổng PAKD
  - Kinh phí đã chi/còn lại theo từng PAKD
  **Đầu ra:** KPI card, bảng tổng hợp, biểu đồ xu hướng, cảnh báo.

---

## 3.2 Hợp đồng

**Mục tiêu:** Quản lý toàn bộ vòng đời hợp đồng từ tạo mới đến thanh lý.
**Yêu cầu chức năng chính:**

- Tạo mới hợp đồng:
  - Thông tin khách hàng
  - Giá trị hợp đồng
  - Danh sách sản phẩm
  - Thời gian thực hiện
  - Thời gian bảo hành
  - Điều khoản chính
- Cập nhật và theo dõi:
  - Tiến độ thực hiện
  - Trạng thái hợp đồng
  - Bàn giao và biên bản nghiệm thu
- Thanh lý hợp đồng:
  - Điều kiện thanh lý
  - Biên bản/ghi nhận thanh lý
  **Đầu ra:** Danh sách hợp đồng, chi tiết hợp đồng, trạng thái thực hiện, dữ liệu liên thông bảo hành/bàn giao/đào tạo.

---

## 3.3 Chi tiết hợp đồng

**Mục tiêu:** Cung cấp góc nhìn 360 độ theo từng hợp đồng.
**Các tab bắt buộc:**

- Thông tin chung
  - Khách hàng, giá trị, thời gian, bảo hành, tiến độ
- Điều khoản chính
  - Điều khoản phạm vi, thanh toán, bảo hành, chấm dứt
- Danh mục sản phẩm
  - Danh sách sản phẩm thuộc hợp đồng
  - Phân loại/dòng sản phẩm, trạng thái
- Tài liệu
  - Hồ sơ hợp đồng, tài liệu kỹ thuật, tài liệu bàn giao
- Đào tạo và huấn luyện
  - Danh sách đợt đào tạo theo hợp đồng, trạng thái, thời gian
  **Đầu ra:** Một điểm truy cập duy nhất cho dữ liệu nghiệp vụ của hợp đồng.

---

## 3.4 Bàn giao và huấn luyện

**Mục tiêu:** Quản lý xuyên suốt quy trình bàn giao và huấn luyện.
**Workflow chuẩn:**

1. Lập và phê duyệt kế hoạch
2. Lập và phê duyệt tờ trình kinh phí
3. Chuẩn bị hàng hóa
4. Tổ chức bàn giao
5. Tổ chức huấn luyện

**Yêu cầu chức năng chính:**

- Tạo đợt bàn giao theo hợp đồng
- Theo dõi từng bước workflow
- Cập nhật mốc thời gian, trạng thái, biên bản
- Liên kết dữ liệu với danh mục sản phẩm và khách hàng
**Đầu ra:** Trạng thái từng đợt bàn giao/huấn luyện, đúng hạn/chậm tiến độ.

---

## 3.5 Bảo hành và sửa chữa (Ticket)

**Mục tiêu:** Quản lý đầy đủ vòng đời ticket từ tiếp nhận đến đóng ticket.
**Workflow chuẩn:**

1. Tiếp nhận yêu cầu
  - Nguồn: khách hàng/nội bộ
  - Thông tin: khách hàng, thiết bị, mô tả sự cố, thời gian phát sinh, mức độ
2. Xử lý phân loại
  - Thuộc bảo hành/hết bảo hành
  - Mức độ ưu tiên (khẩn cấp/cao/trung bình/thấp)
  - Giao đơn vị, gán SLA, gán thời gian xử lý
3. Lập kế hoạch xử lý
  - Kỹ thuật viên
  - Vật tư/hàng hóa
  - Lịch xử lý
4. Kiểm tra và chuẩn đoán
  - Khảo sát thực tế, xác định nguyên nhân (phần cứng/phần mềm/vận hành)
5. Thực hiện sửa chữa/bảo trì
  - Sửa chữa/thay linh kiện/cập nhật phần mềm/vệ sinh bảo dưỡng
6. Kiểm tra sau sửa chữa
  - Chạy thử, đo kiểm, xác nhận đạt
  - Không đạt: quay lại bước chuẩn đoán

## **Đầu ra:** Ticket trạng thái đầy đủ, SLA, lịch sử xử lý, kết quả nghiệm thu sau sửa chữa.

## 3.6 Khách hàng và liên hệ (CRM)

**Mục tiêu:** Quản lý hồ sơ khách hàng, đầu mối liên lạc và hoạt động chăm sóc.
**Yêu cầu chức năng chính:**

- Quản lý thông tin khách hàng
- Quản lý đầu mối liên lạc
- Ghi nhận hoạt động chăm sóc, tiếp xúc
- Nhắc lịch các dịp quan trọng:
  - Ngày truyền thống đơn vị
  - Sinh nhật lãnh đạo
  - Ngày đón nhận danh hiệu/huân huy chương
  **Đầu ra:** Hồ sơ khách hàng tập trung, lịch sử tương tác và chăm sóc.

---

## 3.7 Sản phẩm

**Mục tiêu:** Quản lý danh mục sản phẩm quốc phòng theo vòng đời.
**Yêu cầu chức năng chính:**

- Quản lý thông tin sản phẩm:
  - Mã, tên, phân loại
  - Đơn vị sử dụng, nhà sản xuất
  - Trạng thái vòng đời
- Theo dõi các giai đoạn:
  1. Giai đoạn sản xuất
  2. Nghiệm thu cấp Bộ
  3. Đưa vào trang bị
- Liên kết với hợp đồng và bảo hành
**Đầu ra:** Danh mục sản phẩm chuẩn, trạng thái theo giai đoạn.

---

## 3.8 Vật tư, linh kiện

**Mục tiêu:** Quản lý nhập, tồn, điều chuyển vật tư phục vụ bàn giao/sửa chữa.
**Yêu cầu chức năng chính:**

- Nhập vật tư
- Quản lý vật tư tiêu hao:
  - Tên, số lượng
- Quản lý vật tư định danh:
  - Tên, serial, số lượng
- Điều chuyển vật tư:
  - Nguồn, đích, số lượng, trạng thái điều chuyển
  **Đầu ra:** Tồn kho tin cậy, truy vết vật tư định danh, cân đối vật tư cho tác vụ hậu mãi.

---

## 3.9 Đào tạo

**Mục tiêu:** Quản lý các khóa huấn luyện theo hợp đồng/bàn giao.
**Yêu cầu chức năng chính:**

- Tạo và quản lý khóa đào tạo
- Danh sách học viên
- Lịch buổi học
- Trạng thái khóa (kế hoạch/đang diễn ra/hoàn thành/hủy)
- Liên kết với hợp đồng và khách hàng
**Đầu ra:** Kế hoạch và kết quả huấn luyện đầy đủ, phục vụ nghiệm thu.

---

## 3.10 Tài liệu

**Mục tiêu:** Lưu trữ và truy xuất tài liệu vận hành hậu mãi.
**Yêu cầu chức năng chính:**

- Quản lý tài liệu theo nhóm:
  - Hợp đồng
  - Kỹ thuật
  - Đào tạo
  - Báo cáo
- Gắn tài liệu theo thực thể:
  - Hợp đồng
  - Sản phẩm
  - Khóa đào tạo
  - Dự án/ticket khi cần
  **Đầu ra:** Kho tài liệu tập trung, dễ tìm kiếm và truy xuất theo ngữ cảnh nghiệp vụ.

---

## 3.11 Báo cáo và thống kê

**Mục tiêu:** Cung cấp báo cáo phục vụ điều hành và đánh giá hiệu quả.
**Yêu cầu chức năng chính:**

- Báo cáo theo khách hàng
- Báo cáo theo hợp đồng
- Báo cáo theo dòng sản phẩm
- Báo cáo theo đơn vị thực hiện
- Báo cáo theo yêu cầu bảo hành
- Báo cáo theo ticket sửa chữa
- Báo cáo quản lý chi phí:
  - PAKD
  - Hạng mục chính + số tiền
  - Đã chi/còn lại
  **Đầu ra:** Biểu đồ + bảng số liệu, có khả năng lọc theo kỳ.

---

## 3.12 Cài đặt (Master Data)

**Mục tiêu:** Quản trị dữ liệu nền và bảo mật truy cập.
**Yêu cầu chức năng chính:**

- Người dùng và phân quyền
- Danh mục khách hàng
- Danh mục sản phẩm
- Danh mục vật tư
- Các cấu hình hệ thống liên quan thông báo/vai trò
**Đầu ra:** Hệ thống ổn định, kiểm soát truy cập theo vai trò.

---

## 4. Ma trận liên kết dữ liệu giữa màn hình


| Màn hình              | Liên kết chính                                                       |
| --------------------- | -------------------------------------------------------------------- |
| Dashboard             | Tổng hợp từ Hợp đồng, Bàn giao, Bảo hành, Đào tạo, Khách hàng, PAKD  |
| Hợp đồng              | Liên kết Khách hàng, Sản phẩm, Bàn giao, Đào tạo, Tài liệu, Bảo hành |
| Bàn giao & Huấn luyện | Liên kết Hợp đồng, Sản phẩm, Khách hàng                              |
| Bảo hành/Sửa chữa     | Liên kết Khách hàng, Thiết bị/Sản phẩm, Vật tư, SLA                  |
| Khách hàng/CRM        | Liên kết Hợp đồng, Ticket, Hoạt động chăm sóc                        |
| Sản phẩm              | Liên kết Hợp đồng, Bảo hành, Đào tạo                                 |
| Vật tư                | Liên kết Sửa chữa/Bảo trì và điều chuyển                             |
| Tài liệu              | Liên kết Hợp đồng, Sản phẩm, Đào tạo                                 |
| Báo cáo               | Tổng hợp đa module                                                   |


---

## 5. Tiêu chí nghiệm thu chức năng mức BRD

- Mỗi màn hình có đủ nhóm chức năng cốt lõi đã nêu ở mục 3.
- Các workflow chính (Bàn giao, Bảo hành) đi đủ bước và có trạng thái chuyển tiếp rõ ràng.
- Dữ liệu liên kết xuyên màn hình theo ma trận mục 4.
- Dashboard phản ánh được KPI của các luồng chính.
- Báo cáo có thể lọc và xuất được số liệu theo các trục đã định.

---

## 6. Ghi chú triển khai

- BRD này mô tả **yêu cầu nghiệp vụ** theo tài liệu nguồn.
- Khi triển khai kỹ thuật cần bổ sung:
  - SRS/API contract chi tiết
  - Quy tắc phân quyền theo vai trò
  - Quy tắc SLA và cảnh báo
  - Bộ test case UAT theo từng màn.

