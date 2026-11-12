# OPEN ITEMS — PF Generator v0.4.2

The canonical gap list. Read this before proposing next steps.

## Fixed in v0.4.0 (all open issues closed at the time)

> **Withdrawn in v0.4.1:** the certain-only fix below (`nCO`)
> was invented, not a PBGC rule. The user corrected it. Item 10
> is open again. Everything else in v0.4.0 stands.

## Fixed in v0.4.2 (no open issues)

- **Certain-only forms: use `CTN`.** The user directed it. `CTN`
  is the add-in code itself (add-in doc p.38), so it is the name.
  The term comes from `monthsCertain` (over 0, enforced). A `CTN`
  to-form is refused — no field holds its term. Item 10 closed.

- **BFCFAEQ Method is the interest method, not deferral mortality.**
  A real bug, found while closing item 9: the app wrote
  `deferralMortality` (`Y`/`N`) into BFCFAEQ's `Method` slot.
  BFCFAEQ has no deferral-mortality parameter — its `Method`
  argument is the interest method (`IntMethod`), per the add-in
  doc p.143 "Method (IntMethod and SMethod)" and Factor Training
  2026. Levels: `O` (lump sum rate structure), `N` (annuity rate
  structure, fixed-rate plans), `L` (417(e) segment rates), `L**`
  (L + stability period PY/CY/PQ/CQ/M), `L**#` (L** + lookback
  1–5), and O/N with a stability period only with LS06SUYYYY or
  LS12SUYYYY mortality. `LPBGC` is not available in BFCFAEQ and is
  refused. Training deck slide 69 confirms it: a worked BFCFAEQ
  passes `"LPQ"` there. Writing `"N"` was right by luck for
  fixed-rate plans; writing `"Y"` would have been invalid. The
  app now carries `intMethod` per BFCF set (required, validated),
  writes it in the `Method` slot, and refuses a non-null
  `deferralMortality` on a BFCF set. ERF/LRF keep `deferralMortality`
  `Y`/`N` and carry no `intMethod` (fixed-rate plans only).
- **Certain-only forms.** WITHDRAWN in v0.4.1. The plan-form name
  `nCO` (e.g. `3CO`) was invented in v0.4.0 — no PBGC source names
  it. The user corrected it: do not invent, stick to PBGC rules.
  The mapping is removed; the app refuses such a form. See item 10.
- **Logo.** White PBGC logo in the header (same file as DEL,
  Book of Job "images" folder; local copy in `assets/logos/`),
  52px desktop / 44px under 640px, both themes.
- **Per-type prompts.** Step 1 offers the full prompt plus four
  per-type prompts (ERF, LRF, BFCF, OTHER): the same prompt with
  a scope header that says to find only that type.
- **Print preview.** Step 4 has a "Preview print layout" button:
  each tab the workbook will hold, as HTML tables — header rows,
  table values as printed, formula text where Excel computes.
  Built from the same formula helpers as the .xlsx, so the preview
  and the file agree.
- **Printed table on added conversions.** The Add form takes a
  printed factor table (one row per line: partAge, benAge,
  factor), parsed and validated like a scraped grid; the values
  are written as values in the tab. The edit panel edits a BFCF
  set's printed table the same way. A months table stays JSON-only.

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

## Closed after v0.3.0 (2026-11-11, checked against all sources)

- **UP84M2 — closed.** Confirmed in use by PBGC in two sources:
  the reference PF file (live `BFCFAEQ`/`ERFAEQ` formulas) and the
  Drive file `JSON_to_V1_Engine_Reverse_24884900_Updated.txt`
  (same case). Searched and found nothing else: add-in doc text
  (no hit), BCV dictionary (no hit), local xlsm files (no hit),
  Drive fullText (only those two files). The MORTNAME table itself
  lives in the ATPBGC database and was never seen — but two PBGC
  sources using the code is the confirmation that matters. The
  office test with the add-in is the final check.
- **Rounding policy — closed.** No written PBGC rounding policy
  found. Searched: add-in doc (the "four decimal" hit is about
  interest-rate inputs, not factors), BCV dictionary, Drive
  fullText "four decimal" (training docs only), local files. The
  R1 sample language says the plan determined factors to four
  decimal places. Per the rule in this item, the file's practice
  (`ROUND` to 4) is the policy.

## 2. Mortality table code UP84M2 not confirmed in the add-in doc

Closed — see "Closed after v0.3.0" above.

## 3. Rounding policy source not found

Closed — see "Closed after v0.3.0" above.

## 4. No logo in v0.3.0 — fixed in v0.4.0

White PBGC logo in the header, same file as DEL. See "Fixed in
v0.4.0" above.

## 5. Scraper prompt is one prompt, not per-group prompts — fixed in v0.4.0

Step 1 offers four per-type prompts (ERF, LRF, BFCF, OTHER) next
to the full prompt. See "Fixed in v0.4.0" above.

## 6. Edit is title-only in review — fixed in v0.3.0

Review now edits every set field in place (interest, mortality,
method, sexes, ranges, dates, citation), with re-validation on
save. v0.4.0 adds a BFCF printed factor table to the edit panel.
A months table is still JSON-only.

## 7. No print preview in the app — fixed in v0.4.0

Step 4 previews the tabs as HTML tables. See "Fixed in v0.4.0"
above.

## 8. Additional conversions cannot carry a printed factor table yet — fixed in v0.4.0

The Add form and the edit panel both take a printed BFCF grid.
See "Fixed in v0.4.0" above.

## 9. BFCFAEQ Method levels not enumerated in the doc — fixed in v0.4.0

Resolved, and it was a real bug, not a gap in the doc. The doc
does enumerate the levels (p.143 "Method (IntMethod and SMethod)":
O, N, L, L**[#], LPBGC; O/N with a stability period only with
LS06SUYYYY/LS12SUYYYY mortality), and Factor Training 2026 slide
69 shows a worked BFCFAEQ with `"LPQ"` in the slot. The app was
writing `deferralMortality` there — BFCFAEQ has no such parameter.
Fixed: `intMethod` per BFCF set, validated, written in the slot.
NPVF2's `deferralAssump` N/P/B is a different parameter (the
valuation function, not BFCFAEQ) and does not apply here.

## 10. No plan-form name for pure certain-only (CTN) — fixed in v0.4.2

Closed by the user: use `CTN`. The add-in code is the name
(add-in doc p.38, "Suggested Input": n-year Certain → code
`CTN`, mths n). The term is not in the name: `monthsCertain`
must state it in months, over 0 (`CTN` with 0 is refused by the
add-in), and the validator enforces that. v0.4.0 invented `nCO`
(`3CO`); withdrawn in v0.4.1; `CTN` is the correction.
One limit stays: a `CTN` to-form is refused — the app has no
field for its term.
