import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, "../docs/file docs/ASMS_BRD.html");
const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 120000 });
await page.waitForFunction(
  () => {
    const blocks = document.querySelectorAll(".mermaid");
    if (!blocks.length) return false;
    const svgs = [...blocks].filter((el) => el.querySelector("svg")).length;
    return svgs >= blocks.length - 2;
  },
  { timeout: 300000, polling: 1000 }
);
const stats = await page.evaluate(() => {
  const blocks = document.querySelectorAll(".mermaid");
  const svgs = [...blocks].filter((el) => el.querySelector("svg")).length;
  const errs = document.querySelectorAll(".mermaid-err").length;
  return { total: blocks.length, svgs, errs };
});
console.log(stats);
await browser.close();
