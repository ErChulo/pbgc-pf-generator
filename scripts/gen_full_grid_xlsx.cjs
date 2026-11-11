"use strict";
/* Generate a full-size BFCF workbook (26 participant ages x 101
   beneficiary ages = 2,626 formulas) through the HTML's own code.
   The set is the demo BFCF-2020 set with full age ranges, imported
   as JSON and approved, exactly as a user would do it.
   Usage: node scripts/gen_full_grid_xlsx.cjs [output-path] */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const out = process.argv[2] || "/tmp/pf-full-grid.xlsx";
const html = fs.readFileSync(path.join(ROOT, "pf-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("no <script> block"); process.exit(1); }
const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: "pf-generator.html" });
const PF = sandbox.PF;
const data = JSON.parse(JSON.stringify(PF.DEMO_PF_JSON));
const bf = data.factorSets.find((s) => s.id === "BFCF-2020");
bf.partAgeMin = 55; bf.partAgeMax = 80; bf.benAgeMin = 0; bf.benAgeMax = 100;
data.factorSets = [bf];
data.additionalConversions = [];
sandbox.pfImportText(JSON.stringify(data), "full-grid JSON");
PF.state.decisions = { "BFCF-2020": "approved" };
const res = sandbox.pfGenerate();
if (!res.ok) { console.error("full-grid generate failed: " + res.why); process.exit(1); }
fs.writeFileSync(out, Buffer.from(PF.state.generated.bytes));
console.log("wrote " + out + " (" + PF.state.generated.bytes.length + " bytes, " + PF.state.generated.tabs + " tabs)");
