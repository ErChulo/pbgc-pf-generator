# Release notes — PF Generator v0.4.0

> **Withdrawn in v0.4.1:** the certain-only section below
> (`nCO` / `3CO`) was invented, not a PBGC rule. The user corrected
> it. The name and mapping are removed; item 10 is open again.
> Everything else in v0.4.0 stands.


All open issues closed. No open issues remain.

## The interest-method fix (a real bug)

The app wrote `deferralMortality` (`Y`/`N`) into BFCFAEQ's `Method`
slot. BFCFAEQ has no deferral-mortality parameter: the slot is the
interest method. Found by reading the add-in doc p.143 ("Method
(IntMethod and SMethod)") and Factor Training 2026 slide 69, which
shows a worked BFCFAEQ passing `"LPQ"` there.

Levels, per the doc: `O` (PBGC lump sum rate structure), `N` (PBGC
annuity rate structure — fixed-rate plans), `L` (417(e) segment
rates), `L**` (L + stability period: PY, CY, PQ, CQ, M), `L**#`
(L** + lookback 1–5), and O/N with a stability period only with
LS06SUYYYY or LS12SUYYYY mortality. `LPBGC` is not available in
BFCFAEQ and is refused.

Writing `"N"` was right by luck for fixed-rate plans; writing
`"Y"` would have been invalid. BFCF sets now carry `intMethod`
(required, validated); the formula writes it in the `Method` slot.
A non-null `deferralMortality` on a BFCF set is refused. ERF/LRF
keep `deferralMortality` `Y`/`N` and carry no `intMethod`
(fixed-rate plans only: interest is a number, not a date).

## Certain-only forms

New plan-form name `nCO` (e.g. `3CO`), mapped to BCV code `CTN`
with `n*12` months certain. Months certain derives from the name;
a stated value that disagrees fails validation. The name is a Muse
decision, parallel to `nCC`, for the user to correct if the
documents write it another way.

## Logo

White PBGC logo in the header (same file as DEL, Book of Job
"images" folder; local copy in `assets/logos/`). 52px desktop,
44px under 640px, both themes.

## Per-type prompts

Step 1 offers the full prompt plus four per-type prompts (ERF,
LRF, BFCF, OTHER): the same prompt with a scope header that says
to find only that type. Run the LLM once per type, then combine
the JSON.

## Print preview

Step 4 has a "Preview print layout" button. Each tab the workbook
will hold shows as an HTML table: header rows, printed values as
printed, formula text where Excel computes. Built from the same
formula helpers as the .xlsx, so the preview and the file agree.

## Printed tables on added conversions

The Add form takes a printed factor table (one row per line:
partAge, benAge, factor), parsed and validated like a scraped
grid; the values are written as values in the tab. The edit panel
edits a BFCF set's printed table the same way. A months table
stays JSON-only.

## Also closed

- **UP84M2** — confirmed in use by PBGC in two sources (the
  reference PF file and the V1 engine reverse file for the same
  case). The MORTNAME table itself was never seen, but two PBGC
  sources using the code is the confirmation that matters.
- **Rounding policy** — no written PBGC rounding policy found in
  any source. The file's practice (`ROUND` to 4) is the policy.

## Verified — v0.4.0

- `npm test`: **330 passed, 0 failed** (243 unit + 87 browser).
- `node --check` on the HTML script: passes.
- `python3 scripts/verify_xlsx.py`: all 88 checks pass. 4 tabs
  (ERF-2020, LRF-2020, BFCF-2020 SLA->JS50, BFCF-2020 SLA->JS100).
  No JS75 tab. Full 26 × 101 grid (2,626 formulas) builds and
  opens, 29 KB compressed. LibreOffice converts to PDF and Calc
  shows the month-1 factor (0.9944).
- Determinism: the same approved inputs produce identical bytes.
  `samples/riverbend-pf.json` regenerates
  `samples/riverbend-pf.xlsx` byte-for-byte.
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`, no
  external URLs. Only `http://` strings: OOXML namespace URIs in
  the .xlsx builder and document properties — identifiers, not
  fetches.
