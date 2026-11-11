# OPEN ITEMS — PF Generator v0.2.2

The canonical gap list. Read this before proposing next steps.

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

## 1. Full BFCF grid not yet generated end to end

The demo uses a small grid (part 55–60, ben 0–5: 36 formulas). A full
grid (26 x 101 = 2,626 formulas per tab) has not been run through the
app yet. The builder writes grids of any size from imported JSON.
Run a full-grid import and check the file size, the write time, and
that Excel opens it. Stored ZIP (no compression) makes about 1 MB per
full tab. Compression is a later step, not a fix for v0.1.1.

## 2. Mortality table code UP84M2 not confirmed in the add-in doc

Arg order and codes GM83/GF83/UP84 are confirmed against
`BCV_ATPBGC_Add-ins.pdf` (Jul 2024). The doc examples
`ERFAEQ(.06,"M",65,120,0,"GM83","GF83","MP","Y")` and
`BFCFAEQ("SLA",0,0,0,"JSC",0.5,0,0,65,61,"M","F",0.06,"LS00SU2015","LS00SU2015","MP","N")`
match our formulas. Still open: "UP84M2" has no hit in the doc
text; it comes from the reference file only. The doc lists no full
table-code list — codes live in the ATPBGC database MORTNAME table,
looked up with MORTCODE/MORTDESC. Confirm UP84M2 is a valid
MORTNAME code.

## 3. Rounding policy source not found

The file shows ROUND to 4 decimals. No written PBGC rounding policy
was found in the Book of Job yet. If none exists, the file's practice
is the policy. Search for it.

## 4. No logo in v0.2.2

The header is text only. The DEL generator embeds the white PBGC logo
(base64, from the Book of Job "images" folder). PF should reuse that
approach: same source files, same manifest note, white logo on the
blue header in both themes. Do not invent a logo.

## 5. Scraper prompt is one prompt, not per-group prompts

The prompt asks for all factor sets at once. If a plan has many eras,
the LLM may miss sets. A per-era or per-type prompt split (like the
DEL full-universe plan) may be needed. Not decided.

## 6. Edit is title-only in review

Review lets the user edit a set title and the header. It does not yet
edit basis, interest, mortality, or ranges in place. A bad value must
be fixed in the JSON and re-uploaded (partial import fills only
missing sets). In-place editing of rule values is a later step.

## 7. No print preview in the app

The app sets print area, titles, fit, and margins, but it does not
show a print preview. The user checks print in Excel. A preview
would need a render of the sheet, which the single file does not do.
