# BIÊN BẢN CUỘC HỌP

## Họp rà soát yêu cầu và định hướng phát triển hệ thống ASMS

| Thuộc tính | Nội dung |
|---|---|
| **Dự án** | ASMS — Hệ thống quản lý hậu mãi |
| **Loại cuộc họp** | Trao đổi yêu cầu nghiệp vụ & kỹ thuật (review prototype / backlog) |
| **Thời gian** | *(ghi trong biên bản gốc — bổ sung ngày/giờ cụ thể khi có)* |
| **Hình thức** | Họp trực tiếp / trình chiếu phần mềm |
| **Nguồn ghi âm** | [hop.md](./hop.md) (speech-to-text, đã chuẩn hóa nội dung) |
| **Phiên bản biên bản** | 1.0 |
| **Ngày lập biên bản** | 21/05/2026 |
| **Hướng dẫn sử dụng** | [huong-dan-su-dung-asms.md](./huong-dan-su-dung-asms.md) |

---

## 1. Thành phần tham dự

| STT | Họ tên / Vai trò | Đơn vị | Ghi chú |
|:---:|---|---|---|
| 1 | Anh Thành | VTX (khách hàng / chủ nghiệp vụ) | Người trình bày yêu cầu chính |
| 2 | Hoàng | Đội phát triển | Dev / kiến trúc nghiệp vụ |
| 3 | Quang | Đội phát triển | UI/UX |
| 4 | Tuấn | Đội phát triển | Dev |
| 5 | Sơn | Đội phát triển | *(được nhắc trong phần lịch họp)* |

**Chủ trì cuộc họp:** Anh Thành (VTX)  
**Thư ký / ghi biên bản:** Đội phát triển (tổng hợp từ `hop.md`)

---

## 2. Mục đích cuộc họp

1. Rà soát và thống nhất hướng phát triển các module: **Quy trình**, **Hợp đồng**, **Khách hàng/CRM**, **Bảo hành — Sửa chữa**, **Huấn luyện**, **Vật tư**, **Dashboard/Báo cáo**.
2. Làm rõ quy tắc nghiệp vụ: quy trình theo hợp đồng, nhắc hạn, tài liệu bắt buộc từng bước, phân quyền theo đơn vị.
3. Chốt phạm vi **phiên bản 1 (v1)** và lộ trình **v2** (kéo-thả quy trình, phân tích sâu hơn).
4. Thống nhất cách **triển khai tại đơn vị** (không mang máy tính/USB ra ngoài).
5. Trao đổi thêm về **demo AI nội bộ** (không thuộc phạm vi bắt buộc v1).

---

## 3. Nội dung trao đổi

### 3.1. Module Quy trình (Bàn giao, Huấn luyện, Bảo hành/Sửa chữa)

- Tách **Bàn giao** và **Huấn luyện** thành hai luồng nghiệp vụ riêng; mỗi luồng có **quy trình cấu hình riêng** (đặt tên, số bước, đơn vị tham gia).
- **Bảo hành / Sửa chữa** cũng có quy trình riêng, không gộp chung với bàn giao/huấn luyện.
- Menu **Quy trình** gồm các nhóm: Bàn giao, Huấn luyện, Bảo hành/Sửa chữa; mỗi hợp đồng **gắn một quy trình** khi tạo/cập nhật.
- **Theo dòng sản phẩm:** mỗi dòng sản phẩm có thể có luồng quy trình khác (ví dụ: bàn giao xong mới huấn luyện, hoặc huấn luyện trước/sau tùy loại mặt hàng).
- **Mỗi bước quy trình** cần:
  - Khai báo dữ liệu bắt buộc phải nhập.
  - **Bắt buộc có tài liệu đính kèm** mới được tick hoàn thành / chuyển bước.
  - Theo dõi tiến độ: bước nào đã có tài liệu, đã nghiệm thu, thứ tự bước.
- **Kéo-thả sắp xếp bước** quy trình: mong muốn có nhưng có thể đưa sang **v2**; v1 ưu tiên hoàn thiện logic nghiệp vụ cốt lõi.
- Phía VTX sẽ **viết lại chi tiết** quy trình (bàn giao, huấn luyện, bảo hành) theo mẫu từng bước (field + tài liệu), gửi lại cho đội dev.

### 3.2. Hợp đồng — Tiến độ và nhắc hạn

- Tiến độ hợp đồng tính theo **ngày bắt đầu — ngày kết thúc** và trạng thái.
- **Nhắc hạn** không nhập rời trên từng hợp đồng mà **cấu hình tập trung tại Cài đặt** theo **loại hợp đồng**:
  - Hợp đồng lớn: nhắc trước khoảng **2–3 tháng**.
  - Hợp đồng nhỏ: nhắc trước khoảng **1 tuần**.
- Các mốc nhắc: sắp hết hạn bảo hành, lịch đào tạo, lịch sửa chữa, các ngày quan trọng khác.
- **Thanh lý** hợp đồng: không cần quy trình riêng; chỉ cần nhắc/cảnh báo khi gần hạn.
- Chậm tiến độ / quá hạn: hiển thị cảnh báo (đỏ, nhấp nháy trên dashboard/sidebar).

### 3.3. Sản phẩm

- Khi tạo mới sản phẩm: trạng thái mặc định **Đang sản xuất** (cho phép chỉnh sau).
- Trường bắt buộc thiếu: **báo đỏ** trên form.
- Thêm **dòng sản phẩm** (combo) trên màn tạo/sửa để xác định quy trình và thông tin liên quan theo dòng.

### 3.4. Khách hàng và chăm sóc khách hàng (CRM)

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

### 3.5. Phản ánh, bảo hành, sửa chữa

- Tiếp nhận phản ánh từ **hai nguồn:** khách hàng bên ngoài và nội bộ; **không** có kênh tự động (auto).
- Phân vai:
  - **Chăm sóc khách hàng (CSKH):** tiếp nhận, nhập phản ánh.
  - **Đơn vị bảo hành/sửa chữa:** xử lý theo quy trình đã gán.
- Luồng xử lý: tiếp nhận → phân loại / mức độ khẩn (cao/trung bình/thấp) → **giao việc cho đơn vị** → xử lý → nghiệm thu.
- Trưởng đơn vị thấy việc được gán trong đơn vị mình.
- Phiếu bảo hành: bắt buộc chọn **sản phẩm** và **vật tư/linh kiện** khách đề cập (phục vụ thống kê linh kiện hay hỏng).
- VTX cung cấp file **Excel** mô tả đơn vị tham gia và ma trận phân quyền (kinh doanh, huấn luyện, bảo hành, CSKH, thanh lý, …).

### 3.6. Huấn luyện

- Khóa huấn luyện cần đủ trường: thời gian, địa điểm, hình thức, giảng viên, thành phần tham dự, nội dung, kết luận (đối tác có thể điền).
- Không bắt buộc form in giống mẫu Mobifone; cần **thống kê phản hồi** sau dịch vụ huấn luyện.

### 3.7. Vật tư, linh kiện và báo cáo

- Thống kê **vật tư hay hỏng** theo danh mục vật tư, từ dữ liệu phiếu bảo hành/sửa chữa.
- **Mỗi module/menu** có tab **Dashboard / Báo cáo**; số liệu tổng hợp đưa sang tab báo cáo, màn danh sách chỉ hiển thị dữ liệu.
- Cảnh báo quan trọng hiển thị trên **icon/badge** menu; việc chậm/trễ → đỏ/nhấp nháy.

### 3.8. Giao diện và trải nghiệm người dùng

- Sắp xếp lại menu trái theo luồng vận hành ưu tiên:
  1. Dashboard  
  2. Khách hàng  
  3. Hợp đồng  
  4. Sản phẩm  
  5. Bàn giao  
  6. Huấn luyện  
  7. Bảo hành / Sửa chữa  
- Danh sách: **phân trang** (~10 dòng/trang), tối ưu một màn hình, hạn chế scroll.
- Quy trình giai đoạn đầu: mô tả bước bằng **Bước 1, Bước 2…**; chưa bắt buộc chữ ký số trên từng bước.
- Hiển thị số lượng (đang tiếp nhận, đang xử lý, …) trên **icon** thay vì chiếm thêm không gian text.

### 3.9. Triển khai tại đơn vị

- **Không** mang máy tính, USB ra ngoài cơ quan → triển khai bằng cách:
  - Bàn giao **mã nguồn** + hướng dẫn cài đặt (DB, migrate, env, chạy service).
  - Dev đến hỗ trợ trực tiếp khi cần (không mang thiết bị ra).
- Cần tài liệu **2–3 trang** mô tả sản phẩm + kịch bản triển khai chi tiết.

### 3.10. AI nội bộ (tham khảo, ngoài phạm vi v1 bắt buộc)

- Mong muốn demo **bot AI chạy local** (Ollama, LM Studio, OpenWebUI + RAG) để lãnh đạo hình dung.
- Gợi ý cấu hình phần cứng: RAM **≥ 32 GB**, GPU **≥ 4 GB** (Mac M-series 64 GB RAM được nhắc).
- Use case: tra cứu tài liệu, so sánh **file PDF bản vẽ** (version 1 vs version 2).
- Nếu máy nội bộ không đủ tài nguyên → sau này cần gateway/phần mềm riêng; **không chặn** tiến độ ASMS v1.

### 3.11. Các module khác (đề tài, công việc, tài liệu)

- **Đề tài / Công việc:** tạm **không ưu tiên** đưa vào phạm vi giai đoạn này.
- **Quản lý tài liệu:** có thể gom sau; tài liệu gắn theo hợp đồng/bước quy trình là ưu tiên.

---

## 4. Các quyết định đã thống nhất

| STT | Nội dung quyết định | Ghi chú |
|:---:|---|---|
| Q1 | Mỗi nhóm nghiệp vụ (Bàn giao, Huấn luyện, Bảo hành/Sửa chữa) có **quy trình riêng**, cấu hình được | Menu Quy trình |
| Q2 | Mỗi hợp đồng **gắn một quy trình**; có thể khác nhau theo **dòng sản phẩm** | |
| Q3 | Mỗi bước quy trình: **bắt buộc nhập đủ field + có tài liệu** mới hoàn thành bước | |
| Q4 | Rule nhắc hạn cấu hình tại **Cài đặt** theo loại hợp đồng; form HĐ chỉ chọn loại | |
| Q5 | Module Khách hàng nâng cấp thành **CRM 360°** (doanh thu, chi phí, phản ánh, hoạt động) | |
| Q6 | Phản ánh: CSKH tiếp nhận; đơn vị kỹ thuật xử lý; có phân loại khẩn + giao đơn vị | |
| Q7 | Sắp xếp menu theo luồng: KH → HĐ → SP → Bàn giao → Huấn luyện → Bảo hành | |
| Q8 | Triển khai tại đơn vị: **source + tài liệu hướng dẫn**, không mang máy/USB | |
| Q9 | **v1** ưu tiên nghiệp vụ core + báo cáo/dashboard; **kéo-thả quy trình → v2** | |
| Q10 | AI local chỉ **demo/tham khảo**, không nằm cam kết v1 | |

---

## 5. Công việc cần thực hiện (Action items)

| STT | Nội dung công việc | Người phụ trách | Hạn (dự kiến) | Trạng thái |
|:---:|---|---|---|---|
| A1 | Viết lại quy trình chi tiết: Bàn giao, Huấn luyện, Bảo hành/Sửa chữa (field + tài liệu từng bước) | VTX (anh Thành) | Tuần tới | Chưa làm |
| A2 | Gửi file **Excel** mô tả đơn vị và ma trận phân quyền | VTX | Tuần tới | Chưa làm |
| A3 | Triển khai module Quy trình động (gán HĐ, step payload, tài liệu bước) | Dev (Hoàng, Tuấn) | Theo kế hoạch v1 | Đang làm |
| A4 | Triển khai CRM khách hàng 360° + dashboard/badge cảnh báo | Dev + Quang (UI) | Theo kế hoạch v1 | Đang làm |
| A5 | Cấu hình nhắc hạn theo loại HĐ tại Cài đặt | Dev | v1 | Chưa làm |
| A6 | Phân trang danh sách, tối ưu layout một màn hình | Quang | v1 | Chưa làm |
| A7 | Soạn tài liệu mô tả sản phẩm (2–3 trang) + hướng dẫn triển khai nội bộ | Dev | Trước bàn giao mã | Chưa làm |
| A8 | Lập **phương án triển khai** (phạm vi v1/v2, milestone) | Dev | Tuần tới | Chưa làm |
| A9 | Bổ sung mảng update sau cuộc họp (nếu có thay đổi chương trình) | Hai bên | Tuần sau | Theo dõi |

---

## 6. Phạm vi phiên bản (đề xuất)

### Phiên bản 1 (v1) — ưu tiên

- Quy trình động theo hợp đồng (không kéo-thả).
- CRM khách hàng cơ bản + chi phí/doanh thu tổng hợp.
- Phản ánh + giao việc đơn vị + mức khẩn.
- Nhắc hạn theo cài đặt.
- Dashboard/badge cảnh báo.
- Báo cáo cơ bản theo module.
- Phân quyền theo role (sau khi có Excel từ VTX).
- Tài liệu hướng dẫn triển khai.

### Phiên bản 2 (v2) — sau v1

- Kéo-thả sắp xếp bước quy trình.
- Báo cáo nâng cao, lọc đa chiều.
- Thống kê vật tư/linh kiện sâu hơn.
- Tích hợp / gateway AI (nếu triển khai).

---

## 7. Rủi ro và điểm cần làm rõ thêm

| STT | Nội dung | Hành động đề xuất |
|:---:|---|---|
| R1 | Một số câu trong `hop.md` bị nhận dạng sai (speech-to-text) | Đối chiếu với anh Thành trước khi code |
| R2 | Ma trận phân quyền chi tiết chưa có file chính thức | Chờ Excel từ VTX (A2) |
| R3 | Quy trình chi tiết từng bước chưa có bản văn bản | Chờ VTX (A1) |
| R4 | Ngày/giờ cuộc họp chưa ghi trong file gốc | Bổ sung vào header khi xác nhận |

---

## 8. Lịch họp tiếp theo

- **Trong tuần:** bổ sung update theo các hạng mục A1–A3, A8.
- **Tuần sau:** họp rà soát tiến độ / nhận bản cập nhật từ VTX (quy trình + Excel phân quyền).
- **Mục tiêu:** có bản **v1** đủ để UAT và báo cáo tiến độ cho lãnh đạo.

---

## 9. Phụ lục

### Phụ lục A — Tài liệu liên quan

| Tài liệu | Mô tả |
|---|---|
| [hop.md](./hop.md) | Biên bản ghi âm gốc (speech-to-text) |
| [hop-tom-tat.md](./hop-tom-tat.md) | Bảng tổng hợp việc cần làm (24 dòng) |
| [hop-bang-cong-viec-chi-tiet.md](./hop-bang-cong-viec-chi-tiet.md) | **Bảng chi tiết ~97 hạng mục** cần làm sau họp |
| [tom-tat-cuoc-hop.md](./tom-tat-cuoc-hop.md) | Tóm tắt cuộc họp (phiên bản ngắn) |
| [BRD-TONG-THE-ASMS.md](./BRD-TONG-THE-ASMS.md) | BRD tổng thể |
| [SRS-ASMS.md](./SRS-ASMS.md) | SRS kỹ thuật |
| [TECHSPEC-TONG-THE-ASMS.md](./TECHSPEC-TONG-THE-ASMS.md) | Tech spec tổng thể |

### Phụ lục B — Trích dẫn yêu cầu nổi bật (theo chủ đề)

**Quy trình:** «Mỗi cái này là có quy trình riêng» — bàn giao, huấn luyện, bảo hành đều cấu hình riêng, gắn theo hợp đồng.

**Nhắc hạn:** «Gần đến hạn bảo hành phải nhắc» — cấu hình theo loại hợp đồng tại Cài đặt.

**CRM:** «Bấm vào một khách hàng phải biết toàn bộ: doanh thu bao nhiêu, chi phí bao nhiêu, phản ánh tồn» — màn chi tiết khách hàng 360°.

**Triển khai:** «Không ai được mang máy tính bỏ hoa để cắm» — bàn giao source + hướng dẫn cài đặt.

**v1/v2:** «Version một chưa kéo thả thì version 2 kéo thả sau» — ưu tiên xong core trước.

---

## 10. Xác nhận biên bản

| Vai trò | Họ tên | Chữ ký | Ngày |
|---|---|---|---|
| Chủ trì / VTX | | | |
| Đội phát triển | | | 21/05/2026 |

---

*Biên bản được lập từ nội dung trao đổi trong cuộc họp; khi có mâu thuẫn với tài liệu chính thức từ VTX (quy trình Excel, phân quyền), ưu tiên bản cập nhật từ phía VTX.*
