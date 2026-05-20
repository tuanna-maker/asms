# Tóm tắt cuộc họp ASMS

> Nguồn: biên bản ghi âm `[hop.md](./hop.md)` (speech-to-text).  
> Một số câu trong bản gốc bị nhận dạng sai từ; nội dung dưới đây đã chuẩn hóa theo ngữ cảnh nghiệp vụ.

**Ngữ cảnh:** Trao đổi giữa phía khách (anh Thành / VTX) và đội phát triển về hướng phát triển hệ thống ASMS.

---

## 1. Quy trình (trọng tâm)

- Gom **Bàn giao**, **Huấn luyện**, **Bảo hành / Sửa chữa** vào menu **Quy trình**; mỗi loại có **quy trình riêng**, tự đặt tên và cấu hình từng bước.
- **Mỗi hợp đồng** gắn một quy trình; sau này muốn **kéo thả** sắp bước (có thể để **v2**; **v1** ưu tiên hoàn thiện chức năng cốt lõi trước).
- **Theo dòng sản phẩm**: mỗi dòng có luồng khác (ví dụ: bàn giao xong mới huấn luyện; hoặc huấn luyện trước / song song tùy loại).
- **Mỗi bước quy trình:**
  - Khai báo field bắt buộc phải nhập.
  - **Phải đính kèm tài liệu** mới được tick / chuyển bước.
  - Theo dõi bước nào đã có tài liệu, nghiệm thu hoàn thành bao nhiêu bước.
- Phía khách sẽ **viết lại chi tiết** quy trình bàn giao, huấn luyện, bảo hành (bản hiện tại còn chung chung).

---

## 2. Nhắc lịch và cài đặt

- Nhắc các mốc: **sắp hết hạn bảo hành**, lịch đào tạo, sửa chữa, các lịch quan trọng khác.
- **Cấu hình tập trung ở Cài đặt** (theo loại hợp đồng):
  - Hợp đồng lớn: nhắc trước 2–3 tháng.
  - Hợp đồng nhỏ: nhắc trước khoảng 1 tuần.
- Trên form hợp đồng chỉ **chọn loại** đã khai báo, không nhập lại từng mốc nhắc riêng lẻ.
- **Thanh lý** không cần quy trình riêng.
- **Tiến độ hợp đồng** tính theo ngày bắt đầu – ngày kết thúc; chậm tiến độ → cảnh báo (đỏ / nhấp nháy).

---

## 3. Sản phẩm

- Trạng thái mặc định khi tạo mới: **Đang sản xuất** (người dùng có thể sửa sau).
- Field bắt buộc: **báo đỏ** nếu thiếu.
- Thêm **dòng sản phẩm** (combo) để quyết định quy trình và thông tin liên quan.

---

## 4. Khách hàng và CRM

- Hướng module **Quản lý / Chăm sóc khách hàng**.
- **Một khách hàng — nhiều đầu mối liên hệ**; chi phí ghi theo **khách hàng**, không theo từng contact.
- **Màn chi tiết khách hàng** (bấm tên / link): xem hợp đồng, tiến độ, **tổng doanh thu**, **tổng chi phí**, phản ánh / ticket, hoạt độ CRM (gặp ai, nội dung, chi phí từng lần tiếp xúc).
- **Ngày kỷ niệm / nhắc chăm sóc:** ngày thành lập, sinh nhật đầu mối, ngày nhận huân chương, v.v.
- Lọc hợp đồng: ưu tiên **ngày ký** (quan trọng hơn ngày tạo), ngày hết hạn, bảo hành, tên khách hàng.

---

## 5. Bảo hành, phản ánh, phân quyền

- Phiếu tiếp nhận từ **khách hàng bên ngoài** và **nội bộ**; **không** có kênh tự động (auto).
- Phân vai rõ:
  - **Chăm sóc khách hàng**: tiếp nhận, nhập phản ánh.
  - **Đơn vị sửa chữa / bảo hành**: xử lý theo quy trình.
- Quy trình: phân loại, mức độ khẩn, **giao việc cho đơn vị**; trưởng đơn vị thấy việc được gán.
- Phiếu bảo hành: chọn **sản phẩm** + **vật tư / linh kiện** khách đề cập → phục vụ thống kê vật tư hay hỏng.
- Cần file **Excel** mô tả đơn vị và ma trận phân quyền (kinh doanh, huấn luyện, bảo hành, CSKH, …).

---

## 6. Huấn luyện

- Các trường thông tin: thời gian, địa điểm, hình thức, giảng viên, thành phần tham dự, nội dung, kết luận (đối tác điền).
- Không bắt buộc layout form in giống mẫu Mobifone; cần **thống kê phản hồi** sau dịch vụ.

---

## 7. Vật tư và báo cáo

- Thống kê **vật tư hay hỏng** (từ dữ liệu bảo hành / sửa chữa), theo danh mục vật tư.
- **Mỗi menu** có tab **Dashboard / Báo cáo**.
- Số liệu cảnh báo hiển thị trên **icon / badge** sidebar; việc chậm → **đỏ / nhấp nháy**.
- Màn danh sách: **phân trang ~10 dòng**, tối ưu một màn hình, hạn chế scroll.
- Bỏ dòng text thống kê thừa phía dưới nếu đã hiển thị trên đầu trang / trên icon.

---

## 8. Thứ tự menu (ưu tiên nghiệp vụ)

Sắp xếp lại menu trái theo luồng:

**Khách hàng → Hợp đồng → Sản phẩm → Bàn giao → Huấn luyện → Bảo hành**

---

## 9. Triển khai và tài liệu

- **Không** mang máy tính / USB ra ngoài → bàn giao **source code** + **hướng dẫn cài đặt** để phía khách tự triển khai trên server nội bộ.
- Cần tài liệu **2–3 trang** mô tả sản phẩm + **kịch bản triển khai** (install, DB, migrate, v.v.).
- Module **phương án kinh doanh** (cơ bản): đơn vị chủ trì, giá trị đấu thầu, tổng doanh thu, chi phí đã chi.

---

## 10. AI local (thử nghiệm / demo — ngoài phạm vi v1 bắt buộc)

- Demo **bot AI chạy offline** (Ollama, LM Studio, OpenWebUI + RAG) để lãnh đạo hình dung khả năng.
- Yêu cầu phần cứng gợi ý: RAM **≥ 32 GB**, GPU **≥ 4 GB** (Mac M-series 64 GB RAM cũng được nhắc).
- Use case: tra cứu tài liệu, so sánh **file PDF bản vẽ** (version 1 vs version 2).
- Nếu máy nội bộ không đủ cấu hình → sau này cần gateway / phần mềm riêng; **v1 ưu tiên ASMS nghiệp vụ**.

---

## 11. Giao diện (UI/UX)

- Tối ưu **một màn hình**, hạn chế cuộn dọc.
- Phân trang danh sách (~10 dòng / trang).
- Hiển thị số liệu tổng hợp trên **icon** (đang tiếp nhận, đang xử lý, …) thay vì chiếm thêm không gian text.
- Quy trình giai đoạn đầu: **không** bắt buộc chữ ký số; mô tả rõ bước 1, bước 2.

---

## 12. Việc tiếp theo


| Bên             | Công việc                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Khách (VTX)** | Viết lại quy trình chi tiết (bàn giao, huấn luyện, bảo hành); gửi Excel phân quyền / đơn vị; bổ sung tài liệu mẫu |
| **Dev**         | Triển khai CRM 360°, quy trình động, dashboard/badge, phân trang; tài liệu hướng dẫn cài đặt nội bộ               |
| **Chung**       | Ra **phiên bản 1** đủ UAT / báo cáo; kéo thả quy trình có thể **v2**                                              |


**Lịch:** Bổ sung thêm trong tuần; có thể có mảng update sang tuần sau.

---

## 13. Kết luận

Cuộc họp xác định ASMS hướng tới:

1. **Quy trình động** theo hợp đồng và dòng sản phẩm, có ràng buộc tài liệu từng bước.
2. **CRM khách hàng 360°** (doanh thu, chi phí, phản ánh, hoạt động tiếp xúc).
3. **Nhắc lịch cấu hình tập trung** theo loại hợp đồng.
4. **Dashboard / cảnh báo** trên từng module.
5. **Triển khai offline** tại đơn vị (không mang máy ra ngoài).

AI local là **hướng demo tương lai**, không chặn bản nghiệp vụ chính v1.

---

## Tài liệu liên quan

- Biên bản gốc: `[hop.md](./hop.md)`
- Kế hoạch VTX: `[0004-trien-khai-kehoach-vtx.md](./0004-trien-khai-kehoach-vtx.md)`
- BRD: `[BRD-ASMS.md](./BRD-ASMS.md)`
- UAT: `[uat-checklist.md](./uat-checklist.md)`

