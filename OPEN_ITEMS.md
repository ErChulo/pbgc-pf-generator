# OPEN ITEMS — PF Generator v0.3.0

The canonical gap list. Read this before proposing next steps.

## Fixed in v0.3.0 (Software correctness and end-to-end readiness)

- **BCV form-code mapping.** A `3CC` from-form wrote
  `BFCFAEQ("3CC",...)` — invalid, the add-in accepts only `SLA`,
  `CTN`, `JSC`, `JSJ`, `JSN`, `JSP`. It now writes
  `BFCFAEQ("SLA",0,36,...)`, as the reference file does. Plan forms
  map to BCV codes (`SLA`, `nCC` → `SLA` + `n*12`, `JSnn` →
  `JSC` + percent); unknown forms are refused. Months certain
  derives from a `nCC` form name and conflicts fail validation.
  Demo LRF fixed: `3CC` with 0 → 36.
- **Validation, fail-closed.** Interest under 1.0, NRA and ages
  0–124, calc method `MP`/`QP`/`SP`/`Exact`, mortality codes on the
  known MORTNAME list (or user-confirmed), survivor percent matching
  its to-form, NRA plus months certain over 124 refused for
  Woolhouse methods.
- **Effective dates and duplicates.** `effectiveFrom` /
  `effectiveTo` per set; a set starting after DOPT is refused; the
  same factor key twice is refused as a duplicate.
- **Edit in the app.** Every set field is editable in Review, with
  re-validation on save; a saved edit clears the decision. Each row
  shows the exact formula that will be written. A manually added
  pair PBGC does not honor needs the "Include it anyway" tick.
- **Full grid.** A 26 × 101 BFCF grid (2,626 formulas) runs end to
  end: `samples/riverbend-full-grid.xlsx`, 29 KB.
- **Compression and determinism.** DEFLATE (pure JS, offline) for
  every ZIP entry; fixed ZIP timestamps, so the same approved
  inputs give the same bytes. Sample JSON regenerates the sample
  workbook byte-for-byte.
- **Audit report and versions.** Full report (versions, input JSON
  hash, per-set traceability); workbook document properties carry
  the generator version. Two sets sharing a tab name are refused.
- **Scraper prompt.** Per-document instruction (read each document
  on its own, then combine), effective dates, form-name guidance,
  MORTNAME note, `schemaVersion` in the shape.

## Fixed in v0.2.3 (Additional conversions)

The user can add any from-form to to-form pair by hand in Review,
under "Additional conversions". The form builds a BFCF set with the
same shape as a scraped set; the same validator checks it (same
BCV arguments, same age ranges, same rule). Adding it approves it:
the user's own entry is the approval. A user-added pair gets a tab
even when PBGC does not honor it — the PBGC rule never leaves it
out. The review says "PBGC honors: No — included by your choice"
with the reason, and the audit log records it as "additional
conversion (user-added)". Copying BCV arguments from an existing
BFCF set fills interest, mortality, method, sexes, and ranges, but
never the survivor percent: it derives from the new to-form (JS100
-> 1). Demo: the JS100 pair is user-added; the workbook has 4 tabs.
See the "Additional conversions" part of the "PBGC honors" section
in `docs/PF_NOTES.md`.

## Fixed in v0.2.2 (PBGC honors rule)

PBGC honors only conversions from the normal single form to the
normal married form. Any other BFCF pair is left out of the
workbook: no tab, no decision needed in review, and the generate
gate is not blocked by it. The app derives the decision itself
from `fromForm`, `normalForm`, `toForm`, and
`planMetadata.normalMarriedForm`; the LLM's `appliesInPbgcAdmin`
is checked against it and any disagreement fails validation. A
missing `normalMarriedForm` fails validation when a BFCF set is
present — never guessed as JS50. The review screen shows "PBGC
honors: Yes/No" per BFCF set with the reason. The audit log names
every excluded set and its reason, and records the normal married
form used. Demo: the JS75 set is excluded; the workbook still has
exactly 3 tabs. See the "PBGC honors" section in `docs/PF_NOTES.md`.

## Fixed in v0.2.1 (table shape and cell formatting)

Months fill down each column, as in the reference file (v0.2.0 ran
them across the row). Cell formatting matches the reference file:
header fonts per row (14 / 12 / 11, Calibri), thin borders on row 10
and every table cell, template row heights, empty merged rows 4 and
8 with anchor cells, and the BFCF A11 label merge split at row 70
(one merge for grids ending at or before row 70). Row 6 reads
`Basis: <rule>`, as in the reference file. An openpyxl style diff
of the demo file against the reference file shows no remaining
differences on fonts, borders, merges, freeze panes, widths, print
settings, or row heights — only the interior cells of merged ranges
(e.g. H9, A16), which the reference file stores with partial
borders and ours omits; Excel draws a merged area's border from its
top-left cell, so the printed look is the same. See the
layout-parity section in `docs/PF_NOTES.md`.

## Fixed in v0.2.0 (plan-defined BCV arguments)

Every BCV argument now comes from the plan documents: `partSex`,
`benSex`, `calcMethod`, `deferralMortality` (no silent default),
`survivorPct` (explicit, or derived from a JS to-form), `monthsTemp`.
The scraper prompt asks for each one, plus `ruleText` (the plan's
own words, quoted) and any printed factor `table` (copied
semantically; values written as values, formulas for the rest).
Review shows `ruleText` and the source label per set. The audit log
counts table vs formula cells per set. See the BCV argument mapping
in `docs/PF_NOTES.md`.

## Fixed in v0.1.1 (from the old-attempt review)

Merged header cells, freeze panes, exact column widths, and the BFCF
column shift (headers in column B, row-9 label, B10 "Age", A11 label).
Layout-parity checks added to `scripts/verify_xlsx.py` and the unit
tests. Schema tightened (`additionalProperties: false` on the fixed
objects). See `docs/OLD_ATTEMPT_COMPARISON.md` and the layout-parity
section in `docs/PF_NOTES.md`.

## 1. Full BFCF grid — fixed in v0.3.0

A full grid (26 x 101 = 2,626 formulas per tab) now runs end to
end through the app: `scripts/gen_full_grid_xlsx.cjs` and
`samples/riverbend-full-grid.xlsx` (29 KB compressed). DEFLATE
replaced stored ZIP; see "Fixed in v0.3.0" above.

## 2. Mortality table code UP84M2 not confirmed in the add-in doc

Arg order and codes GM83/GF83/UP84 are confirmed against
`BCV_ATPBGC_Add-ins.pdf` (Jul 2024). The doc examples
`ERFAEQ(.06,"M",65,120,0,"GM83","GF83","MP","Y")` and
`BFCFAEQ("SLA",0,0,0,"JSC",0.5,0,0,65,61,"M","F",0.06,"LS00SU2015","LS00SU2015","MP","N")`
match our formulas. Still open: "UP84M2" has no hit in the doc
text; it comes from the reference file only. The doc lists no full
table-code list — codes live in the ATPBGC database MORTNAME table,
looked up with MORTCODE/MORTDESC. Confirm UP84M2 is a valid
MORTNAME code. Until then: UP84M2 is on the app's known list (from
the reference file), and any other unlisted code needs
`mortalityConfirmed` — the user checked it in MORTNAME.

## 3. Rounding policy source not found

The file shows ROUND to 4 decimals. No written PBGC rounding policy
was found in the Book of Job yet. If none exists, the file's practice
is the policy. Search for it.

## 4. No logo in v0.3.0

The header is text only. The DEL generator embeds the white PBGC logo
(base64, from the Book of Job "images" folder). PF should reuse that
approach: same source files, same manifest note, white logo on the
blue header in both themes. Do not invent a logo.

## 5. Scraper prompt is one prompt, not per-group prompts

The prompt asks for all factor sets at once, but v0.3.0 adds a
per-document instruction (read each document on its own, then
combine). A per-era or per-type prompt split (like the DEL
full-universe plan) may still be needed. Not decided.

## 6. Edit is title-only in review — fixed in v0.3.0

Review now edits every set field in place (interest, mortality,
method, sexes, ranges, dates, citation), with re-validation on
save. The printed factor table is still JSON-only: it cannot be
edited in the app.

## 7. No print preview in the app

The app sets print area, titles, fit, and margins, but it does not
show a print preview. The user checks print in Excel. A preview
would need a render of the sheet, which the single file does not do.

## 8. Additional conversions cannot carry a printed factor table yet

A user-added conversion is formula-only (`table` is null). If the
plan documents print a factor table for that pair, the user cannot
attach it through the form today — the values must be in the JSON
as a scraped set, or the table stays formulas. The form is also
BFCF-only by design: ERF, LRF, and OTHER sets come from the
scraper, not from the form.
