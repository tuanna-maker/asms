/**
 * Xuất docs/ASMS_quan-ly-tien-do-bieu-do.html → PDF
 * Chạy: node scripts/export-progress-charts-pdf.mjs
 */
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../docs/ASMS_quan-ly-tien-do-bieu-do.html");
const pdfPath = path.resolve(__dirname, "../docs/ASMS_quan-ly-tien-do-bieu-do.pdf");
const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });

await page.waitForFunction(
  () => {
    const blocks = document.querySelectorAll(".mermaid");
    if (blocks.length === 0) return true;
    return [...blocks].every((el) => el.querySelector("svg"));
  },
  { timeout: 120000, polling: 500 },
);

await page.emulateMediaType("print");

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: true,
});

await browser.close();
console.log(`PDF saved: ${pdfPath}`);
