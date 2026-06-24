import fs from "fs";
import mermaid from "mermaid";
import { JSDOM } from "jsdom";

const htmlPath = process.argv[2] || "docs/file docs/ASMS_BRD.html";
const html = fs.readFileSync(htmlPath, "utf8");

// Extract from md-source script (raw markdown) before render
const mdMatch = html.match(/<script id="md-source" type="text\/markdown">\n([\s\S]*?)\n<\/script>/);
if (!mdMatch) {
  console.error("No md-source found");
  process.exit(1);
}
const md = mdMatch[1];
const blocks = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1].trim());
console.log(`Found ${blocks.length} mermaid blocks in markdown`);

const dom = new JSDOM("<!DOCTYPE html><body></body>");
global.document = dom.window.document;
mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

let fail = 0;
const errors = [];
for (let i = 0; i < blocks.length; i++) {
  try {
    await mermaid.parse(blocks[i]);
  } catch (e) {
    fail++;
    errors.push({ i, msg: e.message?.split("\n")[0] || String(e), first: blocks[i].split("\n").slice(0, 3).join(" | ") });
  }
}
console.log(`Failed: ${fail} / ${blocks.length}`);
errors.slice(0, 20).forEach((e) => {
  console.log(`#${e.i}: ${e.msg}\n   ${e.first}`);
  console.log("---\n" + blocks[e.i] + "\n---");
});
