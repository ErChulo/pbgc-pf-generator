# Release notes — PF Generator v0.4.2

No open issues remain.

## Certain-only forms use `CTN`

The user directed it: use `CTN`.

Why the app did not use it before: the app knew `CTN` only as
a BCV code (add-in doc p.38, "Suggested Input": n-year Certain
→ code `CTN`, mths n). But the app maps plan-form names to codes,
and no name led to `CTN`. `SLA`, `nCC`, `JSnn` were the only names
it knew. `CTN` was not among them. Now it is: the code is the name.

- `pfPlanFormToBcv("CTN")` returns code `CTN`, survivor percent 0.
- The term is not in the name. `monthsCertain` states it in
  months (120 for 10 years). The validator requires it over 0:
  the add-in refuses `CTN` with 0 months.
- A `BFCFAEQ` from-form of `CTN` writes
  `BFCFAEQ("CTN",0,<monthsCertain>,0,"JSC",...)`. An ERF/LRF set
  with normal form `CTN` puts `monthsCertain` in `TheCPeriod`.
- The scraper prompt says so: a certain-only form writes as
  `CTN`, with the term in `monthsCertain`. Never invent a name.
- One limit stays: a `CTN` to-form is refused. The to-form's term
  comes from its name only, and `CTN` carries none — the app has
  no field for it.

Item 10 is closed. The `nCO` invention (v0.4.0, withdrawn v0.4.1)
is replaced by the rule itself.

## Also in v0.4.2

- The validator now refuses a normal form with no BCV code, for
  every set (found in v0.4.1: it never checked `normalForm` at
  all, so an unknown name passed silently).

## Verified — v0.4.2

- `npm test`: **331 passed, 0 failed** (244 unit + 87 browser).
- `node --check` on the HTML script: passes.
- `python3 scripts/verify_xlsx.py`: all 88 checks pass.
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`, no
  external URLs.
