# Kế hoạch quản lý tiến độ dự án ASMS

| Thuộc tính | Nội dung |
|---|---|
| **Tên dự án** | ASMS — Hệ thống quản lý hậu mãi |
| **Phiên bản tài liệu** | 2.2 |
| **Ngày cập nhật** | 24/06/2026 |
| **Phạm vi tài liệu** | Chỉ liệt kê hạng mục đạt **100%** |
| **Nguyên tắc** | Không liệt kê màn ẩn, kịch bản sử dụng bỏ qua hoặc hạng mục chưa xong |
| **Bản trình bày in A4** | [ASMS_quan-ly-tien-do-du-an.html](./ASMS_quan-ly-tien-do-du-an.html) |

**Tài liệu liên quan:** [ASMS_phuong-an-trien-khai.html](./ASMS_phuong-an-trien-khai.html) · [huong-dan-su-dung-asms.md](./huong-dan-su-dung-asms.md) · [use-case-asms.md](./use-case-asms.md) · [hop-bang-cong-viec-chi-tiet.md](./hop-bang-cong-viec-chi-tiet.md) · [uat-checklist.md](./uat-checklist.md)

---

## Mục lục

1. [Chỉ số hoàn thành](#1-chỉ-số-hoàn-thành)
2. [Mốc dự án đã đạt](#2-mốc-dự-án-đã-đạt)
3. [Màn giao diện hoàn thành 100%](#3-màn-giao-diện-hoàn-thành-100)
4. [Hạng mục giao diện đã xong (tiêu biểu)](#4-hạng-mục-giao-diện-đã-xong-tiêu-biểu)
5. [Kiểm thử sơ bộ kịch bản sử dụng — phân hệ đạt 100%](#5-kiểm-thử-sơ-bộ-kịch-bản-sử-dụng--phân-hệ-đạt-100)
6. [Lịch sử phiên bản tài liệu](#6-lịch-sử-phiên-bản-tài-liệu)

---

## 1. Chỉ số hoàn thành

> **Cập nhật 24/06/2026** — Tài liệu này **chỉ** liệt kê hạng mục đạt **100%**.

### 1.1 Tóm tắt

| Chỉ số | Giá trị | Ghi chú |
|--------|--------:|---------|
| Màn giao diện 100% | **1** | Đăng nhập |
| Phân hệ kiểm thử sơ bộ 100% | **9** | 101 kịch bản đạt · 0 bỏ qua · 0 thiếu dữ liệu |
| Hạng mục tiêu biểu đã đóng | **7** | Công việc giao diện đã hoàn thành |

### 1.2 Phạm vi loại trừ (không liệt kê)

| Loại | Chi tiết | Lý do |
|------|----------|-------|
| Màn ẩn menu | Đề tài, Công việc, Đào tạo | Ẩn trên thanh bên — không theo dõi |
| Kịch bản bỏ qua | 6 kịch bản (bảng điều khiển, báo cáo, tài liệu, thông báo) | Chưa triển khai / ngoài phạm vi phiên bản 1 |
| Màn dưới 100% | 14 màn còn lại trong phạm vi giao diện | Đang làm hoặc hoàn thành một phần |

---

## 2. Mốc dự án đã đạt

| Mốc | Tiêu chí nghiệm thu | Trạng thái |
|-----|---------------------|------------|
| **M0** — Nền tảng | Đăng nhập bảo mật, triển khai container, thao tác dữ liệu cơ bản (thêm/sửa/xóa/xem), khung phân quyền | ✅ Hoàn thành 100% |

*Các mốc M1–M4 chưa đạt 100% — không liệt kê trong tài liệu này.*

---

## 3. Màn giao diện hoàn thành 100%

*Chỉ các màn đạt 100% tiến độ giao diện — cập nhật hàng tuần.*

| STT | Màn | Số kịch bản | % | Trạng thái |
|:---:|-----|------------:|--:|:----------:|
| 1 | Đăng nhập | 7 | 100% | ✅ Xong |

Các màn còn lại (Bảng điều khiển, Hợp đồng, Bàn giao, Bảo hành, Sản phẩm, Vật tư, Khách hàng, Phản ánh, Báo cáo, Tài liệu, Quy trình, Cài đặt, Thuộc tính, Thông báo) chưa đạt 100%.

---

## 4. Hạng mục giao diện đã xong (tiêu biểu)

*Các hạng mục công việc đã đóng — tính năng hoàn thành, có thể nằm trên màn chưa đạt 100% tổng thể.*

| Mã | Kết quả |
|----|---------|
| BH-10 | Phân hệ Phản ánh — luồng tạo mới, chi tiết, thống kê |
| BH-06 | Bảo hành — biểu mẫu động theo quy trình |
| HD-08, SET-04 | Tab điều khoản hợp đồng + bộ chọn |
| HD-09 | 1 bàn giao + 1 huấn luyện / hợp đồng |
| WF-01, HL-04 | Huấn luyện trên màn Bàn giao |
| DSH-01, DSH-02 | Tab bảng điều khiển chính — kết nối máy chủ trực tiếp |
| RPT-01 | Báo cáo — 5 tab + xuất file |

---

## 5. Kiểm thử sơ bộ kịch bản sử dụng — phân hệ đạt 100%

*Nguồn: báo cáo kiểm thử sơ bộ — 22/06/2026. Chỉ phân hệ có kịch bản đạt đầy đủ, không bỏ qua, không thiếu dữ liệu.*

| Phân hệ giao diện | Kịch bản đạt | Trạng thái |
|------------------|-------------:|:----------:|
| Xác thực (Đăng nhập) | 7 | ✅ 100% |
| Hợp đồng (+ điều khoản) | 21 | ✅ 100% |
| Bàn giao | 12 | ✅ 100% |
| Bảo hành | 8 | ✅ 100% |
| Sản phẩm | 12 | ✅ 100% |
| Vật tư | 8 | ✅ 100% |
| Khách hàng | 9 | ✅ 100% |
| Quy trình | 13 | ✅ 100% |
| Cài đặt | 11 | ✅ 100% |
| **Tổng (phân hệ 100%)** | **101** | **9 phân hệ** |

---

## 6. Lịch sử phiên bản tài liệu

| Phiên bản | Ngày | Nội dung |
|-----------|------|----------|
| 1.0 | 24/06/2026 | Khởi tạo tài liệu tiến độ |
| 1.1 | 24/06/2026 | Lược bỏ màn ẩn; chỉ theo dõi menu + luồng liên quan |
| 2.0 | 24/06/2026 | Thêm bản trang web in khổ A4 |
| 2.1 | 24/06/2026 | Chỉ liệt kê hạng mục 100%; loại bỏ phần bỏ qua và đang làm |
| 2.2 | 24/06/2026 | Việt hóa toàn bộ nội dung hiển thị |

---

*Cập nhật hàng tuần: bổ sung màn/hạng mục mới khi đạt 100% tại [mục 3](#3-màn-giao-diện-hoàn-thành-100) và [mục 5](#5-kiểm-thử-sơ-bộ-kịch-bản-sử-dụng--phân-hệ-đạt-100).*
