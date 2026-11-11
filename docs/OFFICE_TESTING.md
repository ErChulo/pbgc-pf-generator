# Office testing — PF Generator v0.3.0

How to test the app in the PBGC office. No server. No install. No
administrator rights. Double-click one file.

## What you need

- `pf-generator.html` (this release).
- Excel with the ATPBGC add-in, so the BCV formulas compute.
- The sample file in `samples/` (synthetic — no real plan):
  - `riverbend-pf.json` — sample input JSON. The app itself makes
    the workbook from it (see step 6).
- The sample workbooks are generated, not stored in the repo:
  `node scripts/gen_demo_xlsx.cjs` makes the demo workbook;
  `node scripts/gen_full_grid_xlsx.cjs` makes the full 26 × 101
  grid. Both need a desktop with Node.

## 1. Open the app

Double-click `pf-generator.html`. It opens in the browser, straight
from disk. No server, no data leaves the page. The header shows
v0.3.0.

## 2. Try the demo

Click "Try the demo" (Welcome page, or Step 2). The demo case loads:
Riverbend Manufacturing Pension Plan, Plan No. 001, case 98765400,
DOPT 2025-06-30. Review shows 5 scraped sets and 1 user-added
conversion (SLA to JS100).

## 3. Review

Step 3 shows each set with its source, its effective dates, and the
exact formula that will be written. Check:

- ERF-2020: linear, months 1–120, table values at 1, 60, 120.
- LRF-2020: `LRFAEQ` with months certain 36 (normal form 3CC).
- BFCF-2020 SLA to JS50: honored by PBGC. BFCF-2020 SLA to JS75:
  left out by the PBGC rule, with the reason.
- BFCF-2020 SLA to JS100: user-added, included by choice.

Try Edit on a set: change a value, save a bad one (refused, error
names the field), save a good one (decision clears — approve again).

## 4. Approve, generate, download

Approve ERF-2020, LRF-2020, BFCF-2020, and the JS100 conversion.
Reject the missing disability set. Generate unlocks. Download
`98765400PF.xlsx` and the audit log.

## 5. Check the workbook in Excel

- 4 tabs: ERF-2020, LRF-2020, BFCF-2020 SLA->JS50,
  BFCF-2020 SLA->JS100. No JS75 tab.
- BFCF C11 reads
  `=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C10,B11,"M","F",0.08,"UP84M2","UP84M2","MP","N"),4)`.
  With the add-in, it computes. Without it, Excel shows the formula.
- ERF B11 is 0.9944 (a table value). B12 is a formula.
- Print: each tab prints landscape, fit 1 wide × 2 tall, titles
  rows 1:10.
- File → Properties shows "PF Generator v0.3.0".

## 6. Check the sample reproduces

Upload `samples/riverbend-pf.json`, approve the same sets, generate.
The file you get is byte-identical to the sample workbook the
generator script makes (`node scripts/gen_demo_xlsx.cjs`).
That is the reproducibility check.

## 7. Check the full grid

Generate it with `node scripts/gen_full_grid_xlsx.cjs` (desktop with
Node) and open it: one tab, ages 55–80 across, 0–100 down, 2,626
formulas. Excel opens it without a repair warning.

## 8. Try a real plan (synthetic JSON first)

Feed the scraper prompt (`Step 1 — Download the scraper prompt`)
and the plan documents to Copilot. Upload the JSON it returns. The
app validates it and refuses bad values with the field named. Fix
values in Review with Edit instead of editing the JSON.

## What to report back

- Any value the app refuses that the documents support.
- Any formula that does not match the plan's rule.
- Any workbook Excel refuses to open, or opens with a repair warning.
- The mortality code, if the plan uses one the app does not know
  (tick "Mortality code confirmed" in Edit once checked in MORTNAME).

## Test results for this release

- `npm test`: 288 passed (217 unit + 71 browser).
- `python3 scripts/verify_xlsx.py`: 88 checks pass, including the
  full grid and a LibreOffice PDF conversion.
- See `docs/RELEASE_NOTES_0.3.0.md` for what changed and what is
  still open.
