# PF Generator — Plan Factors

![Tests: 137 passing](https://img.shields.io/badge/tests-137%20passing-brightgreen)
![Unit tests: 97 passing](https://img.shields.io/badge/unit%20tests-97%20passing-brightgreen)
![Browser tests: 40 passing](https://img.shields.io/badge/browser%20tests-40%20passing-brightgreen)
![XLSX checks: 48 passing](https://img.shields.io/badge/xlsx%20checks-48%20passing-brightgreen)
![Network calls: 0](https://img.shields.io/badge/network%20calls-0-brightgreen)
![Version: v0.1.1](https://img.shields.io/badge/version-v0.1.1-blue)

Badges show grades measured on v0.1.1. Update badges when tests change.

## Purpose

Write the PF — the plan factors workbook — from plan documents. One tab
per set of factors the plan uses: early retirement factors, late
retirement factors, benefit form conversion factors, and any other
factors for benefits. Each tab is set to print.

## End result

A filled PF Excel workbook: `<case>PF.xlsx`, e.g. `98765400PF.xlsx`.
One tab per approved factor set. Header rows (plan, case, DOPT, title,
basis, normal form). Months/Factor tables for ERF/LRF. Age grids for
BFCF. Formulas in the cells, not values. Plus an audit log.

## How to use

Open `pf-generator.html` in a browser, straight from disk (`file://`). No server. No install. No data leaves the page. One HTML file. Theme toggle in the header: dark or light.

1. **Download prompt** — scraper prompt for the LLM.
2. **Upload JSON** — JSON from the LLM, or flat JSON. Partial JSON fills only missing sets.
3. **Review** — each factor set: Approve / Edit / Reject. Unmapped keys listed, never dropped. Conflicts become ambiguous, never merged.
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
| `scripts/verify_xlsx.py` | Checks the generated .xlsx with openpyxl + LibreOffice. |
| `tests/run.cjs` | Unit tests (97). |
| `tests/browser.cjs` | Browser tests (40, jsdom). |
| `package.json` | Test command (`npm test`), jsdom dev dependency. |
| `OPEN_ITEMS.md` | Gap list. Read it before next steps. |

## Design system

PBGC Design System **v1.1.0 DRAFT** (not approved). Tokens from `ErChulo/pbgc-design-system`, commit `84a7149d112ef26fcf1e5656b017b9e54f863cb2` (2026-11-08), blob SHA `49e4c3c9e2a41bbe50bea204ea71a7d427843ac2` (byte-identical). Brand blue #002D72. Helvetica Neue/Arial. WCAG 2.2 AA. Dark theme: toggle in the header. Dark background #000. No logo in v0.1.1 (see OPEN_ITEMS.md). Design-system repo not modified.

## Formulas

The app writes formulas. It never computes actuarial equivalence.

- Plain rules: `=ROUND(1-(months/180),4)` and the stepped form. Cached values in the file, computed by the same arithmetic in JS.
- BCV rules: `ERFAEQ`, `LRFAEQ`, `BFCFAEQ` as cell formulas. They compute only in Excel with the ATPBGC add-in. The workbook sets `fullCalcOnLoad`, so Excel computes on open.
- Rounding: `ROUND(...,4)`, format `0.0000`.

## Print

Every tab: print area = full table, print titles rows 1:10, landscape, fit 1 wide x 2 tall, margins 0.4 / 0.4 / 0.5 / 0.5.

## Tests

```sh
npm test                              # 97 unit + 40 browser checks
python3 scripts/verify_xlsx.py        # demo .xlsx checks (48)
python3 scripts/build_single_file.py  # re-inject prompt, run safety checks
```

## Verified — v0.1.1

- `npm test`: **137 passed, 0 failed** (97 unit + 40 browser).
- `node --check` on the HTML script: passes.
- `python3 scripts/verify_xlsx.py`: all 48 checks pass. 3 tabs (ERF-2020, LRF-2020, BFCF-2020 SLA->JS50). Headers filled. Formulas present. Print setup, merged headers, freeze panes, and column widths present on every tab. BFCF headers in column B, as in the reference file. LibreOffice Calc opens the file and computes the plain formulas (month 1 = 0.9944).
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`, no external URLs. Only `http://` strings: OOXML namespace URIs in the .xlsx builder — identifiers, not fetches.
- Browser test: page loads in jsdom on an opaque origin (file: URL). Demo button loads the demo case, moves to Review. Generate stays locked until all sets are decided; approving a missing set stays locked.
- Theme toggle: flips data-theme, dark page #000, header stays brand blue, choice persists.
- Header/nav: skip link first, nav links with aria-current, hash links + hashchange, Menu disclosure on small screens with Escape + focus return.
- No real-case strings in the generated .xlsx (checked by verify script).

## Not verified

- The full BFCF grid (26 participant ages x 101 beneficiary ages) has not been generated end to end yet — the demo uses a small grid (6 x 6). The builder writes grids of any size from imported JSON; a full-grid run is an open item.
- The BCV function signatures (ERFAEQ / LRFAEQ / BFCFAEQ, 9 / 9 / 15 args) come from the reference file only. They are not yet confirmed against the BCV add-in documentation in the Book of Job.
- No written PBGC rounding policy was found yet. The file's practice (ROUND to 4) is the policy for now.
