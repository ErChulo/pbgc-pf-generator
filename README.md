# PF Generator — Plan Factors

![Tests: 331 passing](https://img.shields.io/badge/tests-331%20passing-brightgreen)
![Unit tests: 244 passing](https://img.shields.io/badge/unit%20tests-244%20passing-brightgreen)
![Browser tests: 87 passing](https://img.shields.io/badge/browser%20tests-87%20passing-brightgreen)
![XLSX checks: 88 passing](https://img.shields.io/badge/xlsx%20checks-88%20passing-brightgreen)
![Network calls: 0](https://img.shields.io/badge/network%20calls-0-brightgreen)
![Version: v0.4.2](https://img.shields.io/badge/version-v0.4.2-blue)

Badges show grades measured on v0.4.2. Update badges when tests change.

## v0.4.2 — Certain-only forms use `CTN`

- **BFCFAEQ Method was the interest method, not deferral mortality
  — a real bug, fixed.** The app wrote `deferralMortality`
  (`Y`/`N`) into BFCFAEQ's `Method` slot. BFCFAEQ has no such
  parameter: the slot is the interest method (`O`, `N`, `L`,
  `L` + stability period, `L` + lookback), per the add-in doc
  p.143 and Factor Training 2026. Writing `"N"` was right by luck
  for fixed-rate plans; `"Y"` would have been invalid. BFCF sets
  now carry `intMethod` (required, validated); ERF/LRF keep
  `deferralMortality` `Y`/`N`.
- **Certain-only forms.** `CTN` is the name (user direction). The
  add-in code itself, per the add-in doc p.38. The term is not in
  the name: `monthsCertain` states it in months, over 0, enforced
  by the validator. A `CTN` to-form is refused — no field holds its
  term. Item 10 closed; no open issues.
- **Logo.** White PBGC logo in the header (same file as DEL).
- **Per-type prompts.** Step 1 offers the full prompt plus one
  prompt per factor type (ERF, LRF, BFCF, OTHER).
- **Print preview.** Step 4 previews every tab as HTML tables:
  header rows, printed values, formula text.
- **Printed tables on added conversions.** The Add form and the
  edit panel take a printed BFCF grid (one row per line).

See `docs/RELEASE_NOTES_0.4.0.md` and `docs/OFFICE_TESTING.md`.

## v0.3.0 — Software correctness and end-to-end readiness

- **BCV form-code mapping fixed.** A `3CC` from-form used to write
  `BFCFAEQ("3CC",...)`, which the add-in rejects. It now writes
  `BFCFAEQ("SLA",0,36,...)`, as the reference file does. Every plan
  form maps to its BCV code (`SLA`, `nCC` → `SLA` + `n*12` months
  certain, `JSnn` → `JSC` + percent). Unknown forms are refused.
- **Validation, fail-closed.** Interest under 1.0, NRA and ages
  0–124, calc method `MP`/`QP`/`SP`/`Exact`, mortality codes on the
  known MORTNAME list (or user-confirmed), survivor percent matching
  its to-form, months certain matching a `nCC` form name.
- **Effective dates and duplicates.** Each set carries
  `effectiveFrom` / `effectiveTo`; a set starting after DOPT is
  refused; the same factor key twice is refused as a duplicate.
- **Edit in the app.** Every set field is editable in Review, with
  re-validation on save and the exact formula shown before
  generating. A manually added pair PBGC does not honor needs an
  explicit "Include it anyway" tick.
- **Full grids and compression.** A 26 × 101 BFCF grid (2,626
  formulas) runs end to end. The ZIP writer compresses with DEFLATE
  (pure JS, offline): the full-grid workbook is 29 KB. Builds are
  deterministic — the same inputs give the same bytes.
- **Audit report.** Versions, input JSON hash, and one traceability
  line per set. The workbook's document properties carry the
  generator version.

See `docs/RELEASE_NOTES_0.3.0.md` and `docs/OFFICE_TESTING.md`.

## v0.2.3 — Additional conversions

The user can add any from-form to to-form conversion by hand, in
Review, under "Additional conversions" — a pair the scraper missed,
or one he knows belongs in the file. The form builds a BFCF set
with the same shape as a scraped set and the same validator checks
it. Copying BCV arguments from an existing BFCF set fills interest,
mortality, method, sexes, and ranges, but never the survivor
percent: it derives from the new to-form. A user-added pair gets a
tab even when PBGC does not honor it — the review says "included
by your choice" with the reason, and the audit log records it.
Adding approves the pair at once. Demo: the JS100 pair is
user-added; the workbook has 4 tabs.

## v0.2.2 — PBGC honors only normal single form to normal married form

A conversion PBGC will not honor is left out of the file. Only
conversions from the normal single form to the normal married form
get a tab. The app derives the decision itself from the plan's
normal married form (copied from the documents, never assumed);
the LLM's `appliesInPbgcAdmin` is checked against it and any
disagreement fails validation. The review screen shows "PBGC
honors: Yes/No" per BFCF set with the reason, and an excluded set
needs no decision and does not block Generate. The audit log names
every excluded set and its reason. Demo: the JS75 set is excluded;
the workbook still has exactly 3 tabs.

## v0.2.1 — table shape and cell formatting, as in the example

Months fill down each column, as in the example file: A 1–24,
C 25–48, E 49–72, G 73–96, I 97–120. Cell formatting matches the
example too: header fonts per row (14 / 12 / 11), thin borders on
row 10 and every table cell, template row heights, and the BFCF
A11 label merge split at row 70. Row 6 reads `Basis: <rule>`, as
in the example.

## v0.2.0 — plan-defined arguments

Every BCV argument now comes from the plan documents as the plan
defines it: sexes, calc method, deferral mortality, survivor
percent, temporary months. No hardcodes, no silent defaults. The
scraper quotes the plan's rule sentence (`ruleText`) and translates
it to a formula. A factor table printed in the documents is scraped
row by row and written as values; the rest stays formulas.

## Purpose

Write the PF — the plan factors workbook — from plan documents. One tab
per set of factors the plan uses: early retirement factors, late
retirement factors, benefit form conversion factors, and any other
factors for benefits. Each tab is set to print.

## End result

A filled PF Excel workbook: `<case>PF.xlsx`, e.g. `98765400PF.xlsx`.
One tab per approved factor set. Header rows (plan, case, DOPT, title,
basis, normal form). Months/Factor tables for ERF/LRF. Age grids for
BFCF. Formulas in the cells, except values the document table prints.
Plus an audit log.

## How to use

Open `pf-generator.html` in a browser, straight from disk (`file://`). No server. No install. No data leaves the page. One HTML file. Theme toggle in the header: dark or light.

1. **Download prompt** — scraper prompt for the LLM.
2. **Upload JSON** — JSON from the LLM, or flat JSON. Partial JSON fills only missing sets.
3. **Review** — each factor set: Approve / Edit / Reject. Edit any
   field in place; save re-validates and a saved edit needs approval
   again. Read the plan's words (`ruleText`), the source (table
   values or formulas), the effective dates, and the exact formula
   that will be written. Unmapped keys listed, never dropped.
   Conflicts become ambiguous, never merged. Additional conversions:
   add any from-form to to-form pair the scraper missed; a pair PBGC
   does not honor needs the "Include it anyway" tick, and the audit
   log records the override.
4. **Generate** — locked until header (plan name, case number, DOPT) is filled and each set has a decision. Approved sets must be present.
5. **Download** — filled `<case>PF.xlsx` + audit log.

Loop, in one line: LLM proposes. App checks. You decide. App writes the workbook from approved JSON only. No LLM in the generation path.

Demo case: synthetic. Riverbend Manufacturing Pension Plan, Plan No. 001, case 98765400, DOPT 2025-06-30. Same invented plan as the R5 and DEL generators. No real plan identity anywhere.

## Files

| Path | What it is |
| --- | --- |
| `pf-generator.html` | Deliverable. One `<style>`, one `<script>`, all data embedded. |
| `schema/pf.schema.json` | PF JSON schema (draft). Factor sets, statuses, rules. |
| `prompts/pf-scraper-prompt.md` | Scraper prompt (also embedded in the HTML). |
| `docs/tokens.json` | PBGC Design System tokens used (v1.1.0 DRAFT, not approved). |
| `docs/DESIGN_SYSTEM.md` | Which tokens, which version, which choices. |
| `docs/PF_NOTES.md` | PF definition, tab mapping, formulas, print setup, statuses. |
| `docs/HOW_IT_WORKS.md` | End-to-end mechanics: user actions and app behavior. |
| `docs/XLSX_LIBRARY.md` | Why direct XML, prototype evidence. |
| `docs/OLD_ATTEMPT_COMPARISON.md` | Old March 2026 attempt vs this version; what was borrowed (v0.1.1 layout parity). |
| `scripts/build_single_file.py` | Injects the prompt into the HTML; runs safety checks. |
| `scripts/gen_demo_xlsx.cjs` | Generates the demo .xlsx through the HTML's own code. |
| `scripts/gen_full_grid_xlsx.cjs` | Generates a full 26×101 BFCF grid .xlsx through the HTML's own code. |
| `scripts/verify_xlsx.py` | Checks the generated .xlsx with openpyxl + LibreOffice (88). |
| `tests/run.cjs` | Unit tests (243). |
| `tests/browser.cjs` | Browser tests (87, jsdom). |
| `docs/RELEASE_NOTES_0.4.0.md` | What changed in v0.4.0. One item withdrawn in v0.4.1. |
| `docs/RELEASE_NOTES_0.4.1.md` | What changed in v0.4.1. One item withdrawn. |
| `docs/RELEASE_NOTES_0.4.2.md` | What changed in v0.4.2. No open issues. |
| `docs/OFFICE_TESTING.md` | Office test instructions for v0.4.2. |
| `samples/riverbend-pf.json` | Sample synthetic input JSON (regenerates the sample workbook). |

Sample workbooks are generated, not stored in the repo (binary):
`node scripts/gen_demo_xlsx.cjs` makes the demo workbook;
`node scripts/gen_full_grid_xlsx.cjs` makes the full grid.
| `package.json` | Test command (`npm test`), jsdom dev dependency. |
| `OPEN_ITEMS.md` | Gap list. Read it before next steps. |

## Design system

PBGC Design System **v1.1.0 DRAFT** (not approved). Tokens from `ErChulo/pbgc-design-system`, commit `84a7149d112ef26fcf1e5656b017b9e54f863cb2` (2026-11-08), blob SHA `49e4c3c9e2a41bbe50bea204ea71a7d427843ac2` (byte-identical). Brand blue #002D72. Helvetica Neue/Arial. WCAG 2.2 AA. Dark theme: toggle in the header. Dark background #000. White PBGC logo in the header (same file as DEL, Book of Job "images" folder). Design-system repo not modified.

## Formulas

The app writes formulas. It never computes actuarial equivalence.
Every BCV argument comes from the plan documents: interest, mortality
tables, calc method, interest method (BFCF) or deferral mortality
(ERF/LRF), months certain, sexes, survivor percent, temporary months.
Missing arguments fail validation. There are no silent defaults.

- Plain rules: `=ROUND(1-(months/180),4)` and the stepped form. Cached values in the file, computed by the same arithmetic in JS.
- BCV rules: `ERFAEQ`, `LRFAEQ`, `BFCFAEQ` as cell formulas. They compute only in Excel with the ATPBGC add-in. The workbook sets `fullCalcOnLoad`, so Excel computes on open. Plan form names map to BCV codes: `SLA` → `SLA`, `nCC` (e.g. `3CC`) → `SLA` with `n*12` months certain, `JSnn` → `JSC` with the survivor percent. A form name with no BCV code is refused. BFCFAEQ's `Method` argument is the interest method (`N` for fixed-rate plans), not deferral mortality.
- Printed tables: values the documents print are written as values (format `0.0000`); the rest of the range stays formulas.
- Rounding: `ROUND(...,4)`, format `0.0000`.

## Print

Every tab: print area = full table, print titles rows 1:10, landscape, fit 1 wide x 2 tall, margins 0.4 / 0.4 / 0.5 / 0.5. Step 4 previews the tabs before generating.

## Tests

```sh
npm test                              # 244 unit + 87 browser checks
python3 scripts/verify_xlsx.py        # demo + full-grid .xlsx checks (88)
python3 scripts/build_single_file.py  # re-inject prompt, run safety checks
```

## Verified — v0.4.2

- `npm test`: **331 passed, 0 failed** (244 unit + 87 browser).
- `node --check` on the HTML script: passes.
- `python3 scripts/verify_xlsx.py`: all 88 checks pass. 4 tabs (ERF-2020, LRF-2020, BFCF-2020 SLA->JS50, BFCF-2020 SLA->JS100). No JS75 tab: the SLA->JS75 pair is left out by the PBGC rule. The user-added JS100 tab carries the BFCFAEQ formula with survivor percent 1, derived from the to-form. The audit log is the full report (versions, input hash, per-set trace). Headers filled. Formulas present. Print setup, merged headers, freeze panes, and column widths present on every tab. BFCF headers in column B, as in the reference file. Demo ERF tab: months fill down each column (C11=25, E11=49, G11=73, I11=97); months 1, 60, 120 are table values (0.9944 at B11, 0.6667 at F22, 0.3333 at J34); the rest are formulas. Header fonts match the reference file (A1=14 bold, A5=12 bold), thin borders on row 10 and table cells, row heights match. BFCF formula carries the plan sexes "M","F". LRF formula carries months certain 36 (normal form 3CC, as in the reference file's LRF-1982 and LRF-2011). LibreOffice Calc opens the file, converts it to PDF, and shows the month-1 factor (0.9944).
- Full grid: a 26 × 101 BFCF grid (2,626 formulas, A1:AB111) builds and opens, 29 KB compressed.
- Determinism: the same approved inputs produce identical bytes. `samples/riverbend-pf.json` regenerates `samples/riverbend-pf.xlsx` byte-for-byte.
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`, no external URLs. Only `http://` strings: OOXML namespace URIs in the .xlsx builder and document properties — identifiers, not fetches.
- Browser test: page loads in jsdom on an opaque origin (file: URL). Demo button loads the demo case, moves to Review. Generate stays locked until all sets are decided; approving a missing set stays locked. Editing a set in place re-validates; a bad save is refused.
- Theme toggle: flips data-theme, dark page #000, header stays brand blue, choice persists.
- Header/nav: skip link first, nav links with aria-current, hash links + hashchange, Menu disclosure on small screens with Escape + focus return.
- No real-case strings in the generated .xlsx (checked by verify script, decompressed members included).

## Not verified

- The BCV function signatures (ERFAEQ / LRFAEQ / BFCFAEQ) are confirmed against the BCV add-in doc (Jul 2024): argument order matches, codes GM83/GF83/UP84 appear. Still open: the table code UP84M2 has no hit in the doc text; it comes from the reference file only.
- No written PBGC rounding policy was found yet. The file's practice (ROUND to 4) is the policy for now.
- Excel with the ATPBGC add-in has not computed the BCV formulas yet — LibreOffice proves the file opens and the plain formulas compute; the BCV cells compute only in Excel with the add-in.
