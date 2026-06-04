# Bảng chi tiết công việc cần làm — Cuộc họp ASMS

| Thuộc tính | Nội dung |
|---|---|
| **Nguồn** | [hop.md](./hop.md) (ghi âm STT), chuẩn hóa theo [bien-ban-cuoc-hop-asms.md](./bien-ban-cuoc-hop-asms.md) |
| **Mục đích file** | Một bảng duy nhất liệt kê **toàn bộ việc cần làm** sau cuộc họp, đủ chi tiết để theo dõi backlog |
| **Phiên bản** | 1.0 |
| **Ngày lập** | 21/05/2026 |
| **Tổng hợp đã làm** | [chuc-nang-sua-va-moi-sau-hop.md](./chuc-nang-sua-va-moi-sau-hop.md), [chuc-nang-hoan-thanh.md](./chuc-nang-hoan-thanh.md) |

**Chú thích cột**

| Cột | Ý nghĩa |
|---|---|
| **Giai đoạn** | v1 = ưu tiên phiên bản đầu; v2 = sau khi v1 ổn định; Tham khảo = không chặn v1 |
| **Ưu tiên** | Cao / TB / Thấp |
| **Phụ thuộc** | Đầu vào từ VTX hoặc hạng mục khác phải xong trước |
| **Trạng thái** | Chưa làm / Đang làm / Chờ VTX / v2 |

---

## Bảng tổng hợp việc cần làm

| STT | Mã | Nhóm | Hạng mục | Việc cần làm (chi tiết) | Đầu ra / Tiêu chí nghiệm thu | Người PH | Giai đoạn | Ưu tiên | Phụ thuộc | Trạng thái |
|:---:|---|---|---|---|---|:---:|:---:|:---:|:---:|---|
| **A. QUY TRÌNH & WORKFLOW** |
| 1 | WF-01 | Quy trình | Tách luồng nghiệp vụ | Tách **Bàn giao** và **Huấn luyện** thành 2 luồng độc lập; **Bảo hành/Sửa chữa** không gộp chung với bàn giao/huấn luyện | Menu và màn hình phản ánh 3 nhóm riêng; không trộn workflow | Dev | v1 | Cao | — | Đang làm |
| 2 | WF-02 | Quy trình | Menu Quy trình | Menu **Quy trình** gồm: Bàn giao, Huấn luyện, Bảo hành/Sửa chữa (và các module liên quan); mỗi nhóm có danh sách workflow cấu hình được | `/quy-trinh` có thẻ/module; đếm số quy trình từng loại | Dev | v1 | Cao | WF-01 | Đang làm |
| 3 | WF-03 | Quy trình | Gắn quy trình theo HĐ | Mỗi **hợp đồng** (hoặc phiếu con: bàn giao, HL, BH) **gắn một quy trình** khi tạo/sửa; cho phép đổi quy trình có xác nhận | Chọn workflow từ dropdown; instance runtime tạo đúng bước | Dev | v1 | Cao | WF-02 | Đang làm |
| 4 | WF-04 | Quy trình | Theo dòng sản phẩm | Thêm **dòng sản phẩm** (combo) trên HĐ/SP để xác định **luồng quy trình khác nhau** (VD: BG xong mới HL, hoặc HL trước tùy loại) | Cấu hình mapping dòng SP → template quy trình hoặc rule gợi ý | Dev + VTX | v1 | Cao | SP-02, A1 | Chưa làm |
| 5 | WF-05 | Quy trình | Cấu hình từng bước | Mỗi bước: tên, hành động, **vai trò/đơn vị** tham gia, SLA, **fieldSchema** (trường bắt buộc) | Editor bước lưu DB; form runtime render đúng field | Dev | v1 | Cao | A1 | Đang làm |
| 6 | WF-06 | Quy trình | Tài liệu bắt buộc | **Bắt buộc đính kèm tài liệu** mới được tick hoàn thành / **Phê duyệt** chuyển bước (theo cấu hình bước) | Không advance nếu thiếu file khi bước yêu cầu | Dev | v1 | Cao | WF-05, A1 | Chưa làm |
| 7 | WF-07 | Quy trình | Theo dõi tiến độ bước | Hiển thị: bước nào đã nhập đủ, đã có tài liệu, đã nghiệm thu; thứ tự bước; % hoàn thành | Panel tiến trình + báo cáo tổng hợp theo phiếu | Dev | v1 | Cao | WF-05 | Đang làm |
| 8 | WF-08 | Quy trình | stepPayloads | Lưu dữ liệu từng bước (`stepPayloads`) đồng bộ BE/FE; xử lý orphan khi đổi quy trình | Lưu/reload không mất dữ liệu bước; cảnh báo payload thừa | Dev | v1 | Cao | WF-03 | Đang làm |
| 9 | WF-09 | Quy trình | Phê duyệt theo vai trò | Nút **Phê duyệt / Trả lại** chỉ cho đúng role bước hiện tại; sai role → 403 + toast rõ | UAT theo ma trận role từng bước | Dev | v1 | Cao | RBAC-02 | Đang làm |
| 10 | WF-10 | Quy trình | Tài liệu VTX | VTX **viết lại chi tiết** quy trình BG, HL, BH/SC: từng bước + field + loại tài liệu bắt buộc | File/word/excel mẫu gửi dev import vào `fieldSchema` | **VTX** | v1 | Cao | — | Chờ VTX |
| 11 | WF-11 | Quy trình | Kéo-thả bước | **Kéo-thả** sắp xếp thứ tự bước trong editor quy trình (UX trực quan) | Reorder persist; audit log | Dev | v2 | TB | WF-05 | Chưa làm |
| 12 | WF-12 | Quy trình | Kéo-thả luồng | Sau này: kéo-thả **sơ đồ quy trình** (không chỉ reorder list) | v2 roadmap | Dev | v2 | TB | WF-11 | Chưa làm |
| 13 | WF-13 | Quy trình | Chữ ký số | Giai đoạn đầu: **Bước 1, Bước 2…** — **chưa bắt buộc** chữ ký số từng bước | Không block v1 vì thiếu CA | — | v1 | Thấp | — | Đã thống nhất |
| 14 | WF-14 | Quy trình | CSKH quy trình riêng | **Chăm sóc khách hàng** có thể có **quy trình riêng** theo từng HĐ (như các mảng khác) | Module/route CSKH workflow nếu nằm phạm vi v1 | Dev + VTX | v1/v2 | TB | A1 | Chưa làm |
| **B. HỢP ĐỒNG** |
| 15 | HD-01 | Hợp đồng | Tiến độ theo ngày | Tiến độ HĐ = **ngày bắt đầu → ngày kết thúc** + trạng thái; hiển thị % trên list/chi tiết | % khớp khoảng thời gian; trạng thái `late` khi quá hạn | Dev | v1 | Cao | — | Đang làm |
| 16 | HD-02 | Hợp đồng | Chậm tiến độ | HĐ chậm / quá hạn: **đỏ** trên list, badge menu, dashboard | Sidebar `overdueContracts`; hàng highlight đỏ | Dev + Quang | v1 | Cao | HD-01 | Đang làm |
| 17 | HD-03 | Hợp đồng | Nhắc hạn tập trung | **Không** nhập nhắc hạn riêng từng HĐ; rule tại **Cài đặt** theo **loại hợp đồng** | Tab Hệ thống / Thuộc tính có rule; HĐ chỉ chọn loại | Dev | v1 | Cao | SET-03 | Chưa làm |
| 18 | HD-04 | Hợp đồng | Rule HĐ lớn/nhỏ | HĐ lớn: nhắc trước **2–3 tháng**; HĐ nhỏ: nhắc trước **~1 tuần** (cấu hình được) | Scheduler/notification bắn đúng lead time | Dev | v1 | Cao | HD-03 | Chưa làm |
| 19 | HD-05 | Hợp đồng | Các mốc nhắc | Nhắc: sắp **hết hạn bảo hành**, lịch **đào tạo**, lịch **sửa chữa**, mốc quan trọng khác (checkbox loại nhắc trong Cài đặt) | Danh sách loại nhắc tích chọn được | Dev | v1 | Cao | HD-03 | Chưa làm |
| 20 | HD-06 | Hợp đồng | Thanh lý | **Thanh lý** HĐ: **không** quy trình riêng; chỉ **nhắc/cảnh báo** khi gần hạn thanh lý | Trạng thái liquidated + notification | Dev | v1 | TB | HD-05 | Chưa làm |
| 21 | HD-07 | Hợp đồng | Lọc & hiển thị | Lọc HĐ: ưu tiên **ngày ký** (không dùng ngày tạo làm chính), **ngày hết hạn**, **ngày BH**, **tên KH** | Filter API + UI đúng field | Dev | v1 | Cao | — | Đang làm |
| 22 | HD-08 | Hợp đồng | Tab điều khoản | Tab **Điều khoản & Điều kiện**: chọn nhóm/điều khoản từ danh mục; lưu `clauseIds` | Snapshot `terms` khi lưu; HĐ cũ legacy vẫn xem được | Dev | v1 | Cao | SET-04 | Đang làm |
| 23 | HD-09 | Hợp đồng | 1 BG + 1 HL / HĐ | Ràng buộc: tối đa **1 bàn giao + 1 huấn luyện** / hợp đồng; tạo thêm → 400 | API + dropdown HĐ eligible khi tạo mới | Dev | v1 | Cao | — | Đang làm |
| 24 | HD-10 | Hợp đồng | Tab BG/HL trên HĐ | Trên sửa HĐ: tab **Bàn giao** / **Huấn luyện** — chọn quy trình, form động, WorkflowInstancePanel | Liên kết `linkedHandover` / `linkedTraining` trên detail | Dev | v1 | Cao | WF-03 | Đang làm |
| 25 | HD-11 | Hợp đồng | Thông tin chung HĐ | Tab thông tin: khách (FK), giá trị, ngày, loại HĐ, **số ngày nhắc trước hết hạn** (nếu override) | `customerId` lưu đúng BE | Dev | v1 | Cao | — | Đang làm |
| 26 | HD-12 | Hợp đồng | PAKD / chi phí HĐ | Module **phương án kinh doanh**: đơn vị chủ trì, tổng DT, chi phí đã chi (tham khảo BRD) — **cấu hình/đề xuất**, không bắt buộc số chi phí thực tế tự động | Form cơ bản như đã trao đổi trước | Dev + VTX | v1/v2 | TB | — | Chưa làm |
| **C. SẢN PHẨM** |
| 27 | SP-01 | Sản phẩm | Trạng thái mặc định | Tạo mới SP: mặc định **Đang sản xuất**; cho sửa sau | Default trên form create | Dev | v1 | Cao | — | Chưa làm |
| 28 | SP-02 | Sản phẩm | Validation form | Trường bắt buộc thiếu → **báo đỏ** trên form (client + server) | Zod/FE highlight đỏ | Dev | v1 | Cao | — | Chưa làm |
| 29 | SP-03 | Sản phẩm | Dòng sản phẩm | Combo **dòng sản phẩm** / category trên tạo-sửa SP → quyết định quy trình & thông tin liên quan | Field liên kết definitions `product_category` | Dev | v1 | Cao | WF-04 | Chưa làm |
| 30 | SP-04 | Sản phẩm | Thống kê phản ánh SP | Trên SP: số lần **phản ánh**, BH gần đây (từ phiếu warranty) | Widget hoặc tab báo cáo SP | Dev | v1 | TB | BH-08 | Chưa làm |
| 31 | SP-05 | Sản phẩm | Quy trình SX SP | Quy trình module `product` (sản xuất, nghiệm thu…) — cột **Bước QT** trên list | Workflow product attach | Dev | v1 | TB | WF-02 | Đang làm |
| **D. KHÁCH HÀNG / CRM** |
| 32 | CRM-01 | CRM | Đổi tên module | Định hướng **Quản lý / Chăm sóc khách hàng** (không chỉ danh sách) | Title menu, copy UI | Quang | v1 | Cao | — | Chưa làm |
| 33 | CRM-02 | CRM | Nhiều đầu mối | **1 KH — nhiều contact**; thêm/sửa contact trong chi tiết KH | CRUD contacts API + UI | Dev | v1 | Cao | — | Đang làm |
| 34 | CRM-03 | CRM | Chi phí theo KH | **Chi phí tiếp xúc** ghi theo **khách hàng**, không theo từng contact | Tổng chi phí aggregate đúng KH | Dev | v1 | Cao | CRM-05 | Chưa làm |
| 35 | CRM-04 | CRM | Chi tiết 360° | Click tên KH → màn tổng quan: số HĐ, tiến độ HĐ, **tổng DT**, **tổng chi phí**, lãi/lỗ, phản ánh tồn, SC tồn, sản phẩm đến đâu | Một màn “toàn cảnh” KH | Dev + Quang | v1 | Cao | — | Chưa làm |
| 36 | CRM-05 | CRM | Hoạt động CRM | Ghi hoạt động: ngày giờ, đầu mối gặp, nội dung, **chi phí lần đó**, minh chứng (file) | CRUD activities + link contact | Dev | v1 | Cao | — | Đang làm |
| 37 | CRM-06 | CRM | KH trước HĐ | **Phải có KH** trong danh mục trước khi kéo/chọn vào HĐ mới | Dropdown KH chỉ bản ghi đã tạo | Dev | v1 | Cao | — | Đang làm |
| 38 | CRM-07 | CRM | Thông tin bổ sung | Trường **thông tin bổ sung** theo KH (có thể fix bộ field hoặc mở rộng sau): ngày thành lập, SN đầu mối, huân chương… | Nhắc chăm sóc theo ngày | Dev | v1 | TB | — | Chưa làm |
| 39 | CRM-08 | CRM | Nhắc ngày kỷ niệm | Đến ngày → notification / task chăm sóc (thành lập, sinh nhật contact, nhận huân chương…) | Scheduler anniversaries | Dev | v1 | TB | CRM-07, SET-05 | Chưa làm |
| 40 | CRM-09 | CRM | Link mã KH | Mã KH hiển thị **link** vào chi tiết (bỏ chỉ icon mắt nếu thừa) | UX một click vào 360° | Quang | v1 | TB | CRM-04 | Chưa làm |
| 41 | CRM-10 | CRM | Thâm niên / hiệu quả | Thống kê: thâm niên với VTX, số lần tiếp xúc, hiệu quả (định nghĩa KPI với VTX) | Widget trên detail KH | Dev + VTX | v2 | TB | CRM-04 | Chưa làm |
| **E. PHẢN ÁNH / BẢO HÀNH / SỬA CHỮA** |
| 42 | BH-01 | Bảo hành | Hai nguồn tiếp nhận | Phiếu từ **KH bên ngoài** và **nội bộ**; **không** kênh auto/import tự động | Form chọn nguồn; không có API auto ticket | Dev | v1 | Cao | — | Đang làm |
| 43 | BH-02 | Bảo hành | Phân vai CSKH | Role **chăm sóc KH**: tiếp nhận, nhập phản ánh — **tách** khỏi đơn vị sửa chữa | Route + RBAC CSKH vs technician | Dev | v1 | Cao | RBAC-01 | Chưa làm |
| 44 | BH-03 | Bảo hành | Luồng xử lý | Tiếp nhận → **phân loại** → **mức khẩn** (cao/TB/thấp) → **giao đơn vị** → xử lý → **nghiệm thu** | Workflow warranty + bước gán đơn vị | Dev | v1 | Cao | WF-10, A1 | Đang làm |
| 45 | BH-04 | Bảo hành | Trưởng đơn vị | Trưởng đơn vị thấy việc **gán trong đơn vị**; nhân viên trong đơn vị được assign | Filter queue theo unit | Dev | v1 | Cao | RBAC-01 | Chưa làm |
| 46 | BH-05 | Bảo hành | Tab riêng module | Mỗi menu lớn có **tab Dashboard/Báo cáo** riêng hoặc dùng `/bao-cao`; list chỉ data | Tách số liệu khỏi list | Dev + Quang | v1 | TB | RPT-01 | Chưa làm |
| 47 | BH-06 | Bảo hành | Form động BH | Phiếu BH: form theo **quy trình động** (không 5 tab cố định cũ) | fieldSchema từng bước | Dev | v1 | Cao | WF-05 | Đang làm |
| 48 | BH-07 | Bảo hành | Chọn SP + vật tư | Phiếu **bắt buộc** chọn **sản phẩm** và **vật tư/linh kiện** khách đề cập | Field required; validation 422 | Dev | v1 | Cao | — | Chưa làm |
| 49 | BH-08 | Bảo hành | Thống kê vật tư hỏng | Từ phiếu BH → thống kê **linh kiện hay hỏng**, số lần thay | Tab báo cáo Phản ánh / material-defects | Dev | v1 | TB | BH-07 | Chưa làm |
| 50 | BH-09 | Bảo hành | Quy trình BH VTX | VTX viết lại quy trình BH/SC chi tiết (bước gán, phân loại, khối lượng…) | Gửi lại dev (A1) | **VTX** | v1 | Cao | — | Chờ VTX |
| **F. HUẤN LUYỆN & ĐÀO TẠO** |
| 51 | HL-01 | Huấn luyện | Trường khóa HL | Đủ field: thời gian, địa điểm, hình thức, giảng viên, thành phần, nội dung, **kết luận** (đối tác điền) | Form/schema coaching | Dev | v1 | Cao | A1 | Chưa làm |
| 52 | HL-02 | Huấn luyện | Không form in Mobifone | **Không** bắt layout in giống mẫu Mobifone; ưu tiên nhập + thống kê | — | — | v1 | — | Đã thống nhất |
| 53 | HL-03 | Huấn luyện | Thống kê phản hồi HL | Sau dịch vụ HL: **thống kê phản hồi** / feedback | Báo cáo hoặc section trên khóa HL | Dev | v1 | TB | — | Chưa làm |
| 54 | HL-04 | Huấn luyện | Tách màn HL | Huấn luyện (coaching) trên **Bàn giao & HL** / tab HĐ — không list trùng `/dao-tao` | courseKind=coaching | Dev | v1 | Cao | — | Đang làm |
| 55 | DT-01 | Đào tạo | Khóa đào tạo | Module `/dao-tao`: quy trình `training`, học viên, buổi học, stepPayloads | TrainingDetail đầy đủ | Dev | v1 | Cao | — | Đang làm |
| **G. VẬT TƯ & BÁO CÁO** |
| 56 | VT-01 | Vật tư | CRUD + điều chuyển | Nhập/xuất/điều chuyển; không âm tồn | Transfer validation | Dev | v1 | Cao | — | Đang làm |
| 57 | VT-02 | Vật tư | Thống kê hay hỏng | Báo cáo **danh mục vật tư** hay lỗi từ phiếu BH (theo category VT) | Chart/tab báo cáo | Dev | v2 | TB | BH-08 | Chưa làm |
| 58 | RPT-01 | Báo cáo | Tab theo module | `/bao-cao`: KH, HĐ, dòng SP, Phản ánh (3 sub), Đơn vị TH | 5 tab + export | Dev | v1 | Cao | — | Đang làm |
| 59 | RPT-02 | Báo cáo | Lọc thời gian | Lọc **năm** hoặc **từ ngày–đến ngày** + Áp dụng; query URL | Share link filter | Dev | v1 | Cao | — | Đang làm |
| 60 | RPT-03 | Báo cáo | Xuất file | Xuất **Excel / PDF** theo tab đang xem | Không crash khi empty | Dev | v1 | TB | RPT-01 | Đang làm |
| 61 | RPT-04 | Báo cáo | Báo cáo nâng cao | Lọc đa chiều, drill-down sâu | v2 | Dev | v2 | TB | RPT-01 | Chưa làm |
| **H. DASHBOARD & UI/UX** |
| 62 | UI-01 | UI | Thứ tự menu | Sắp menu: **Dashboard → KH → HĐ → SP → Bàn giao → Huấn luyện → BH/SC** (và các mục còn lại) | AppSidebar order | Quang | v1 | Cao | — | Chưa làm |
| 63 | UI-02 | UI | Phân trang | List **~10–20 dòng/trang**, footer phân trang chuẩn | PaginatedTableFooter mọi list chính | Quang | v1 | Cao | — | Đang làm |
| 64 | UI-03 | UI | Một màn hình | Tối ưu chiều cao — **hạn chế scroll** dọc trên list | CEO xem một màn đủ KPI | Quang | v1 | Cao | — | Chưa làm |
| 65 | UI-04 | UI | Badge trên icon | Số **đang tiếp nhận / đang xử lý / trễ** trên **icon menu**, không chiếm dòng text thừa | Sidebar badges | Quang | v1 | Cao | — | Đang làm |
| 66 | UI-05 | UI | Cảnh báo đỏ/nhấp nháy | Việc **chậm, tồn, khiếu nại** → **đỏ / nhấp nháy** (dashboard + list) | AlertTab + row class | Quang | v1 | Cao | — | Chưa làm |
| 67 | UI-06 | UI | Bỏ text thống kê thừa | Dashboard KH: **không** lặp dòng chữ thống kê dưới nếu đã có badge/icon trên | Gọn layout | Quang | v1 | TB | UI-04 | Chưa làm |
| 68 | UI-07 | UI | Dashboard từng module | Mỗi module có **dashboard sub-tab** hoặc dùng chung `/` + `/bao-cao` | Không trộn KPI vào list | Dev | v1 | TB | RPT-01 | Chưa làm |
| 69 | DSH-01 | Dashboard | KPI live | Tab Tổng quan, Dự án, Vật tư dùng **API thật** | Không mock | Dev | v1 | Cao | — | Đang làm |
| 70 | DSH-02 | Dashboard | Thay mock | Thay `contractsData` / `productsData` / `complaintsData` bằng **live data** | Revenue/Product/Warranty tab | Dev | v1 | Cao | — | Chưa làm |
| **I. PHÂN QUYỀN & CÀI ĐẶT** |
| 71 | RBAC-01 | Phân quyền | File Excel VTX | VTX gửi **Excel** đơn vị + ma trận phân quyền (KD, HL, BH, CSKH, thanh lý…) | File chính thức | **VTX** | v1 | Cao | — | Chờ VTX |
| 72 | RBAC-02 | Phân quyền | Map role → module | Cấu hình RBAC: kinh doanh nhập HĐ; CSKH tiếp nhận PA; HL/BH xử lý; viewer read-only | Settings + API enforce | Dev | v1 | Cao | RBAC-01 | Chưa làm |
| 73 | RBAC-03 | Phân quyền | Gán theo đơn vị | Bước workflow **gán đơn vị**; user thuộc đơn vị thấy queue | Unit assignment | Dev | v1 | Cao | RBAC-01 | Chưa làm |
| 74 | SET-01 | Cài đặt | Tab hệ thống | SLA, ngưỡng chậm, **số ngày nhắc**, giờ cron, kênh thông báo | SystemSettingsTab | Dev | v1 | Cao | — | Đang làm |
| 75 | SET-02 | Cài đặt | Thuộc tính | `/cai-dat/thuoc-tinh`: loại HĐ, ưu tiên BH, loại BG… + **điều khoản HĐ** | Definitions CRUD | Dev | v1 | Cao | — | Đang làm |
| 76 | SET-03 | Cài đặt | Loại HĐ → nhắc hạn | Danh mục **loại hợp đồng** gắn rule nhắc (lead time, loại mốc) | HD-03, HD-04 | Dev | v1 | Cao | SET-02 | Chưa làm |
| 77 | SET-04 | Cài đặt | Điều khoản HĐ | CRUD điều khoản + **nhóm điều khoản** + gán nhiều điều khoản vào nhóm | ContractTermsPicker | Dev | v1 | Cao | — | Đang làm |
| 78 | SET-05 | Cài đặt | Đăng ký nhắc sự kiện | Anniversary / subscription nhắc ngày KH (nếu trong phạm vi code) | Notifications | Dev | v1 | TB | CRM-08 | Chưa làm |
| **J. TÀI LIỆU & TRIỂN KHAI** |
| 79 | DOC-01 | Tài liệu | Gắn theo bước QT | Tài liệu ưu tiên gắn **HĐ / từng bước quy trình**; module quản lý tài liệu chung **để sau** | Upload per step | Dev | v1 | TB | WF-06 | Đang làm |
| 80 | DOC-02 | Tài liệu | Hướng dẫn sử dụng | Soạn **hướng dẫn sử dụng** as-is cho người dùng | [huong-dan-su-dung-asms.md](./huong-dan-su-dung-asms.md) | Dev | v1 | TB | — | Đã có bản 1.0 |
| 81 | DOC-03 | Triển khai | HD cài đặt nội bộ | Tài liệu **2–3 trang** mô tả sản phẩm + **kịch bản cài đặt** (DB, migrate, env) — **không** mang máy/USB ra ngoài | PDF/MD bàn giao VTX | Dev | v1 | Cao | — | Chưa làm |
| 82 | DOC-04 | Triển khai | Bàn giao source | Bàn giao **mã nguồn**; VTX tự deploy; dev hỗ trợ onsite **không mang thiết bị** | Repo + tag release | Dev | v1 | Cao | DOC-03 | Chưa làm |
| 83 | DOC-05 | Kế hoạch | Phương án v1/v2 | Lập **milestone** v1 (core) vs v2 (kéo-thả, báo cáo sâu, AI) | doc kế hoạch / hop-tom-tat | Dev | v1 | Cao | — | Chưa làm |
| **K. PHẠM VI NGOÀI / THAM KHẢO** |
| 84 | OUT-01 | Khác | Đề tài / CV | **Đề tài NC**, **Công việc**: **không ưu tiên** giai đoạn này (giữ as-is, không mở rộng) | — | — | — | Thấp | — | Đã thống nhất |
| 85 | OUT-02 | Khác | Quản lý tài liệu | Module **Tài liệu** tổng: gom sau; ưu tiên doc trên HĐ/Bước QT | — | Dev | v2 | Thấp | — | Backlog |
| 86 | AI-01 | AI | Demo local | Demo **Ollama / LM Studio / OpenWebUI + RAG** cho viện trưởng hình dung | PoC tách repo | Dev | Tham khảo | Thấp | HW | Chưa làm |
| 87 | AI-02 | AI | Yêu cầu phần cứng | Gợi ý: RAM **≥ 32 GB**, GPU **≥ 4 GB** (Mac M 64 GB) | Spec sheet | Dev | Tham khảo | Thấp | — | Ghi nhận |
| 88 | AI-03 | AI | So sánh PDF bản vẽ | Use case: so sánh **PDF bản vẽ** v1 vs v2 | Không block ASMS v1 | Dev | Tham khảo | Thấp | AI-01 | Chưa làm |
| **L. HÀNH ĐỘNG SAU HỌP (ACTION)** |
| 89 | A1 | Action | Quy trình VTX | Viết lại quy trình BG, HL, BH (field + tài liệu) | Bản gửi dev | **VTX** | v1 | Cao | — | Chờ VTX |
| 90 | A2 | Action | Excel phân quyền | Gửi file **Excel** đơn vị & phân quyền | File | **VTX** | v1 | Cao | — | Chờ VTX |
| 91 | A3 | Action | Dev quy trình động | Triển khai WF runtime + step + tài liệu bước | UAT workflow | Dev | v1 | Cao | A1 | Đang làm |
| 92 | A4 | Action | Dev CRM + UI | CRM 360° + dashboard/badge | UAT CRM | Dev, Quang | v1 | Cao | — | Đang làm |
| 93 | A5 | Action | Nhắc hạn | Cấu hình nhắc hạn theo loại HĐ | Notification đúng ngày | Dev | v1 | Cao | SET-03 | Chưa làm |
| 94 | A6 | Action | Phân trang UI | Phân trang & layout 1 màn hình | Quang sign-off | Quang | v1 | Cao | — | Chưa làm |
| 95 | A7 | Action | Tài liệu triển khai | HD 2–3 trang + kịch bản deploy | PDF | Dev | v1 | Cao | — | Chưa làm |
| 96 | A8 | Action | Phương án triển khai | Milestone v1/v2 trình lãnh đạo | Plan doc | Dev | v1 | Cao | — | Chưa làm |
| 97 | A9 | Action | Họp tuần sau | Rà soát tiến độ; nhận bản VTX cập nhật | Biên bản họp | Hai bên | — | Cao | A1, A2 | Theo dõi |

---

## Tóm tắt theo giai đoạn

| Giai đoạn | Số hạng mục (ước) | Trọng tâm |
|---|---:|---|
| **v1** | ~75 | Quy trình động, HĐ+nhắc hạn, CRM 360°, BH/PA, UI/badge, RBAC, báo cáo cơ bản, tài liệu triển khai |
| **v2** | ~8 | Kéo-thả QT, báo cáo nâng cao, VT hỏng sâu, CRM nâng cao |
| **Chờ VTX** | 3 | A1, A2, WF-10, BH-09 |
| **Tham khảo** | 3 | AI local |

---

## Rủi ro / làm rõ thêm

| Mã | Nội dung | Hành động |
|---|---|---|
| R1 | `hop.md` speech-to-text có câu sai | Đối chiếu anh Thành trước khi code |
| R2 | Chưa có Excel phân quyền | Chờ A2 |
| R3 | Chưa có quy trình chi tiết văn bản | Chờ A1 |
| R4 | Ngày/giờ họp chưa ghi trong hop.md | Bổ sung header khi xác nhận |

---

## Tài liệu liên quan

| File | Mô tả |
|---|---|
| [hop.md](./hop.md) | Ghi âm gốc |
| [bien-ban-cuoc-hop-asms.md](./bien-ban-cuoc-hop-asms.md) | Biên bản chuẩn hóa |
| [hop-tom-tat.md](./hop-tom-tat.md) | Bảng tóm tắt 24 dòng |
| [tom-tat-cuoc-hop.md](./tom-tat-cuoc-hop.md) | Tóm tắt theo chủ đề |
| [huong-dan-su-dung-asms.md](./huong-dan-su-dung-asms.md) | Hướng dẫn sử dụng (as-is) |

---

*Cập nhật trạng thái cột «Trạng thái» khi sprint thay đổi; ưu tiên nguồn VTX (A1, A2) khi có mâu thuẫn với bản ghi âm.*
