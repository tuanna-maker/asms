/**
 * Sinh tài liệu quản lý tiến độ theo Use Case.
 * Nguồn: docs/uc-test-matrix.md
 * Chạy: node scripts/generate-uc-progress-doc.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const matrixPath = resolve(root, "docs/uc-test-matrix.md");

/** Phạm vi 152 UC — đồng bộ BRD / export-asms-uc-excel.py (loại màn ẩn menu). */
const HIDDEN_MODULE_KEYS = new Set(["de-tai", "cong-viec", "dao-tao"]);
const SCOPE_LABEL = "152 UC vận hành · 14 phân hệ có menu";

const MODULE_LABELS = {
  AUTH: "Xác thực",
  dashboard: "Dashboard",
  "hop-dong": "Hợp đồng",
  "hop-dong.dieu-khoan": "Hợp đồng — Điều khoản",
  "ban-giao": "Bàn giao",
  "bao-hanh": "Bảo hành",
  "san-pham": "Sản phẩm",
  "vat-tu": "Vật tư",
  "khach-hang": "Khách hàng",
  "phan-anh": "Phản ánh",
  "bao-cao": "Báo cáo",
  "tai-lieu": "Tài liệu",
  "quy-trinh": "Quy trình",
  "cai-dat": "Cài đặt",
  "thong-bao": "Thông báo",
};

const MODULE_ORDER = [
  "AUTH",
  "dashboard",
  "hop-dong",
  "hop-dong.dieu-khoan",
  "ban-giao",
  "bao-hanh",
  "san-pham",
  "vat-tu",
  "khach-hang",
  "phan-anh",
  "bao-cao",
  "tai-lieu",
  "quy-trinh",
  "cai-dat",
  "thong-bao",
];

function parseMatrix(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(
      /^\| (UC-[A-Za-z0-9-]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/,
    );
    if (!m) continue;
    rows.push({
      id: m[1],
      name: m[2].trim(),
      mod: m[3].trim(),
      testType: m[4].trim(),
      script: m[5].trim(),
      status: m[6].trim(),
      note: m[7].trim(),
    });
  }
  return rows;
}

/** Ước tính ngày công dev theo tên UC (có thể chỉnh trong scripts/uc-effort-overrides.json sau). */
function estimateDays(name, mod) {
  const n = name.toLowerCase();
  if (n.includes("quy trình") || n.includes("workflow") || n.includes("bước quy")) return 1.5;
  if (n.includes("phê duyệt") || n.includes("chuyển trạng thái")) return 1;
  if (n.includes("xuất") || n.includes("in báo") || n.includes("export")) return 0.5;
  if (n.startsWith("tạo") || n.includes("tạo mới") || n.includes("tạo phiếu")) return 1;
  if (n.startsWith("sửa") || n.includes("cập nhật")) return 0.75;
  if (n.startsWith("xóa")) return 0.5;
  if (n.includes("danh sách") || n.includes("xem danh")) return 0.5;
  if (n.includes("chi tiết")) return 0.5;
  if (n.includes("lọc") || n.includes("tìm kiếm") || n.includes("thống kê")) return 0.5;
  if (mod === "dashboard") return 1;
  if (mod === "quy-trinh") return 1;
  if (mod === "cai-dat") return 0.5;
  return 0.5;
}

function statusLabel(status) {
  if (status === "pass") return { text: "Hoàn thành", cls: "done" };
  if (status === "manual") return { text: "Hoàn thành (thủ công)", cls: "done" };
  if (status === "no_data") return { text: "Hoàn thành (thiếu seed)", cls: "partial" };
  if (status === "pending") return { text: "Chưa làm", cls: "pending" };
  return { text: "Chưa làm", cls: "pending" };
}

function isDone(status) {
  return status === "pass" || status === "manual" || status === "no_data";
}

function formatDays(d) {
  if (d % 1 === 0) return String(d);
  return d.toFixed(2).replace(/\.?0+$/, "");
}

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupByModule(rows) {
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.mod)) groups.set(r.mod, []);
    groups.get(r.mod).push(r);
  }
  return MODULE_ORDER.filter((m) => groups.has(m)).map((m) => ({
    mod: m,
    label: MODULE_LABELS[m] ?? m,
    rows: groups.get(m),
  }));
}

function buildSummary(rows) {
  const done = rows.filter((r) => isDone(r.status));
  const pending = rows.filter((r) => !isDone(r.status));
  const totalDays = done.reduce((s, r) => s + r.days, 0);
  const byStatus = {};
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  return { done: done.length, pending: pending.length, totalDays, byStatus };
}

function renderTableRows(moduleRows, startIdx = 1) {
  let html = "";
  let i = startIdx;
  for (const r of moduleRows) {
    const st = statusLabel(r.status);
    const daysCell = isDone(r.status)
      ? `<strong>${formatDays(r.days)}</strong> ngày`
      : "—";
    const note = r.note ? `<br><span class="note">${esc(r.note)}</span>` : "";
    html += `<tr>
      <td class="num">${i++}</td>
      <td><code>${esc(r.id)}</code></td>
      <td>${esc(r.name)}${note}</td>
      <td><span class="badge ${st.cls}">${st.text}</span></td>
      <td class="days">${daysCell}</td>
    </tr>`;
  }
  return html;
}

function renderModuleSummaryTable(groups) {
  let html = `<table class="spec-table">
    <thead><tr><th>Phân hệ</th><th>Số UC</th><th>Đã xong</th><th>Tổng thời gian</th></tr></thead><tbody>`;
  for (const g of groups) {
    const done = g.rows.filter((r) => isDone(r.status));
    const days = done.reduce((s, r) => s + r.days, 0);
    html += `<tr>
      <td><strong>${esc(g.label)}</strong> <code>${esc(g.mod)}</code></td>
      <td class="num">${g.rows.length}</td>
      <td class="num">${done.length}</td>
      <td class="num"><strong>${formatDays(days)}</strong> ngày</td>
    </tr>`;
  }
  html += "</tbody></table>";
  return html;
}

function pageShell(headerRight, bodyHtml, pageId = "") {
  return `<div class="doc-page"${pageId ? ` id="${pageId}"` : ""}>
    <div class="inner-brd-header"><div>Mã tài liệu: <span>UNICOM/PM-ASMS-001</span></div><div>${headerRight}</div></div>
    <div class="inner-brd-divider"></div>
    <div class="content-area">${bodyHtml}</div>
    <div class="inner-brd-footer"><div>CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ UNICOM</div><div class="inner-brd-footer-r"><span class="ft-page">${headerRight}</span></div></div>
</div>`;
}

function buildHtml(rows, groups, summary, scope) {
  const date = "24/06/2026";
  const version = "4.1";

  let toc = "";
  let idx = 1;
  toc += `<div class="toc-category-title">Tổng quan</div>`;
  toc += `<a href="#kpi" class="toc-row"><span class="toc-num">${String(idx++).padStart(2, "0")}</span> Chỉ số tổng hợp</a>`;
  toc += `<a href="#summary-module" class="toc-row"><span class="toc-num">${String(idx++).padStart(2, "0")}</span> Tổng hợp theo phân hệ</a>`;
  toc += `<div class="toc-category-title">Danh sách Use Case</div>`;
  for (const g of groups) {
    const anchor = `uc-${g.mod.replace(/\./g, "-")}`;
    toc += `<a href="#${anchor}" class="toc-row"><span class="toc-num">${String(idx++).padStart(2, "0")}</span> ${esc(g.label)} (${g.rows.length} UC)</a>`;
  }
  toc += `<div class="toc-category-title">Tham chiếu</div>`;
  toc += `<a href="#history" class="toc-row"><span class="toc-num">${String(idx++).padStart(2, "0")}</span> Lịch sử phiên bản</a>`;

  const kpi = `<h2>1. Chỉ số tổng hợp</h2>
<div class="highlight-box green">
  Liệt kê <strong>${rows.length} Use Case</strong> trong phạm vi <strong>${SCOPE_LABEL}</strong> (theo BRD / <code>use-case-asms.md</code>).
  Không gồm <strong>${scope.excluded}</strong> UC thuộc màn ẩn menu: Đề tài, Công việc, Đào tạo &amp; HL.
  Cột <strong>Thời gian</strong> = <strong>ngày công dev</strong> ước tính cho UC đã hoàn thành.
</div>
<div class="kpi-grid">
  <div class="kpi-card"><div class="val">${rows.length}</div><div class="lbl">Use Case (phạm vi 152)</div><div class="sub">14 phân hệ</div></div>
  <div class="kpi-card"><div class="val">${summary.done}</div><div class="lbl">Đã hoàn thành</div><div class="sub">pass ${summary.byStatus.pass ?? 0} · manual ${summary.byStatus.manual ?? 0} · no_data ${summary.byStatus.no_data ?? 0}</div></div>
  <div class="kpi-card"><div class="val">${formatDays(summary.totalDays)}</div><div class="lbl">Tổng ngày công (ước tính)</div><div class="sub">chỉ UC đã xong</div></div>
</div>
<p><strong>Nguồn trạng thái:</strong> <code>docs/uc-test-matrix.md</code> (lọc bỏ module ẩn menu).</p>
<p><strong>Nguồn thời gian:</strong> ước tính theo độ phức tạp nghiệp vụ — chỉnh trong <code>scripts/generate-uc-progress-doc.mjs</code>.</p>`;

  const summaryModule = `<h2 id="summary-module">2. Tổng hợp theo phân hệ</h2>
${renderModuleSummaryTable(groups)}`;

  let detailPages = "";
  let sectionNum = 3;
  for (const g of groups) {
    const anchor = `uc-${g.mod.replace(/\./g, "-")}`;
    const done = g.rows.filter((r) => isDone(r.status));
    const days = done.reduce((s, r) => s + r.days, 0);
    const table = `<h2 id="${anchor}">${sectionNum}. ${esc(g.label)}</h2>
<p class="module-meta"><code>${esc(g.mod)}</code> · ${g.rows.length} UC · <strong>${formatDays(days)}</strong> ngày công (ước tính)</p>
<table class="spec-table uc-table">
<thead><tr><th>STT</th><th>Mã UC</th><th>Tên Use Case</th><th>Trạng thái</th><th>Thời gian</th></tr></thead>
<tbody>
${renderTableRows(g.rows)}
</tbody></table>`;
    detailPages += pageShell(`ASMS · Tiến độ v${version}`, table);
    sectionNum++;
  }

  const history = pageShell(
    `ASMS · Tiến độ v${version}`,
    `<h2 id="history">Lịch sử phiên bản</h2>
<table class="spec-table">
<thead><tr><th>Phiên bản</th><th>Nội dung</th></tr></thead>
<tbody>
<tr><td><strong>4.1</strong></td><td>Phạm vi 152 UC vận hành — loại màn ẩn menu (Đề tài, Công việc, Đào tạo)</td></tr>
<tr><td>4.0</td><td>Liệt kê toàn bộ 171 UC + thời gian ước tính</td></tr>
<tr><td>3.1</td><td>Chỉ hạng mục đã xong (theo màn/phân hệ)</td></tr>
<tr><td>3.0</td><td>Chi tiết kiểu BATECO</td></tr>
<tr><td>2.0</td><td>Bản HTML in A4</td></tr>
</tbody></table>
<p class="gen-note">Tự sinh: <code>node scripts/generate-uc-progress-doc.mjs</code> — ${date}</p>`,
    "history",
  );

  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản lý tiến độ dự án — ASMS (Use Case)</title>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #d0d0d0; font-family: 'Be Vietnam Pro', 'Segoe UI', sans-serif; font-size: 14px; color: #0d1e34; line-height: 1.6; }
        .doc-page { width: 210mm; min-height: 297mm; margin: 10mm auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.25); display: flex; flex-direction: column; overflow: hidden; }
        @media print { @page { margin: 0; size: A4 portrait; } body { background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .doc-page { margin: 0 !important; box-shadow: none !important; page-break-after: always; } }
        .doc-page.cover { padding: 0; }
        .accent-bar { height: 8px; background: linear-gradient(90deg, #3d7de8, #0ab4d8); }
        .cover .header { padding: 22px 52px; display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 600; }
        .cover .divider { margin: 0 52px; height: 1px; background: #eaeff8; }
        .cover .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-bottom: 50px; }
        .cover .logo-wrap img { width: 220px; }
        .cover .sep { width: 52px; height: 3px; background: linear-gradient(90deg, #3d7de8, #0ab4d8); border-radius: 2px; margin: 24px auto; }
        .cover .doc-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; margin-bottom: 14px; }
        .cover .project-title { font-size: 34px; font-weight: 900; }
        .cover .project-title span { background: linear-gradient(135deg, #3d7de8, #0ab4d8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cover .subtitle { margin-top: 12px; font-size: 12px; color: #3a4a64; max-width: 520px; line-height: 1.7; }
        .cover .meta-info { margin-top: 28px; font-size: 10.5px; color: #3a4a64; line-height: 1.9; }
        .cover .footer { padding: 18px 52px; display: flex; justify-content: space-between; border-top: 1px solid #eaeff8; font-size: 9.5px; }
        .inner-brd-header { padding: 20px 48px 20px 68px; display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 600; }
        .inner-brd-divider { margin: 0 48px 0 68px; height: 1px; background: #eaeff8; }
        .inner-brd-footer { padding: 16px 48px 16px 68px; display: flex; justify-content: space-between; border-top: 1px solid #eaeff8; font-size: 9.5px; }
        .inner-brd-footer-r .ft-page { display: block; font-weight: 600; }
        .content-area { flex: 1; padding: 18px 48px 50px 68px; color: #1a2740; }
        h1.toc-title { font-size: 20px; font-weight: 900; border-bottom: 2px solid #3d7de8; padding-bottom: 8px; margin-bottom: 10px; }
        h2 { font-size: 17px; font-weight: 800; margin: 14px 0 8px; padding: 5px 10px; background: linear-gradient(90deg, #eef4ff, transparent); border-left: 4px solid #3d7de8; }
        p { margin: 5px 0; font-size: 12px; }
        .module-meta { font-size: 11px; color: #64748b; margin-bottom: 8px; }
        .toc-category-title { font-size: 10px; font-weight: 700; color: #3d7de8; margin: 12px 0 4px; }
        .toc-row { display: flex; gap: 10px; padding: 7px 10px; border: 1px solid #eaeff8; border-radius: 8px; text-decoration: none; color: #1a2740; background: #fbfdff; margin-bottom: 6px; font-size: 12.5px; }
        .toc-num { font-weight: 800; color: #3d7de8; min-width: 22px; }
        .spec-table { width: 100%; border-collapse: collapse; font-size: 9.5px; margin: 8px 0; }
        .spec-table th { background: #1e3a5f; color: #fff; padding: 6px 7px; text-align: left; border: 1px solid #cbd5e0; }
        .spec-table td { border: 1px solid #cbd5e0; padding: 5px 7px; vertical-align: top; }
        .spec-table tr:nth-child(even) td { background: #f7fafc; }
        .uc-table td.num, .uc-table th:first-child { width: 32px; text-align: center; }
        .uc-table td.days { width: 72px; text-align: right; white-space: nowrap; }
        .highlight-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 10px 12px; margin: 10px 0; border-radius: 0 8px 8px 0; font-size: 12px; }
        .highlight-box.green { background: #f0fdf4; border-left-color: #22c55e; }
        .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 12px 0; }
        .kpi-card { border: 1px solid #86efac; border-radius: 10px; padding: 14px 10px; text-align: center; background: #f0fdf4; }
        .kpi-card .val { font-size: 26px; font-weight: 900; color: #16a34a; line-height: 1.1; }
        .kpi-card .lbl { font-size: 9.5px; color: #64748b; margin-top: 4px; font-weight: 600; }
        .kpi-card .sub { font-size: 8.5px; color: #94a3b8; margin-top: 2px; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 12px; font-size: 8.5px; font-weight: 700; white-space: nowrap; }
        .badge.done { background: #dcfce7; color: #166534; }
        .badge.partial { background: #fef9c3; color: #854d0e; }
        .badge.pending { background: #fee2e2; color: #991b1b; }
        code { font-family: Consolas, Monaco, monospace; color: #3d7de8; background: #f1f5f9; padding: 1px 4px; border-radius: 4px; font-size: 9px; }
        .note { color: #64748b; font-size: 8.5px; }
        .gen-note { margin-top: 16px; font-size: 10px; color: #94a3b8; }
    </style>
</head>
<body>

<div class="doc-page cover">
    <div class="accent-bar"></div>
    <div class="header">
        <div>Mã tài liệu: <span>UNICOM/PM-ASMS-001</span></div>
        <div>Phiên bản ${version} · ${date}</div>
    </div>
    <div class="divider"></div>
    <div class="main">
        <div class="logo-wrap"><img src="file%20docs/assets/unicom-logo.png" alt="Logo Unicom"></div>
        <div class="sep"></div>
        <div class="doc-label">Báo cáo tiến độ dự án</div>
        <div class="project-title"><span>ASMS</span></div>
        <div class="subtitle">Danh sách Use Case &amp; thời gian triển khai<br>Hệ thống quản lý hậu mãi · ${SCOPE_LABEL}</div>
        <div class="meta-info">
            <strong>Khách hàng:</strong> Viện Công nghệ (VTX)<br>
            <strong>Đơn vị phát triển:</strong> Công ty TNHH Giải pháp Công nghệ Unicom<br>
            <strong>Phạm vi:</strong> ${rows.length} UC vận hành — loại trừ màn ẩn menu (Đề tài, Công việc, Đào tạo)
        </div>
    </div>
    <div class="footer">
        <div>CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ UNICOM</div>
        <div>© 2026 — Bảo mật nội bộ</div>
    </div>
</div>

${pageShell(`ASMS · Tiến độ v${version}`, `<h1 class="toc-title">Mục lục</h1>${toc}`)}

${pageShell(`ASMS · Tiến độ v${version}`, kpi, "kpi")}

${pageShell(`ASMS · Tiến độ v${version}`, summaryModule)}

${detailPages}

${history}

</body>
</html>`;
}

function buildMd(rows, groups, summary, scope) {
  const date = "24/06/2026";
  const version = "4.1";
  let md = `# Kế hoạch quản lý tiến độ dự án ASMS

| Thuộc tính | Nội dung |
|---|---|
| **Tên dự án** | ASMS — Hệ thống quản lý hậu mãi |
| **Phiên bản** | ${version} |
| **Ngày cập nhật** | ${date} |
| **Phạm vi** | **${rows.length} Use Case vận hành** (14 phân hệ có menu) — loại ${scope.excluded} UC màn ẩn menu |
| **Bản in A4** | [ke-hoach-quan-ly-tien-do-du-an-asms.html](./ke-hoach-quan-ly-tien-do-du-an-asms.html) |

> Thời gian là **ước tính ngày công dev**. Phạm vi 152 UC đồng bộ BRD / \`export-asms-uc-excel.py\`. Sinh: \`node scripts/generate-uc-progress-doc.mjs\`

---

## 1. Chỉ số tổng hợp

| Chỉ số | Giá trị |
|--------|--------:|
| Tổng Use Case (phạm vi 152) | **${rows.length}** |
| Đã hoàn thành | **${summary.done}** (pass ${summary.byStatus.pass ?? 0}, manual ${summary.byStatus.manual ?? 0}, no_data ${summary.byStatus.no_data ?? 0}) |
| Tổng ngày công (ước tính) | **${formatDays(summary.totalDays)}** |

---

## 2. Tổng hợp theo phân hệ

| Phân hệ | Module | Số UC | Đã xong | Tổng thời gian |
|---------|--------|------:|--------:|---------------:|
`;

  for (const g of groups) {
    const done = g.rows.filter((r) => isDone(r.status));
    const days = done.reduce((s, r) => s + r.days, 0);
    md += `| ${g.label} | \`${g.mod}\` | ${g.rows.length} | ${done.length} | ${formatDays(days)} ngày |\n`;
  }

  md += `\n---\n\n## 3. Danh sách Use Case chi tiết\n\n`;

  let section = 3;
  for (const g of groups) {
    const done = g.rows.filter((r) => isDone(r.status));
    const days = done.reduce((s, r) => s + r.days, 0);
    md += `### ${section}. ${g.label} (\`${g.mod}\`) — ${formatDays(days)} ngày\n\n`;
    md += `| STT | Mã UC | Tên | Trạng thái | Thời gian |\n|----:|-------|-----|------------|----------:|\n`;
    g.rows.forEach((r, i) => {
      const st = statusLabel(r.status).text;
      const daysCell = isDone(r.status) ? `${formatDays(r.days)} ngày` : "—";
      const note = r.note ? ` *(${r.note})*` : "";
      md += `| ${i + 1} | ${r.id} | ${r.name}${note} | ${st} | ${daysCell} |\n`;
    });
    md += "\n";
    section++;
  }

  md += `---

## Lịch sử phiên bản

| Phiên bản | Nội dung |
|-----------|----------|
| ${version} | Phạm vi 152 UC vận hành — loại màn ẩn menu |
| 4.0 | Liệt kê 171 UC (gồm màn ẩn menu) |
| 3.1 | Chỉ hạng mục đã xong (theo màn/phân hệ) |
| 3.0 | Chi tiết kiểu BATECO |
`;

  return md;
}

// --- main ---
const matrixMd = readFileSync(matrixPath, "utf8");
const allRows = parseMatrix(matrixMd);
const excludedRows = allRows.filter((r) => HIDDEN_MODULE_KEYS.has(r.mod));
const rows = allRows
  .filter((r) => !HIDDEN_MODULE_KEYS.has(r.mod))
  .map((r) => ({
    ...r,
    days: isDone(r.status) ? estimateDays(r.name, r.mod) : 0,
  }));
const scope = { total: allRows.length, excluded: excludedRows.length };
const groups = groupByModule(rows);
const summary = buildSummary(rows);

const html = buildHtml(rows, groups, summary, scope);
const md = buildMd(rows, groups, summary, scope);

const outHtml1 = resolve(root, "docs/ASMS_quan-ly-tien-do-du-an.html");
const outHtml2 = resolve(root, "docs/ke-hoach-quan-ly-tien-do-du-an-asms.html");
const outMd = resolve(root, "docs/ke-hoach-quan-ly-tien-do-du-an-asms.md");

writeFileSync(outHtml1, html, "utf8");
writeFileSync(outHtml2, html, "utf8");
writeFileSync(outMd, md, "utf8");

console.log(`Generated ${rows.length} UCs (scope 152, excluded ${scope.excluded}), ${formatDays(summary.totalDays)} total days`);
console.log(`  ${outHtml1}`);
console.log(`  ${outHtml2}`);
console.log(`  ${outMd}`);
