import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ucMdPath = path.resolve(__dirname, "../docs/file docs/use-case-asms.md");

const ucMd = fs.readFileSync(ucMdPath, "utf8");

/** Màn ẩn menu + chặn route — src/lib/nav-visibility.ts */
const HIDDEN_MODULE_KEYS = new Set(["de-tai", "cong-viec", "dao-tao"]);
/** Nhóm QT ẩn UI — src/lib/workflow-visibility.ts */
const HIDDEN_WORKFLOW_KEYS = new Set(["contract"]);

function isModuleHidden(mod) {
  return mod.note?.includes("ẩn") || HIDDEN_MODULE_KEYS.has(mod.moduleKey);
}

function mermaidMsg(text) {
  return String(text)
    .replace(/[`#]/g, " ")
    .replace(/&/g, " và ")
    .replace(/:/g, " – ")
    .replace(/</g, " ")
    .replace(/>/g, " ")
    .replace(/[|]/g, " ")
    .replace(/"/g, "'")
    .replace(/;/g, ",")
    .replace(/\bAdmin\b/gi, "Quản trị viên")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 96);
}

function mermaidNote(text) {
  return mermaidMsg(text).replace(/ – /g, " — ");
}

function mermaidArrow(from, to, msg, dashed = false) {
  const arrow = dashed ? "-->>" : "->>";
  return `    ${from}${arrow}${to}: "${mermaidMsg(msg)}"`;
}

function purposeFor(name, desc, moduleName) {
  const cleanModule = moduleName.replace(/\s*\(`[^`]+`\).*/, "").trim();
  let text = `Cho phép người dùng **${name.toLowerCase()}** trên phân hệ **${cleanModule}**, đảm bảo dữ liệu đồng bộ với API backend và tuân thủ phân quyền RBAC.`;
  if (desc?.trim()) text += ` ${desc.trim().endsWith(".") ? desc.trim() : `${desc.trim()}.`}`;
  return text;
}

function stepsFor(uc) {
  const { code, name, actor, desc, route, api, perm } = uc;
  const n = name.toLowerCase();

  if (code === "UC-PA-01") {
    return [
      ["Người dùng", "Truy cập `/phan-anh`"],
      ["Hệ thống", "Quản trị viên xem tất cả PA; vai trò khác chỉ thấy PA được phân công"],
      ["Người dùng", "Lọc trạng thái, ưu tiên, đơn vị (`myUnits`)"],
      ["Hệ thống", "Hiển thị danh sách với badge SLA"],
    ];
  }
  if (code.startsWith("UC-AUTH-01")) {
    return [
      ["Người dùng", "Truy cập `/login`, nhập email và mật khẩu"],
      ["Hệ thống", "Gọi `POST /api/v1/auth/login`, xác thực"],
      ["Hệ thống", "Trả access token + refresh token"],
      ["Người dùng", "Chuyển vào Bảng điều khiển"],
    ];
  }
  if (code.startsWith("UC-AUTH-02")) {
    return [
      ["Người dùng", "Chọn Đăng xuất"],
      ["Hệ thống", "Thu hồi refresh token"],
      ["Hệ thống", "Chuyển về `/login`"],
    ];
  }
  if (n.includes("xem danh sách") || n.includes("xem kanban") || n.includes("xem lịch")) {
    return [
      ["Người dùng", `Truy cập màn hình, quyền \`${perm || "read"}\``],
      ["Người dùng", "Áp dụng bộ lọc / tìm kiếm"],
      ["Hệ thống", `Gọi API danh sách${api ? ` (${api})` : ""}`],
      ["Hệ thống", "Hiển thị bảng / kanban với trạng thái"],
    ];
  }
  if (n.includes("xem chi tiết") || n.includes("xem tổng quan") || n.startsWith("xem ")) {
    return [
      ["Người dùng", `Mở bản ghi từ danh sách${route ? ` (${route})` : ""}`],
      ["Hệ thống", "Tải chi tiết từ API"],
      ["Hệ thống", `Hiển thị ${desc || "thông tin đầy đủ và tab liên quan"}`],
    ];
  }
  if (n.includes("tạo") || n.includes("nhập")) {
    return [
      ["Người dùng", `Mở form tạo mới (quyền \`${perm || "create"}\`)`],
      ["Người dùng", "Điền trường bắt buộc, chọn liên kết HĐ/KH/SP"],
      ["Hệ thống", "Kiểm tra dữ liệu (Zod FE + BE)"],
      ["Hệ thống", "Lưu bản ghi, khởi tạo quy trình nếu có"],
      ["Hệ thống", "Thông báo thành công"],
    ];
  }
  if (n.includes("sửa") || n.includes("cập nhật") || n.includes("điền")) {
    return [
      ["Người dùng", `Mở bản ghi sửa (quyền \`${perm || "update"}\`)`],
      ["Người dùng", "Chỉnh sửa trường / payload bước QT"],
      ["Hệ thống", "Kiểm tra và lưu qua API"],
      ["Hệ thống", "Ghi nhật ký thao tác, cập nhật giao diện"],
    ];
  }
  if (n.includes("xóa")) {
    return [
      ["Người dùng", "Chọn Xóa (quyền delete)"],
      ["Hệ thống", "Hiển thị xác nhận"],
      ["Người dùng", "Xác nhận xóa"],
      ["Hệ thống", "Xóa mềm, ẩn khỏi danh sách"],
    ];
  }
  if (n.includes("quy trình") || n.includes("xử lý quy trình")) {
    return [
      ["Người dùng", "Mở bản ghi có quy trình đang chạy"],
      ["Hệ thống", "Hiển thị bước hiện tại và vai trò xử lý"],
      ["Người dùng", "Điền form, đính kèm tài liệu bước"],
      ["Người dùng", "Trình ký / Ký duyệt / Ban hành / Từ chối"],
      ["Hệ thống", "Ghi log, chuyển bước, gửi thông báo"],
    ];
  }
  if (n.includes("phân công")) {
    return [
      ["Quản lý", "Mở chi tiết phản ánh"],
      ["Quản lý", "Chọn người / vai trò xử lý"],
      ["Hệ thống", "Cập nhật phân công, trạng thái đã giao"],
      ["Hệ thống", "Gửi thông báo cho người được phân công"],
    ];
  }
  if (n.includes("báo cáo") || n.includes("thống kê")) {
    return [
      ["Người dùng", "Truy cập tab báo cáo"],
      ["Người dùng", "Chọn năm, khoảng thời gian, bộ lọc"],
      ["Hệ thống", "Tổng hợp từ API reports"],
      ["Hệ thống", "Hiển thị biểu bảng, xuất Excel / in"],
    ];
  }
  if (n.includes("upload") || n.includes("đính kèm")) {
    return [
      ["Người dùng", "Chọn tệp tải lên"],
      ["Hệ thống", "Kiểm tra định dạng, tải lên multipart"],
      ["Hệ thống", "Lưu metadata, liên kết bản ghi"],
      ["Hệ thống", "Hiển thị trong tab tài liệu / bước QT"],
    ];
  }
  if (n.includes("thông báo") || actor === "Hệ thống") {
    return [
      ["Hệ thống", "Phát sinh sự kiện SLA / PA / HĐ hết hạn"],
      ["Hệ thống", "Tạo thông báo theo tùy chọn người dùng"],
      ["Người dùng", "Nhận badge và xem `/thong-bao`"],
      ["Người dùng", "Nhấn để điều hướng tới bản ghi liên quan"],
    ];
  }
  if (n.includes("cấu hình") || n.includes("quản lý")) {
    return [
      ["Quản trị viên", "Truy cập Cài đặt"],
      ["Quản trị viên", "Thêm / sửa / xóa cấu hình"],
      ["Hệ thống", "Kiểm tra và lưu cấu hình"],
      ["Hệ thống", "Áp dụng cho phiên tiếp theo"],
    ];
  }

  return [
    ["Người dùng", `Thực hiện «${name}»`],
    ["Hệ thống", desc || "Xử lý theo mô tả use case"],
    ["Hệ thống", "Trả kết quả và cập nhật dữ liệu"],
  ];
}

function sequenceDiagramFor(steps) {
  const hasAdmin = steps.some(([w]) => w.includes("Admin"));
  const hasManager = steps.some(([w]) => w.includes("Quản lý"));
  const lines = ["sequenceDiagram"];
  const actorLabel = hasAdmin ? "Quản trị viên" : hasManager ? "Quản lý" : "Người dùng";
  lines.push(`    actor U as ${actorLabel}`);
  lines.push("    participant S as Hệ thống ASMS");
  for (const [who, what] of steps) {
    if (who.includes("Hệ thống")) lines.push(mermaidArrow("S", "U", what, true));
    else lines.push(mermaidArrow("U", "S", what));
  }
  return lines.join("\n");
}

function parseUcFile(md) {
  const sectionRe = /^## (\d+)\.\s+(.+?)(?:\s+`([^`]+)`)?(?:\s+—\s+(.+))?$/gm;
  let match;
  const sections = [];
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
    const tableRows = block.match(/^\| UC-[^\n]+\|/gm) || [];
    for (const row of tableRows) {
      if (row.includes("Mã UC") || row.includes("---")) continue;
      const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cols.length < 3) continue;
      const code = cols[0];
      if (!code.startsWith("UC-")) continue;
      const name = cols[1];
      let actor = cols[2];
      let desc = cols[3] || "";
      let perm = "";
      if (cols.length === 4 && ["read", "create", "update", "delete", "CRUD"].includes(actor)) {
        perm = actor;
        actor = "Theo quyền";
        desc = cols[3] || "";
      } else if (cols.length === 4 && ["read", "create", "update", "delete", "CRUD"].includes(cols[3])) {
        perm = cols[3];
        actor = "Theo quyền";
        desc = cols[2]?.includes(".") ? `Submodule: ${cols[2]}` : cols[2] || "";
      } else if (cols.length >= 5) {
        perm = cols[3] || "";
        actor = cols[2];
        desc = cols[4] || cols[3] || "";
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

function renderUc(uc, mod, { operational = true } = {}) {
  const steps = stepsFor({ ...uc, route: mod.route, api: mod.api });
  const seq = sequenceDiagramFor(steps);
  const stepsTable = steps.map(([who, what], i) => `| ${i + 1} | ${who} | ${what} |`).join("\n");

  let meta = `| Thuộc tính | Giá trị |\n|---|---|\n`;
  meta += `| **Mã UC** | \`${uc.code}\` |\n`;
  meta += `| **Tên** | ${uc.name} |\n`;
  meta += `| **Tác nhân** | ${uc.actor} |\n`;
  if (operational) meta += `| **Trạng thái** | ✅ Đang vận hành |\n`;
  else meta += `| **Trạng thái** | ⛔ Ẩn menu — không sử dụng |\n`;
  if (uc.perm) meta += `| **Quyền** | \`${uc.perm}\` |\n`;
  if (mod.moduleKey) meta += `| **Module** | \`${mod.moduleKey}\` |\n`;
  if (mod.route) meta += `| **Route UI** | ${mod.route} |\n`;
  if (mod.api) meta += `| **API** | ${mod.api} |\n`;
  if (uc.desc) meta += `| **Mô tả** | ${uc.desc} |\n`;

  const diagram = operational
    ? `\`\`\`mermaid\n${seq}\n\`\`\`\n\n**Diễn giải các bước:**\n\n| Bước | Người thực hiện | Mô tả |\n|---|---|---|\n${stepsTable}\n`
    : `> **Ghi chú:** Use case thuộc phân hệ ẩn — không hiển thị menu, chặn truy cập trực tiếp (mọi vai trò). API có thể còn trong codebase nhưng **ngoài phạm vi UAT/vận hành**.\n`;

  return `### ${uc.code}: ${uc.name}

**Mục đích:**
${purposeFor(uc.name, uc.desc, mod.title)}

${meta}

${diagram}
---
`;
}

function renderModule(mod, idx, { includeDiagrams = true } = {}) {
  const hidden = isModuleHidden(mod);
  const tag = hidden ? " *(⛔ ẩn — không sử dụng)*" : " *(✅ đang vận hành)*";
  let out = `### 5.${idx}. ${mod.title}${tag}\n\n`;
  if (mod.route) out += `**Route UI:** ${mod.route}\n\n`;
  if (mod.api) out += `**API:** ${mod.api}\n\n`;
  if (hidden) {
    out += `> Phân hệ **không nằm trong phạm vi vận hành hiện tại**. Route bị chặn qua \`nav-visibility.ts\`.\n\n`;
  }
  out += `Phân hệ gồm **${mod.ucs.length}** use case:\n\n`;
  if (includeDiagrams) {
    out += mod.ucs.map((uc) => renderUc(uc, mod, { operational: !hidden })).join("\n");
  } else {
    out += `| Mã UC | Use Case | Trạng thái |\n|---|---|---|\n`;
    out += mod.ucs.map((uc) => `| \`${uc.code}\` | ${uc.name} | ⛔ Không sử dụng |`).join("\n");
    out += "\n\n";
  }
  return out;
}

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
<figcaption>Hình 1. Kiến trúc tổng thể hệ thống ASMS — 5 tầng logic (đồng bộ BRD &amp; TechSpec)</figcaption>
</figure>`;

const modules = parseUcFile(ucMd);
const totalUc = modules.reduce((s, m) => s + m.ucs.length, 0);
const activeModules = modules.filter((m) => !isModuleHidden(m));
const hiddenModules = modules.filter((m) => isModuleHidden(m));
const activeUc = activeModules.reduce((s, m) => s + m.ucs.length, 0);
const hiddenUc = hiddenModules.reduce((s, m) => s + m.ucs.length, 0);


function buildIntro(mode) {
  if (mode === "updated") {
    return `## 1. GIỚI THIỆU CHUNG

Hệ thống **ASMS** (After-Sales Management System) quản lý **hậu mãi** quốc phòng. **BRD cập nhật v1.1** mô tả **${activeUc} use case đang vận hành** trên **${activeModules.length} phân hệ** có menu hiển thị.

> **Khác với BRD đầy đủ (v1.0):** Tài liệu này **loại trừ** ${hiddenUc} UC thuộc ${hiddenModules.length} màn ẩn (\`de-tai\`, \`cong-viec\`, \`dao-tao\`) và ghi rõ nhóm QT \`contract\` không dùng. Chi tiết UC ẩn xem **Phụ lục A**.

### Các nhóm người dùng chính

| Vai trò | Mô tả công việc |
|---|---|
| **Admin** | Quản trị toàn hệ thống, người dùng, phân quyền, cấu hình, audit |
| **Quản lý (manager)** | Điều hành nghiệp vụ, phê duyệt quy trình, báo cáo |
| **Kỹ thuật (technician)** | Bàn giao, bảo hành, vật tư, huấn luyện (tab Bàn giao), thực thi |
| **Sales** | Khách hàng, hợp đồng, CRM, tài liệu |
| **Viewer** | Theo dõi dữ liệu và báo cáo (chỉ đọc) |
| **Hệ thống** | Job thông báo, SLA, routing phản ánh tự động |

### Menu đang hiển thị (14 phân hệ)

Bảng điều khiển · Hợp đồng · Bàn giao & HL · Bảo hành · Sản phẩm · Vật tư · Khách hàng · Phản ánh · Báo cáo · Tài liệu · Quy trình · Cài đặt · Thông báo · Đăng nhập

---

`;
  }
  return `## 1. GIỚI THIỆU CHUNG

Hệ thống **ASMS** (After-Sales Management System) là nền tảng quản lý **hậu mãi** quốc phòng: hợp đồng, bàn giao, huấn luyện, bảo hành/sửa chữa, vật tư, sản phẩm, CRM, phản ánh khách hàng, báo cáo và quản trị workflow.

Tài liệu BRD này (phiên bản 1.0) mô tả **${totalUc} use case** theo hiện trạng codebase, mỗi UC gồm: **Mục đích → Thuộc tính → Biểu đồ tuần tự → Diễn giải các bước** (theo mẫu BRD TASMOS).

> **Phạm vi:** 17 phân hệ. Màn **ẩn menu**: Đề tài NC, Công việc, Đào tạo & HL. QT **Hợp đồng (tổng hợp)** ẩn UI.

### Các nhóm người dùng chính

| Vai trò | Mô tả công việc |
|---|---|
| **Admin** | Quản trị toàn hệ thống, người dùng, phân quyền, cấu hình, audit |
| **Quản lý (manager)** | Điều hành nghiệp vụ, phê duyệt workflow, báo cáo |
| **Kỹ thuật (technician)** | Bàn giao, bảo hành, vật tư, đào tạo, thực thi kỹ thuật |
| **Sales** | Khách hàng, hợp đồng, CRM, tài liệu |
| **Viewer** | Theo dõi dữ liệu và báo cáo (chỉ đọc) |
| **Hệ thống** | Job thông báo, SLA, routing phản ánh tự động |

### Quy ước mã UC

| Ký hiệu | Ý nghĩa |
|---|---|
| \`UC-<MODULE>-<STT>\` | Mã use case (ví dụ \`UC-HD-01\`) |
| **Theo quyền** | Kiểm tra ma trận RBAC module tương ứng |
| **Admin** | Admin xem toàn bộ (ví dụ danh sách PA) |

---

`;
}

const footer = `
---

## 6. MA TRẬN PHÂN QUYỀN NGHIỆP VỤ

| Phân hệ | admin | manager | technician | viewer | sales |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hợp đồng | ✓ | ✓ | — | đọc | ✓ |
| Bàn giao / HL | ✓ | ✓ | ✓ | — | — |
| Bảo hành | ✓ | ✓ | ✓ | — | — |
| Vật tư | ✓ | ✓ | ✓ | — | — |
| Sản phẩm | ✓ | ✓ | ✓ | đọc | đọc |
| Khách hàng / CRM | ✓ | ✓ | tùy | đọc | ✓ |
| Phản ánh | ✓ | ✓ | ✓ | đọc | đọc |
| Báo cáo | ✓ | ✓ | — | ✓ | ✓ |
| Quy trình | ✓ | ✓ | theo bước | đọc | đọc |
| Cài đặt | ✓ | giới hạn | — | — | — |

---

## 7. NHÓM WORKFLOW MODULE

| Module key | Tên hiển thị | Áp dụng |
|---|---|---|
| \`handover\` | Bàn giao | Phiếu bàn giao |
| \`coaching\` | Huấn luyện | Khóa HL |
| \`training\` | Đào tạo | Khóa đào tạo |
| \`warranty\` | Bảo hành | Phiếu BH/SC |
| \`product\` | Sản phẩm | Quy trình SP |
| \`contract\` | Hợp đồng (tổng hợp) | **Ẩn UI** |

---

## 8. KẾT LUẬN

Tài liệu BRD ASMS v1.0 liệt kê **${totalUc} use case** trên **${modules.length} phân hệ**, phục vụ UAT và nghiệm thu. Nguồn: \`docs/file docs/use-case-asms.md\`.

**Tài liệu liên quan:** \`docs/SRS-ASMS.md\`, \`docs/BRD-TONG-THE-ASMS.md\`
`;

function buildUpdatedFooter() {
  return `
---

## 6. MA TRẬN PHÂN QUYỀN (PHẠM VI VẬN HÀNH)

| Phân hệ | Menu | admin | manager | technician | viewer | sales |
|---|:---:|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Hợp đồng | ✅ | ✓ | ✓ | — | đọc | ✓ |
| Bàn giao / HL | ✅ | ✓ | ✓ | ✓ | — | — |
| Bảo hành | ✅ | ✓ | ✓ | ✓ | — | — |
| Vật tư | ✅ | ✓ | ✓ | ✓ | — | — |
| Sản phẩm | ✅ | ✓ | ✓ | ✓ | đọc | đọc |
| Khách hàng / CRM | ✅ | ✓ | ✓ | tùy | đọc | ✓ |
| Phản ánh | ✅ | ✓ | ✓ | ✓ | đọc | đọc |
| Báo cáo | ✅ | ✓ | ✓ | — | ✓ | ✓ |
| Quy trình | ✅ | ✓ | ✓ | theo bước | đọc | đọc |
| Cài đặt | ✅ | ✓ | giới hạn | — | — | — |
| Đề tài NC | ⛔ | — | — | — | — | — |
| Công việc | ⛔ | — | — | — | — | — |
| Đào tạo (màn riêng) | ⛔ | — | — | — | — | — |

---

## 7. NHÓM QUY TRÌNH (ĐANG HIỂN THỊ)

| Module key | Tên | Áp dụng | Menu QT |
|---|---|---|:---:|
| \`handover\` | Bàn giao | Phiếu bàn giao | ✅ |
| \`coaching\` | Huấn luyện | Tab HL trên Bàn giao | ✅ |
| \`training\` | Đào tạo | Khóa đào tạo (API) | ✅ |
| \`warranty\` | Bảo hành | Phiếu BH/SC | ✅ |
| \`product\` | Sản phẩm | Quy trình SP | ✅ |
| \`contract\` | Hợp đồng (tổng hợp) | — | ⛔ Ẩn |

---

## 8. PHỤ LỤC A — USE CASE MÀN ẨN (KHÔNG SỬ DỤNG)

Các UC sau **không** có trong phạm vi UAT/vận hành hiện tại. Liệt kê tham chiếu — **không** có biểu đồ tuần tự.

${hiddenModules.map((m) => `### A.${m.num}. ${m.title}

**Route:** ${m.route || "—"} · **Module:** \`${m.moduleKey}\` · **Số UC:** ${m.ucs.length}

| Mã UC | Use Case | Trạng thái |
|---|---|---|
${m.ucs.map((uc) => `| \`${uc.code}\` | ${uc.name} | ⛔ Ẩn menu — không sử dụng |`).join("\n")}

`).join("\n")}

---

## 9. KẾT LUẬN

BRD cập nhật ASMS v1.1 mô tả **${activeUc} use case vận hành** trên **${activeModules.length} phân hệ** có menu. **${hiddenUc} UC** thuộc **${hiddenModules.length} màn ẩn** được liệt kê tại Phụ lục A — ngoài phạm vi triển khai hiện tại.

**Tham chiếu:** \`docs/file docs/use-case-asms.md\` · \`src/lib/nav-visibility.ts\` · \`src/lib/workflow-visibility.ts\`
`;
}

function buildMdContent(mode) {
  const intro = buildIntro(mode);

  const archSection = `## 2. KIẾN TRÚC TỔNG THỂ HỆ THỐNG

### 2.1 Sơ đồ kiến trúc logic — 5 tầng

${mode === "updated" ? "> Kiến trúc chỉ mô tả **luồng vận hành đang dùng**. Màn ẩn (Đề tài, Công việc, Đào tạo riêng) không xuất hiện trên menu.\n\n" : ""}[[ARCHITECTURE_DIAGRAM]]

**Giải thích các tầng:**

| Tầng | Vai trò |
|---|---|
| **1. Người dùng & Kênh truy cập** | Web quản trị và vận hành; đăng nhập JWT |
| **2. Cổng giao tiếp & Bảo mật** | API Gateway \`/api/v1\`, RBAC 5 vai trò |
| **3. Hệ thống lõi** | Module nghiệp vụ: HĐ, BG, BH, SP, VT, CRM, PA, Quy trình |
| **4. Lưu trữ dữ liệu** | PostgreSQL, file upload, job thông báo |
| **5. Nền tảng công nghệ** | React + Vite, Express + TS, Prisma, Docker |

---

`;

  const flowSection = `## 3. LUỒNG TỔNG THỂ END-TO-END

\`\`\`mermaid
sequenceDiagram
    actor KH as Khách hàng
    actor NV as Nhân viên
    participant ASMS as Hệ thống ASMS
    actor QL as Quản lý

    rect rgb(238, 242, 255)
    Note over NV,ASMS: Giai đoạn 1 — Hợp đồng
    NV->>ASMS: "Tạo HĐ, gán KH và sản phẩm"
    ASMS->>ASMS: "Khởi tạo quy trình HĐ"
    QL->>ASMS: "Duyệt bước quy trình HĐ"
    end

    rect rgb(220, 252, 231)
    Note over NV,ASMS: Giai đoạn 2 — Bàn giao và Huấn luyện
    NV->>ASMS: "Tạo phiếu bàn giao"
    ASMS->>ASMS: "Chạy quy trình bàn giao"
    NV->>ASMS: "Tạo khóa huấn luyện"
    QL->>ASMS: "Ký duyệt và ban hành huấn luyện"
    end

    rect rgb(254, 243, 199)
    Note over KH,ASMS: Giai đoạn 3 — Bảo hành và Phản ánh
    KH->>NV: "Yêu cầu bảo hành hoặc phản ánh"
    NV->>ASMS: "Tạo phiếu BH hoặc phản ánh"
    ASMS->>ASMS: "Quy trình bảo hành và phân luồng PA"
    NV->>ASMS: "Xử lý và đóng phản ánh"
    end

    rect rgb(207, 250, 254)
    Note over QL,ASMS: Giai đoạn 4 — Báo cáo
    QL->>ASMS: "Xem bảng điều khiển và báo cáo"
    ASMS-->>QL: "KPI và cảnh báo SLA"
    end
\`\`\`

**Tóm tắt:** Luồng vận hành: Hợp đồng → Bàn giao & Huấn luyện → Bảo hành / Phản ánh → Báo cáo.

### Quy tắc hiển thị Phản ánh

| Vai trò | Danh sách PA |
|---|---|
| **Quản trị viên** | Xem tất cả phản ánh |
| **Người khác** | Chỉ PA được phân công |

---

`;

  const summaryNum = "4";
  const ucSectionNum = "5";

  const summarySection = `## ${summaryNum}. TỔNG HỢP USE CASE THEO MODULE

| # | Phân hệ | Module key | Số UC | Trạng thái |
|---:|---|---|--:|---|
${modules.map((m) => {
  const st = isModuleHidden(m) ? "⛔ Ẩn — không dùng" : "✅ Đang vận hành";
  return `| ${m.num} | ${m.title.replace(/\(.*\)/, "").trim()} | ${m.moduleKey || "—"} | ${m.ucs.length} | ${st} |`;
}).join("\n")}
| | **Tổng codebase** | | **${totalUc}** | |
${mode === "updated" ? `| | **Phạm vi vận hành** | | **${activeUc}** | ✅ |` : ""}

---

## ${ucSectionNum}. CÁC USE CASE CHI TIẾT${mode === "updated" ? " (ĐANG VẬN HÀNH)" : ""}

`;

  const ucModules = mode === "updated" ? activeModules : modules;
  const ucBody = ucModules.map((m, i) => renderModule(m, i + 1, { includeDiagrams: true })).join("\n");

  const endFooter = mode === "updated" ? buildUpdatedFooter() : footer;

  if (mode === "full") {
    return intro + archSection + flowSection + summarySection + ucBody + endFooter;
  }
  return intro + archSection + flowSection + summarySection + ucBody + endFooter;
}

function buildHtmlTemplate(cfg) {
  const { docCode, version, subtitle, metaPhamVi, ucCount, footerLabel } = cfg;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>BRD — ASMS — ${cfg.title || "Use Case"}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#d0d0d0;font-family:'Be Vietnam Pro','Segoe UI',Arial,sans-serif;font-size:11px;color:#0d1e34;}
.doc-page{width:210mm;min-height:297mm;margin:10mm auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.25);position:relative;overflow:hidden;display:flex;flex-direction:column;}
@media print{body{background:#fff;}.doc-page{margin:0;box-shadow:none;page-break-after:always;}}
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
.md-render table{width:100%;border-collapse:collapse;font-size:10.5px;margin:10px 0;}
.md-render th,.md-render td{border:1px solid #cbd5e0;padding:5px 8px;vertical-align:top;text-align:left;}
.md-render th{background:#1e3a5f;color:#fff;font-weight:600;}
.md-render tr:nth-child(even) td{background:#f7fafc;}
.md-render hr{border:none;border-top:1px dashed #c8d8ec;margin:14px 0;}
.md-render blockquote{margin:10px 0;padding:8px 14px;background:#fff8e1;border-left:4px solid #f59e0b;font-size:11.5px;}
.md-render code{font-family:Consolas,monospace;font-size:10px;background:#f1f5f9;padding:1px 5px;border-radius:3px;}
.md-render .mermaid{text-align:center;margin:14px 0;background:#fafbfd;padding:12px;border-radius:6px;border:1px solid #eaeff8;}
.md-render .mermaid svg{max-width:100%;height:auto;}
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
    <div class="header-right">Phiên bản ${version} &nbsp;·&nbsp; 06/2026 &nbsp;·&nbsp; ${ucCount} Use Case</div>
  </div>
  <div class="divider"></div>
  <div class="main">
    <div class="logo-wrap"><img src="assets/unicom-logo.png" alt="UNICOM AI Software Factory" /></div>
    <div class="sep"></div>
    <div class="doc-label">Business Requirements Document (BRD)</div>
    <div class="project-title"><span class="brand">Hệ thống ASMS</span></div>
    <div class="subtitle">${subtitle}</div>
    <div class="meta-info">
      ${metaPhamVi}
    </div>
  </div>
  <div class="footer">
    <div class="footer-l">UNICOM TECHNOLOGY SOLUTIONS CO., LTD</div>
    <div class="footer-r">${footerLabel}</div>
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
    <p class="toc-subtitle">Danh mục ${ucCount} use case — nhấn để di chuyển nhanh.</p>
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
wrapper.className = 'doc-page';
wrapper.innerHTML = '<div class="inner-brd-header"><div class="inner-brd-code">Mã tài liệu: <span>${docCode}</span></div><div class="inner-brd-right">ASMS &nbsp;·&nbsp; Phiên bản ${version}</div></div><div class="inner-brd-divider"></div><div class="content-area"><div class="md-render">' + htmlContent + '</div></div><div class="inner-brd-footer"><div class="inner-brd-footer-l">UNICOM TECHNOLOGY SOLUTIONS CO., LTD</div><div class="inner-brd-footer-r"><span class="ft-page">${footerLabel}</span></div></div>';
host.appendChild(wrapper);
const archHtml = ${JSON.stringify(architectureHtml)};
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
(async function() {
  try {
    await mermaid.run({ querySelector: '.mermaid', suppressErrors: true });
  } catch (err) {
    console.error('Mermaid render error:', err);
  }
})();
</script>
</body>
</html>`;
}

function writeBrd(mode, outPath, htmlCfg) {
  const mdContent = buildMdContent(mode);
  const htmlTemplate = buildHtmlTemplate(htmlCfg);
  const htmlFinal = htmlTemplate.replace(
    '<script id="md-source" type="text/markdown"></script>',
    `<script id="md-source" type="text/markdown">\n${mdContent}\n</script>`
  );
  fs.writeFileSync(outPath, htmlFinal, "utf8");
  const ucCount = mode === "updated" ? activeUc : totalUc;
  const modCount = mode === "updated" ? activeModules.length : modules.length;
  console.log(`Generated ${outPath} (${modCount} phân hệ, ${ucCount} UC)`);
}

const docsDir = path.resolve(__dirname, "../docs/file docs");

writeBrd("full", path.join(docsDir, "ASMS_BRD.html"), {
  title: "Use Case đầy đủ",
  docCode: "UNICOM/BRD-ASMS-001",
  version: "1.0",
  subtitle: "After-Sales Management System — Quản lý hậu mãi quốc phòng",
  metaPhamVi: `<strong>Phạm vi:</strong> ${modules.length} phân hệ · ${totalUc} use case (đầy đủ codebase)<br>
      <strong>Nguồn:</strong> docs/file docs/use-case-asms.md<br>
      <strong>Định dạng:</strong> Mục đích · Thuộc tính · Sequence · Diễn giải bước`,
  ucCount: totalUc,
  footerLabel: "ASMS — BRD v1.0",
});

writeBrd("updated", path.join(docsDir, "ASMS_BRD_UPDATED.html"), {
  title: "BRD Cập nhật — Phạm vi vận hành",
  docCode: "UNICOM/BRD-ASMS-002",
  version: "1.1",
  subtitle: "BRD Cập nhật — Chỉ màn đang vận hành (loại trừ màn ẩn)",
  metaPhamVi: `<strong>Phạm vi vận hành:</strong> ${activeModules.length} phân hệ · ${activeUc} use case đang dùng<br>
      <strong>Loại trừ:</strong> ${hiddenModules.length} màn ẩn (${hiddenUc} UC) — Đề tài, Công việc, Đào tạo riêng<br>
      <strong>QT ẩn:</strong> contract (Hợp đồng tổng hợp)`,
  ucCount: activeUc,
  footerLabel: "ASMS — BRD Cập nhật v1.1",
});
