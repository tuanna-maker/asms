import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = process.argv[2] || "full";
const isPlain = arg === "plain" || arg === "--plain";
const isTasmos = arg === "tasmos" || arg === "--tasmos";
const isUpdated = arg === "updated" || arg === "--updated";
const base = isPlain ? "ASMS_BRD_PLAIN" : isTasmos ? "ASMS_BRD_TASMOS" : isUpdated ? "ASMS_BRD_UPDATED" : "ASMS_BRD";
const customPdfName = process.argv[3];
const htmlPath = path.resolve(__dirname, `../docs/file docs/${base}.html`);
const pdfFileName = customPdfName ? `${customPdfName}.pdf` : `${base}.pdf`;
const pdfPath = path.resolve(__dirname, "../docs/file docs", pdfFileName);
const margined =
  customPdfName === "ASMS_BRD#3" ||
  customPdfName === "ASMS_BRD#4" ||
  process.argv.includes("--margin-y");
const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });

await page.waitForFunction(
  () => {
    const blocks = document.querySelectorAll(".mermaid");
    if (blocks.length === 0) return true;
    const done = [...blocks].filter((el) => el.querySelector("svg")).length;
    return done >= blocks.length;
  },
  { timeout: 300000, polling: 500 }
);

if (margined) {
  await page.waitForFunction(() => window.__brdLayoutReady === true, { timeout: 120000 });
  await page.evaluate(() => {
    document.body.classList.add("brd-pdf-v3");
  });
  await page.addStyleTag({
    content: `@media print {
      @page:first { size: A4; margin: 0; }
      @page { size: A4; margin: 18mm 0 18mm 0; }
      body.brd-pdf-v3 .doc-page.cover { page-break-after: always !important; }
      body.brd-pdf-v3 .doc-page.toc-page {
        min-height: auto !important;
        height: auto !important;
        page-break-after: always !important;
        break-after: page !important;
      }
      body.brd-pdf-v3 .doc-page.content-flow {
        min-height: auto !important;
        height: auto !important;
        page-break-before: always !important;
        break-before: page !important;
        page-break-after: auto !important;
      }
      body.brd-pdf-v3 .inner-brd-header { padding: 0 48px 6px 68px !important; }
      body.brd-pdf-v3 .inner-brd-footer { padding: 6px 48px 0 68px !important; border-top: 1px solid #eaeff8; }
      body.brd-pdf-v3 .content-area { padding: 4px 48px 0 68px !important; }
      body.brd-pdf-v3 .toc-page .content-area { padding-bottom: 0 !important; }
    }`,
  });
}

await page.emulateMediaType("print");

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: false,
});

await browser.close();
console.log(`PDF saved: ${pdfPath}`);
