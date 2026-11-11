# OPEN ITEMS — PF Generator v0.1.1

The canonical gap list. Read this before proposing next steps.

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

## 2. BCV function signatures not confirmed against the add-in docs

ERFAEQ / LRFAEQ (9 args) and BFCFAEQ (15 args) come from the
reference example file only. Confirm them against the BCV add-in
documentation in the Book of Job before encoding them as final.

## 3. Rounding policy source not found

The file shows ROUND to 4 decimals. No written PBGC rounding policy
was found in the Book of Job yet. If none exists, the file's practice
is the policy. Search for it.

## 4. No logo in v0.1.1

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
