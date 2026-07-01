/**
 * Sinh tài liệu quản lý tiến độ dạng biểu đồ % theo phân hệ.
 * Chỉ theo UC: chức năng hoạt động (pass / manual / no_data) = hoàn thành.
 * Nguồn: docs/uc-test-matrix.md
 * Chạy: node scripts/generate-progress-charts-doc.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const matrixPath = resolve(root, "docs/uc-test-matrix.md");

const HIDDEN_MODULE_KEYS = new Set(["de-tai", "cong-viec", "dao-tao"]);

const MODULE_LABELS = {
  AUTH: "Xác thực",
  dashboard: "Dashboard",
  "hop-dong": "Hợp đồng",
  "hop-dong.dieu-khoan": "HĐ — Điều khoản",
  "ban-giao": "Bàn giao & HL",
  "bao-hanh": "Bảo hành / SC",
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
  "quy-trinh",
  "hop-dong",
  "hop-dong.dieu-khoan",
  "ban-giao",
  "bao-hanh",
  "phan-anh",
  "khach-hang",
  "san-pham",
  "vat-tu",
  "bao-cao",
  "tai-lieu",
  "cai-dat",
  "thong-bao",
];

const GROUPS = [
  { id: "nentang", label: "Nền tảng & bảo mật", mods: ["AUTH", "cai-dat"] },
  { id: "dieuhanh", label: "Điều hành tổng thể", mods: ["dashboard", "bao-cao"] },
  { id: "quytrinh", label: "Quy trình & hợp đồng", mods: ["quy-trinh", "hop-dong", "hop-dong.dieu-khoan"] },
  { id: "vanhanh", label: "Vận hành", mods: ["ban-giao", "bao-hanh", "phan-anh"] },
  { id: "danhmuc", label: "Danh mục & master data", mods: ["san-pham", "vat-tu", "khach-hang"] },
  { id: "hotro", label: "Tài liệu & thông báo", mods: ["tai-lieu", "thong-bao"] },
];

/** Thời gian triển khai giai đoạn này */
const PROJECT = {
  startLabel: "05/05/2026",
  endLabel: "20/06/2026",
  startIso: "2026-05-05",
  endIso: "2026-06-20",
  totalDays: 47,
};

const ROADMAP_PHASES = [
  {
    id: "p1",
    groupId: "nentang",
    label: "Nền tảng & bảo mật",
    short: "Nền tảng",
    start: "05/05",
    end: "11/05",
    isoStart: "2026-05-05",
    isoEnd: "2026-05-12",
    deliverable: "Đăng nhập, phiên, RBAC, cài đặt hệ thống",
  },
  {
    id: "p2",
    groupId: "quytrinh",
    label: "Quy trình & hợp đồng",
    short: "QT & HĐ",
    start: "12/05",
    end: "20/05",
    isoStart: "2026-05-12",
    isoEnd: "2026-05-21",
    deliverable: "Workflow, hợp đồng, tab điều khoản",
  },
  {
    id: "p3",
    groupId: "vanhanh",
    label: "Vận hành",
    short: "Vận hành",
    start: "21/05",
    end: "30/05",
    isoStart: "2026-05-21",
    isoEnd: "2026-05-31",
    deliverable: "Bàn giao, HL, bảo hành, phản ánh",
  },
  {
    id: "p4",
    groupId: "danhmuc",
    label: "Danh mục & master data",
    short: "Danh mục",
    start: "31/05",
    end: "07/06",
    isoStart: "2026-05-31",
    isoEnd: "2026-06-08",
    deliverable: "Sản phẩm, vật tư, khách hàng CRM",
  },
  {
    id: "p5",
    groupId: "dieuhanh",
    label: "Điều hành tổng thể",
    short: "Điều hành",
    start: "08/06",
    end: "14/06",
    isoStart: "2026-06-08",
    isoEnd: "2026-06-15",
    deliverable: "Dashboard 11 tab, báo cáo xuất file",
  },
  {
    id: "p6",
    groupId: "hotro",
    label: "Tài liệu, thông báo & kiểm thử",
    short: "Hoàn thiện",
    start: "15/06",
    end: "20/06",
    isoStart: "2026-06-15",
    isoEnd: "2026-06-21",
    deliverable: "Tài liệu, thông báo, smoke test 152 UC",
  },
];

function parseMatrix(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    const m = line.match(
      /^\| (UC-[A-Za-z0-9-]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]*) \|$/,
    );
    if (!m) continue;
    rows.push({ id: m[1], mod: m[3].trim(), status: m[6].trim() });
  }
  return rows.filter((r) => !HIDDEN_MODULE_KEYS.has(r.mod));
}

function isUcDone(status) {
  return status === "pass" || status === "manual" || status === "no_data";
}

function pctClass(p) {
  if (p >= 100) return "high";
  if (p >= 75) return "mid";
  if (p >= 50) return "low";
  return "crit";
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildModules(rows) {
  const byMod = new Map();
  for (const r of rows) {
    if (!byMod.has(r.mod)) byMod.set(r.mod, { total: 0, done: 0 });
    const b = byMod.get(r.mod);
    b.total++;
    if (isUcDone(r.status)) b.done++;
  }
  return MODULE_ORDER.filter((m) => byMod.has(m)).map((mod) => {
    const { total, done } = byMod.get(mod);
    const pct = Math.round((done / total) * 100);
    return {
      mod,
      label: MODULE_LABELS[mod] ?? mod,
      ucTotal: total,
      ucDone: done,
      pct,
    };
  });
}

function weightedPct(modules) {
  const sum = modules.reduce((s, m) => s + m.pct * m.ucTotal, 0);
  const total = modules.reduce((s, m) => s + m.ucTotal, 0);
  return Math.round(sum / total);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function renderBar(label, pct, sub = "") {
  const cls = pctClass(pct);
  return `<div class="prog-row">
  <div class="prog-head"><span class="prog-label">${esc(label)}</span><span class="prog-val ${cls}">${pct}%</span></div>
  <div class="prog-track"><div class="prog-fill ${cls}" style="width:${pct}%"></div></div>
  ${sub ? `<div class="prog-sub">${sub}</div>` : ""}
</div>`;
}

function renderModuleCard(m) {
  return `<div class="module-card">
  <div class="module-card-head">
    <strong>${esc(m.label)}</strong>
    <span class="badge-pct ${pctClass(m.pct)}">${m.pct}%</span>
  </div>
  <code class="mod-key">${esc(m.mod)}</code>
  ${renderBar("UC hoạt động", m.pct, `${m.ucDone}/${m.ucTotal} UC đạt`)}
</div>`;
}

function donutSvg(pct, size = 160) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `<svg class="donut" width="${size}" height="${size}" viewBox="0 0 120 120" aria-label="${pct}%">
    <circle class="donut-bg" cx="60" cy="60" r="${r}" />
    <circle class="donut-fg ${pctClass(pct)}" cx="60" cy="60" r="${r}"
      stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" />
    <text x="60" y="56" class="donut-pct">${pct}%</text>
    <text x="60" y="72" class="donut-lbl">UC đạt</text>
  </svg>`;
}

function mermaidPieTiers(modules, totalDone, totalUc) {
  const pending = totalUc - totalDone;
  if (pending === 0) {
    return `pie showData
    title Trạng thái 152 UC
    "Hoạt động (đạt)" : ${totalDone}`;
  }
  return `pie showData
    title Trạng thái 152 UC
    "Hoạt động (đạt)" : ${totalDone}
    "Chưa đạt" : ${pending}`;
}

function ucCountForGroup(modules, group) {
  return group.mods.reduce((s, mod) => {
    const m = modules.find((x) => x.mod === mod);
    return s + (m?.ucTotal ?? 0);
  }, 0);
}

function timelinePct(isoDate) {
  const start = new Date(PROJECT.startIso).getTime();
  const end = new Date(PROJECT.endIso).getTime();
  const cur = new Date(isoDate).getTime();
  return Math.max(0, Math.min(100, ((cur - start) / (end - start)) * 100));
}

function mermaidGantt() {
  const lines = [
    "gantt",
    "    title Roadmap triển khai ASMS (05/05 – 20/06/2026)",
    "    dateFormat  YYYY-MM-DD",
    "    axisFormat  %d/%m",
  ];
  for (const p of ROADMAP_PHASES) {
    lines.push(`    section ${p.short}`);
    lines.push(`    ${p.label} :done, ${p.id}, ${p.isoStart}, ${p.isoEnd}`);
  }
  return lines.join("\n");
}

function renderRoadmap(modules) {
  const phases = ROADMAP_PHASES.map((p) => {
    const group = GROUPS.find((g) => g.id === p.groupId);
    return { ...p, ucCount: group ? ucCountForGroup(modules, group) : 0 };
  });

  const axis = `<div class="roadmap-axis">
    <span>${PROJECT.startLabel}</span>
    <span>Tháng 5 / 2026</span>
    <span>Tháng 6 / 2026</span>
    <span>${PROJECT.endLabel}</span>
  </div>`;

  const track = phases
    .map((p) => {
      const left = timelinePct(p.isoStart);
      const right = timelinePct(p.isoEnd);
      const width = Math.max(right - left, 4);
      return `<div class="roadmap-seg" style="left:${left}%;width:${width}%" title="${esc(p.label)}">
        <span class="roadmap-seg-lbl">${esc(p.short)}</span>
      </div>`;
    })
    .join("");

  const cards = phases
    .map(
      (p) => `<div class="roadmap-item no-break">
      <div class="roadmap-item-head">
        <span class="roadmap-date">${p.start} – ${p.end}</span>
        <span class="roadmap-badge">✓ Hoàn thành</span>
      </div>
      <strong>${esc(p.label)}</strong>
      <p class="roadmap-deliver">${esc(p.deliverable)}</p>
      <p class="roadmap-meta">${p.ucCount} UC · ${esc(GROUPS.find((g) => g.id === p.groupId)?.label ?? "")}</p>
    </div>`,
    )
    .join("");

  const tableRows = phases
    .map(
      (p) => `<tr>
      <td><strong>${p.start} – ${p.end}</strong></td>
      <td>${esc(p.label)}</td>
      <td>${esc(p.deliverable)}</td>
      <td class="num">${p.ucCount}</td>
      <td><span class="status-done">Hoàn thành</span></td>
    </tr>`,
    )
    .join("");

  const intro = `<div class="highlight roadmap-highlight">
  Giai đoạn triển khai: <strong>${PROJECT.startLabel}</strong> → <strong>${PROJECT.endLabel}</strong>
  (${PROJECT.totalDays} ngày làm việc · 152 UC)
</div>
${axis}
<div class="roadmap-track">${track}</div>`;

  const gantt = `<div class="mermaid-wrap no-break"><pre class="mermaid">${mermaidGantt()}</pre></div>`;

  const cardsHtml = `<div class="roadmap-list">${cards}</div>
<table class="spec roadmap-table">
<thead><tr><th>Thời gian</th><th>Giai đoạn</th><th>Đầu ra chính</th><th>UC</th><th>Trạng thái</th></tr></thead>
<tbody>${tableRows}</tbody>
</table>`;

  return { intro, gantt, cardsHtml };
}

function pageShell(title, body, id = "", extraClass = "") {
  return `<div class="doc-page content-page${extraClass ? ` ${extraClass}` : ""}"${id ? ` id="${id}"` : ""}>
  <div class="inner-header"><div>Mã tài liệu: UNICOM/PM-ASMS-002</div><div>${title}</div></div>
  <div class="inner-divider"></div>
  <div class="content-area">${body}</div>
  <div class="inner-footer"><div>CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ UNICOM</div><div>${title}</div></div>
</div>`;
}

function buildHtml(modules, stats) {
  const date = "24/06/2026";
  const version = "1.3";

  const roadmap = renderRoadmap(modules);

  const roadmapDetailPage = pageShell(
      `ASMS · Biểu đồ v${version}`,
      `<h2>2. Roadmap triển khai (chi tiết)</h2>
${roadmap.cardsHtml}`,
      "roadmap-detail",
    );

  const groupBlockList = GROUPS.map((g) => {
    const mods = modules.filter((m) => g.mods.includes(m.mod));
    const avg = weightedPct(mods);
    const bars = mods.map((m) => renderBar(m.label, m.pct, `${m.ucDone}/${m.ucTotal} UC`)).join("");
    return `<div class="group-block" id="${g.id}">
      <div class="group-head"><h3>${esc(g.label)}</h3><span class="group-pct ${pctClass(avg)}">${avg}%</span></div>
      ${bars}
    </div>`;
  });

  const overviewPage = pageShell(
    `ASMS · Biểu đồ v${version}`,
    `<h2 id="overview">1. Tổng quan biểu đồ</h2>
<div class="highlight">Tiến độ = <strong>% UC hoạt động</strong> (kiểm thử đạt: pass, manual, no_data). Không tính audit màn hình.</div>
<div class="overview-layout no-break">
  ${donutSvg(stats.pct)}
  <div>
    <div class="kpi-grid">
      <div class="kpi"><div class="val">${stats.pct}%</div><div class="lbl">UC hoạt động</div></div>
      <div class="kpi"><div class="val">${stats.ucDone}/${stats.totalUc}</div><div class="lbl">Use Case đạt</div></div>
      <div class="kpi"><div class="val">${PROJECT.totalDays}</div><div class="lbl">Ngày triển khai</div></div>
    </div>
  </div>
</div>
<h2 id="roadmap">2. Roadmap triển khai</h2>
<p class="section-note">Lộ trình thực hiện 152 UC từ <strong>${PROJECT.startLabel}</strong> đến <strong>${PROJECT.endLabel}</strong>.</p>
${roadmap.intro}
${roadmap.gantt}`,
    "overview",
  );

  const groupChunks = chunk(groupBlockList, 3);
  const groupPages = groupChunks
    .map((blocks, i) =>
      pageShell(
        `ASMS · Biểu đồ v${version}`,
        `${i === 0 ? `<h2 id="groups">3. Tiến độ theo nhóm nghiệp vụ</h2>
<p class="section-note">6 nhóm — % trung bình có trọng số theo số UC.</p>` : `<h2>3. Tiến độ theo nhóm nghiệp vụ (tiếp)</h2>`}
${blocks.join("")}`,
        i === 0 ? "groups" : `groups-${i + 1}`,
      ),
    )
    .join("\n");

  const piePage = pageShell(
    `ASMS · Biểu đồ v${version}`,
    `<h2 id="chart-pie">4. Phân bổ trạng thái UC</h2>
<div class="mermaid-wrap"><pre class="mermaid">${mermaidPieTiers(modules, stats.ucDone, stats.totalUc)}</pre></div>`,
    "chart-pie",
  );

  const modulePage = pageShell(
    `ASMS · Biểu đồ v${version}`,
    `<h2 id="modules">5. Chi tiết từng phân hệ</h2>
<p class="section-note">Bảng đầy đủ 15 phân hệ — 152 UC.</p>
<table class="spec module-table fill-table">
<thead><tr><th>Phân hệ</th><th>Module</th><th>UC đạt</th><th>Tiến độ</th></tr></thead>
<tbody>
${modules
  .map(
    (m) => `<tr>
      <td>${esc(m.label)}</td>
      <td><code>${esc(m.mod)}</code></td>
      <td class="num">${m.ucDone}/${m.ucTotal}</td>
      <td class="num"><strong>${m.pct}%</strong></td>
    </tr>`,
  )
  .join("")}
</tbody>
</table>`,
    "modules",
  );

  const toc = `
    <a href="#overview" class="toc-row"><span class="toc-num">01</span> Tổng quan biểu đồ</a>
    <a href="#roadmap" class="toc-row"><span class="toc-num">02</span> Roadmap triển khai (05/05 – 20/06)</a>
    <a href="#groups" class="toc-row"><span class="toc-num">03</span> Tiến độ theo nhóm nghiệp vụ</a>
    <a href="#chart-pie" class="toc-row"><span class="toc-num">04</span> Phân bổ trạng thái UC</a>
    <a href="#modules" class="toc-row"><span class="toc-num">05</span> Chi tiết từng phân hệ</a>
    <a href="#legend" class="toc-row"><span class="toc-num">06</span> Chú giải &amp; nguồn dữ liệu</a>`;

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quản lý tiến độ ASMS — Biểu đồ % (UC)</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #d0d0d0; font-family: 'Be Vietnam Pro', sans-serif; font-size: 14px; color: #0d1e34; line-height: 1.55; }
    .doc-page { width: 210mm; height: 297mm; min-height: 297mm; margin: 10mm auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.22); display: flex; flex-direction: column; overflow: hidden; }
    .doc-page.cover { min-height: 297mm; }
    .doc-page.content-page { min-height: 297mm; }
    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { background: #fff; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .doc-page { width: 210mm !important; height: 297mm !important; min-height: 297mm !important; margin: 0; box-shadow: none; page-break-after: always; break-after: page; overflow: hidden !important; }
      .doc-page.cover { min-height: 297mm; height: 297mm; }
      .doc-page.content-page { min-height: 297mm; height: 297mm; overflow: hidden; }
      .no-break, .module-card, .group-block, .kpi, .highlight, .mermaid-wrap,
      .overview-layout, .toc-row, h2, h3, .legend-grid, table.spec, .roadmap-item {
        break-inside: avoid; page-break-inside: avoid;
      }
      .module-grid { break-inside: auto; }
    }
    .accent-bar { height: 8px; background: linear-gradient(90deg, #3d7de8, #0ab4d8); }
    .cover { padding: 0; }
    .cover .header, .inner-header { padding: 20px 48px 20px 68px; display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 600; }
    .cover .divider, .inner-divider { margin: 0 48px 0 68px; height: 1px; background: #eaeff8; }
    .cover .main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 52px 60px; }
    .cover .logo-wrap img { width: 200px; }
    .cover .sep { width: 52px; height: 3px; background: linear-gradient(90deg, #3d7de8, #0ab4d8); margin: 22px auto; border-radius: 2px; }
    .cover .doc-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #3d7de8; }
    .cover .project-title { font-size: 32px; font-weight: 900; margin-top: 10px; }
    .cover .project-title span { background: linear-gradient(135deg, #3d7de8, #0ab4d8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .cover .subtitle { margin-top: 12px; font-size: 12px; color: #475569; max-width: 480px; }
    .cover .footer, .inner-footer { margin-top: auto; padding: 16px 48px 16px 68px; display: flex; justify-content: space-between; border-top: 1px solid #eaeff8; font-size: 9.5px; }
    .content-area { flex: 1; padding: 18px 48px 44px 68px; }
    h1.toc-title { font-size: 20px; font-weight: 900; border-bottom: 2px solid #3d7de8; padding-bottom: 8px; margin-bottom: 12px; }
    h2 { font-size: 17px; font-weight: 800; margin: 14px 0 10px; padding: 6px 10px; background: linear-gradient(90deg, #eef4ff, transparent); border-left: 4px solid #3d7de8; }
    h3 { font-size: 14px; font-weight: 700; color: #1e3a5f; }
    .toc-row { display: flex; gap: 10px; padding: 8px 10px; border: 1px solid #eaeff8; border-radius: 8px; text-decoration: none; color: inherit; margin-bottom: 6px; font-size: 13px; background: #fbfdff; }
    .toc-num { font-weight: 800; color: #3d7de8; min-width: 22px; }
    .highlight { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px 12px; margin: 10px 0; font-size: 12px; border-radius: 0 8px 8px 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
    .kpi { border: 1px solid #86efac; border-radius: 10px; padding: 12px 8px; text-align: center; background: #f0fdf4; }
    .kpi .val { font-size: 22px; font-weight: 900; line-height: 1.1; color: #16a34a; }
    .kpi .lbl { font-size: 9px; color: #64748b; margin-top: 4px; font-weight: 600; }
    .overview-layout { display: grid; grid-template-columns: 180px 1fr; gap: 20px; align-items: center; margin: 16px 0; }
    .donut-bg { fill: none; stroke: #e2e8f0; stroke-width: 12; }
    .donut-fg { fill: none; stroke-width: 12; stroke-linecap: round; }
    .donut-fg.high { stroke: #22c55e; }
    .donut-fg.mid { stroke: #eab308; }
    .donut-fg.low { stroke: #f97316; }
    .donut-fg.crit { stroke: #ef4444; }
    .donut-pct { text-anchor: middle; font-size: 22px; font-weight: 900; fill: #0f172a; }
    .donut-lbl { text-anchor: middle; font-size: 9px; fill: #64748b; font-weight: 600; }
    .prog-row { margin: 8px 0; }
    .prog-head { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
    .prog-label { font-weight: 600; color: #334155; }
    .prog-val { font-weight: 800; }
    .prog-val.high, .badge-pct.high, .group-pct.high { color: #16a34a; }
    .prog-val.mid, .badge-pct.mid, .group-pct.mid { color: #ca8a04; }
    .prog-val.low, .badge-pct.low, .group-pct.low { color: #ea580c; }
    .prog-val.crit, .badge-pct.crit, .group-pct.crit { color: #dc2626; }
    .prog-track { height: 10px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .prog-fill { height: 100%; border-radius: 999px; }
    .prog-fill.high { background: linear-gradient(90deg, #4ade80, #16a34a); }
    .prog-fill.mid { background: linear-gradient(90deg, #fde047, #ca8a04); }
    .prog-fill.low { background: linear-gradient(90deg, #fdba74, #ea580c); }
    .prog-fill.crit { background: linear-gradient(90deg, #fca5a5, #dc2626); }
    .prog-sub { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .group-block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 12px; background: #fafbfd; break-inside: avoid; page-break-inside: avoid; }
    .group-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .group-pct { font-size: 20px; font-weight: 900; }
    .mermaid-wrap { margin: 12px 0; padding: 10px; border: 1px solid #eaeff8; border-radius: 8px; background: #fafbfd; overflow-x: auto; }
    .module-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
    .module-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; background: #fff; font-size: 11px; break-inside: avoid; page-break-inside: avoid; }
    .module-card-head { display: flex; justify-content: space-between; align-items: center; }
    .badge-pct { font-size: 16px; font-weight: 900; }
    .mod-key { font-size: 9px; color: #64748b; display: block; margin: 2px 0 8px; font-family: Consolas, monospace; }
    .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .swatch { width: 14px; height: 14px; border-radius: 4px; }
    .swatch.high { background: #22c55e; }
    .swatch.mid { background: #eab308; }
    .swatch.low { background: #f97316; }
    .swatch.crit { background: #ef4444; }
    table.spec { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 10px; }
    table.spec th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; }
    table.spec td { border: 1px solid #cbd5e0; padding: 5px 8px; }
    table.spec tr:nth-child(even) td { background: #f8fafc; }
    .gen-note { font-size: 9.5px; color: #94a3b8; margin-top: 12px; }
    .section-note { font-size: 11px; color: #64748b; margin-bottom: 10px; }
    .roadmap-highlight { background: #eff6ff; border-left-color: #3b82f6; }
    .roadmap-axis { display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin: 14px 0 6px; font-weight: 600; }
    .roadmap-track { position: relative; height: 36px; background: #e2e8f0; border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
    .roadmap-seg { position: absolute; top: 4px; height: 28px; background: linear-gradient(90deg, #3d7de8, #0ab4d8); border-radius: 6px; min-width: 28px; display: flex; align-items: center; justify-content: center; }
    .roadmap-seg-lbl { font-size: 8px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px; }
    .roadmap-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
    .roadmap-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #fafbfd; font-size: 10.5px; }
    .roadmap-item-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .roadmap-date { font-size: 9px; font-weight: 700; color: #3d7de8; }
    .roadmap-badge { font-size: 8px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 10px; }
    .roadmap-deliver { color: #475569; margin: 4px 0; line-height: 1.45; }
    .roadmap-meta { font-size: 9px; color: #94a3b8; }
    .roadmap-table td.num { text-align: center; }
    .status-done { color: #16a34a; font-weight: 700; font-size: 9.5px; }
    .cover .timeline-meta { margin-top: 20px; font-size: 11px; color: #1e3a5f; font-weight: 600; padding: 10px 18px; border: 1px solid #bfdbfe; border-radius: 10px; background: #eff6ff; }
  </style>
</head>
<body>

<div class="doc-page cover">
  <div class="accent-bar"></div>
  <div class="header"><div>Mã tài liệu: UNICOM/PM-ASMS-002</div><div>v${version} · ${date}</div></div>
  <div class="divider"></div>
  <div class="main">
    <div class="logo-wrap"><img src="file%20docs/assets/unicom-logo.png" alt="Unicom"></div>
    <div class="sep"></div>
    <div class="doc-label">BÁO CÁO TIẾN ĐỘ DỰ ÁN</div>
    <div class="project-title"><span>ASMS</span> — Tiến độ theo UC</div>
    <div class="subtitle">Tiến độ theo Use Case — chức năng hoạt động là hoàn thành<br>Phạm vi 152 UC · 15 phân hệ vận hành</div>
    <div class="timeline-meta">Thời gian triển khai: ${PROJECT.startLabel} → ${PROJECT.endLabel}</div>
  </div>
  <div class="footer"><div>CÔNG TY TNHH GIẢI PHÁP CÔNG NGHỆ UNICOM</div><div>© 2026</div></div>
</div>

${pageShell(`ASMS · Biểu đồ v${version}`, `<h1 class="toc-title">Mục lục</h1>${toc}`)}

${overviewPage}

${roadmapDetailPage}

${groupPages}

${piePage}

${modulePage}

${pageShell(
  `ASMS · Biểu đồ v${version}`,
  `<h2 id="legend">6. Chú giải &amp; nguồn dữ liệu</h2>
<div class="legend-grid">
  <div class="legend-item"><span class="swatch high"></span> 100% — Tất cả UC phân hệ hoạt động</div>
  <div class="legend-item"><span class="swatch mid"></span> 75–99% — Còn UC chưa đạt</div>
  <div class="legend-item"><span class="swatch low"></span> 50–74% — Đang triển khai</div>
  <div class="legend-item"><span class="swatch crit"></span> &lt; 50% — Ưu tiên bổ sung</div>
</div>
<p style="font-size:11px;margin:10px 0"><strong>Đạt</strong> = trạng thái <code>pass</code>, <code>manual</code> hoặc <code>no_data</code> trong ma trận kiểm thử.</p>
<table class="spec">
<thead><tr><th>Phân hệ</th><th>UC đạt</th><th>Tiến độ</th></tr></thead>
<tbody>
${modules.map((m) => `<tr><td>${esc(m.label)}</td><td>${m.ucDone}/${m.ucTotal}</td><td><strong>${m.pct}%</strong></td></tr>`).join("")}
</tbody></table>
`,
  "legend",
)}

<script>
  mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
</script>
</body>
</html>`;
}

function buildMd(modules, stats) {
  let md = `# Quản lý tiến độ ASMS — Biểu đồ % (chỉ UC)

| Thuộc tính | Nội dung |
|---|---|
| **Phiên bản** | 1.3 |
| **Ngày** | 24/06/2026 |
| **Thời gian triển khai** | **${PROJECT.startLabel} → ${PROJECT.endLabel}** (${PROJECT.totalDays} ngày) |
| **Bản HTML** | [ASMS_quan-ly-tien-do-bieu-do.html](./ASMS_quan-ly-tien-do-bieu-do.html) |
| **Phạm vi** | 152 UC · 15 phân hệ |
| **Tiêu chí** | UC hoạt động (pass / manual / no_data) = hoàn thành |

## Tổng quan

| Chỉ số | Giá trị |
|--------|--------:|
| Tiến độ UC | **${stats.pct}%** |
| UC đạt | **${stats.ucDone}/${stats.totalUc}** |

## Roadmap triển khai (${PROJECT.startLabel} – ${PROJECT.endLabel})

| Thời gian | Giai đoạn | Đầu ra chính | UC |
|-----------|-----------|--------------|---:|
`;
  for (const p of ROADMAP_PHASES) {
    const group = GROUPS.find((g) => g.id === p.groupId);
    const uc = group ? ucCountForGroup(modules, group) : 0;
    md += `| ${p.start} – ${p.end} | ${p.label} | ${p.deliverable} | ${uc} |\n`;
  }

  md += `
## Tiến độ từng phân hệ

| Phân hệ | UC đạt | Tiến độ |
|---------|-------:|--------:|
`;
  for (const m of modules) {
    md += `| ${m.label} | ${m.ucDone}/${m.ucTotal} | **${m.pct}%** |\n`;
  }
  md += `\nSinh tự động: \`node scripts/generate-progress-charts-doc.mjs\`\n`;
  return md;
}

// --- main ---
const rows = parseMatrix(readFileSync(matrixPath, "utf8"));
const modules = buildModules(rows);
const ucDone = rows.filter((r) => isUcDone(r.status)).length;
const stats = {
  totalUc: rows.length,
  ucDone,
  pct: Math.round((ucDone / rows.length) * 100),
};

const html = buildHtml(modules, stats);
const md = buildMd(modules, stats);

const outHtml = resolve(root, "docs/ASMS_quan-ly-tien-do-bieu-do.html");
const outMd = resolve(root, "docs/ke-hoach-tien-do-bieu-do-asms.md");

writeFileSync(outHtml, html, "utf8");
writeFileSync(outMd, md, "utf8");

console.log(`UC progress: ${stats.pct}% (${stats.ucDone}/${stats.totalUc})`);
console.log(`  ${outHtml}`);
console.log(`  ${outMd}`);
