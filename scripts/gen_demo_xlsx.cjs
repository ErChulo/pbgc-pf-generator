"use strict";
/* Generate the demo PF.xlsx through the HTML's own code, driving the
   real UI path: load the demo, decide the sets, generate.
   Writes the workbook and the audit log next to it.
   Usage: node scripts/gen_demo_xlsx.cjs [output-path] */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const out = process.argv[2] || "/tmp/pf-demo.xlsx";
const auditOut = out.replace(/\.xlsx$/i, "-audit.txt");
const html = fs.readFileSync(path.join(ROOT, "pf-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: "pf-generator.html" });
const PF = sandbox.PF;
// Demo: approve the 3 included present sets, reject the missing
// disability set, approve the user-added JS100 conversion. The JS75
// set needs no decision: the PBGC rule leaves it out.
sandbox.pfLoadDemo();
PF.state.decisions = {
  "ERF-2020": "approved",
  "LRF-2020": "approved",
  "BFCF-2020": "approved",
  "BFCF-2020-JS100": "approved",
  "ERF-DIS-2020": "rejected",
};
const res = sandbox.pfGenerate();
if (!res.ok) { console.error("demo generate failed: " + res.why); process.exit(1); }
fs.writeFileSync(out, Buffer.from(PF.state.generated.bytes));
fs.writeFileSync(auditOut, PF.state.auditText || "(no entries)");
console.log("wrote " + out + " (" + PF.state.generated.bytes.length + " bytes, " + PF.state.generated.tabs + " tabs)");
console.log("wrote " + auditOut);
