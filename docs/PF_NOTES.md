# PF Notes — PF Generator v0.2.0

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
- Row 7: Normal single form.
- Header rows 1–8 are merged across the table width. Rows 4 and 8 are empty merged rows, as in the reference file.
- Freeze panes: ERF/LRF/OTHER at A11, BFCF at C11. Grid lines off, as in the reference file.

### ERF / LRF / OTHER tabs

- Row 10: `Months | Factor` x 5 pairs, columns A–J.
- Rows 11+: months in order, 5 per row. Month range comes from the data, not from the app. The demo uses 1–120.
- Factor cells: format `0.0000`.
- Column widths: all 10.0.

### BFCF tabs

- Headers in column B: B1 plan, B2 case, B3 DOPT, B5 title, B6 basis, B7 normal form. Merged B1:H1 … B8:H8 (to the last column).
- Row 9: `Participant's Age Nearest Birthday` at C9, merged across to the last column.
- Row 10: B10 `Age`, then participant ages from C10 across.
- Rows 11+: A11 holds `Beneficiary's Age Nearest Birthday` (merged down the grid), beneficiary ages in column B, factor grid from C across.
- Age ranges come from the data, not from the app. The demo uses part 55–60, ben 0–5. A full grid is 26 x 101.
- Column widths: A = 4.0, B onward = 8.5.
- BFCF formulas use plain refs, as in the reference file: `C11 =ROUND(BFCFAEQ(...,C10,B11,...),4)`.

## Layout parity (v0.1.1)

v0.1.1 reproduces the reference file's layout, checked by `scripts/verify_xlsx.py` (merges, freeze panes, widths, BFCF columns) and by unit tests on the sheet XML. Two deliberate differences from the reference file:

- The reference file merges the A11 label in two chunks (A11:A70, A71:A111). Ours merges it in one (A11:A{last row}). Same layout for any grid size.
- The reference file has no row-7 form-pair suffix. v0.1.0 added `(SLA to JS50)` to row 7; v0.1.1 drops it, matching the reference file. The form pair already shows in the tab name and the title.

## Formulas

The app writes them. Excel computes them. Every BCV argument comes
from the plan documents as the plan defines it. Nothing is assumed.

Each present set carries `ruleText` — the plan's own words for the
rule, quoted short, with a citation. The formula is translated from
it. The review screen shows it under the set.

### BCV argument mapping (JSON field → function argument)

| JSON field | ERFAEQ / LRFAEQ argument | BFCFAEQ argument |
| --- | --- | --- |
| `interest` | XBRD (rate as a decimal) | interest |
| `partSex` | sex ("M" or "F") | partSex |
| `nra` | theNRA | — |
| months cell / age cells | EarlyMonths / Latemonths | partAge, benAge |
| `monthsCertain` | TheCPeriod (null means 0) | FromMthsCert (null means 0) |
| `monthsTemp` | — | FromMthsTemp (null means 0) |
| `mortality1`, `mortality2` | TheMNameHandle, TheFNameHandle | mort1, mort2 |
| `calcMethod` | CalcMethod (`MP`, `QP`, `SP`, …) | calcMethod |
| `deferralMortality` | DeferralMort | deferralMort |
| `benSex` | — | benSex |
| `fromForm` | — | FromBftForm |
| `survivorPct` | — | ToSurvPct |
| `toForm` | — | ToBftForm, derived (see below) |

- **linear:** `=ROUND(1-(months/denominator),4)`. Example: 1/15 per year early = 1/180 per month.
- **stepped:** `=ROUND(1-(1/D1)*MIN(m,N)-(1/D2)*MAX(MIN(m-N,CAP),0),4)`. First rate for N months, then second rate.
- **bcv ERF:** `=ROUND(ERFAEQ(interest,partSex,nra,months,certain,"mort1","mort2",calcMethod,deferralMortality),4)`.
- **bcv LRF:** `=ROUND(LRFAEQ(interest,partSex,nra,months,certain,"mort1","mort2",calcMethod,deferralMortality),4)`.
- **bcv BFCF:** `=ROUND(BFCFAEQ("from",0,certain,temp,"JSC",survivorPct,0,0,partAge,benAge,partSex,benSex,interest,"mort1","mort2",calcMethod,deferralMortality),4)`.

Derived, not scraped:

- **ToBftForm "JSC":** the BCV add-in code for a joint-and-survivor
  to-form. Derived from `toForm` when it is a JS form (JS50, JS75,
  JS100). A to-form that is not a JS form fails validation for a
  bcv BFCF rule. The code is never guessed.
- **survivorPct:** explicit value wins. When null and `toForm` is
  a JS form, it derives from the name (JS50 → 0.5, JS75 → 0.75,
  JS100 → 1). The derivation is noted in the audit log. When
  neither, validation fails.

Missing arguments fail validation. A bcv rule with no `partSex`,
no `calcMethod`, or no `deferralMortality` is refused. There is no
silent default: `deferralMortality` is never assumed to be "Y",
`calcMethod` is never assumed to be "MP", sexes are never assumed
to be "M". Any argument not in the documents leaves the set
`missing` or `ambiguous`, never defaulted.

### Factor tables printed in the documents

When a plan document prints a factor table, the scraper copies it
semantically into `table` (kind `months` or `grid`, one row per
printed row: month or age pair plus the factor as printed, with a
citation). The writer writes those values as values (format
`0.0000`) for exactly the months/ages the table covers, and
formulas for the rest of the range. The review screen shows the
source per set ("Table: N values from the document table, rest
formulas" or "Formulas from the rule"). The audit log records, per
set, how many cells came from the table and how many from formulas.
Table factors must be numbers 0–2, and table months/ages must lie
inside the set's ranges; anything else fails validation. Rows are
never reordered, interpolated, or filled in from the formula.

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
