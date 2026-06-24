/** Nội dung BRD ASMS — ngôn ngữ dễ hiểu cho người không chuyên kỹ thuật */

export const architectureHtmlPlain = `
<figure class="arch-figure">
<div class="arch-diagram">
  <div class="arch-title">ASMS — Hệ thống quản lý hậu mãi (5 tầng)</div>
  <div class="arch-layer l1">
    <div class="arch-layer-hd">TẦNG 1 — NGƯỜI SỬ DỤNG</div>
    <div class="arch-row">
      <div class="arch-box"><strong>Màn hình quản trị</strong><br>Quản trị viên · Quản lý · Kinh doanh<br><em>Tổng quan, cài đặt hệ thống</em></div>
      <div class="arch-box"><strong>Màn hình vận hành</strong><br>Kỹ thuật viên · Người xem<br><em>Hợp đồng, bàn giao, bảo hành, vật tư…</em></div>
      <div class="arch-box"><strong>Đăng nhập</strong><br>Tài khoản &amp; mật khẩu<br><em>Mỗi người chỉ thấy phần việc của mình</em></div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l2">
    <div class="arch-layer-hd">TẦNG 2 — BẢO MẬT &amp; KIỂM SOÁT TRUY CẬP</div>
    <div class="arch-row two">
      <div class="arch-box"><strong>Cổng kết nối hệ thống</strong><br>Tiếp nhận yêu cầu từ màn hình<br>Trả kết quả thống nhất</div>
      <div class="arch-box"><strong>Phân quyền theo vai trò</strong><br>5 nhóm người dùng<br>Xem / thêm / sửa / xóa từng phần</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l3">
    <div class="arch-layer-hd">TẦNG 3 — NGHIỆP VỤ CHÍNH</div>
    <div class="arch-grid">
      <div class="arch-box"><strong>Hợp đồng</strong><br>Lập, theo dõi, phê duyệt<br>Gắn khách hàng &amp; sản phẩm</div>
      <div class="arch-box"><strong>Bàn giao &amp; Huấn luyện</strong><br>Quy trình bàn giao thiết bị<br>Tổ chức tập huấn vận hành</div>
      <div class="arch-box"><strong>Bảo hành &amp; Sửa chữa</strong><br>Tiếp nhận sự cố<br>Theo dõi thời hạn xử lý</div>
      <div class="arch-box"><strong>Sản phẩm &amp; Vật tư</strong><br>Danh mục trang bị<br>Quản lý kho &amp; điều chuyển</div>
      <div class="arch-box"><strong>Khách hàng &amp; Phản ánh</strong><br>Hồ sơ khách hàng<br>Tiếp nhận &amp; xử lý ý kiến</div>
      <div class="arch-box"><strong>Quy trình &amp; Cài đặt</strong><br>Thiết lập bước phê duyệt<br>Quản lý người dùng</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l4">
    <div class="arch-layer-hd">TẦNG 4 — LƯU TRỮ DỮ LIỆU &amp; TÀI LIỆU</div>
    <div class="arch-row">
      <div class="arch-box"><strong>Cơ sở dữ liệu</strong><br>Lưu hồ sơ nghiệp vụ<br>Lịch sử thao tác</div>
      <div class="arch-box"><strong>Tệp đính kèm</strong><br>Hợp đồng, biên bản, ảnh…<br>Gắn theo từng hồ sơ</div>
      <div class="arch-box"><strong>Thông báo tự động</strong><br>Nhắc hết hạn, quá hạn<br>Thông báo trên màn hình</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l5">
    <div class="arch-layer-hd">TẦNG 5 — NỀN TẢNG CÔNG NGHỆ</div>
    <div class="arch-tech">
      <span>Giao diện web</span><span>Máy chủ ứng dụng</span><span>Cơ sở dữ liệu</span><span>Triển khai an toàn</span>
    </div>
  </div>
</div>
<figcaption>Hình 1. Cách hệ thống ASMS được tổ chức — từ người dùng đến dữ liệu</figcaption>
</figure>`;

export const MODULE_PLAIN_NAMES = {
  AUTH: "Đăng nhập & bảo mật",
  dashboard: "Bảng tổng quan",
  "hop-dong": "Quản lý hợp đồng",
  "ban-giao": "Bàn giao & huấn luyện",
  "bao-hanh": "Bảo hành & sửa chữa",
  "san-pham": "Quản lý sản phẩm",
  "vat-tu": "Quản lý vật tư",
  "khach-hang": "Khách hàng & chăm sóc",
  "phan-anh": "Phản ánh khách hàng",
  "bao-cao": "Báo cáo & thống kê",
  "tai-lieu": "Kho tài liệu",
  "quy-trinh": "Quy trình phê duyệt",
  "cai-dat": "Cài đặt hệ thống",
  "thong-bao": "Thông báo",
};

export function plainModuleTitle(mod) {
  return MODULE_PLAIN_NAMES[mod.moduleKey] || mod.title.replace(/\s*\(.*\)/, "").trim();
}

export function plainActor(actor) {
  const map = {
    Admin: "Quản trị viên",
    "Quản trị viên": "Quản trị viên",
    "Theo quyền": "Tùy vai trò được cấp",
    "Mọi user": "Mọi người dùng",
    "Mọi người dùng": "Mọi người dùng",
    "Hệ thống": "Hệ thống (tự động)",
    Manager: "Quản lý",
    "Quản lý (manager)": "Quản lý",
    Sales: "Nhân viên kinh doanh",
    Technician: "Kỹ thuật viên",
    Viewer: "Người xem",
  };
  return map[actor] || actor;
}

export function plainUcExplain(name, desc) {
  const n = name.toLowerCase();
  if (desc && !desc.match(/POST|GET|PUT|PATCH|\/api|read|create|update|delete|CRUD|module|submodule/i)) {
    return desc.replace(/`/g, "");
  }
  if (n.includes("xem danh sách")) return "Mở màn hình danh sách, tìm kiếm và lọc theo nhu cầu.";
  if (n.includes("xem chi tiết") || n.includes("xem tổng quan")) return "Mở một hồ sơ cụ thể để xem đầy đủ thông tin.";
  if (n.includes("tạo")) return "Thêm hồ sơ mới vào hệ thống.";
  if (n.includes("sửa") || n.includes("cập nhật") || n.includes("điền")) return "Chỉnh sửa thông tin đã lưu.";
  if (n.includes("xóa")) return "Xóa hồ sơ khỏi danh sách (vẫn lưu lịch sử phía hệ thống).";
  if (n.includes("quy trình") || n.includes("xử lý quy trình")) return "Thực hiện bước phê duyệt: trình, duyệt hoặc từ chối.";
  if (n.includes("upload") || n.includes("đính kèm")) return "Tải file (biên bản, ảnh…) gắn vào hồ sơ.";
  if (n.includes("đăng nhập")) return "Vào hệ thống bằng email và mật khẩu.";
  if (n.includes("đăng xuất")) return "Thoát tài khoản an toàn.";
  if (n.includes("báo cáo") || n.includes("thống kê")) return "Xem số liệu tổng hợp, có thể xuất file hoặc in.";
  if (n.includes("phân công")) return "Chỉ định người hoặc đơn vị phụ trách xử lý.";
  if (n.includes("thông báo")) return "Nhận nhắc việc, cảnh báo hết hạn trên hệ thống.";
  if (n.includes("cấu hình") || n.includes("quản lý người")) return "Thiết lập tài khoản, quyền hoặc danh mục dùng chung.";
  return "Thực hiện thao tác «" + name + "» trên phần mềm.";
}

export const BUSINESS_FLOWS_PLAIN = [
  {
    title: "Đăng nhập và sử dụng an toàn",
    moduleKeys: ["AUTH"],
    purpose:
      "Mỗi cán bộ đăng nhập bằng tài khoản riêng. Hệ thống chỉ cho phép xem và thao tác đúng phần việc được giao — tránh nhầm lẫn và lộ thông tin.",
    functions: [
      "Đăng nhập bằng email và mật khẩu",
      "Đăng xuất khi không dùng nữa",
      "Quản trị viên tạo tài khoản cho đồng nghiệp mới",
      "Xem và quản lý các thiết bị đang đăng nhập",
    ],
    mermaid: `sequenceDiagram
    actor NV as Cán bộ
    participant HT as Hệ thống ASMS
    NV->>HT: Nhập email và mật khẩu
    HT->>HT: Kiểm tra tài khoản
    HT-->>NV: Vào màn hình làm việc
    NV->>HT: Thao tác theo quyền được cấp`,
    steps: [
      ["Cán bộ", "Mở trang đăng nhập, nhập email và mật khẩu"],
      ["Hệ thống", "Xác nhận đúng tài khoản, mở màn hình chính"],
      ["Cán bộ", "Làm việc trên các màn hình được phép"],
      ["Cán bộ", "Đăng xuất khi kết thúc phiên làm việc"],
    ],
  },
  {
    title: "Quản lý hợp đồng",
    moduleKey: "hop-dong",
    purpose:
      "Lưu trữ toàn bộ thông tin hợp đồng với khách hàng: sản phẩm, giá trị, thời hạn, điều khoản và tiến độ. Một hợp đồng là điểm xuất phát cho bàn giao, bảo hành và chăm sóc sau này.",
    functions: [
      "Tạo và cập nhật hợp đồng",
      "Chọn khách hàng và danh sách sản phẩm",
      "Soạn điều khoản từ mẫu có sẵn",
      "Trình lãnh đạo duyệt qua các bước",
      "Đính kèm file hợp đồng, biên bản",
    ],
    mermaid: `sequenceDiagram
    actor KD as Kinh doanh
    actor QL as Quản lý
    participant HT as Hệ thống
    KD->>HT: Tạo hợp đồng mới
    KD->>HT: Chọn khách hàng và sản phẩm
    KD->>HT: Trình duyệt
    QL->>HT: Phê duyệt hoặc yêu cầu sửa
    HT-->>KD: Hợp đồng có hiệu lực, sẵn sàng bàn giao`,
    steps: [
      ["Nhân viên kinh doanh", "Tạo hợp đồng, điền thông tin khách hàng và giá trị"],
      ["Nhân viên kinh doanh", "Chọn sản phẩm và điều khoản áp dụng"],
      ["Quản lý", "Xem và phê duyệt từng bước"],
      ["Hệ thống", "Lưu trạng thái, thông báo các bên liên quan"],
    ],
  },
  {
    title: "Bàn giao thiết bị và huấn luyện",
    moduleKey: "ban-giao",
    purpose:
      "Theo dõi từng đợt bàn giao thiết bị cho khách hàng và tổ chức huấn luyện sử dụng. Quy trình gồm: lập kế hoạch → xin kinh phí → chuẩn bị hàng → bàn giao → tập huấn.",
    functions: [
      "Mở phiếu bàn giao theo hợp đồng",
      "Theo dõi từng bước trên màn hình",
      "Trình và duyệt kế hoạch, tờ trình",
      "Ghi nhận biên bản bàn giao",
      "Quản lý khóa huấn luyện cho khách hàng",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật viên
    actor QL as Quản lý
    participant HT as Hệ thống
    KT->>HT: Tạo phiếu bàn giao
    KT->>HT: Hoàn thành từng bước quy trình
    QL->>HT: Ký duyệt
    KT->>HT: Tổ chức huấn luyện
    HT-->>KT: Hoàn tất bàn giao`,
    steps: [
      ["Kỹ thuật viên", "Tạo phiếu bàn giao gắn với hợp đồng"],
      ["Kỹ thuật viên", "Thực hiện lần lượt: kế hoạch, kinh phí, chuẩn bị, bàn giao"],
      ["Quản lý", "Duyệt các bước cần phê duyệt"],
      ["Kỹ thuật viên", "Mở khóa huấn luyện và ghi kết quả"],
    ],
  },
  {
    title: "Bảo hành và sửa chữa",
    moduleKey: "bao-hanh",
    purpose:
      "Tiếp nhận yêu cầu bảo hành hoặc sửa chữa, phân loại mức độ, giao việc cho kỹ thuật viên và theo dõi đến khi khách hàng nghiệm thu xong.",
    functions: [
      "Tạo phiếu tiếp nhận sự cố",
      "Phân loại trong/ngoài bảo hành",
      "Lập kế hoạch sửa chữa và vật tư cần dùng",
      "Ghi nhận kết quả và đóng phiếu",
    ],
    mermaid: `sequenceDiagram
    actor KH as Khách hàng
    actor KT as Kỹ thuật viên
    participant HT as Hệ thống
    KH->>KT: Báo sự cố
    KT->>HT: Tạo phiếu bảo hành
    KT->>HT: Xử lý và cập nhật tiến độ
    KT->>HT: Nghiệm thu và đóng phiếu`,
    steps: [
      ["Kỹ thuật viên", "Ghi nhận yêu cầu, thiết bị và mô tả sự cố"],
      ["Hệ thống", "Ghi thời hạn xử lý cần hoàn thành"],
      ["Kỹ thuật viên", "Sửa chữa, thay linh kiện nếu cần"],
      ["Kỹ thuật viên", "Xác nhận đã xử lý xong và đóng phiếu"],
    ],
  },
  {
    title: "Tiếp nhận và xử lý phản ánh",
    moduleKey: "phan-anh",
    purpose:
      "Ghi nhận ý kiến, khiếu nại của khách hàng; phân công đúng đơn vị xử lý; theo dõi tiến độ đến khi đóng hồ sơ.",
    functions: [
      "Tạo phản ánh mới",
      "Hệ thống gợi ý đơn vị xử lý phù hợp",
      "Quản lý phân công người phụ trách",
      "Trao đổi, cập nhật tiến độ trên hồ sơ",
      "Đóng phản ánh khi đã xử lý xong",
    ],
    mermaid: `sequenceDiagram
    actor NV as Nhân viên
    actor QL as Quản lý
    participant HT as Hệ thống
    NV->>HT: Tạo phản ánh
    HT->>HT: Gợi ý đơn vị xử lý
    QL->>HT: Phân công người phụ trách
    NV->>HT: Cập nhật xử lý
    QL->>HT: Đóng phản ánh`,
    steps: [
      ["Nhân viên", "Tạo phản ánh, mô tả vấn đề và khách hàng liên quan"],
      ["Hệ thống", "Gợi ý đơn vị nên xử lý theo quy tắc đã thiết lập"],
      ["Quản lý", "Chỉ định người hoặc nhóm phụ trách"],
      ["Người được giao", "Cập nhật tiến độ và trao đổi trên hồ sơ"],
      ["Quản lý", "Xác nhận xử lý xong và đóng phản ánh"],
    ],
  },
  {
    title: "Chăm sóc khách hàng",
    moduleKey: "khach-hang",
    purpose:
      "Lưu hồ sơ khách hàng, người liên hệ, lịch sử chăm sóc và các dịp quan trọng (kỷ niệm, sinh nhật…) để chủ động duy trì quan hệ.",
    functions: [
      "Quản lý thông tin khách hàng",
      "Lưu danh sách người liên hệ",
      "Ghi nhận các lần gặp gỡ, gọi điện, email",
      "Nhắc lịch các dịp cần chúc mừng",
    ],
    mermaid: `sequenceDiagram
    actor KD as Kinh doanh
    participant HT as Hệ thống
    KD->>HT: Cập nhật hồ sơ khách hàng
    KD->>HT: Ghi hoạt động chăm sóc
    HT-->>KD: Nhắc lịch kỷ niệm`,
    steps: [
      ["Nhân viên kinh doanh", "Tạo hoặc cập nhật thông tin khách hàng"],
      ["Nhân viên kinh doanh", "Thêm người liên hệ và vai trò"],
      ["Nhân viên kinh doanh", "Ghi lại các hoạt động chăm sóc"],
      ["Hệ thống", "Nhắc nhở khi đến ngày kỷ niệm quan trọng"],
    ],
  },
  {
    title: "Quản lý sản phẩm",
    moduleKey: "san-pham",
    purpose:
      "Danh mục sản phẩm/trang bị: thông tin kỹ thuật, linh kiện đi kèm, giai đoạn sản xuất — nghiệm thu — đưa vào sử dụng.",
    functions: [
      "Thêm và cập nhật thông tin sản phẩm",
      "Quản lý linh kiện, thông số kỹ thuật",
      "Theo dõi giai đoạn vòng đời sản phẩm",
      "Gắn tài liệu kỹ thuật",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật viên
    participant HT as Hệ thống
    KT->>HT: Cập nhật danh mục sản phẩm
    KT->>HT: Quản lý linh kiện và tài liệu
    HT-->>KT: Liên kết với hợp đồng và bảo hành`,
    steps: [
      ["Kỹ thuật viên", "Nhập thông tin sản phẩm: mã, tên, phân loại"],
      ["Kỹ thuật viên", "Cập nhật linh kiện và thông số"],
      ["Kỹ thuật viên", "Theo dõi trạng thái: sản xuất, nghiệm thu, trang bị"],
    ],
  },
  {
    title: "Quản lý vật tư và kho",
    moduleKey: "vat-tu",
    purpose:
      "Biết rõ vật tư đang có, nhập kho, xuất dùng cho sửa chữa hoặc điều chuyển giữa các đơn vị.",
    functions: [
      "Nhập vật tư mới vào kho",
      "Xem tồn kho hiện tại",
      "Lập phiếu điều chuyển giữa các nơi",
      "Liên kết vật tư với phiếu sửa chữa",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật viên
    participant HT as Hệ thống
    KT->>HT: Nhập vật tư
    KT->>HT: Lập phiếu điều chuyển
    HT-->>KT: Cập nhật số lượng tồn`,
    steps: [
      ["Kỹ thuật viên", "Ghi nhận vật tư nhập kho"],
      ["Kỹ thuật viên", "Theo dõi số lượng còn lại"],
      ["Kỹ thuật viên", "Tạo phiếu chuyển vật tư khi cần"],
    ],
  },
  {
    title: "Kho tài liệu",
    moduleKey: "tai-lieu",
    purpose:
      "Lưu trữ tập trung file hợp đồng, tài liệu kỹ thuật, biên bản… và gắn đúng hồ sơ để tra cứu nhanh.",
    functions: [
      "Tải file lên hệ thống",
      "Phân loại: hợp đồng, kỹ thuật, đào tạo, báo cáo…",
      "Gắn tài liệu vào hợp đồng hoặc sản phẩm",
      "Tìm kiếm và tải về khi cần",
    ],
    mermaid: `sequenceDiagram
    actor NV as Nhân viên
    participant HT as Hệ thống
    NV->>HT: Tải file lên
    NV->>HT: Chọn loại và gắn hồ sơ
    HT-->>NV: Lưu và hiển thị trong thư viện`,
    steps: [
      ["Nhân viên", "Chọn file cần lưu trên máy tính"],
      ["Nhân viên", "Chọn loại tài liệu và hồ sơ liên quan"],
      ["Hệ thống", "Lưu file, cho phép tìm và tải lại sau"],
    ],
  },
  {
    title: "Thiết lập quy trình phê duyệt",
    moduleKey: "quy-trinh",
    purpose:
      "Quản trị viên cấu hình các bước phê duyệt cho bàn giao, bảo hành, sản phẩm… để mỗi hồ sơ đi đúng quy trình nội bộ.",
    functions: [
      "Xem danh sách quy trình theo loại hồ sơ",
      "Thêm hoặc sửa các bước duyệt",
      "Quy định ai được duyệt ở từng bước",
      "Theo dõi hồ sơ đang ở bước nào",
    ],
    mermaid: `sequenceDiagram
    actor QT as Quản trị viên
    actor NV as Người xử lý
    participant HT as Hệ thống
    QT->>HT: Thiết lập quy trình
    NV->>HT: Thực hiện bước hiện tại
    HT-->>NV: Chuyển sang bước tiếp theo`,
    steps: [
      ["Quản trị viên", "Tạo quy trình và các bước cần thực hiện"],
      ["Người xử lý", "Mở hồ sơ và hoàn thành bước được giao"],
      ["Hệ thống", "Chuyển bước và báo cho người duyệt tiếp theo"],
    ],
  },
  {
    title: "Bảng tổng quan và báo cáo",
    moduleKeys: ["dashboard", "bao-cao"],
    purpose:
      "Giúp lãnh đạo nắm nhanh tình hình: hợp đồng, bàn giao, bảo hành, phản ánh… và xuất báo cáo theo kỳ.",
    functions: [
      "Xem bảng tổng quan các chỉ số chính",
      "Lọc theo thời gian, khách hàng",
      "Xem báo cáo chi tiết từng mảng",
      "Xuất file Excel hoặc in báo cáo",
    ],
    mermaid: `sequenceDiagram
    actor QL as Quản lý
    participant HT as Hệ thống
    QL->>HT: Mở bảng tổng quan
    HT-->>QL: Hiển thị số liệu và cảnh báo
    QL->>HT: Xuất báo cáo theo kỳ`,
    steps: [
      ["Quản lý", "Mở màn hình tổng quan khi vào hệ thống"],
      ["Quản lý", "Chọn khoảng thời gian hoặc khách hàng cần xem"],
      ["Quản lý", "Vào mục báo cáo và xuất file nếu cần"],
    ],
  },
  {
    title: "Cài đặt và thông báo",
    moduleKeys: ["cai-dat", "thong-bao"],
    purpose:
      "Quản trị viên quản lý tài khoản, phân quyền; mọi người nhận thông báo nhắc việc, hết hạn hợp đồng, quá hạn xử lý…",
    functions: [
      "Thêm, sửa tài khoản người dùng",
      "Phân quyền xem/sửa từng phần hệ thống",
      "Thiết lập quy tắc phân phản ánh",
      "Nhận và xem thông báo trên hệ thống",
    ],
    mermaid: `sequenceDiagram
    actor QT as Quản trị viên
    actor NV as Nhân viên
    participant HT as Hệ thống
    QT->>HT: Cấu hình tài khoản và quyền
    HT->>HT: Tự động gửi nhắc việc
    HT-->>NV: Hiển thị thông báo`,
    steps: [
      ["Quản trị viên", "Tạo tài khoản và gán vai trò cho từng người"],
      ["Quản trị viên", "Thiết lập ai được làm gì trên từng màn hình"],
      ["Hệ thống", "Gửi thông báo khi có việc cần xử lý hoặc sắp hết hạn"],
      ["Nhân viên", "Mở mục thông báo và làm theo hướng dẫn"],
    ],
  },
];
