

 Nội dung trao đổi

1. Module Quy trình (Bàn giao, Huấn luyện, Bảo hành/Sửa chữa)

- Tách **Bàn giao** và **Huấn luyện** thành hai luồng nghiệp vụ riêng; mỗi luồng có **quy trình cấu hình riêng** (đặt tên, số bước, đơn vị tham gia).
- **Bảo hành / Sửa chữa** cũng có quy trình riêng, không gộp chung với bàn giao/huấn luyện.
- Menu **Quy trình** gồm các nhóm: Bàn giao, Huấn luyện, Bảo hành/Sửa chữa; mỗi hợp đồng **gắn một quy trình** khi tạo/cập nhật.
- **Theo dòng sản phẩm:** mỗi dòng sản phẩm có thể có luồng quy trình khác (ví dụ: bàn giao xong mới huấn luyện, hoặc huấn luyện trước/sau tùy loại mặt hàng).
- **Mỗi bước quy trình** cần:
  - Khai báo dữ liệu bắt buộc phải nhập.
  - **Bắt buộc có tài liệu đính kèm** mới được tick hoàn thành / chuyển bước.
  - Theo dõi tiến độ: bước nào đã có tài liệu, đã nghiệm thu, thứ tự bước.
- **Kéo-thả sắp xếp bước** quy trình: mong muốn có nhưng có thể đưa sang **v2**; v1 ưu tiên hoàn thiện logic nghiệp vụ cốt lõi.

2. Hợp đồng — Tiến độ và nhắc hạn

- Tiến độ hợp đồng tính theo **ngày bắt đầu — ngày kết thúc** và trạng thái.
- **Nhắc hạn** không nhập rời trên từng hợp đồng mà **cấu hình tập trung tại Cài đặt** theo **loại hợp đồng**:
  - Hợp đồng lớn: nhắc trước khoảng **2–3 tháng**.
  - Hợp đồng nhỏ: nhắc trước khoảng **1 tuần**.
- Các mốc nhắc: sắp hết hạn bảo hành, lịch đào tạo, lịch sửa chữa, các ngày quan trọng khác.
- **Thanh lý** hợp đồng: không cần quy trình riêng; chỉ cần nhắc/cảnh báo khi gần hạn.
- Chậm tiến độ / quá hạn: hiển thị cảnh báo (đỏ, nhấp nháy trên dashboard/sidebar).

3. Sản phẩm

- Khi tạo mới sản phẩm: trạng thái mặc định **Đang sản xuất** (cho phép chỉnh sau).
- Trường bắt buộc thiếu: **báo đỏ** trên form.
- Thêm **dòng sản phẩm** (combo) trên màn tạo/sửa để xác định quy trình và thông tin liên quan theo dòng.

4. Khách hàng và chăm sóc khách hàng (CRM)

- Đổi hướng module thành **Quản lý / Chăm sóc khách hàng** (không chỉ danh sách đơn giản).
- **Một khách hàng — nhiều đầu mối liên hệ**; có thể thêm/sửa contact trong chi tiết khách hàng.
- **Chi phí tiếp xúc** ghi nhận theo **khách hàng** (không theo từng contact); contact chỉ là dữ liệu phụ.
- Màn **chi tiết khách hàng** (click tên/link): hiển thị tổng quan:
  - Số hợp đồng, tiến độ từng hợp đồng.
  - **Tổng doanh thu**, **tổng chi phí** (lãi/lỗ theo khách hàng).
  - Số phản ánh, ticket đang tồn, nhu cầu sửa chữa.
  - Lịch sử hoạt động CRM: ngày giờ, đối tượng gặp, nội dung, chi phí, minh chứng (nếu có).
- **Ngày kỷ niệm / nhắc chăm sóc:** ngày thành lập đơn vị, sinh nhật đầu mối, ngày nhận huân chương, v.v. — dùng để nhắc chăm sóc.
- Lọc hợp đồng theo khách: ưu tiên **ngày ký hợp đồng**, ngày hết hạn, ngày bảo hành, tên khách hàng.
- Trên dashboard khách hàng: thống kê tổng (số KH, liên hệ, phản ánh tồn, khiếu nại tồn) — **không** hiển thị dòng text thống kê thừa phía dưới nếu đã có trên icon/badge.

5. Phản ánh, bảo hành, sửa chữa

- Tiếp nhận phản ánh từ **hai nguồn:** khách hàng bên ngoài và nội bộ; **không** có kênh tự động (auto).
- Phân vai:
  - **Chăm sóc khách hàng (CSKH):** tiếp nhận, nhập phản ánh.
  - **Đơn vị bảo hành/sửa chữa:** xử lý theo quy trình đã gán.
- Luồng xử lý: tiếp nhận → phân loại / mức độ khẩn (cao/trung bình/thấp) → **giao việc cho đơn vị** → xử lý → nghiệm thu.
- Trưởng đơn vị thấy việc được gán trong đơn vị mình.
- Phiếu bảo hành: bắt buộc chọn **sản phẩm** và **vật tư/linh kiện** khách đề cập (phục vụ thống kê linh kiện hay hỏng).

6. Huấn luyện

- Khóa huấn luyện cần đủ trường: thời gian, địa điểm, hình thức, giảng viên, thành phần tham dự, nội dung, kết luận (đối tác có thể điền).
- Không bắt buộc form in giống mẫu Mobifone; cần **thống kê phản hồi** sau dịch vụ huấn luyện.

7. Vật tư, linh kiện và báo cáo

- Thống kê **vật tư hay hỏng** theo danh mục vật tư, từ dữ liệu phiếu bảo hành/sửa chữa.
- **Mỗi module/menu** có tab **Dashboard / Báo cáo**; số liệu tổng hợp đưa sang tab báo cáo, màn danh sách chỉ hiển thị dữ liệu.
- Cảnh báo quan trọng hiển thị trên **icon/badge** menu; việc chậm/trễ → đỏ/nhấp nháy.

8. Giao diện và trải nghiệm người dùng

- Sắp xếp lại menu trái theo luồng vận hành ưu tiên:
  1. Dashboard  
  2. Khách hàng  
  3. Hợp đồng  
  4. Sản phẩm  
  5. Bàn giao  
  6. Huấn luyện  
  7. Bảo hành / Sửa chữa  
- Danh sách: **phân trang** (~20 dòng/trang), tối ưu một màn hình, hạn chế scroll.
- Quy trình giai đoạn đầu: mô tả bước bằng **Bước 1, Bước 2…**; chưa bắt buộc chữ ký số trên từng bước.
- Hiển thị số lượng (đang tiếp nhận, đang xử lý, …) trên **icon** thay vì chiếm thêm không gian text.

9. Triển khai tại đơn vị

- **Không** mang máy tính, USB ra ngoài cơ quan → triển khai bằng cách:
  - Bàn giao **mã nguồn** + hướng dẫn cài đặt (DB, migrate, env, chạy service).
- Cần tài liệu **2–3 trang** mô tả sản phẩm + kịch bản triển khai chi tiết..


Cập nhật

- Quy trình động theo hợp đồng (không kéo-thả).
- CRM khách hàng cơ bản + chi phí/doanh thu tổng hợp.
- Phản ánh + giao việc đơn vị + mức khẩn.
- Nhắc hạn theo cài đặt.
- Dashboard/badge cảnh báo.
- Báo cáo cơ bản theo module.
- Phân quyền theo role
- Tài liệu hướng dẫn triển khai.
- Kéo-thả sắp xếp bước quy trình.
- Báo cáo nâng cao, lọc đa chiều.
- Thống kê vật tư/linh kiện sâu hơn.
- Tích hợp / gateway AI (nếu triển khai).

