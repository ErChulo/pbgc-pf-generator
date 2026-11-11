# Release notes — PF Generator v0.4.1

One correction. Everything else in v0.4.0 stands.

## `nCO` withdrawn

The plan-form name `nCO` (e.g. `3CO`) was invented in v0.4.0.
No PBGC source names a certain-only form that way. The user
corrected it: do not invent, stick to PBGC rules.

What is true, from the add-in doc p.38 ("Suggested Input"): a
pure n-year Certain writes as BCV code `CTN` with `mths` = n,
and `CTN` with months 0 is refused by the add-in. What is not
known: any short plan-form name for it. `3CC` is attested in the
reference PF file's tab names; `3CO` is attested nowhere.

Changes in v0.4.1:

- `pfPlanFormToBcv` no longer maps `nCO`. A `3CO` form returns
  null, and the validator refuses it with the form named.
- The scraper prompt no longer lists `3CO`. A pure certain-only
  form is recorded as written, noted, and marked `ambiguous`.
  It is never given an invented short name.
- The schema, the form table in `PF_NOTES.md`, and the docs no
  longer mention `nCO` as a name — only as the withdrawn invention.
- Open item 10 is open again: no plan-form name for a
  certain-only form. The name must come from the plan documents,
  when a plan with such a form comes up.

## Verified — v0.4.1

- `npm test`: **327 passed, 0 failed** (240 unit + 87 browser).
  Three fewer unit checks than v0.4.0: the five `nCO` checks are
  replaced by two refusal checks (no BCV code for `3CO`;
  validator refuses a `3CO` normal form). The revert also closed
  a gap the `nCO` name had hidden: the validator never checked
  `normalForm` for a BCV code at all, so an unknown normal form
  passed silently. It now refuses one, for every set — "an unknown
  form name is refused, never guessed" was already the documented
  rule; now the validator enforces it.
- `node --check` on the HTML script: passes.
- `python3 scripts/verify_xlsx.py`: all 88 checks pass.
- Grep: 0 `fetch(`, 0 `<script src`, 0 `<link>`, 0 `import(`, no
  external URLs.
