# Release notes — PF Generator v0.3.0

Software Correctness and End-to-End Readiness.

## What changed

### Correctness (P0)

- **BCV form-code mapping — real bug fixed.** The app wrote the plan
  form name straight into `BFCFAEQ` as the first argument. For a
  3-year certain-and-life form (`3CC`) that wrote `BFCFAEQ("3CC",...)`,
  which the add-in rejects: it accepts only `SLA`, `CTN`, `JSC`,
  `JSJ`, `JSN`, `JSP`. The reference file proves the right mapping —
  its `3CC->JS50` tabs read `BFCFAEQ("SLA",0,36,...)`. The app now
  maps every plan form to its BCV code: `SLA` → `SLA`; `nCC`
  (`3CC`, `5CC`, ...) → `SLA` with `n*12` months certain; `JSnn`
  → `JSC` with the survivor percent. Same mapping for the to-form,
  and the from-form's survivor percent. An unknown form name is
  refused, never guessed.
- **Months certain from the form.** A `3CC` normal form means 36
  months certain. The app derives it when the value is not stated,
  and refuses it when a stated value disagrees with the form name.
  The demo LRF set had `3CC` with 0 — wrong by the reference file's
  own pattern (`LRF-1982`, `LRF-2011` both use 36) — fixed to 36.
- **Validation, fail-closed.** Interest must be under 1.0 (the
  add-in rejects 1.0). NRA and ages 0–124. Calc method must be
  `MP`, `QP`, `SP`, or `Exact` (the add-in doc's two families).
  Mortality codes must be well-formed and on the known MORTNAME
  list (codes from the add-in doc plus `UP84M2` from the reference
  file); an unknown code needs `mortalityConfirmed` — the user
  checked it in the MORTNAME table. An explicit survivor percent
  must match its to-form. NRA plus months certain over 124 is
  refused for Woolhouse methods.
- **Regimes and duplicates.** Each set carries `effectiveFrom` /
  `effectiveTo` (ISO dates). A set that starts after DOPT is
  refused. The same factor key twice (same type, era, pair, rule,
  ranges) under different ids is refused as a duplicate. Different
  rules in one era are fine — a disability ERF next to a regular
  ERF.
- **Approval controls.** A manually added conversion PBGC does not
  honor now needs an explicit tick — "Include it anyway" — before
  it is added. The audit log records the override confirmation.
  Every header edit, set edit, approval, rejection, addition,
  removal, and exclusion is recorded.

### Functionality (P1)

- **Edit in the app.** Every factor-set field is editable in Review
  (interest, mortality, method, sexes, ranges, dates, citation).
  Save re-validates the whole document first; a bad value is
  refused and the error names the field. A saved edit clears the
  set's decision — approve it again to include it.
- **Formula preview.** Each review row shows the exact first-cell
  formula that will be written, before anything is generated.
- **Traceability.** The audit log is now a full report: generator
  and schema versions, plan and case, input JSON hash, and one line
  per set (source citation, effective dates, rule, decision,
  PBGC-honors result, formula). The workbook's document properties
  carry the generator version too.
- **Reproducibility.** The ZIP timestamps are fixed, so the same
  approved inputs always produce the same bytes. The sample proves
  it: `samples/riverbend-pf.json` regenerates
  `samples/riverbend-pf.xlsx` byte-for-byte.
- **Full grids.** A 26 × 101 BFCF grid (2,626 formulas) now runs end
  to end: `samples/riverbend-full-grid.xlsx`, 29 KB.
- **Sheet names.** Two sets that would share a tab name (after the
  31-character cut) are refused with both ids named.

### Efficiency (P2)

- **Compression.** The ZIP writer now compresses with raw DEFLATE
  (fixed Huffman, LZ77), pure JS, offline. The full-grid workbook
  is 29 KB instead of ~1 MB. The demo workbook is 14 KB.

## Verified — v0.3.0

- `npm test`: **288 passed, 0 failed** (217 unit + 71 browser).
- `python3 scripts/verify_xlsx.py`: **88 checks pass**, including
  the full 26 × 101 grid (2,626 formulas, print area, freeze panes)
  and a LibreOffice conversion to PDF.
- `python3 scripts/build_single_file.py --version 0.3.0`: prompt
  injected, 0 fetch, 0 external URLs, 124 unique top-level
  declarations, 0 duplicates.
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`.
- The reference-file layout, print setup, and formulas are unchanged
  from v0.2.3 — only the 3CC mapping and the LRF months-certain
  values changed, both toward the reference file.

## Known limitations

- `UP84M2` is still confirmed only by the reference file, not by
  the add-in doc text. It is on the known list; any other unlisted
  code needs `mortalityConfirmed`.
- No written PBGC rounding policy found yet; the file's practice
  (`ROUND` to 4) is the policy.
- No PBGC logo in the header yet (text only).
- No print preview in the app; check print in Excel.
- A user-added conversion cannot carry a printed factor table
  through the form; the table stays in the JSON.
- The scraper prompt is one prompt with a per-document instruction,
  not split per era or per type.
