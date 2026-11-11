# PF Notes — PF Generator v0.4.0

## What PF is

The plan factors workbook. One Excel file. One tab per set of factors
the plan uses to work out benefits.

- **ERF** — early retirement factors. One tab per era. Disability ERF too, if any.
- **LRF** — late retirement factors. One tab per era.
- **BFCF** — benefit form conversion factors. One tab per era and form pair (SLA to JS50, 3CC to JS50). Only pairs PBGC honors get a tab: from the normal single form to the normal married form. Any other pair is left out of the workbook (see "PBGC honors" below) — unless the user adds it by hand (see "Additional conversions" below).
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
- Rows 11+: months fill DOWN each column, as in the reference file:
  A holds the first ceil(n/5) months, C the next, and so on. For
  1–120 that is A 1–24, C 25–48, E 49–72, G 73–96, I 97–120. The
  last column may be short. Never one tall 2-column list, never
  months across the row. Month range comes from the data, not from
  the app. The demo uses 1–120.
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

## PBGC honors only normal single form to normal married form

Source: user, 2026-11-11. The prior plan administrator may have
used benefit conversions that PBGC will not apply once the plan is
in PBGC administration. PBGC honors only conversions between the
normal single form and the normal married form. Everything else is
left out of the PF workbook. It is not a tab. It is not dropped
silently: the review screen names it and says why, and the audit
log records it.

- The plan's normal married form lives in
  `planMetadata.normalMarriedForm` (for example `JS50`), copied
  from the plan documents. Never assumed. If the documents do not
  name one and any BFCF set is present, validation fails and names
  the missing field. The app cannot judge without it, and it must
  not guess `JS50`.
- The app derives the decision itself, per BFCF set: honored only
  when `fromForm` equals the set's `normalForm` (the normal single
  form for that era) AND `toForm` equals `normalMarriedForm`.
  Otherwise the set is excluded: no tab, no decision needed in
  review, and the generate gate is not blocked by it. ERF, LRF,
  and OTHER sets are not touched by this rule.
- The LLM's `appliesInPbgcAdmin` is its read of the same rule,
  with a citation. The app checks it against the derived decision
  and fails validation on any disagreement. A mismatch is never
  silently resolved.
- The audit log records, per excluded set: id, fromForm, toForm,
  normalForm, normalMarriedForm, and the reason. It also records
  the normal married form used.

## Additional conversions (v0.2.3)

A conversion the scraper missed — or one the user knows belongs in
the file — can be added by hand in Review, under "Additional
conversions". The user picks any from-form and to-form and fills in
the BCV arguments (interest, mortality tables, calc method,
deferral mortality, months certain, sexes, survivor percent,
temporary months, age ranges, the plan's words). The form can copy
the BCV arguments from an existing BFCF set, but never the survivor
percent: it derives from the new to-form (JS100 -> 1).

- The added set lives in `additionalConversions` in the JSON, same
  shape as a factorSets entry, type always BFCF. The same validator
  checks it. A bad argument fails the add and the form says what is
  missing; nothing half-filled is written.
- A user-added pair is included in the workbook by the user's
  choice, even when PBGC does not honor it. Adding it needs the
  explicit "Include it anyway" tick (v0.3.0): the tick is the
  approval of the override. The review shows "PBGC honors: No —
  included by your choice" with the reason, and the audit log
  records it as "additional conversion (user-added)" with the
  honored status and the override confirmation.
- Adding approves the pair at once: the user's own entry, plus the
  tick when the pair is not honored, is the approval. An imported
  user-added pair (from JSON) still needs an Approve in review, like
  any scraped set. A user-added pair can be removed in review; the
  audit log records the removal.
- A user-added conversion is formula-only: it cannot carry a
  printed factor table through the form (see OPEN_ITEMS.md item 8).

## Layout parity (v0.1.1, v0.2.1)

v0.1.1 reproduces the reference file's layout, checked by `scripts/verify_xlsx.py` (merges, freeze panes, widths, BFCF columns) and by unit tests on the sheet XML. v0.2.1 completes it: months fill down each column (v0.2.1 ran them across the row), header fonts match per row, thin borders on row 10 and all table cells, row heights match, and the BFCF A11 merge uses the template's split at row 70.

- **Table shape:** ERF/LRF/OTHER months fill down each column (see above). BFCF is an age grid: participant ages across row 10, beneficiary ages down column B.
- **Cell styles (from the reference file):** row 1 Calibri 14 bold, rows 2–3 Calibri 12 bold, row 5 Calibri 12 bold, rows 6–7 Calibri 11. Months tabs wrap rows 5–7 at the top (heights 28/18/18); BFCF tabs centre them (heights 18/16/16). Row heights: 1=20, 2=16, 3=16. Row 10 headers, C9, and row-10 part ages are Calibri 11 bold, centred, thin borders. Months and beneficiary-age cells are Calibri 11, centred, thin borders. Factor cells are the same with format `0.0000`. The BFCF A11 label is Calibri 11 bold, centred at the top, rotated 90, thin borders. Rows 4 and 8 are empty merged rows, as in the reference file.
- **BFCF A11 merge split:** the reference file splits the label merge at row 70 (A11:A70, A71:A111). Grids ending at or before row 70 get one merge; larger grids get the split at row 70.
- **Row 6:** the reference file reads `Basis: <rule>`. The writer adds the `Basis: ` prefix unless the scraped basis already carries it.
- **Remaining differences (style diff, v0.2.1):** none on fonts, borders, merges, freeze panes, widths, print settings, or row heights. The only openpyxl-level differences are the interior cells of merged ranges (e.g. H9, A16), which the reference file stores with partial borders and ours omits — Excel draws a merged area's border from its top-left cell, so the printed look is the same. Values and formulas differ only where the data differs (different plan, different era, different sexes and assumptions).

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
| `deferralMortality` | DeferralMort | — (BFCFAEQ has none) |
| `intMethod` | — (not written; fixed-rate plans only) | Method (interest method) |
| `benSex` | — | benSex |
| `fromForm` | — | FromBftForm |
| `survivorPct` | — | ToSurvPct |
| `toForm` | — | ToBftForm, derived (see below) |

- **linear:** `=ROUND(1-(months/denominator),4)`. Example: 1/15 per year early = 1/180 per month.
- **stepped:** `=ROUND(1-(1/D1)*MIN(m,N)-(1/D2)*MAX(MIN(m-N,CAP),0),4)`. First rate for N months, then second rate.
- **bcv ERF:** `=ROUND(ERFAEQ(interest,partSex,nra,months,certain,"mort1","mort2",calcMethod,deferralMortality),4)`.
- **bcv LRF:** `=ROUND(LRFAEQ(interest,partSex,nra,months,certain,"mort1","mort2",calcMethod,deferralMortality),4)`.
- **bcv BFCF:** `=ROUND(BFCFAEQ("fromCode",fromSpc,certain,temp,"toCode",survivorPct,toCertain,0,partAge,benAge,partSex,benSex,interest,"mort1","mort2",calcMethod,intMethod),4)`. `fromCode` / `toCode` are the BCV codes for the plan forms (see "Plan form names map to BCV codes" above), not the plan names. `toCertain` comes from the to-form name (`nCC`/`nCO` → `n*12`, else 0). `intMethod` is the interest method: `N` for a fixed rate, `O` for the lump sum rate structure, `L` for 417(e) segment rates, `L` with a stability period (`LPQ`, …) or a lookback (`LPQ1`–`LPQ5`), or O/N with a stability period (only with LS06SUYYYY/LS12SUYYYY mortality). `LPBGC` is not available in BFCFAEQ. BFCFAEQ has **no** deferral-mortality parameter — v0.3.0 wrote `deferralMortality` in that slot by mistake; v0.4.0 writes `intMethod` there and refuses a non-null `deferralMortality` on a BFCF set.

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
no `calcMethod`, no `deferralMortality` (ERF/LRF), or no
`intMethod` (BFCF) is refused. There is no silent default:
`deferralMortality` is never assumed to be "Y", `calcMethod` is
never assumed to be "MP", `intMethod` is never assumed to be "N",
sexes are never assumed to be "M". Any argument not in the
documents leaves the set `missing` or `ambiguous`, never defaulted.

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

### Plan form names map to BCV codes (v0.3.0)

The plan form name is not a BCV argument. The app maps it:

| Plan form | BCV code | Survivor percent | Months certain |
| --- | --- | --- | --- |
| `SLA` | `SLA` | 0 | 0 |
| `nCC` (`3CC`, `5CC`, ...) | `SLA` | 0 | `n*12` |
| `nCO` (`3CO`, `5CO`, ...) | `CTN` | 0 | `n*12` |
| `JSnn` (`JS50`, `JS75`, `JS100`) | `JSC` | `nn/100` | 0 |

The `nCO` row is the other kind of "certain": a pure term that
**stops** after n months (no life part). `nCC` always means certain
**and continues** (for life). The name `nCO` is a Muse decision,
parallel to `nCC`, for the user to correct if the documents write
it another way. `CTN` with months 0 is refused by the add-in.

### V1 uses digits, not these codes

The same form is written differently in the valuation. `FORM_CODE`,
`FORM_CODE_NSF`, `FORM_CODE_NMF` (BCV1) are one digit: `2` = SLA,
`4` = Certain Only, `5` = C&C, with the months in `MthsNSF` /
`MTHS`. So a 3-year C&C normal single form is `FORM_CODE_NSF`
= `5`, `MthsNSF` = 36. The NPVF function fields
(`NPVF_FORM_CODE`, `NPVF_FORM_CODE_NSF`, `NPVF_FORM_CODE_NMF`)
use the 3-letter codes above: `SLA` with certain period 36.

Source: the add-in doc, PBGCBFCF2 "Suggested Input" (same codes
`BFCFAEQ` accepts: `SLA`, `CTN`, `JSC`, `JSJ`, `JSN`, `JSP`). The
reference file proves it: its `3CC->JS50` tabs read
`BFCFAEQ("SLA",0,36,...)`. Before v0.3.0 the app wrote the plan
name (`"3CC"`) as the first argument — invalid, the add-in rejects
it. An unknown form name is refused, never guessed. An explicit
survivor percent must match the form name (`JS50` → 0.5).

### Months certain

`monthsCertain` is the months certain in the form the formula
converts from (BFCF) or in the normal single form (ERF/LRF,
`TheCPeriod`). When it is not stated, a certain form name supplies
it (`3CC` → 36, `3CO` → 36). A stated value that disagrees with
the form name is a conflict and fails validation. The reference
file's pattern: `SLA` → 0 (`LRF-1978`), `3CC` → 36
(`ERF-Disability`, `LRF-1982`, `LRF-2011`).

### Effective dates and duplicates (v0.3.0)

Each set carries `effectiveFrom` / `effectiveTo` (ISO dates, or
null). A set that starts after DOPT is refused. The same factor
key twice (same type, era, form pair, rule, and ranges) under
different ids is refused as a duplicate. Different rules in one
era are fine — a disability ERF next to a regular ERF.

### Audit report (v0.3.0)

The downloadable audit log is a report: generator and schema
versions, plan and case, input JSON hash, one traceability line
per set (source citation, effective dates, rule, decision,
PBGC-honors result, formula), then the event log — every import,
edit, approval, rejection, addition, removal, exclusion, and
generation. The workbook's document properties (`docProps/core.xml`,
`docProps/app.xml`) carry the generator version too, so a workbook
can be traced back to the app that wrote it.

### Compression and determinism (v0.3.0)

The ZIP writer compresses every entry with raw DEFLATE (fixed
Huffman, LZ77), pure JS, offline. A full 26 × 101 BFCF grid is
29 KB. ZIP timestamps are fixed (1980-01-01), so the same approved
inputs always produce the same bytes: `samples/riverbend-pf.json`
regenerates `samples/riverbend-pf.xlsx` byte-for-byte.

## Rounding

`ROUND(...,4)`. Format `0.0000`. Source: the reference file's practice. No written PBGC rounding policy found in any source (add-in doc, dictionary, Book of Job, training) — the file's practice is the policy.

## Print (every tab)

- Print area = full table.
- Print titles = rows 1:10.
- Orientation = landscape. Fit to page: 1 wide, 2 tall.
- Margins: left/right 0.4, top/bottom 0.5.
- Step 4 previews the tabs before generating (header rows, printed
  values, formula text where Excel computes).

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
