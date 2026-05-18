import * as XLSX from "xlsx";

export type ExportSheet = {
  name: string;
  rows: Record<string, string | number>[];
};

export function exportSheetsToExcel(sheets: ExportSheet[], filename: string) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function printReportArea(elementId = "report-print-area") {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }
  const prevTitle = document.title;
  document.title = "Bao cao ASMS";
  const style = document.createElement("style");
  style.id = "report-print-style";
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #${elementId}, #${elementId} * { visibility: visible !important; }
      #${elementId} { position: absolute; left: 0; top: 0; width: 100%; }
    }
  `;
  document.head.appendChild(style);
  window.print();
  document.head.removeChild(style);
  document.title = prevTitle;
}
