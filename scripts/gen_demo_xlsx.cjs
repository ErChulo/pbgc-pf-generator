"use strict";
/* Generate the demo PF.xlsx through the HTML's own code.
   Usage: node scripts/gen_demo_xlsx.cjs [output-path] */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const out = process.argv[2] || "/tmp/pf-demo.xlsx";
const html = fs.readFileSync(path.join(ROOT, "pf-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: "pf-generator.html" });
const PF = sandbox.PF;
const demo = PF.DEMO_PF_JSON;
// Demo: approve the 3 present sets, reject the missing disability set.
const approved = JSON.parse(JSON.stringify(demo));
approved.factorSets = approved.factorSets.filter((s) => s.status === "present");
const bytes = PF.pfBuildXlsxBytes(approved);
fs.writeFileSync(out, Buffer.from(bytes));
console.log("wrote " + out + " (" + bytes.length + " bytes)");
