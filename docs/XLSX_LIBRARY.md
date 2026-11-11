# XLSX library — PF Generator v0.1.0

## Decision

**No library. Direct XML, written by the app, zipped by an inlined
stored-ZIP writer (no compression) + CRC-32.**

Same technique as the DEL generator's `.docx` writer. The writer is
about 30 lines. It gives full control of the print setup. No library
was needed.

## Why not SheetJS / ExcelJS

- SheetJS Community Edition does not set print area, print titles,
  or fit-to-page in a reliable way. Those are the core PF print rules.
- ExcelJS can set them, but it is a large library to inline into one
  HTML file, and it was not needed once direct XML worked.
- Direct XML was prototyped first and verified. See below.

## Prototype evidence (2026-11-11)

File: `/tmp/pf_proto/proto.cjs` (kept out of the repo; the app's
writer is the same code, `pf`-prefixed, in `pf-generator.html`).

The prototype wrote a 2-tab `.xlsx`:

- Tab 1, ERF style: Months/Factor table, 12 months, formula
  `=ROUND(1-(A11/180),4)`, format `0.0000`.
- Tab 2, BFCF style: small age grid, formula
  `=ROUND(BFCFAEQ("SLA",0,36,0,"JSC",0.5,0,0,C$10,$A11,"M","M",0.08,"UP84M2","UP84M2","MP","N"),4)`.

Checks run on the prototype file:

- `openpyxl` read back both tabs. Print area, print titles `$1:$10`,
  orientation `landscape`, `fitToWidth=1`, `fitToHeight=2`,
  `fitToPage=True`, margins `0.4 / 0.4 / 0.5 / 0.5` — all present
  on both tabs. Formulas and the `0.0000` format read back as written.
- `zipfile.testzip()` passed. No bad part.
- LibreOffice Calc opened the file and converted it to PDF. The
  plain formulas computed: month 1 = `0.9944`, month 12 = `0.9333`.
  The BFCF cells kept their cached value, as expected: `BFCFAEQ`
  is a BCV add-in function, so it computes only in Excel with the
  ATPBGC add-in. The app writes the formula; Excel computes it.

## What the writer writes

One ZIP part per file. Parts:

- `[Content_Types].xml`, `_rels/.rels`
- `xl/workbook.xml` — sheet list, defined names for print area and
  print titles per sheet, `<calcPr fullCalcOnLoad="1"/>` so Excel
  computes the BCV formulas on open.
- `xl/_rels/workbook.xml.rels`, `xl/styles.xml` — one custom
  number format, `0.0000` (numFmtId 164); normal, factor, and
  bold cell styles.
- `xl/worksheets/sheetN.xml` — one per tab. Inline strings for
  text, `<v>` for numbers, `<f>` + cached `<v>` for plain formulas,
  `<f>` only for BCV formulas. `pageSetup` landscape, fit 1 x 2,
  `pageMargins` 0.4 / 0.4 / 0.5 / 0.5, `sheetPr/pageSetUpPr
  fitToPage="1"`.

## Limits

- Stored ZIP, no compression. A full BFCF grid (26 x 101 formulas)
  makes a large file, about 1 MB per tab. Acceptable for v0.1.0.
  Compression is a later step, not a fix for v0.1.0.
- Cached values exist only for plain formulas. BCV cells have no
  cached value. A reader without the add-in shows 0 until Excel
  computes. That is the same rule as the R5 rates round-trip.
