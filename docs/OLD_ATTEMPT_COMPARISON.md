# Old attempt vs PF v0.1.0 — ErChulo/pbgc-plan-factors-module

**Status: borrowings applied in v0.1.1.** Items 1–3 below are done:
merged headers, freeze panes, exact widths, BFCF column fix, layout-parity
checks, schema tightened. Item 4 (do not borrow) still holds. The rest of
this file is the v0.1.0 record, kept as written.

Read 2026-11-11. One commit, March 11–12 2026. Public repo, user-authorized read.
Old repo: `packages/core-pf` (TS builder), `packages/web-pf` (Vite UI),
`packages/cli-pf`, `packages/schemas`, `templates/PF_template.v0.7.13.xlsx`,
`fixtures/`, `standalone/pf-builder-standalone.html` (built, 249 KB).
Prompt: `Module-PF-prompt.md` (412 lines, SpecKit + Codex CLI).

## The old idea: patch a template, do not rebuild

- The template IS the reference-case file, byte-identical to the expected fixture
  (same md5). The builder copies it and patches only header cells and
  formula cells. All formatting, merges, print setup, freeze panes, and
  column widths come free from the template.
- Golden test: build from the sample fixtures (real reference case +
  factors) and compare sha256 with the expected file. Strong check that
  patching does not corrupt anything. But it is circular: inputs equal
  the file's own data, so it proves fidelity, not generality.
- No CI. No test run recorded. Vitest is configured, but whether the
  tests ever passed is unknown.

## What the old attempt does better

- Formatting parity is guaranteed by construction. Ours rebuilds from
  scratch and is missing: merged header cells (A1:J1, A5:J5, A6:J6),
  freeze panes (ERF/LRF A11, BFCF C11), and the exact column widths
  (all 10.0 in the template; ours uses 10/12 alternating).
- BFCF layout is exact in the old one: headers in column B (B1/B2/B3/
  B5/B6/B7), row 9 label "Participant's Age Nearest Birthday" at C9,
  B10 "Age", A11 "Beneficiary's Age Nearest Birthday", B11 first
  beneficiary age. Ours is shifted one column left (title at A5,
  beneficiary age at A11, no row-9 label, no B10 "Age").
- Real JSON schemas with AJV validation (additionalProperties false,
  required keys). Ours validates by hand in the HTML.
- Its formula strings match ours exactly (same ROUND formulas, same
  ERFAEQ/LRFAEQ/BFCFAEQ argument order). Cross-check: our formulas
  are right.
- Its sample planFactors JSON records the exact reference-case assumptions
  per era (interest, mortality, months certain). Useful reference
  values for tests, not data to copy.

## Where the old attempt falls short

- Hardcoded to the 11 reference-case tabs and eras (fixed keys in types.ts
  and the schema, additionalProperties false). A plan with other eras
  cannot be represented. Ours is data-driven: any set, any era.
- No scraper prompt, no LLM loop, no review gate, no audit log.
  Upload two JSON files, download the workbook. No human approval step.
- The Vite web UI fetches the template (`fetch("/PF_template...")`),
  so it needs a server. Only the standalone HTML works from file://.
  Ours is a single file with no fetch at all.
- No PBGC Design System (custom green/beige style), no dark mode,
  no Welcome/Help, no onboarding, no accessibility work.
- Small bugs: the `sex` input is ignored (formulas hardcode "M");
  `HEADER_CELL_MAP` in constants.ts is dead code (B2/B3/H2/H3, never
  used); formula cells get cached value 0 with no fullCalcOnLoad set
  by the builder (relies on the template having it).
- Real case data is committed in the repo: the template and the
  fixture are the actual reference-case file (real case number, real plan
  name), and case.sample.json uses the real case. That breaks the
  synthetic-only rule. Our repo has zero real-case strings.
- Filename carries the version: `<case>PF.v0.7.13.xlsx`. Ours is
  `<case>PF.xlsx`, matching DEL/436. Not yet confirmed with the user.
- SpecKit constitution file is an unfilled template. Scaffolding
  only, not governance.

## What to borrow (in order)

1. Layout parity checks: add merged headers, freeze panes, and exact
   column widths (10.0) to our writer, and extend verify_xlsx.py to
   check them. Fix the BFCF column shift (headers in B, row-9 label,
   B10 "Age", A11 label).
2. Golden-style test: add a layout-parity test that compares our
   generated workbook's structure (sheet order, dims, merges, print
   settings, freeze panes, widths) against the reference inventory,
   the way the old golden test compared against its fixture.
3. Schema: tighten schema/pf.schema.json toward the old AJV shape
   (required keys, no extra keys) for the fixed fields, while keeping
   the factor-set list open-ended.
4. Do NOT borrow: the template-patching architecture (it needs the
   real reference-case file as a binary template in the repo, and it cannot
   handle other eras); the Vite web UI (needs a server); the
   versioned filename (until the user confirms it).
