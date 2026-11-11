"use strict";
/* PF Generator v0.2.0 — test runner.
   Loads the single <script> block of pf-generator.html into a Node vm
   (no DOM, no localStorage — the pure logic only) and checks schema
   validation, flexible import, partial merge, formula builders, and
   the .xlsx bytes.
   Run: node tests/run.cjs   (exits non-zero on any failure) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "pf-generator.html"), "utf-8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("FAIL: no <script> block in pf-generator.html"); process.exit(1); }
const script = m[1];

const sandbox = { console, TextEncoder, Blob, URL, File, setTimeout };
vm.createContext(sandbox);
try {
  vm.runInContext(script, sandbox, { filename: "pf-generator.html" });
} catch (e) {
  console.error("FAIL: script did not load:", e.message);
  process.exit(1);
}
const PF = sandbox.PF;
if (!PF) { console.error("FAIL: globalThis.PF not exported"); process.exit(1); }

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("  ok  " + name); }
  else { fail++; console.log("FAIL  " + name + (extra ? " — " + extra : "")); }
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }

console.log("PF Generator v" + PF.VERSION + " — tests");

/* --- 1. Schema + demo --- */
const schema = JSON.parse(fs.readFileSync(path.join(ROOT, "schema", "pf.schema.json"), "utf-8"));
check("schema is valid JSON with planMetadata + factorSets", Object.keys(schema.properties).length === 2);
const demo = PF.DEMO_PF_JSON;
check("demo has 4 factor sets", demo.factorSets.length === 4);
const demoErrs = PF.validatePfJson(demo);
check("demo validates", demoErrs.errors.length === 0, demoErrs.errors.join("; "));
check("demo plan is the synthetic Riverbend plan", demo.planMetadata.planName === "Riverbend Manufacturing Pension Plan");
check("demo case number is text 98765400", demo.planMetadata.caseNumber === "98765400");
check("demo DOPT is 2025-06-30", demo.planMetadata.dopt === "2025-06-30");
check("demo has ERF, LRF, BFCF sets", ["ERF", "LRF", "BFCF"].every((t) => demo.factorSets.some((s) => s.type === t)));
check("demo has 1 missing set (disability)", demo.factorSets.filter((s) => s.status === "missing").length === 1);
check("demo BFCF grid is small (part 55-60, ben 0-5)",
  demo.factorSets.find((s) => s.id === "BFCF-2020").partAgeMax === 60 &&
  demo.factorSets.find((s) => s.id === "BFCF-2020").benAgeMax === 5);
check("demo ERF carries a printed table (months 1, 60, 120)",
  demo.factorSets[0].table && demo.factorSets[0].table.kind === "months" && demo.factorSets[0].table.rows.length === 3);
check("demo ERF table values are the linear-rule values",
  demo.factorSets[0].table.rows[0].factor === 0.9944 && demo.factorSets[0].table.rows[1].factor === 0.6667 && demo.factorSets[0].table.rows[2].factor === 0.3333);
check("demo present sets have ruleText (the plan's own words)",
  demo.factorSets.filter((s) => s.status === "present").every((s) => typeof s.ruleText === "string" && s.ruleText.length > 0));
check("demo BFCF sexes are M/F from the plan", demo.factorSets[2].partSex === "M" && demo.factorSets[2].benSex === "F");

/* --- 1b. .xlsx filename: <case>PF.xlsx --- */
check("xlsx filename is <case>PF.xlsx", PF.pfXlsxFileName("98765400") === "98765400PF.xlsx");
check("xlsx filename keeps leading zeros", PF.pfXlsxFileName("00123456") === "00123456PF.xlsx");
check("xlsx filename falls back to PF.xlsx when empty", PF.pfXlsxFileName("") === "PF.xlsx");
check("xlsx filename falls back to PF.xlsx when null", PF.pfXlsxFileName(null) === "PF.xlsx");

/* --- 1c. Tab names --- */
check("tab name ERF", PF.pfTabName(demo.factorSets[0]) === "ERF-2020");
check("tab name BFCF has form pair", PF.pfTabName(demo.factorSets[2]) === "BFCF-2020 SLA->JS50");
check("tab name never exceeds 31 chars", PF.pfTabName({ type: "BFCF", era: "2020-very-long-era-name-here", fromForm: "SLA", toForm: "JS50" }).length <= 31);
check("tab name strips illegal chars", PF.pfTabName({ type: "ERF", era: "2020/21" }) === "ERF-2020-21");

/* --- 2. Validator rejects bad input, accepts good --- */
const bad1 = clone(demo); delete bad1.planMetadata.planName;
check("validator rejects missing planName", PF.validatePfJson(bad1).errors.length > 0);
const bad2 = clone(demo); bad2.planMetadata.dopt = "June 30, 2025";
check("validator rejects non-ISO dopt", PF.validatePfJson(bad2).errors.length > 0);
const bad3 = clone(demo); bad3.factorSets[0].status = "maybe";
check("validator rejects bad status", PF.validatePfJson(bad3).errors.length > 0);
const bad4 = clone(demo); bad4.factorSets[0].status = "conditional"; bad4.factorSets[0].note = null;
check("validator rejects conditional without note", PF.validatePfJson(bad4).errors.length > 0);
const bad5 = clone(demo); bad5.factorSets.push(clone(bad5.factorSets[0]));
check("validator rejects a duplicate set id", PF.validatePfJson(bad5).errors.length > 0);
const bad6 = clone(demo); bad6.factorSets[0].rule = null;
check("validator rejects present set without a rule", PF.validatePfJson(bad6).errors.length > 0);
const bad7 = clone(demo); bad7.factorSets[2].partAgeMax = 50;
check("validator rejects a bad BFCF age range", PF.validatePfJson(bad7).errors.length > 0);
const bad8 = clone(demo); bad8.factorSets[1].interest = 5;
check("validator rejects interest as a percent (must be a decimal)", PF.validatePfJson(bad8).errors.length > 0);
const ext = clone(demo);
ext.factorSets.push({ id: "OTHER-2020", type: "OTHER", era: "2020", title: "Pre-retirement death factors (2020 Plan)", basis: "death benefit = accrued benefit", normalForm: "SLA", fromForm: null, toForm: null, nra: 65, interest: null, mortality1: null, mortality2: null, calcMethod: null, deferralMortality: null, monthsCertain: null, partSex: null, benSex: null, survivorPct: null, monthsTemp: null, ruleText: "death benefit equals the accrued benefit", table: null, monthMin: 1, monthMax: 60, partAgeMin: null, partAgeMax: null, benAgeMin: null, benAgeMax: null, rule: { kind: "linear", denominator: 120 }, status: "present", note: null, citation: { document: "D1", section: "8.1", page: "20" } });
check("validator accepts an OTHER factor set", PF.validatePfJson(ext).errors.length === 0, PF.validatePfJson(ext).errors.join("; "));

/* --- 3. Formula builders --- */
const erf = demo.factorSets[0];
const f1 = PF.pfMonthFormula(erf, "A11", 1);
check("linear formula is ROUND(1-(A11/180),4)", f1.formula === "ROUND(1-(A11/180),4)", f1.formula);
check("linear cached value is 0.9944", f1.cached === "0.9944", f1.cached);
const f120 = PF.pfMonthFormula(erf, "I34", 120);
check("linear cached value at 120 months is 0.3333", f120.cached === "0.3333", f120.cached);
const stepped = { rule: { kind: "stepped", firstMonths: 60, firstDenominator: 180, secondDenominator: 360 }, monthMax: 120 };
const fs1 = PF.pfMonthFormula(stepped, "A11", 1);
check("stepped formula has MIN/MAX shape", fs1.formula === "ROUND(1-(1/180)*MIN(A11,60)-(1/360)*MAX(MIN(A11-60,60),0),4)", fs1.formula);
check("stepped cached at month 120 is 0.5000", PF.pfMonthFormula(stepped, "I34", 120).cached === "0.5000");
const lrf = demo.factorSets[1];
const fl = PF.pfMonthFormula(lrf, "A11", 1);
check("LRF formula is LRFAEQ", fl.formula === 'ROUND(LRFAEQ(0.05,"M",65,A11,0,"GM83","GF83","MP","Y"),4)', fl.formula);
check("BCV formula has no cached value", fl.cached === null);
const bf = PF.pfBfcfFormula(demo.factorSets[2], "C10", "B11");
check("BFCF formula is BFCFAEQ", bf.formula === 'ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C10,B11,"M","F",0.08,"UP84M2","UP84M2","MP","N"),4)', bf.formula);
check("BFCF formula has no cached value", bf.cached === null);

/* --- 4. Sheet XML --- */
const erfSheet = PF.pfSheetForSet(erf, demo.planMetadata);
check("ERF sheet dimension is A1:J34", erfSheet.xml.indexOf('<dimension ref="A1:J34"/>') >= 0);
check("ERF sheet has landscape fit 1x2", erfSheet.xml.indexOf('orientation="landscape" fitToWidth="1" fitToHeight="2"') >= 0);
check("ERF sheet has margins 0.4/0.4/0.5/0.5", erfSheet.xml.indexOf('left="0.4" right="0.4" top="0.5" bottom="0.5"') >= 0);
check("ERF sheet has fitToPage", erfSheet.xml.indexOf('fitToPage="1"') >= 0);
check("ERF sheet has 120 month cells", (erfSheet.xml.match(/<v>120<\/v>/) || []).length === 1);
check("ERF sheet has 117 formulas (3 months are table values)", (erfSheet.xml.match(/<f>ROUND\(1-\(/g) || []).length === 117);
check("ERF sheet merges header rows 1-8", [1,2,3,4,5,6,7,8].every((r) => erfSheet.xml.indexOf('<mergeCell ref="A'+r+':J'+r+'"/>') >= 0));
check("ERF sheet freezes at A11", erfSheet.xml.indexOf('<pane ySplit="10" topLeftCell="A11" activePane="bottomLeft" state="frozen"/>') >= 0);
check("ERF sheet widths are all 10", (erfSheet.xml.match(/<col width="10" customWidth="1"/g) || []).length === 10);
const bfSheet = PF.pfSheetForSet(demo.factorSets[2], demo.planMetadata);
check("BFCF sheet dimension is A1:H16", bfSheet.xml.indexOf('<dimension ref="A1:H16"/>') >= 0);
check("BFCF sheet has 36 formulas (6 part x 6 ben)", (bfSheet.xml.match(/<f>ROUND\(BFCFAEQ/g) || []).length === 36);
check("BFCF sheet references part age row 10", bfSheet.xml.indexOf("C10") >= 0);
check("BFCF sheet references ben age col B", bfSheet.xml.indexOf("B11") >= 0);
check("BFCF header sits in column B", bfSheet.xml.indexOf('r="B1"') >= 0 && bfSheet.xml.indexOf('r="B5"') >= 0 && bfSheet.xml.indexOf('r="A5"') < 0);
check("BFCF sheet has row 9 label at C9", bfSheet.xml.indexOf("Participant's Age Nearest Birthday") >= 0 && bfSheet.xml.indexOf('r="C9"') >= 0);
check("BFCF sheet has ben-age label at A11", bfSheet.xml.indexOf("Beneficiary's Age Nearest Birthday") >= 0);
check("BFCF sheet merges header rows 1-8 across B:H", [1,2,3,4,5,6,7,8].every((r) => bfSheet.xml.indexOf('<mergeCell ref="B'+r+':H'+r+'"/>') >= 0));
check("BFCF sheet merges C9 label and A11 label", bfSheet.xml.indexOf('<mergeCell ref="C9:H9"/>') >= 0 && bfSheet.xml.indexOf('<mergeCell ref="A11:A16"/>') >= 0);
check("BFCF sheet freezes at C11", bfSheet.xml.indexOf('<pane xSplit="2" ySplit="10" topLeftCell="C11" activePane="bottomRight" state="frozen"/>') >= 0);
check("BFCF sheet widths are 4 then 8.5", bfSheet.xml.indexOf('<col width="4" customWidth="1" min="1" max="1"/>') >= 0 && (bfSheet.xml.match(/<col width="8.5" customWidth="1"/g) || []).length === 7);
const wbXml = PF.pfWorkbookXml([
  { name: "ERF-2020", lastRow: 34, lastCol: "J" },
  { name: "BFCF-2020 SLA->JS50", lastRow: 16, lastCol: "H" },
]);
check("workbook XML has print area per sheet", wbXml.indexOf("_xlnm.Print_Area") >= 0 && wbXml.indexOf("$A$1:$J$34") >= 0 && wbXml.indexOf("$A$1:$H$16") >= 0);
check("workbook XML has print titles rows 1:10 per sheet", (wbXml.match(/\$1:\$10/g) || []).length === 2);
check("workbook XML sets fullCalcOnLoad", wbXml.indexOf("fullCalcOnLoad") >= 0);

/* --- 5. .xlsx bytes --- */
const approved = clone(demo);
approved.factorSets = approved.factorSets.filter((s) => s.status === "present");
const bytes = PF.pfBuildXlsxBytes(approved);
check("xlsx bytes are a stored ZIP (PK header)", bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04);
const buf = Buffer.from(bytes);
function has(str) { return buf.indexOf(Buffer.from(str, "utf8")) >= 0; }
check("xlsx contains the plan name", has("Riverbend Manufacturing Pension Plan"));
check("xlsx contains the case number", has("98765400"));
check("xlsx contains the DOPT", has("2025-06-30"));
check("xlsx contains the linear formula", has("ROUND(1-(C11/180),4)"));
check("xlsx contains the LRFAEQ formula", has("LRFAEQ(0.05"));
check("xlsx contains the BFCFAEQ formula", has("BFCFAEQ("));
check("xlsx contains the 0.0000 format", has('formatCode="0.0000"'));
check("xlsx contains print area", has("_xlnm.Print_Area"));
check("xlsx contains print titles", has("_xlnm.Print_Titles"));
check("xlsx contains the missing set title nowhere (rejected sets are out)", !has("Disability"));
const missingOnly = clone(demo);
missingOnly.factorSets = missingOnly.factorSets.filter((s) => s.status === "missing");
let threw = false;
try { PF.pfBuildXlsxBytes(missingOnly); } catch (e) { threw = true; }
check("xlsx build refuses data with no present sets", threw);

/* --- 6. Flexible import --- */
const flex1 = PF.importFlexPfJson({
  "Plan Name": "Riverbend Manufacturing Pension Plan",
  "Case Number": "98765400",
  DOPT: "2025-06-30",
  factorSets: [clone(demo.factorSets[0])],
}, {});
check("flex import maps header + sets", flex1.kind === "flex" && flex1.data.planMetadata.planName === "Riverbend Manufacturing Pension Plan", flex1.kind);
check("flex import normalises a written-out date", PF.importFlexPfJson({ "Plan Name": "A", DOPT: "06/30/2025", factorSets: [clone(demo.factorSets[0])] }, {}).data.planMetadata.dopt === "2025-06-30");
const flex2 = PF.importFlexPfJson({ "SomeRandomKey": "x", "planName": "Riverbend Manufacturing Pension Plan" }, {});
check("flex import lists unmapped keys, never drops them", flex2.unmapped.length === 1 && flex2.unmapped[0] === "SomeRandomKey", flex2.unmapped.join(","));
const flex3 = PF.importFlexPfJson({ "Plan Name": "A", planName: "B", factorSets: [clone(demo.factorSets[0])] }, {});
check("flex import reports a header conflict and keeps neither value", flex3.conflicts.length === 1 && flex3.data.planMetadata.planName === "");
check("flex import passes full PF JSON through unchanged", PF.importFlexPfJson(clone(demo), {}).kind === "pf");
check("flex import rejects bad full JSON", PF.importFlexPfJson({ planMetadata: {}, factorSets: [] }, {}).kind === "error");
check("flex import detects a partial payload", PF.importFlexPfJson({ factorSets: [clone(demo.factorSets[3])] }, {}).kind === "partial");

/* --- 7. Partial merge --- */
const cur = clone(demo);
const dis = clone(demo.factorSets[3]);
dis.status = "present"; dis.basis = "ERFAEQ with interest=8%; mortality=UP84M2/UP84M2";
dis.interest = 0.08; dis.mortality1 = "UP84M2"; dis.mortality2 = "UP84M2";
dis.calcMethod = "MP"; dis.deferralMortality = "Y"; dis.monthsCertain = 36;
dis.partSex = "M"; dis.ruleText = "disability retirement factor by actuarial equivalence";
dis.rule = { kind: "bcv", function: "ERFAEQ" }; dis.note = null;
const merged = PF.mergePartialPfJson(cur, { factorSets: [dis] });
check("partial merge succeeds", merged.ok, merged.errors.join("; "));
check("partial merge fills the missing set", merged.filled.length === 1 && merged.filled[0] === "ERF-DIS-2020");
check("partial merge result validates", PF.validatePfJson(merged.data).errors.length === 0, PF.validatePfJson(merged.data).errors.join("; "));
const refused = PF.mergePartialPfJson(cur, { factorSets: [clone(demo.factorSets[0])] });
check("partial merge never overwrites a filled set", refused.filled.length === 0 && refused.ignored.length === 1);
const unknown = PF.mergePartialPfJson(cur, { factorSets: [Object.assign(clone(dis), { id: "ERF-1999" })] });
check("partial merge ignores an unknown set id", unknown.filled.length === 0 && unknown.ignored.length === 1);

/* --- 8. Prompt embedded --- */
check("prompt is embedded in the app", typeof PF.PF_SCRAPER_PROMPT === "string" && PF.PF_SCRAPER_PROMPT.length > 2000, "len=" + PF.PF_SCRAPER_PROMPT.length);
check("prompt names all 4 factor types", ["ERF", "LRF", "BFCF", "OTHER"].every((t) => PF.PF_SCRAPER_PROMPT.includes(t)));
check("prompt says return only valid JSON", /return \*\*only\*\* valid JSON/i.test(PF.PF_SCRAPER_PROMPT));
check("prompt says do not guess", /do not guess/i.test(PF.PF_SCRAPER_PROMPT));
check("prompt says keep every distinct set", /keep every distinct set/i.test(PF.PF_SCRAPER_PROMPT));

/* --- 8b. v0.2.0: plan-defined BCV arguments, no hardcodes --- */
const erfF = clone(demo.factorSets[1]);
erfF.id = "ERF-F-2020"; erfF.type = "ERF"; erfF.rule = { kind: "bcv", function: "ERFAEQ" };
erfF.partSex = "F"; erfF.calcMethod = "QP"; erfF.monthsCertain = 36;
const ff = PF.pfMonthFormula(erfF, "A11", 1);
check("ERF bcv with partSex F writes F, not M", ff.formula === 'ROUND(ERFAEQ(0.05,"F",65,A11,36,"GM83","GF83","QP","Y"),4)', ff.formula);
const bf75 = clone(demo.factorSets[2]);
bf75.toForm = "JS75"; bf75.survivorPct = null; bf75.benSex = "F";
check("survivorPct derives from JS75 as 0.75", PF.pfSurvivorPctForSet(bf75) === 0.75);
check("BFCF with JS75 writes 0.75 and JSC", PF.pfBfcfFormula(bf75, "C10", "B11").formula.indexOf('"JSC",0.75') >= 0);
check("BFCF form code is JSC for JS forms, null otherwise", PF.pfBfcfFormCode("JS50") === "JSC" && PF.pfBfcfFormCode("SLA") === null);
const noDm = clone(demo); noDm.factorSets[1].deferralMortality = null;
check("validator rejects a bcv rule with no deferralMortality (no silent Y)", PF.validatePfJson(noDm).errors.some((e) => e.indexOf("deferralMortality") >= 0), PF.validatePfJson(noDm).errors.join("; "));
const noSex = clone(demo); noSex.factorSets[1].partSex = null;
check("validator rejects a bcv rule with no partSex", PF.validatePfJson(noSex).errors.some((e) => e.indexOf("partSex") >= 0));
const noRt = clone(demo); noRt.factorSets[0].ruleText = null;
check("validator rejects a present set with no ruleText", PF.validatePfJson(noRt).errors.some((e) => e.indexOf("ruleText") >= 0));
const badTo = clone(demo); badTo.factorSets[2].toForm = "SLA"; badTo.factorSets[2].survivorPct = null;
check("validator rejects a bcv BFCF set whose toForm is not a JS form", PF.validatePfJson(badTo).errors.some((e) => e.indexOf("toForm") >= 0));
const badFac = clone(demo); badFac.factorSets[0].table.rows[0].factor = 2.5;
check("validator rejects a table factor outside 0-2", PF.validatePfJson(badFac).errors.some((e) => e.indexOf("factor") >= 0));
const badMo = clone(demo); badMo.factorSets[0].table.rows[0].months = 999;
check("validator rejects a table month outside the set range", PF.validatePfJson(badMo).errors.some((e) => e.indexOf("months") >= 0));
check("table lookup returns the printed value", PF.pfTableValue(demo.factorSets[0], 60, null, null) === 0.6667);
check("table lookup returns null off the table", PF.pfTableValue(demo.factorSets[0], 2, null, null) === null);
check("source label is Table when a table exists", PF.pfSetSourceLabel(demo.factorSets[0]).indexOf("Table:") === 0);
check("source label is Formulas when no table exists", PF.pfSetSourceLabel(demo.factorSets[1]) === "Formulas from the rule");
const erfSheet2 = PF.pfSheetForSet(demo.factorSets[0], demo.planMetadata);
check("ERF sheet writes table month 1 as a value, not a formula", erfSheet2.xml.indexOf('<c r="B11" s="1"><v>0.9944</v></c>') >= 0);
check("ERF sheet writes table month 60 as a value", erfSheet2.xml.indexOf('<c r="J22" s="1"><v>0.6667</v></c>') >= 0);
check("ERF sheet writes table month 120 as a value", erfSheet2.xml.indexOf('<c r="J34" s="1"><v>0.3333</v></c>') >= 0);
check("ERF sheet still writes formulas off the table (month 2)", erfSheet2.xml.indexOf("ROUND(1-(C11/180),4)") >= 0);
const statsOut = [];
PF.pfBuildXlsxBytes(approved, statsOut);
check("build stats report table vs formula cells per set", statsOut.length === 3 && statsOut[0].tableCells === 3 && statsOut[0].formulaCells === 117 && statsOut[1].tableCells === 0, JSON.stringify(statsOut));

/* --- 9. UI import/generate path (minimal DOM stub) --- */
{
  const docStub = {
    readyState: "complete",
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    createElement: () => ({ click: () => {}, setAttribute: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
    documentElement: { setAttribute: () => {}, removeAttribute: () => {} },
  };
  const sb2 = { console, TextEncoder, Blob, URL, File, setTimeout, document: docStub };
  vm.createContext(sb2);
  vm.runInContext(script, sb2, { filename: "pf-generator.html" });
  const P2 = sb2.PF;
  const st = () => sb2.PF.state;

  sb2.pfImportText(JSON.stringify(P2.DEMO_PF_JSON), "test file");
  check("UI import accepts the demo JSON", st().data !== null && st().importReport.kind === "pf" && st().step === 2);

  sb2.pfImportText('{"planMetadata": ', "bad file");
  check("UI import rejects unreadable JSON", st().importReport.kind === "error");

  const badFull = clone(P2.DEMO_PF_JSON); delete badFull.planMetadata.planName;
  sb2.pfImportText(JSON.stringify(badFull), "bad file");
  check("UI import rejects a full JSON that fails validation", st().importReport.kind === "error");

  // Partial merge through the UI path.
  sb2.pfImportText(JSON.stringify(P2.DEMO_PF_JSON), "test file");
  const part = { factorSets: [Object.assign(clone(P2.DEMO_PF_JSON.factorSets[3]), { status: "present", basis: "ERFAEQ with interest=8%; mortality=UP84M2/UP84M2", interest: 0.08, mortality1: "UP84M2", mortality2: "UP84M2", calcMethod: "MP", deferralMortality: "Y", monthsCertain: 36, partSex: "M", ruleText: "disability retirement factor by actuarial equivalence", rule: { kind: "bcv", function: "ERFAEQ" }, note: null })] };
  sb2.pfImportText(JSON.stringify(part), "partial file");
  check("UI partial import fills the missing set", st().importReport.kind === "partial" && st().importReport.filled === 1 && st().data.factorSets.find((s) => s.id === "ERF-DIS-2020").status === "present");

  // Generate gate: locked while undecided, open once all decided.
  sb2.pfImportText(JSON.stringify(P2.DEMO_PF_JSON), "test file");
  sb2.pfGenerate();
  check("UI generate is locked while sets are undecided", st().generated === null);
  st().data.factorSets.forEach((s) => {
    st().decisions[s.id] = s.status === "missing" ? "rejected" : "approved";
  });
  const gen = sb2.pfGenerate();
  check("UI generate produces the .xlsx once all decided", gen.ok && st().generated && st().generated.name === "98765400PF.xlsx" && st().step === 4, "name=" + (st().generated && st().generated.name));
  check("UI generate wrote 3 tabs", st().generated && st().generated.tabs === 3);
  const gbuf = Buffer.from(st().generated.bytes);
  check("generated bytes contain the BFCF formula", gbuf.indexOf(Buffer.from("BFCFAEQ(", "utf8")) >= 0);
  check("generated bytes omit the rejected set", gbuf.indexOf(Buffer.from("Disability", "utf8")) < 0);
  check("audit log has entries", st().audit.length >= 3);
  check("audit log records per-set table vs formula counts", st().audit.some((a) => a.action === "generate set" && a.detail.indexOf("ERF-2020") === 0 && a.detail.indexOf("table values: 3") >= 0), st().audit.map((a) => a.action + " " + a.detail).join(" | "));
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
