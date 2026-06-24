/**
 * Sinh BRD ASMS theo bố cục TASMOS:
 * Giới thiệu → Kiến trúc → Tính năng đặc biệt → E2E → Luồng chi tiết → Trạng thái → Phụ lục UC
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  architectureHtmlPlain,
  BUSINESS_FLOWS_PLAIN,
  plainModuleTitle,
  plainActor,
  plainUcExplain,
} from "./brd-plain-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ucMd = fs.readFileSync(path.resolve(__dirname, "../docs/file docs/use-case-asms.md"), "utf8");

const HIDDEN_MODULE_KEYS = new Set(["de-tai", "cong-viec", "dao-tao"]);

function isModuleHidden(mod) {
  return mod.note?.includes("ẩn") || HIDDEN_MODULE_KEYS.has(mod.moduleKey);
}

function parseUcFile(md) {
  const sectionRe = /^## (\d+)\.\s+(.+?)(?:\s+`([^`]+)`)?(?:\s+—\s+(.+))?$/gm;
  const sections = [];
  let match;
  while ((match = sectionRe.exec(md)) !== null) {
    let title = match[2].trim();
    let moduleKey = match[3];
    const keyInTitle = title.match(/\(`([^`]+)`\)/);
    if (keyInTitle) {
      moduleKey = keyInTitle[1];
      title = title.replace(/\s*\(`[^`]+`\)/, "").trim();
    }
    sections.push({ index: match.index, num: match[1], title, moduleKey, note: match[4] });
  }
  const modules = [];
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].index;
    const end = i + 1 < sections.length ? sections[i + 1].index : md.length;
    const block = md.slice(start, end);
    const titleLine = block.split("\n")[0];
    if (titleLine.includes("Tổng hợp") || titleLine.includes("Luồng nghiệp vụ") || titleLine.includes("Tài liệu liên quan") || titleLine.includes("Quy ước")) continue;
    const routeMatch = block.match(/\*\*Route UI:\*\*\s+(.+)/);
    const apiMatch = block.match(/\*\*API:\*\*\s+(.+)/);
    const submoduleMatch = block.match(/\*\*Submodule:\*\*\s+(.+)/);
    const ucs = [];
    for (const row of block.match(/^\| UC-[^\n]+\|/gm) || []) {
      if (row.includes("Mã UC") || row.includes("---")) continue;
      const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length < 3 || !cols[0].startsWith("UC-")) continue;
      const [code, name, ...rest] = cols;
      let actor = rest[0] || "Theo quyền";
      let desc = rest[1] || "";
      let perm = "";
      if (["read", "create", "update", "delete", "CRUD"].includes(actor)) {
        perm = actor;
        actor = "Theo quyền";
        desc = rest[0] || "";
      }
      ucs.push({ code, name, actor, desc, perm });
    }
    if (ucs.length === 0) continue;
    modules.push({
      num: sections[i].num,
      title: sections[i].title,
      moduleKey: sections[i].moduleKey,
      note: sections[i].note,
      route: routeMatch?.[1]?.trim(),
      api: apiMatch?.[1]?.trim(),
      submodule: submoduleMatch?.[1]?.trim(),
      ucs,
    });
  }
  return modules;
}

const modules = parseUcFile(ucMd);
const activeModules = modules.filter((m) => !isModuleHidden(m));
const activeUc = activeModules.reduce((s, m) => s + m.ucs.length, 0);

const architectureHtml = `
<figure class="arch-figure">
<div class="arch-diagram">
  <div class="arch-title">ASMS — After-Sales Management System (5 tầng)</div>
  <div class="arch-layer l1">
    <div class="arch-layer-hd">TẦNG 1 — NGƯỜI DÙNG &amp; KÊNH TRUY CẬP</div>
    <div class="arch-row">
      <div class="arch-box"><strong>Web Quản trị</strong><br>Admin · Manager · Sales<br><em>React + Vite — Dashboard, Cài đặt</em></div>
      <div class="arch-box"><strong>Web Vận hành</strong><br>Technician · Viewer<br><em>HĐ · BG · BH · VT · SP · PA</em></div>
      <div class="arch-box"><strong>Đăng nhập &amp; API</strong><br>/login · Bearer JWT<br><em>/api/v1/auth · refresh token</em></div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l2">
    <div class="arch-layer-hd">TẦNG 2 — CỔNG GIAO TIẾP &amp; BẢO MẬT</div>
    <div class="arch-row two">
      <div class="arch-box"><strong>Express API Gateway</strong><br>/api/v1 · CORS · rate limit<br>Envelope { success, data }</div>
      <div class="arch-box"><strong>JWT Guard &amp; RBAC</strong><br>5 roles · module permissions<br>read / create / update / delete</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l3">
    <div class="arch-layer-hd">TẦNG 3 — HỆ THỐNG LÕI (Express + TypeScript)</div>
    <div class="arch-grid">
      <div class="arch-box"><strong>Hợp đồng &amp; Điều khoản</strong><br>contracts · contract-clauses<br>Workflow HĐ · gán SP</div>
      <div class="arch-box"><strong>Bàn giao &amp; Huấn luyện</strong><br>handovers · training coaching<br>WF handover / coaching</div>
      <div class="arch-box"><strong>Bảo hành / Sửa chữa</strong><br>warranties · SLA<br>WF warranty · BOM vật tư</div>
      <div class="arch-box"><strong>Sản phẩm &amp; Vật tư</strong><br>products · materials<br>BOM · điều chuyển kho</div>
      <div class="arch-box"><strong>CRM &amp; Phản ánh</strong><br>customers · feedbacks<br>routing · multi-assignee</div>
      <div class="arch-box"><strong>Workflow &amp; Cài đặt</strong><br>workflows · definitions<br>users · roles · audit</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l4">
    <div class="arch-layer-hd">TẦNG 4 — LƯU TRỮ DỮ LIỆU &amp; FILE</div>
    <div class="arch-row">
      <div class="arch-box"><strong>PostgreSQL</strong><br>Prisma ORM · soft delete<br>audit logs · notifications</div>
      <div class="arch-box"><strong>File Uploads</strong><br>uploads/ · multipart<br>documents · workflow files</div>
      <div class="arch-box"><strong>Job &amp; Thông báo</strong><br>notify jobs · SLA scan<br>in-app notifications</div>
    </div>
  </div>
  <div class="arch-arrow">▼</div>
  <div class="arch-layer l5">
    <div class="arch-layer-hd">TẦNG 5 — NỀN TẢNG CÔNG NGHỆ</div>
    <div class="arch-tech">
      <span>React + Vite</span><span>Express + TS</span><span>Prisma</span><span>PostgreSQL</span><span>Zod</span><span>Docker</span>
    </div>
  </div>
</div>
<figcaption>Hình 1. Kiến trúc tổng thể hệ thống ASMS — 5 tầng logic</figcaption>
</figure>`;

/** Luồng nghiệp vụ chi tiết — mỗi luồng gắn moduleKey để lấy bảng UC */
const BUSINESS_FLOWS = [
  {
    title: "Xác thực và quản lý phiên làm việc",
    moduleKeys: ["AUTH"],
    purpose:
      "Cho phép người dùng đăng nhập an toàn bằng JWT, quản lý phiên đa thiết bị và thu hồi quyền truy cập khi cần. Mọi API nghiệp vụ (trừ login/register) yêu cầu token hợp lệ.",
    functions: [
      "Đăng nhập email/mật khẩu → access + refresh token",
      "Làm mới phiên, đăng xuất một hoặc tất cả thiết bị",
      "Xem danh sách phiên đang hoạt động",
      "Admin tạo tài khoản người dùng mới",
    ],
    mermaid: `sequenceDiagram
    actor U as Người dùng
    participant S as Hệ thống ASMS
    U->>S: Truy cập /login, nhập thông tin
    S->>S: POST /api/v1/auth/login
    S-->>U: JWT access + refresh token
    U->>S: Gọi API nghiệp vụ kèm Bearer token
    S->>S: Kiểm tra JWT và RBAC module
    S-->>U: Dữ liệu theo quyền vai trò`,
    steps: [
      ["Người dùng", "Truy cập `/login`, nhập email và mật khẩu"],
      ["Hệ thống", "Xác thực, phát hành access token và refresh token"],
      ["Người dùng", "Làm việc trên các module theo ma trận phân quyền"],
      ["Người dùng", "Đăng xuất hoặc thu hồi phiên từ Cài đặt → Phiên đăng nhập"],
    ],
  },
  {
    title: "Quản lý hợp đồng",
    moduleKey: "hop-dong",
    purpose:
      "Quản lý toàn bộ vòng đời hợp đồng: tạo mới, gán khách hàng và sản phẩm, điều khoản, tài liệu, theo dõi tiến độ và xử lý quy trình phê duyệt. Chi tiết hợp đồng cung cấp góc nhìn 360° qua các tab thông tin, điều khoản, sản phẩm, tài liệu và phản ánh.",
    functions: [
      "Tạo/sửa/xóa hợp đồng, gán danh mục sản phẩm và điều khoản mẫu",
      "Tab chi tiết: thông tin chung, điều khoản, SP, tài liệu, phản ánh liên quan",
      "Xử lý quy trình HĐ: trình ký, ký duyệt, từ chối, đính kèm tài liệu từng bước",
      "Quản lý thư viện điều khoản mẫu và nhóm điều khoản",
    ],
    mermaid: `sequenceDiagram
    actor NV as Nhân viên Sales
    actor QL as Quản lý
    participant S as Hệ thống ASMS
    NV->>S: Tạo HĐ mới, chọn KH và sản phẩm
    S->>S: Lưu HĐ, khởi tạo workflow
    NV->>S: Điền điều khoản, upload tài liệu
    NV->>S: Trình ký bước quy trình
    QL->>S: Ký duyệt hoặc từ chối
    S-->>NV: Cập nhật trạng thái HĐ và thông báo`,
    steps: [
      ["Nhân viên", "Tạo hợp đồng, chọn khách hàng, giá trị, thời hạn bảo hành"],
      ["Nhân viên", "Gán sản phẩm và chọn điều khoản mẫu"],
      ["Hệ thống", "Khởi tạo quy trình phê duyệt hợp đồng"],
      ["Quản lý", "Duyệt từng bước, đính kèm biên bản nếu cần"],
      ["Hệ thống", "Cập nhật tiến độ, liên thông bàn giao và bảo hành"],
    ],
  },
  {
    title: "Bàn giao và huấn luyện",
    moduleKey: "ban-giao",
    purpose:
      "Quản lý xuyên suốt quy trình bàn giao thiết bị và huấn luyện vận hành theo hợp đồng. Workflow chuẩn gồm: lập kế hoạch → tờ trình kinh phí → chuẩn bị hàng → tổ chức bàn giao → tổ chức huấn luyện.",
    functions: [
      "Tạo phiếu bàn giao gắn HĐ và khách hàng",
      "Xử lý quy trình bàn giao: trình ký, ký duyệt, ban hành",
      "Tab huấn luyện: tạo khóa HL, điền payload từng bước, quy trình coaching",
      "Đính kèm tài liệu và biên bản theo bước workflow",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật viên
    actor QL as Quản lý
    participant S as Hệ thống ASMS
    KT->>S: Tạo phiếu bàn giao theo HĐ
    S->>S: Chạy WF handover — bước 1 Kế hoạch
    KT->>S: Điền form và trình ký
    QL->>S: Ký duyệt từng bước
    KT->>S: Tạo khóa huấn luyện tab HL
    QL->>S: Ban hành huấn luyện
    S-->>KT: Hoàn tất bàn giao và HL`,
    steps: [
      ["Kỹ thuật", "Tạo phiếu bàn giao, chọn hợp đồng và sản phẩm"],
      ["Kỹ thuật", "Lập kế hoạch, tờ trình kinh phí qua workflow"],
      ["Quản lý", "Phê duyệt từng bước bàn giao"],
      ["Kỹ thuật", "Tổ chức bàn giao, cập nhật biên bản nghiệm thu"],
      ["Kỹ thuật", "Tạo và hoàn tất khóa huấn luyện trên tab HL"],
    ],
  },
  {
    title: "Bảo hành và sửa chữa",
    moduleKey: "bao-hanh",
    purpose:
      "Quản lý đầy đủ vòng đời phiếu bảo hành/sửa chữa: tiếp nhận → phân loại → lập kế hoạch → chuẩn đoán → sửa chữa → nghiệm thu. Form động theo schema từng bước workflow, tích hợp vật tư và SLA.",
    functions: [
      "Tạo/sửa/xóa phiếu BH/SC, gắn khách hàng và thiết bị",
      "Workflow: tiếp nhận, xử lý, nghiệm thu với form động",
      "Đính kèm tài liệu và biên bản từng bước",
      "Theo dõi SLA và trạng thái xử lý",
    ],
    mermaid: `sequenceDiagram
    actor KH as Khách hàng
    actor KT as Kỹ thuật
    participant S as Hệ thống ASMS
    KH->>KT: Yêu cầu bảo hành hoặc sửa chữa
    KT->>S: Tạo phiếu BH/SC
    S->>S: Phân loại bảo hành, gán SLA
    KT->>S: Lập kế hoạch, chuẩn đoán, sửa chữa
    KT->>S: Nghiệm thu sau sửa chữa
    S-->>KH: Đóng phiếu, cập nhật lịch sử thiết bị`,
    steps: [
      ["Kỹ thuật", "Tiếp nhận yêu cầu, tạo phiếu BH/SC"],
      ["Hệ thống", "Phân loại trong/ngoài bảo hành, gán mức ưu tiên và SLA"],
      ["Kỹ thuật", "Lập kế hoạch: kỹ thuật viên, vật tư, lịch xử lý"],
      ["Kỹ thuật", "Chuẩn đoán và thực hiện sửa chữa qua các bước WF"],
      ["Kỹ thuật", "Nghiệm thu; không đạt thì quay lại chuẩn đoán"],
    ],
  },
  {
    title: "Phản ánh khách hàng",
    moduleKey: "phan-anh",
    purpose:
      "Tiếp nhận, phân luồng và xử lý phản ánh/khiếu nại đa đơn vị. Hệ thống hỗ trợ phân công multi-assignee, routing theo sản phẩm/đơn vị, timeline bình luận và quy trình đóng/mở lại.",
    functions: [
      "Tạo phản ánh, phân công người/vai trò xử lý",
      "Phân luồng tự động theo SP và đơn vị (routing rules)",
      "Cập nhật xử lý từng đơn vị, bình luận issue/fix/note",
      "Yêu cầu đóng, đóng PA, hoàn tất sửa chữa và mở lại",
      "Thống kê theo KH/SP/VT; Admin xem tất cả, vai trò khác chỉ PA được giao",
    ],
    mermaid: `sequenceDiagram
    actor NV as Nhân viên
    actor QL as Quản lý
    participant S as Hệ thống ASMS
    NV->>S: Tạo phản ánh mới /phan-anh/moi
    S->>S: Routing preview theo SP và đơn vị
    QL->>S: Phân công multi-assignee
    NV->>S: Cập nhật xử lý và bình luận
    NV->>S: Yêu cầu đóng
    QL->>S: Đóng phản ánh hoặc mở lại`,
    steps: [
      ["Nhân viên", "Tạo phản ánh, mô tả sự cố và liên kết KH/SP"],
      ["Hệ thống", "Áp dụng quy tắc routing, gợi ý đơn vị xử lý"],
      ["Quản lý", "Phân công người hoặc vai trò xử lý"],
      ["Kỹ thuật", "Cập nhật tiến độ, bình luận theo từng đơn vị"],
      ["Quản lý", "Đóng PA sau khi xử lý xong hoặc mở lại nếu cần"],
    ],
  },
  {
    title: "CRM và chăm sóc khách hàng",
    moduleKey: "khach-hang",
    purpose:
      "Quản lý hồ sơ khách hàng tập trung: thông tin tổ chức, đầu mối liên lạc, hoạt động chăm sóc và lịch kỷ niệm (ngày truyền thống, sinh nhật lãnh đạo, huân huy chương).",
    functions: [
      "CRUD khách hàng và liên hệ",
      "Ghi nhận hoạt động CRM (gọi điện, gặp mặt, email…)",
      "Quản lý kỷ niệm và đăng ký nhận thông báo nhắc lịch",
      "Liên kết HĐ, phản ánh và lịch sử tương tác",
    ],
    mermaid: `sequenceDiagram
    actor Sales as Nhân viên Sales
    participant S as Hệ thống ASMS
    Sales->>S: Tạo hoặc cập nhật hồ sơ KH
    Sales->>S: Thêm đầu mối liên lạc
    Sales->>S: Ghi hoạt động chăm sóc CRM
    Sales->>S: Thiết lập kỷ niệm và nhắc lịch
    S-->>Sales: Dashboard CRM và báo cáo theo KH`,
    steps: [
      ["Sales", "Tạo hồ sơ khách hàng với thông tin tổ chức"],
      ["Sales", "Quản lý danh sách liên hệ và vai trò"],
      ["Sales", "Ghi nhận hoạt động chăm sóc theo thời gian"],
      ["Hệ thống", "Nhắc lịch kỷ niệm qua thông báo"],
      ["Sales", "Tra cứu HĐ và phản ánh liên quan từ hồ sơ KH"],
    ],
  },
  {
    title: "Quản lý sản phẩm vòng đời",
    moduleKey: "san-pham",
    purpose:
      "Quản lý danh mục sản phẩm quốc phòng theo vòng đời: sản xuất → nghiệm thu cấp Bộ → đưa vào trang bị. Hỗ trợ BOM, thông số kỹ thuật, serial linh kiện, tài liệu và quy trình sản phẩm.",
    functions: [
      "CRUD sản phẩm, theo dõi giai đoạn vòng đời",
      "Quản lý BOM, linh kiện, serial và thông số kỹ thuật",
      "Gắn tài liệu kỹ thuật, xem lịch sử thay đổi",
      "Xử lý quy trình sản phẩm (workflow product)",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật
    actor QL as Quản lý
    participant S as Hệ thống ASMS
    KT->>S: Tạo sản phẩm mới, phân loại
    KT->>S: Cập nhật BOM và thông số kỹ thuật
    KT->>S: Cập nhật giai đoạn vòng đời
    QL->>S: Duyệt quy trình sản phẩm
    S-->>KT: Liên kết HĐ, BH và báo cáo SP`,
    steps: [
      ["Kỹ thuật", "Tạo danh mục sản phẩm với mã, phân loại, NSX"],
      ["Kỹ thuật", "Quản lý BOM, linh kiện và serial"],
      ["Kỹ thuật", "Cập nhật trạng thái giai đoạn sản xuất/nghiệm thu"],
      ["Quản lý", "Phê duyệt quy trình sản phẩm nếu có"],
      ["Hệ thống", "Liên kết với hợp đồng, bảo hành và báo cáo"],
    ],
  },
  {
    title: "Vật tư và điều chuyển",
    moduleKey: "vat-tu",
    purpose:
      "Quản lý nhập kho, tồn và điều chuyển vật tư phục vụ bàn giao và sửa chữa. Phân biệt vật tư tiêu hao và vật tư định danh (serial), truy vết nguồn-đích.",
    functions: [
      "Nhập/sửa/xóa vật tư trong kho",
      "Quản lý vật tư tiêu hao và vật tư định danh (serial)",
      "Tạo phiếu điều chuyển: nguồn, đích, số lượng, trạng thái",
      "Báo cáo lỗi vật tư liên kết module Báo cáo",
    ],
    mermaid: `sequenceDiagram
    actor KT as Kỹ thuật
    participant S as Hệ thống ASMS
    KT->>S: Nhập vật tư mới vào kho
    KT->>S: Tạo phiếu điều chuyển
    S->>S: Cập nhật tồn nguồn và đích
    KT->>S: Xuất vật tư cho phiếu BH/SC
    S-->>KT: Cân đối tồn và lịch sử điều chuyển`,
    steps: [
      ["Kỹ thuật", "Nhập vật tư: tên, loại, serial nếu định danh"],
      ["Kỹ thuật", "Theo dõi tồn kho theo kho/vị trí"],
      ["Kỹ thuật", "Tạo phiếu điều chuyển giữa các đơn vị"],
      ["Hệ thống", "Trừ/cộng tồn khi duyệt điều chuyển"],
      ["Kỹ thuật", "Liên kết vật tư với phiếu bảo hành khi sửa chữa"],
    ],
  },
  {
    title: "Quản lý tài liệu",
    moduleKey: "tai-lieu",
    purpose:
      "Lưu trữ và truy xuất tài liệu vận hành hậu mãi theo nhóm (hợp đồng, kỹ thuật, đào tạo, báo cáo) và gắn với thực thể nghiệp vụ.",
    functions: [
      "Upload file và quản lý metadata tài liệu",
      "Lọc theo loại: HĐ, kỹ thuật, chính sách, đào tạo, báo cáo",
      "Liên kết HĐ, SP, khóa HL, ticket",
      "Xem chi tiết, tải xuống, soft delete",
    ],
    mermaid: `sequenceDiagram
    actor NV as Nhân viên
    participant S as Hệ thống ASMS
    NV->>S: Upload file qua POST /documents/upload
    NV->>S: Gắn loại và liên kết HĐ/SP
    S->>S: Lưu metadata và đường dẫn file
    NV->>S: Tìm kiếm và lọc thư viện tài liệu
    S-->>NV: Preview và tải file`,
    steps: [
      ["Nhân viên", "Chọn tệp và loại tài liệu"],
      ["Hệ thống", "Upload multipart, lưu metadata"],
      ["Nhân viên", "Liên kết với hợp đồng, sản phẩm hoặc khóa HL"],
      ["Nhân viên", "Lọc và tìm kiếm trong thư viện"],
      ["Nhân viên", "Tải xuống hoặc xóa mềm tài liệu"],
    ],
  },
  {
    title: "Quy trình và phê duyệt",
    moduleKey: "quy-trinh",
    purpose:
      "Cấu hình và vận hành engine quy trình động cho bàn giao, huấn luyện, bảo hành, sản phẩm. Mỗi bước có schema form, vai trò xử lý và tài liệu đính kèm.",
    functions: [
      "Xem tổng quan nhóm QT theo module (handover, coaching, warranty, product, training)",
      "Tạo/sửa/xóa định nghĩa quy trình và các bước",
      "Cấu hình field schema động cho từng bước",
      "Theo dõi instance đang chạy trên từng bản ghi nghiệp vụ",
    ],
    mermaid: `sequenceDiagram
    actor Admin as Quản trị viên
    actor NV as Người xử lý
    participant S as Hệ thống ASMS
    Admin->>S: Cấu hình WF mới và các bước
    Admin->>S: Định nghĩa field schema từng bước
    NV->>S: Mở bản ghi có WF đang chạy
    NV->>S: Điền form, đính kèm, trình ký
    S-->>NV: Chuyển bước và gửi thông báo`,
    steps: [
      ["Admin", "Tạo quy trình thuộc module (handover, warranty…)"],
      ["Admin", "Cấu hình bước, vai trò và schema form"],
      ["Người xử lý", "Mở phiếu HĐ/BG/BH có workflow"],
      ["Người xử lý", "Điền payload, upload tài liệu bước"],
      ["Hệ thống", "Ghi audit, chuyển bước, thông báo người tiếp theo"],
    ],
  },
  {
    title: "Bảng điều khiển và báo cáo",
    moduleKeys: ["dashboard", "bao-cao"],
    purpose:
      "Cung cấp bức tranh điều hành KPI thời gian thực trên Dashboard và báo cáo chuyên sâu theo khách hàng, hợp đồng, sản phẩm, phản ánh, đơn vị và PAKD.",
    functions: [
      "Dashboard: tab Overview, KH, doanh thu, dự án, SP, BH, vật tư, cảnh báo",
      "Lọc theo năm/quý/khách hàng; luân chuyển tab và fullscreen",
      "Báo cáo: theo KH, HĐ, dòng SP, PA, đơn vị, lỗi vật tư",
      "Xuất Excel và in báo cáo",
    ],
    mermaid: `sequenceDiagram
    actor QL as Quản lý
    participant S as Hệ thống ASMS
    QL->>S: Truy cập Dashboard /
    S-->>QL: KPI HĐ, BG, BH, PA, PAKD
    QL->>S: Lọc năm/quý/khách hàng
    QL->>S: Mở /bao-cao, chọn loại báo cáo
    S-->>QL: Biểu bảng, xuất Excel hoặc in`,
    steps: [
      ["Quản lý", "Mở Dashboard, xem KPI tổng hợp"],
      ["Quản lý", "Chuyển tab theo góc nhìn (KH, SP, BH…)"],
      ["Quản lý", "Xem tab Alerts — cảnh báo quá hạn SLA"],
      ["Quản lý", "Vào Báo cáo, chọn loại và khoảng thời gian"],
      ["Hệ thống", "Tổng hợp API reports, xuất Excel/in"],
    ],
  },
  {
    title: "Cài đặt, phân quyền và thông báo",
    moduleKeys: ["cai-dat", "thong-bao"],
    purpose:
      "Quản trị dữ liệu nền, người dùng, ma trận phân quyền RBAC 5 vai trò, cấu hình thông báo và nhận cảnh báo SLA/hết hạn trong hệ thống.",
    functions: [
      "Quản lý người dùng, vai trò admin/manager/technician/viewer/sales",
      "Ma trận phân quyền theo module (read/create/update/delete)",
      "Cấu hình đơn vị PA, routing rules, phiên đăng nhập",
      "Thông báo in-app: SLA, PA, HĐ hết hạn; badge menu",
    ],
    mermaid: `sequenceDiagram
    actor Admin as Quản trị viên
    actor NV as Nhân viên
    participant S as Hệ thống ASMS
    Admin->>S: Cấu hình user và phân quyền module
    Admin->>S: Thiết lập routing PA và đơn vị
    S->>S: Job quét SLA và hết hạn HĐ
    S-->>NV: Tạo thông báo và badge menu
    NV->>S: Xem /thong-bao, điều hướng bản ghi`,
    steps: [
      ["Admin", "Tạo user, gán vai trò RBAC"],
      ["Admin", "Cấu hình ma trận quyền từng module"],
      ["Admin", "Thiết lập quy tắc routing phản ánh"],
      ["Hệ thống", "Job tạo thông báo SLA và hết hạn"],
      ["Nhân viên", "Nhận badge, xem và xử lý từ /thong-bao"],
    ],
  },
];

function modByKey(key) {
  return activeModules.find((m) => m.moduleKey === key);
}

function ucsForFlow(flow) {
  if (flow.moduleKey) {
    const m = modByKey(flow.moduleKey);
    return m ? { mod: m, ucs: m.ucs } : null;
  }
  if (flow.moduleKeys?.length) {
    const mods = flow.moduleKeys
      .map((k) => activeModules.find((m) => m.moduleKey === k) || modules.find((m) => m.moduleKey === k))
      .filter(Boolean);
    if (!mods.length) return null;
    return { mod: mods[0], mods, ucs: mods.flatMap((m) => m.ucs) };
  }
  return null;
}

function renderFlow(idx, flow) {
  const ucData = ucsForFlow(flow);
  const stepsTable = flow.steps.map(([who, what], i) => `| ${i + 1} | ${who} | ${what} |`).join("\n");
  const funcList = flow.functions.map((f) => `- ${f}`).join("\n");

  let ucSection = "";
  if (ucData?.ucs?.length) {
    if (ucData.mods?.length > 1) {
      ucSection = `\n**Danh sách chức năng (Use Case):**\n\n`;
      for (const m of ucData.mods) {
        ucSection += `*${m.title}* (${m.ucs.length} UC):\n\n| Mã UC | Chức năng | Tác nhân | Mô tả |\n|---|---|---|---|\n`;
        ucSection += m.ucs.map((uc) => `| \`${uc.code}\` | ${uc.name} | ${uc.actor} | ${uc.desc || "—"} |`).join("\n");
        ucSection += "\n\n";
      }
    } else {
      const m = ucData.mod;
      ucSection = `\n**Danh sách chức năng (Use Case) — ${m.title} (${ucData.ucs.length} UC):**\n\n`;
      ucSection += `| Mã UC | Chức năng | Tác nhân | Mô tả |\n|---|---|---|---|\n`;
      ucSection += ucData.ucs.map((uc) => `| \`${uc.code}\` | ${uc.name} | ${uc.actor} | ${uc.desc || "—"} |`).join("\n");
      ucSection += "\n";
    }
  }

  return `### LUỒNG ${idx}: ${flow.title}

**Mục đích:** ${flow.purpose}

**Chức năng chính:**

${funcList}

\`\`\`mermaid
${flow.mermaid}
\`\`\`

**Diễn giải các bước:**

| Bước | Người thực hiện | Mô tả |
|---|---|---|
${stepsTable}
${ucSection}
---
`;
}

function renderFlowPlain(idx, flow) {
  const ucData = ucsForFlow(flow);
  const stepsTable = flow.steps.map(([who, what], i) => `| ${i + 1} | ${who} | ${what} |`).join("\n");
  const funcList = flow.functions.map((f) => `- ${f}`).join("\n");

  let ucSection = "";
  if (ucData?.ucs?.length) {
    const mods = ucData.mods || (ucData.mod ? [ucData.mod] : []);
    ucSection = `\n**Các thao tác trên phần mềm (${ucData.ucs.length} mục):**\n\n`;
    ucSection += `| STT | Việc cần làm | Ai thực hiện | Giải thích |\n|---:|---|---|---|\n`;
    ucData.ucs.forEach((uc, i) => {
      ucSection += `| ${i + 1} | ${uc.name} | ${plainActor(uc.actor)} | ${plainUcExplain(uc.name, uc.desc)} |\n`;
    });
  }

  return `### LUỒNG ${idx}: ${flow.title}

**Mục đích:** ${flow.purpose}

**Người dùng có thể:**

${funcList}

\`\`\`mermaid
${flow.mermaid}
\`\`\`

**Các bước thực hiện:**

| Bước | Người thực hiện | Việc làm |
|---:|---|---|
${stepsTable}
${ucSection}
---
`;
}

function buildIntroSection(flowCount) {
  return `## 1. GIỚI THIỆU CHUNG

Hệ thống **ASMS** (After-Sales Management System) là nền tảng quản lý **hậu mãi quốc phòng**, số hóa 4 luồng chính: **tiếp nhận hợp đồng → bàn giao & huấn luyện → bảo hành/sửa chữa → chăm sóc khách hàng**, kèm master data, báo cáo và quản trị workflow.

Tài liệu BRD này mô tả **${flowCount} luồng nghiệp vụ cốt lõi** và **${activeUc} chức năng (use case)** trên **${activeModules.length} phân hệ** đang vận hành — theo bố cục tài liệu BRD TASMOS (Taseco Air).

### Các nhóm người dùng chính

| Vai trò | Mô tả công việc |
|---|---|
| **Admin** | Quản trị hệ thống, người dùng, phân quyền, cấu hình workflow và routing |
| **Quản lý (manager)** | Phê duyệt quy trình, phân công PA, giám sát KPI và báo cáo |
| **Kỹ thuật (technician)** | Bàn giao, bảo hành, vật tư, huấn luyện, thực thi kỹ thuật |
| **Sales** | Khách hàng, hợp đồng, CRM, tài liệu hợp đồng |
| **Viewer** | Theo dõi dữ liệu và báo cáo (chỉ đọc) |
| **Hệ thống** | Job thông báo, SLA, routing phản ánh tự động |

### Bốn luồng vận hành chính

| # | Luồng | Mô tả |
|---|---|---|
| 1 | Tiếp nhận hợp đồng | Tạo HĐ, gán KH/SP, điều khoản, phê duyệt |
| 2 | Bàn giao & huấn luyện | Workflow 5 bước bàn giao và khóa HL |
| 3 | Bảo hành & sửa chữa | Ticket BH/SC, SLA, vật tư, nghiệm thu |
| 4 | Chăm sóc khách hàng | CRM, phản ánh, routing đa đơn vị |

---
`;
}

function buildMdContentPlain() {
  const flowsBody = BUSINESS_FLOWS_PLAIN.map((f, i) => renderFlowPlain(i + 1, f)).join("\n");

  const appendix = activeModules
    .map((m) => {
      const title = plainModuleTitle(m);
      let s = `### ${title}\n\n`;
      s += `| STT | Việc cần làm | Ai thực hiện | Giải thích |\n|---:|---|---|---|\n`;
      s += m.ucs
        .map((uc, i) => `| ${i + 1} | ${uc.name} | ${plainActor(uc.actor)} | ${plainUcExplain(uc.name, uc.desc)} |`)
        .join("\n");
      return s + "\n";
    })
    .join("\n");

  return `${buildIntroSection(BUSINESS_FLOWS_PLAIN.length)}

## 2. TỔNG QUAN CÁCH HỆ THỐNG HOẠT ĐỘNG

Sơ đồ dưới mô tả **các lớp** của hệ thống — từ màn hình người dùng thấy hàng ngày đến nơi lưu dữ liệu.

[[ARCHITECTURE_DIAGRAM]]

**Giải thích bằng lời:**

| Tầng | Ý nghĩa với người dùng |
|---|---|
| **1. Người sử dụng** | Màn hình web trên trình duyệt — đăng nhập và làm việc |
| **2. Bảo mật** | Mỗi người chỉ thấy đúng phần việc được giao |
| **3. Nghiệp vụ** | Các màn hình: Hợp đồng, Bàn giao, Bảo hành, Khách hàng… |
| **4. Lưu trữ** | Cơ sở dữ liệu, file đính kèm, thông báo |
| **5. Nền tảng** | Hạ tầng kỹ thuật vận hành phần mềm |

---

## 3. ĐIỂM NỔI BẬT: QUY TRÌNH PHÊ DUYỆT & PHÂN CÔNG PHẢN ÁNH

**Vấn đề thực tế:** Nhiều hồ sơ (bàn giao, bảo hành…) phải qua nhiều bước trình — duyệt. Phản ánh khách hàng cần chuyển đúng đơn vị xử lý.

**Cách ASMS hỗ trợ:**

| Bước | Ai làm | Việc làm |
|---:|---|---|
| 1 | Quản trị viên | Thiết lập các bước phê duyệt cho từng loại hồ sơ |
| 2 | Cán bộ xử lý | Điền thông tin và trình bước hiện tại |
| 3 | Hệ thống | Lưu dữ liệu, chuyển bước, báo người duyệt tiếp theo |
| 4 | Quản lý | Tạo phản ánh; hệ thống gợi ý đơn vị nên xử lý |
| 5 | Hệ thống | Phân công và theo dõi đến khi đóng hồ sơ |

**Lợi ích:**
- Mọi hồ sơ đi đúng quy trình nội bộ, có người chịu trách nhiệm từng bước
- Phản ánh không bị “lạc” giữa các đơn vị
- Lãnh đạo tra cứu được lịch sử xử lý

---

## 4. QUY TRÌNH TỔNG THỂ (TỪ HỢP ĐỒNG ĐẾN BÁO CÁO)

\`\`\`mermaid
flowchart LR
    A[Ký hợp đồng] --> B[Bàn giao thiết bị]
    B --> C[Huấn luyện]
    C --> D[Bảo hành / Sửa chữa]
    D --> E[Phản ánh khách hàng]
    E --> F[Báo cáo cho lãnh đạo]
\`\`\`

**Tóm tắt:** Khách hàng ký hợp đồng → bàn giao và tập huấn → trong quá trình sử dụng có bảo hành, sửa chữa, phản ánh → cuối cùng tổng hợp báo cáo phục vụ điều hành.

### Sơ đồ tương tác các bên

\`\`\`mermaid
sequenceDiagram
    actor KH as Khách hàng
    actor KD as Kinh doanh
    actor KT as Kỹ thuật
    actor QL as Quản lý
    participant HT as Hệ thống ASMS

    rect rgb(238, 242, 255)
    Note over KD,HT: Giai đoạn 1 — Hợp đồng
    KD->>HT: Lập hợp đồng
    QL->>HT: Phê duyệt
    end

    rect rgb(220, 252, 231)
    Note over KT,HT: Giai đoạn 2 — Bàn giao & Huấn luyện
    KT->>HT: Thực hiện bàn giao
    QL->>HT: Duyệt và hoàn tất huấn luyện
    end

    rect rgb(254, 243, 199)
    Note over KH,HT: Giai đoạn 3 — Bảo hành & Phản ánh
    KH->>KT: Yêu cầu hỗ trợ
    KT->>HT: Xử lý bảo hành / phản ánh
    end

    rect rgb(207, 250, 254)
    Note over QL,HT: Giai đoạn 4 — Báo cáo
    QL->>HT: Xem tổng quan và báo cáo
    end
\`\`\`

| Vai trò | Phần việc chính trên hệ thống |
|---|---|
| **Kinh doanh** | Hợp đồng, khách hàng, tài liệu |
| **Kỹ thuật** | Bàn giao, bảo hành, vật tư, sản phẩm |
| **Quản lý** | Duyệt hồ sơ, phân công, báo cáo |
| **Quản trị viên** | Cài đặt toàn hệ thống |

---

## 5. CHI TIẾT TỪNG QUY TRÌNH LÀM VIỆC

${flowsBody}

## 6. TRẠNG THÁI HỒ SƠ (DỄ THEO DÕI)

### 6.1. Hợp đồng

| Trạng thái | Ý nghĩa |
|---|---|
| Mới tạo | Vừa nhập, chưa duyệt xong |
| Đang thực hiện | Đã có hiệu lực, đang triển khai |
| Hoàn thành | Đã bàn giao / nghiệm thu |
| Thanh lý | Kết thúc theo thỏa thuận |

### 6.2. Bàn giao & huấn luyện

| Bước trên hệ thống | Ý nghĩa |
|---|---|
| Lập kế hoạch | Soạn kế hoạch bàn giao |
| Xin kinh phí | Trình và duyệt kinh phí |
| Chuẩn bị hàng | Chuẩn bị thiết bị |
| Bàn giao | Thực hiện bàn giao |
| Huấn luyện | Tập huấn cho khách hàng |

### 6.3. Bảo hành / sửa chữa

| Trạng thái | Ý nghĩa |
|---|---|
| Mới tiếp nhận | Vừa ghi nhận sự cố |
| Đang xử lý | Kỹ thuật đang sửa |
| Chờ nghiệm thu | Kiểm tra lại sau sửa |
| Đã đóng | Hoàn tất |

### 6.4. Phản ánh khách hàng

| Trạng thái | Ý nghĩa |
|---|---|
| Mới | Vừa tạo phản ánh |
| Đang xử lý | Đã giao việc, đang làm |
| Chờ đóng | Xử lý xong, chờ xác nhận |
| Đã đóng | Kết thúc |

---

## 7. DANH MỤC CHỨC NĂNG THEO TỪNG PHẦN (${activeUc} mục)

${appendix}

---

## 8. KẾT LUẬN

Tài liệu mô tả **${BUSINESS_FLOWS_PLAIN.length} quy trình** và **${activeUc} chức năng** của ASMS bằng ngôn ngữ dễ hiểu. Hệ thống giúp:

- **Gom hồ sơ một chỗ** — hợp đồng, bàn giao, bảo hành, khách hàng liên thông
- **Đi đúng quy trình** — trình duyệt rõ ràng, có người chịu trách nhiệm
- **Theo dõi tiến độ** — bảng tổng quan và báo cáo cho lãnh đạo
- **Nhắc việc kịp thời** — thông báo hết hạn, quá hạn xử lý

Mọi góp ý xin gửi đội dự án để hoàn thiện trước khi đưa vào sử dụng chính thức.

— Hết —
`;
}

function buildMdContent() {
  const flowsBody = BUSINESS_FLOWS.map((f, i) => renderFlow(i + 1, f)).join("\n");

  const appendix = activeModules
    .map((m) => {
      let s = `### Phụ lục — ${m.title}\n\n`;
      if (m.route) s += `**Route:** ${m.route} · **Module:** \`${m.moduleKey}\`\n\n`;
      s += `| Mã UC | Chức năng | Tác nhân | Quyền / Mô tả |\n|---|---|---|---|\n`;
      s += m.ucs
        .map((uc) => `| \`${uc.code}\` | ${uc.name} | ${uc.actor} | ${uc.perm || uc.desc || "—"} |`)
        .join("\n");
      return s + "\n";
    })
    .join("\n");

  return `${buildIntroSection(BUSINESS_FLOWS.length)}

## 2. KIẾN TRÚC TỔNG THỂ HỆ THỐNG

Sơ đồ dưới mô tả cách các thành phần ASMS kết nối từ giao diện người dùng đến API nghiệp vụ, lưu trữ và báo cáo.

[[ARCHITECTURE_DIAGRAM]]

**Giải thích nhanh các tầng:**

| Tầng | Vai trò |
|---|---|
| **1. Người dùng & Kênh** | Web quản trị/vận hành; đăng nhập JWT |
| **2. Cổng & Bảo mật** | API \`/api/v1\`, RBAC 5 vai trò, envelope chuẩn |
| **3. Hệ thống lõi** | HĐ, BG, BH, SP, VT, CRM, PA, Workflow |
| **4. Lưu trữ** | PostgreSQL, file upload, job thông báo |
| **5. Nền tảng** | React + Vite, Express + TS, Prisma, Docker |

---

## 3. TÍNH NĂNG ĐẶC BIỆT: WORKFLOW ĐỘNG & PHÂN LUỒNG PHẢN ÁNH

**Vấn đề thực tế:** Nghiệp vụ hậu mãi quốc phòng có nhiều bước phê duyệt và form khác nhau theo từng loại hồ sơ (bàn giao, bảo hành, sản phẩm). Phản ánh khách hàng cần phân cho nhiều đơn vị xử lý song song.

**Giải pháp:** ASMS tích hợp **Workflow Engine** — mỗi module (handover, coaching, warranty, product, training) có định nghĩa bước, schema form động và luồng trình ký/ký duyệt. Kết hợp **Routing Phản ánh** — tự động gợi ý đơn vị xử lý theo sản phẩm và quy tắc cấu hình.

| Bước | Người thực hiện | Mô tả |
|---|---|---|
| 1 | Admin | Cấu hình quy trình và field schema từng bước tại Quy trình |
| 2 | Người xử lý | Mở phiếu HĐ/BG/BH, điền form bước hiện tại |
| 3 | Hệ thống | Validate Zod, lưu payload, chuyển bước, gửi thông báo |
| 4 | Quản lý | Tạo phản ánh; hệ thống preview routing theo SP |
| 5 | Hệ thống | Phân công multi-assignee; Admin xem tất cả PA |

**Lợi ích:**
- Chuẩn hóa quy trình phê duyệt trên mọi phân hệ
- Form linh hoạt không cần deploy lại khi đổi schema bước
- Phản ánh được phân luồng minh bạch, truy vết timeline

---

## 4. LUỒNG TỔNG THỂ END-TO-END

\`\`\`mermaid
flowchart LR
    A[Tiếp nhận HĐ] --> B[Bàn giao & HL]
    B --> C[Bảo hành / SC]
    C --> D[Phản ánh KH]
    D --> E[Báo cáo & KPI]
    C --> F[Vật tư]
    B --> G[Tài liệu]
\`\`\`

**Tóm tắt:** Hồ sơ đi từ hợp đồng → bàn giao/huấn luyện → vận hành bảo hành và phản ánh → tổng hợp báo cáo điều hành. Dữ liệu master (SP, VT, KH) liên thông xuyên suốt.

### 4.1. Sequence Diagram — Luồng end-to-end với các Actor

\`\`\`mermaid
sequenceDiagram
    actor KH as Khách hàng
    actor Sales as Sales / NV
    actor KT as Kỹ thuật
    actor QL as Quản lý
    participant ASMS as Hệ thống ASMS

    rect rgb(238, 242, 255)
    Note over Sales,ASMS: Giai đoạn 1 — Hợp đồng
    Sales->>ASMS: Tạo HĐ, gán KH và SP
    QL->>ASMS: Duyệt quy trình HĐ
    end

    rect rgb(220, 252, 231)
    Note over KT,ASMS: Giai đoạn 2 — Bàn giao & Huấn luyện
    KT->>ASMS: Phiếu bàn giao + workflow
    QL->>ASMS: Ký duyệt bàn giao & HL
    end

    rect rgb(254, 243, 199)
    Note over KH,ASMS: Giai đoạn 3 — Bảo hành & Phản ánh
    KH->>KT: Yêu cầu BH hoặc phản ánh
    KT->>ASMS: Phiếu BH / PA + routing
    KT->>ASMS: Xử lý và đóng PA
    end

    rect rgb(207, 250, 254)
    Note over QL,ASMS: Giai đoạn 4 — Báo cáo
    QL->>ASMS: Dashboard và báo cáo
    ASMS-->>QL: KPI, SLA, cảnh báo
    end
\`\`\`

| Actor | Vai trò | Quyền truy cập chính |
|---|---|---|
| **Sales** | HĐ, CRM, tài liệu | \`/hop-dong\`, \`/khach-hang\` |
| **Kỹ thuật** | BG, BH, VT, SP | \`/ban-giao\`, \`/bao-hanh\`, \`/vat-tu\` |
| **Quản lý** | Phê duyệt, PA, báo cáo | Workflow steps, \`/phan-anh\`, \`/bao-cao\` |
| **Admin** | Toàn hệ thống | Mọi module + Cài đặt |
| **Hệ thống ASMS** | SLA, routing, notify | Job nền, audit log |

---

## 5. CÁC LUỒNG NGHIỆP VỤ CHI TIẾT

${flowsBody}

## 6. CÁC TRẠNG THÁI CHÍNH

### 6.1. Hợp đồng

| Trạng thái | Ý nghĩa |
|---|---|
| Nháp / Mới | HĐ vừa tạo, chưa duyệt |
| Đang thực hiện | HĐ có hiệu lực, đang triển khai |
| Hoàn thành | Đã bàn giao/nghiệm thu xong |
| Thanh lý | Kết thúc HĐ theo điều khoản |

### 6.2. Bàn giao & Huấn luyện

| Trạng thái workflow | Ý nghĩa |
|---|---|
| Kế hoạch | Lập và trình kế hoạch bàn giao |
| Tờ trình KP | Phê duyệt kinh phí |
| Chuẩn bị HH | Chuẩn bị hàng hóa |
| Tổ chức BG | Thực hiện bàn giao |
| Huấn luyện | Tổ chức và hoàn tất HL |

### 6.3. Bảo hành / Sửa chữa

| Trạng thái | Ý nghĩa |
|---|---|
| Tiếp nhận | Phiếu mới, chờ phân loại |
| Đang xử lý | Kỹ thuật đang sửa chữa |
| Nghiệm thu | Kiểm tra sau sửa |
| Đóng | Hoàn tất, lưu lịch sử |

### 6.4. Phản ánh khách hàng

| Trạng thái | Ý nghĩa |
|---|---|
| Mới | PA vừa tạo |
| Đang xử lý | Đã phân công, đơn vị xử lý |
| Chờ đóng | Yêu cầu đóng, chờ duyệt |
| Đã đóng | Hoàn tất |
| Mở lại | PA được mở lại sau đóng |

---

## 7. PHỤ LỤC — DANH SÁCH CHỨC NĂNG THEO PHÂN HỆ (${activeUc} UC)

${appendix}

---

## 8. KẾT LUẬN

Tài liệu BRD ASMS mô tả **${BUSINESS_FLOWS.length} luồng nghiệp vụ** và **${activeUc} chức năng** trên **${activeModules.length} phân hệ**, giúp đội dự án nắm tổng thể cách hệ thống vận hành. Các luồng được thiết kế theo nguyên tắc:

- **Workflow chuẩn hóa:** Phê duyệt rõ ràng trên HĐ, BG, BH, SP
- **Liên thông dữ liệu:** KH ↔ HĐ ↔ SP ↔ VT ↔ PA ↔ Báo cáo
- **Phân quyền chặt:** RBAC 5 vai trò theo module
- **Truy vết:** Audit log và timeline phản ánh
- **Điều hành:** Dashboard KPI và báo cáo đa chiều

Mọi góp ý xin gửi về đội dự án để hoàn thiện trước khi triển khai chính thức.

— Hết —
`;
}

function buildHtmlTemplate(cfg, archDiagram = architectureHtml) {
  const { docCode, version, subtitle, metaPhamVi, ucCount, footerLabel } = cfg;
  const archJson = JSON.stringify(archDiagram);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BRD — ASMS — ${cfg.title || "TASMOS Style"}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#d0d0d0;font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;font-size:11px;color:#0d1e34;}
.doc-page{width:210mm;min-height:297mm;margin:10mm auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.25);position:relative;overflow:hidden;display:flex;flex-direction:column;}
@media print{
  body{background:#fff;}
  @page{size:A4;margin:0;}
  .doc-page{margin:0;box-shadow:none;width:100%;max-width:100%;}
  .doc-page.cover,.doc-page.toc-page{page-break-after:always;}
  body.brd-pdf-v3 .doc-page.cover{min-height:297mm;height:297mm;}
  body.brd-pdf-v3 .doc-page.content-flow{page-break-after:auto;min-height:auto;height:auto;overflow:visible;}
  .keep-together,.table-keep,.diagram-keep,.arch-figure{
    break-inside:avoid;page-break-inside:avoid;-webkit-column-break-inside:avoid;
  }
  .md-render .mermaid{break-inside:avoid;page-break-inside:avoid;}
  .md-render table{break-inside:avoid;page-break-inside:avoid;}
  .md-render thead{display:table-header-group;}
  .md-render tr{break-inside:avoid;page-break-inside:avoid;}
  .md-render h2,.md-render h3,.md-render h4{break-after:avoid;page-break-after:avoid;}
  body.brd-pdf-v3 .arch-diagram{font-size:9px;}
  body.brd-pdf-v3 .arch-layer-hd{padding:5px 10px;font-size:9.5px;}
  body.brd-pdf-v3 .arch-box{padding:6px 8px;}
}
.doc-page.cover{padding:0;}
.doc-page.cover .accent-bar{height:8px;background:linear-gradient(90deg,#3d7de8,#0ab4d8);flex-shrink:0;}
.doc-page.cover .header{padding:22px 52px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.doc-page.cover .header-code{font-size:9.5px;font-weight:600;letter-spacing:.8px;}
.doc-page.cover .header-code span{color:#0d1e34;}
.doc-page.cover .header-right{font-size:9.5px;text-align:right;line-height:1.7;}
.doc-page.cover .divider{margin:0 52px;height:1px;background:#eaeff8;flex-shrink:0;}
.doc-page.cover .main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding-bottom:80px;text-align:center;}
.doc-page.cover .logo-wrap{margin-bottom:36px;}
.doc-page.cover .logo-wrap img{width:280px;display:block;}
.doc-page.cover .sep{width:52px;height:3px;background:linear-gradient(90deg,#3d7de8,#0ab4d8);border-radius:2px;margin:0 auto 32px;}
.doc-page.cover .doc-label{font-size:10px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:20px;color:#52637d;}
.doc-page.cover .project-title{font-size:36px;font-weight:900;line-height:1.15;}
.doc-page.cover .project-title .brand{background:linear-gradient(135deg,#3d7de8,#0ab4d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.doc-page.cover .subtitle{margin-top:16px;font-size:12px;color:#3a4a64;}
.doc-page.cover .meta-info{margin-top:36px;font-size:10.5px;line-height:1.85;color:#3a4a64;}
.doc-page.cover .meta-info strong{color:#0d1e34;font-weight:600;}
.doc-page.cover .footer{padding:18px 52px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #eaeff8;flex-shrink:0;}
.doc-page.cover .footer-l,.doc-page.cover .footer-r{font-size:9.5px;}
.doc-page.cover .footer-r{text-align:right;}
.inner-brd-header{padding:22px 48px 22px 68px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.inner-brd-header .inner-brd-code{font-size:9.5px;font-weight:600;letter-spacing:.8px;}
.inner-brd-header .inner-brd-right{font-size:9.5px;text-align:right;line-height:1.7;}
.inner-brd-divider{margin:0 48px 0 68px;height:1px;background:#eaeff8;flex-shrink:0;}
.inner-brd-footer{padding:18px 48px 18px 68px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #eaeff8;flex-shrink:0;}
.inner-brd-footer-l{font-size:9.5px;}
.inner-brd-footer-r{font-size:9.5px;text-align:right;line-height:1.65;}
.inner-brd-footer-r .ft-page{display:block;font-weight:600;}
.content-area{flex:1;overflow:visible;padding:14px 48px 14px 68px;font-size:12.5px;line-height:1.55;color:#1a2740;}
.md-render h1{font-size:20px;font-weight:900;color:#0d1e34;margin:8px 0 14px;padding-bottom:8px;border-bottom:2px solid #3d7de8;}
.md-render h2{font-size:16px;font-weight:800;color:#0d1e34;margin:22px 0 10px;padding:6px 10px;background:linear-gradient(90deg,#eef4ff,transparent);border-left:4px solid #3d7de8;page-break-after:avoid;}
.md-render h3{font-size:13.5px;font-weight:700;color:#1e3a5f;margin:16px 0 6px;page-break-after:avoid;}
.md-render h4{font-size:12.5px;font-weight:600;color:#1e3a5f;margin:10px 0 4px;}
.md-render p{margin:6px 0;}
.md-render ul{margin:6px 0 6px 20px;}
.md-render table{width:100%;border-collapse:collapse;font-size:10.5px;margin:10px 0;}
.md-render th,.md-render td{border:1px solid #cbd5e0;padding:5px 8px;vertical-align:top;text-align:left;}
.md-render th{background:#1e3a5f;color:#fff;font-weight:600;}
.md-render tr:nth-child(even) td{background:#f7fafc;}
.md-render hr{border:none;border-top:1px dashed #c8d8ec;margin:14px 0;}
.md-render .mermaid{text-align:center;margin:14px 0;background:#fafbfd;padding:12px;border-radius:6px;border:1px solid #eaeff8;break-inside:avoid;page-break-inside:avoid;}
.md-render .mermaid svg{max-width:100%;height:auto;display:block;margin:0 auto;}
.table-keep,.diagram-keep{break-inside:avoid;page-break-inside:avoid;}
.keep-together{break-inside:avoid;page-break-inside:avoid;margin-bottom:4px;}
.arch-figure{margin:16px 0 20px;}
.arch-figure figcaption{font-size:11px;color:#52637d;text-align:center;margin-top:10px;line-height:1.5;}
.arch-diagram{border:1px solid #cbd5e0;border-radius:10px;overflow:hidden;font-size:10px;line-height:1.45;}
.arch-title{text-align:center;font-weight:800;font-size:12px;padding:10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;}
.arch-layer{padding:0;}
.arch-layer-hd{padding:7px 12px;font-weight:700;font-size:10.5px;color:#fff;text-align:center;}
.arch-layer.l1 .arch-layer-hd{background:#2563eb;}
.arch-layer.l2 .arch-layer-hd{background:#7c3aed;}
.arch-layer.l3 .arch-layer-hd{background:#1e293b;}
.arch-layer.l4 .arch-layer-hd{background:#059669;}
.arch-layer.l5 .arch-layer-hd{background:#64748b;}
.arch-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;background:#fff;}
.arch-row.two{grid-template-columns:repeat(2,1fr);}
.arch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;background:#fff;}
.arch-box{border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;background:#fafbfd;text-align:center;}
.arch-box strong{color:#0d1e34;font-size:10.5px;}
.arch-box em{color:#64748b;font-size:9.5px;}
.arch-arrow{text-align:center;color:#94a3b8;font-size:14px;padding:2px 0;background:#f8fafc;}
.arch-tech{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:12px;background:#fff;}
.arch-tech span{border:1px solid #e2e8f0;border-radius:6px;padding:6px 12px;background:#f1f5f9;font-weight:600;font-size:10px;}
@media screen{.doc-page{height:auto;min-height:297mm;}}
.toc-page .content-area{padding:22px 48px 18px 68px;}
.toc-title{font-size:20px;font-weight:900;color:#0d1e34;margin:4px 0 10px;padding-bottom:8px;border-bottom:2px solid #3d7de8;}
.toc-subtitle{font-size:11.5px;color:#52637d;margin-bottom:18px;}
.toc-list{display:flex;flex-direction:column;gap:5px;}
.toc-item{display:flex;align-items:flex-start;gap:10px;padding:6px 10px;border-radius:8px;text-decoration:none;color:#1a2740;border:1px solid #e6edf7;background:#fbfdff;}
.toc-item:hover{border-color:#3d7de8;background:#f5f9ff;}
.toc-item.level-3{margin-left:14px;}
.toc-item.level-4{margin-left:28px;font-size:11px;}
.toc-index{min-width:22px;font-size:11px;font-weight:800;color:#3d7de8;}
.toc-text{font-size:11.5px;line-height:1.4;}
</style>
</head>
<body>
<div class="doc-page cover">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="header-code">Mã tài liệu: <span>${docCode}</span></div>
    <div class="header-right">Phiên bản ${version} &nbsp;·&nbsp; 06/2026</div>
  </div>
  <div class="divider"></div>
  <div class="main">
    <div class="logo-wrap"><img src="assets/unicom-logo.png" alt="UNICOM AI Software Factory" /></div>
    <div class="sep"></div>
    <div class="doc-label">Business Requirements Document (BRD)</div>
    <div class="project-title"><span class="brand">Hệ thống ASMS</span></div>
    <div class="subtitle">${subtitle}</div>
    <div class="meta-info">${metaPhamVi}</div>
  </div>
  <div class="footer">
    <div class="footer-l">UNICOM TECHNOLOGY SOLUTIONS CO., LTD</div>
    <div class="footer-r">Tài liệu trình: Ban quản lý dự án ASMS</div>
  </div>
</div>
<div class="doc-page toc-page">
  <div class="inner-brd-header">
    <div class="inner-brd-code">Mã tài liệu: <span>${docCode}</span></div>
    <div class="inner-brd-right">ASMS &nbsp;·&nbsp; Phiên bản ${version}</div>
  </div>
  <div class="inner-brd-divider"></div>
  <div class="content-area">
    <h1 class="toc-title">Mục lục</h1>
    <p class="toc-subtitle">Nhấn vào từng mục để di chuyển nhanh — ${ucCount} chức năng · ${BUSINESS_FLOWS.length} luồng nghiệp vụ.</p>
    <div id="toc-list" class="toc-list"></div>
  </div>
  <div class="inner-brd-footer">
    <div class="inner-brd-footer-l">UNICOM TECHNOLOGY SOLUTIONS CO., LTD</div>
    <div class="inner-brd-footer-r"><span class="ft-page">${footerLabel}</span></div>
  </div>
</div>
<div id="content-host"></div>
<script id="md-source" type="text/markdown"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' });
function decodeHtmlEntities(text) {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}
function mermaidBlocksToDivs(html) {
  return html.replace(/<pre><code class="language-mermaid">([\\s\\S]*?)<\\/code><\\/pre>/gi, function(_, raw) {
    const code = decodeHtmlEntities(raw);
    return '<div class="mermaid">' + code.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>';
  });
}
const renderer = new marked.Renderer();
const baseCode = renderer.code.bind(renderer);
renderer.code = function(code, lang) {
  if (lang === 'mermaid') {
    const safe = code.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return '<div class="mermaid">' + safe + '</div>';
  }
  return baseCode(code, lang);
};
marked.setOptions({ renderer, gfm: true, breaks: false });
const mdRaw = document.getElementById('md-source').textContent;
let htmlContent = mermaidBlocksToDivs(marked.parse(mdRaw));
const host = document.getElementById('content-host');
const wrapper = document.createElement('div');
wrapper.className = 'doc-page content-flow';
wrapper.innerHTML = '<div class="inner-brd-header"><div class="inner-brd-code">Mã tài liệu: <span>${docCode}</span></div><div class="inner-brd-right">ASMS &nbsp;·&nbsp; Phiên bản ${version}</div></div><div class="inner-brd-divider"></div><div class="content-area"><div class="md-render">' + htmlContent + '</div></div><div class="inner-brd-footer"><div class="inner-brd-footer-l">UNICOM TECHNOLOGY SOLUTIONS CO., LTD</div><div class="inner-brd-footer-r"><span class="ft-page">${footerLabel}</span></div></div>';
host.appendChild(wrapper);
const archHtml = ${archJson};
const renderRoot = wrapper.querySelector('.md-render');
renderRoot.innerHTML = renderRoot.innerHTML.replace('<p>[[ARCHITECTURE_DIAGRAM]]</p>', archHtml);
function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
const seenIds = new Map();
const headings = Array.from(renderRoot.querySelectorAll('h2, h3, h4'));
headings.forEach((heading, index) => {
  const base = slugify(heading.textContent) || 'section-' + (index + 1);
  const count = seenIds.get(base) || 0;
  seenIds.set(base, count + 1);
  heading.id = count ? base + '-' + (count + 1) : base;
});
const tocList = document.getElementById('toc-list');
headings.forEach((heading, index) => {
  const link = document.createElement('a');
  const level = heading.tagName === 'H2' ? '2' : heading.tagName === 'H3' ? '3' : '4';
  link.className = 'toc-item level-' + level;
  link.href = '#' + heading.id;
  link.innerHTML = '<span class="toc-index">' + (index + 1) + '.</span><span class="toc-text">' + heading.textContent + '</span>';
  tocList.appendChild(link);
});
function wrapKeepTogether(root) {
  root.querySelectorAll('table').forEach(function(table) {
    if (table.closest('.table-keep')) return;
    var wrap = document.createElement('div');
    wrap.className = 'table-keep';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
  root.querySelectorAll('.mermaid').forEach(function(el) {
    if (el.closest('.diagram-keep')) return;
    var wrap = document.createElement('div');
    wrap.className = 'diagram-keep';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
  });
  root.querySelectorAll('h3').forEach(function(h3) {
    var t = h3.textContent || '';
    if (!/^Phụ lục —/.test(t)) return;
    if (h3.closest('.keep-together')) return;
    var box = document.createElement('div');
    box.className = 'keep-together';
    h3.parentNode.insertBefore(box, h3);
    box.appendChild(h3);
    var next = h3.nextElementSibling;
    while (next && next.tagName !== 'H3' && next.tagName !== 'H2') {
      var grab = next;
      next = next.nextElementSibling;
      box.appendChild(grab);
    }
  });
  root.querySelectorAll('h4').forEach(function(h4) {
    var next = h4.nextElementSibling;
    if (!next || next.tagName !== 'TABLE') return;
    if (h4.closest('.keep-together')) return;
    var box = document.createElement('div');
    box.className = 'keep-together';
    h4.parentNode.insertBefore(box, h4);
    box.appendChild(h4);
    box.appendChild(next);
  });
  root.querySelectorAll('.arch-figure').forEach(function(el) {
    if (el.closest('.diagram-keep')) return;
    var wrap = document.createElement('div');
    wrap.className = 'diagram-keep';
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);
  });
}
function paginateForPrint() {
  var hostEl = document.getElementById('content-host');
  var pageShell = hostEl.querySelector('.doc-page.content-flow');
  if (!pageShell || pageShell.classList.contains('print-page')) return;
  var mdRoot = pageShell.querySelector('.md-render');
  if (!mdRoot) return;
  var blocks = Array.from(mdRoot.children);
  var MAX_H = 640;
  hostEl.removeChild(pageShell);
  function newPrintPage() {
    var page = pageShell.cloneNode(true);
    page.classList.add('print-page');
    page.classList.remove('content-flow');
    var md = page.querySelector('.md-render');
    md.innerHTML = '';
    hostEl.appendChild(page);
    return md;
  }
  var curMd = newPrintPage();
  blocks.forEach(function(block) {
    curMd.appendChild(block);
    if (curMd.scrollHeight > MAX_H && curMd.children.length > 1) {
      curMd.removeChild(block);
      curMd = newPrintPage();
      curMd.appendChild(block);
    }
  });
}
window.paginateForPrint = paginateForPrint;
(async function() {
  try {
    await mermaid.run({ querySelector: '.mermaid', suppressErrors: true });
    wrapKeepTogether(renderRoot);
    window.__brdLayoutReady = true;
  } catch (err) {
    console.error('Mermaid render error:', err);
    window.__brdLayoutReady = true;
  }
})();
</script>
</body>
</html>`;
}

const docsDir = path.resolve(__dirname, "../docs/file docs");
const outPath = path.join(docsDir, "ASMS_BRD_TASMOS.html");
const mdContent = buildMdContent();
const htmlTemplate = buildHtmlTemplate({
  title: "BRD TASMOS Style",
  docCode: "UNICOM/BRD-ASMS-003",
  version: "1.0",
  subtitle: "After-Sales Management System — Quản lý hậu mãi quốc phòng",
  metaPhamVi: `<strong>Khách hàng:</strong> Đơn vị quốc phòng<br>
      <strong>Đơn vị phát triển:</strong> Unicom Technology Solutions Co., Ltd<br>
      <strong>Phạm vi:</strong> ${activeModules.length} phân hệ · ${activeUc} chức năng · ${BUSINESS_FLOWS.length} luồng nghiệp vụ`,
  ucCount: activeUc,
  footerLabel: "ASMS — BRD v1.0",
});
const htmlFinal = htmlTemplate.replace(
  '<script id="md-source" type="text/markdown"></script>',
  `<script id="md-source" type="text/markdown">\n${mdContent}\n</script>`
);
fs.writeFileSync(outPath, htmlFinal, "utf8");
console.log(`Generated ${outPath} (${activeModules.length} phân hệ, ${activeUc} UC, ${BUSINESS_FLOWS.length} luồng)`);

const plainOut = path.join(docsDir, "ASMS_BRD_PLAIN.html");
const plainMd = buildMdContentPlain();
const plainHtml = buildHtmlTemplate(
  {
    title: "BRD Dễ hiểu",
    docCode: "UNICOM/BRD-ASMS-004",
    version: "1.0",
    subtitle: "Hệ thống quản lý hậu mãi — Phiên bản dễ hiểu cho mọi người dùng",
    metaPhamVi: `<strong>Đối tượng đọc:</strong> Cán bộ nghiệp vụ, lãnh đạo — không cần biết lập trình<br>
      <strong>Phạm vi:</strong> ${activeModules.length} phần hệ thống · ${activeUc} chức năng · ${BUSINESS_FLOWS_PLAIN.length} quy trình<br>
      <strong>Đơn vị phát triển:</strong> Unicom Technology Solutions Co., Ltd`,
    ucCount: activeUc,
    footerLabel: "ASMS — BRD dễ hiểu v1.0",
  },
  architectureHtmlPlain
);
const plainFinal = plainHtml.replace(
  '<script id="md-source" type="text/markdown"></script>',
  `<script id="md-source" type="text/markdown">\n${plainMd}\n</script>`
);
fs.writeFileSync(plainOut, plainFinal, "utf8");
console.log(`Generated ${plainOut} (plain language, ${BUSINESS_FLOWS_PLAIN.length} quy trình)`);
