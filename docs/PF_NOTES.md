# PF Notes — PF Generator v0.1.0

## What PF is

The plan factors workbook. One Excel file. One tab per set of factors
the plan uses to work out benefits.

- **ERF** — early retirement factors. One tab per era. Disability ERF too, if any.
- **LRF** — late retirement factors. One tab per era.
- **BFCF** — benefit form conversion factors. One tab per era and form pair (SLA to JS50, 3CC to JS50).
- **OTHER** — any other factor for benefits. Pre-retirement death, optional forms past JS50, anything else.

PF is not R1 §§17–18 asset allocation / 4022(c). That material belongs to R1, not PF.

## Tab names

`<type>-<era>[ <from>-><to>]`. Examples: `ERF-2020`, `LRF-2020`, `BFCF-2020 SLA->JS50`. Max 31 chars. Illegal chars become `-`.

## Layout (all tabs)

Header rows 1–9, row 10 headers. Follows the reference file.

- Row 1: Plan name.
- Row 2: Case Number.
- Row 3: DOPT.
- Row 5: Title.
- Row 6: Basis (rule in words).
- Row 7: Normal single form (+ form pair for BFCF).

### ERF / LRF / OTHER tabs

- Row 10: `Months | Factor` x 5 pairs, columns A–J.
- Rows 11+: months in order, 5 per row. Month range comes from the data, not from the app. The demo uses 1–120.
- Factor cells: format `0.0000`.

### BFCF tabs

- Row 10: `Age | Part. age |` participant ages across.
- Rows 11+: beneficiary age in column A (and B), factor grid across.
- Age ranges come from the data, not from the app. The demo uses part 55–60, ben 0–5. A full grid is 26 x 101.

## Formulas

The app writes them. Excel computes them.

- **linear:** `=ROUND(1-(months/denominator),4)`. Example: 1/15 per year early = 1/180 per month.
- **stepped:** `=ROUND(1-(1/D1)*MIN(m,N)-(1/D2)*MAX(MIN(m-N,CAP),0),4)`. First rate for N months, then second rate.
- **bcv ERF:** `=ROUND(ERFAEQ(interest,"M",nra,months,certain,"mort1","mort2","MP","Y"),4)`.
- **bcv LRF:** `=ROUND(LRFAEQ(interest,"M",nra,months,certain,"mort1","mort2","MP","Y"),4)`.
- **bcv BFCF:** `=ROUND(BFCFAEQ("from",0,certain,0,"JSC",0.5,0,0,partAge,benAge,"M","M",interest,"mort1","mort2","MP","N"),4)`.

BCV add-in functions: ERFAEQ, LRFAEQ, BFCFAEQ. They run only in Excel with the ATPBGC add-in. The workbook sets `fullCalcOnLoad`, so Excel computes on open. Plain formulas carry a cached value. BCV cells carry none.

## Rounding

`ROUND(...,4)`. Format `0.0000`. Source: the reference file's practice. No written PBGC rounding policy found yet (open item).

## Print (every tab)

- Print area = full table.
- Print titles = rows 1:10.
- Orientation = landscape. Fit to page: 1 wide, 2 tall.
- Margins: left/right 0.4, top/bottom 0.5.

## Statuses

- `present` — the set is in the documents. Written to the workbook when approved.
- `notApplicable` — the set does not apply. Never written.
- `missing` — the documents do not have it. Cannot be approved. Reject it, or fill it with a partial import.
- `ambiguous` — the documents disagree. Needs a note. Written when approved.
- `conditional` — applies only in a case. Needs a note. Written when approved.

## Filename

`<case>PF.xlsx`. Case number is text. Leading zeros kept. Missing case falls back to `PF.xlsx`.

## No template

No PF folder exists under 03_CASEWORK_TEMPLATES. The layout, formulas, and print setup come from the reference example file (11 tabs). Its data is never reused. All development uses synthetic data only.
