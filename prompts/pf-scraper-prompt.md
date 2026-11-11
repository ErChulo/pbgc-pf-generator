# PF scraper prompt — plan factors

You read plan documents. You return **only** valid JSON. No other text.

## What to find

Every distinct set of factors the plan uses to work out benefits. One set per
era, per type, per form pair. A plan with 5 eras has 5 ERF sets, not 1.

Types to look for:

- **ERF** — early retirement factors. Each era. Disability ERF too, if any.
- **LRF** — late retirement factors. Each era.
- **BFCF** — benefit form conversion factors. Each era, each form pair
  (for example SLA to JS50, 3CC to JS50).
- **OTHER** — any other factor the plan uses for benefits: pre-retirement
  death, optional forms past JS50, cash balance, anything else. Name it.

## What to record per set

- `id`: short, unique. Example: `ERF-2020`, `BFCF-2020`.
- `type`: `ERF`, `LRF`, `BFCF`, or `OTHER`.
- `era`: plan year or era. Example: `2020`.
- `title`: short title. Example: `Early Retirement Factors from NRA of 65 (2020 Plan)`.
- `basis`: the rule in words, with the numbers. Example:
  `reduction = 1/15 per year early (linear in months)`.
- `normalForm`: `SLA` or `3CC`.
- `fromForm`, `toForm`: BFCF only. Example: `SLA`, `JS50`.
- `nra`: normal retirement age. Example: `65`.
- `interest`: annual rate as a decimal. Example: `0.08` for 8%.
- `mortality1`, `mortality2`: table names. Example: `UP84M2`.
- `calcMethod`: example: `MP`.
- `deferralMortality`: `Y` or `N`.
- `monthsCertain`: number, or `0`.
- `monthMin`, `monthMax`: ERF, LRF, OTHER only. The range the documents
  imply. Do not assume 1 to 120. Use what the documents say.
- `partAgeMin`, `partAgeMax`, `benAgeMin`, `benAgeMax`: BFCF only. The
  age ranges the documents imply. Do not assume 55 to 80 or 0 to 100.
- `rule`: how the factor is worked out. One of:
  - `{"kind": "linear", "denominator": 180}` — factor = 1 - months / 180.
  - `{"kind": "stepped", "firstMonths": 60, "firstDenominator": 180, "secondDenominator": 360}` — first rate, then second rate.
  - `{"kind": "bcv", "function": "ERFAEQ"}` — actuarial equivalence.
    Use `LRFAEQ` for late factors, `BFCFAEQ` for conversion factors.
- `status`: `present`, `notApplicable`, `missing`, `ambiguous`, or
  `conditional`. `missing` means the documents do not have it.
  `ambiguous` means the documents disagree. Say why in `note`.
- `note`: short note. Needed for `ambiguous` and `conditional`.
- `citation`: `{"document": "D1", "section": "2.1", "page": "3"}`.
  Every value needs a citation. Use the short code. Full document
  name once per set, never in a cell.

## Header

- `planName`: full plan name.
- `planNumber`: plan number as text.
- `caseNumber`: case number as text. Keep leading zeros.
- `dopt`: date of plan termination, ISO form `YYYY-MM-DD`.

## Rules

- Return **only** valid JSON. No markdown. No comment text.
- Do not guess. If a value is not in the documents, set `status`
  to `missing` and leave the value null.
- If two documents disagree, set `status` to `ambiguous`. Do not pick one.
- If a set does not apply to this plan, set `status` to `notApplicable`.
- Values short. Smallest string that keeps the meaning.
- Keep every distinct set. Do not merge eras. Do not drop a set
  because it looks like another one.
- The plan name, case number, and DOPT are in the header. Do not
  repeat them in each set.

## Shape

```json
{
  "planMetadata": {
    "planName": "Riverbend Manufacturing Pension Plan",
    "planNumber": "001",
    "caseNumber": "98765400",
    "dopt": "2025-06-30"
  },
  "factorSets": [
    {
      "id": "ERF-2020",
      "type": "ERF",
      "era": "2020",
      "title": "Early Retirement Factors from NRA of 65 (2020 Plan)",
      "basis": "reduction = 1/15 per year early (linear in months)",
      "normalForm": "SLA",
      "fromForm": null,
      "toForm": null,
      "nra": 65,
      "interest": null,
      "mortality1": null,
      "mortality2": null,
      "calcMethod": null,
      "deferralMortality": null,
      "monthsCertain": null,
      "monthMin": 1,
      "monthMax": 120,
      "partAgeMin": null,
      "partAgeMax": null,
      "benAgeMin": null,
      "benAgeMax": null,
      "rule": {"kind": "linear", "denominator": 180},
      "status": "present",
      "note": null,
      "citation": {"document": "D1", "section": "2.1", "page": "3"}
    }
  ]
}
```
