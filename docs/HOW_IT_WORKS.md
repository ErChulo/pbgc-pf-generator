# How the PF Generator works

ASD STE 100. One idea per line. User action, then app behavior.

## Open

- Open `pf-generator.html`. No server. No install.
- The menu has three pages: PF generator, Welcome, Help.
- The landing page shows only the work steps.

## 1. Download the prompt

- You: click "Download the scraper prompt".
- App: downloads `pf-scraper-prompt.md`.
- Or: click one per-type prompt (ERF, LRF, BFCF, OTHER). Same prompt, scoped to one type. Run the LLM once per type, then combine the JSON.

## 2. Scrape (outside the app)

- You: feed the prompt and the plan documents to an LLM. Copilot in the office, any LLM at home.
- LLM: returns JSON. It only proposes.
- LLM: finds every distinct factor set. Each era. Each type. Each form pair. No merging. No dropping.
- LLM: reads each document on its own first (plan, restatement, amendments), then combines. An amendment that changes a rule starts a new era.
- LLM: records when each rule applies (`effectiveFrom` / `effectiveTo`).
- LLM: records form names as written (`SLA`, `3CC`, `3CO`, `JS50`). The app maps each name to its BCV code.
- LLM: quotes the plan's rule sentence into `ruleText`, then states the matching `rule`. Words first, formula second.
- LLM: copies every BCV argument from the plan's definition: interest, mortality tables, calc method, interest method (BFCF) or deferral mortality (ERF/LRF), months certain, sexes, survivor percent, temporary months. Nothing assumed.
- LLM: copies any factor table the documents print, row by row, as printed. No reordering. No interpolating. No filling in from the formula.
- LLM: records the plan's normal married form in `planMetadata.normalMarriedForm`, with a citation. Never assumes `JS50`.
- LLM: for each BFCF set, records `appliesInPbgcAdmin` — true only when from-form is the normal single form and to-form is the normal married form. The app derives the same decision itself and refuses the JSON if the two disagree.
- LLM: if a conversion is in the documents but its factors cannot be worked out, reports the set as `missing` or `ambiguous` and says why. The user adds it by hand in Review (see step 4). Never invent it.

## 3. Upload the JSON

- You: upload or paste the JSON.
- App: validates it against the schema. Bad JSON is refused.
- App: fills only empty slots. It never overwrites a value.
- App: lists keys it does not know. You assign each one a target.
- Partial JSON: fills only sets that are missing. The rest is ignored.

## 4. Review

- You: approve, reject, or edit each factor set.
- You: edit the header (plan name, plan number, case number, DOPT).
- You: edit any field of a set in place (Edit). Save checks every value first; a bad value is refused and the error names the field. A saved edit clears the set's decision — approve it again.
- You: read the plan's words (`ruleText`) under each set, and the source: table values or formulas.
- You: read the exact formula that will be written, on each row, before generating.
- You: read the effective dates of each set, and which sets need attention (missing, ambiguous, or failing validation).
- You: read, for each BFCF set, whether PBGC honors it. Honored pairs only. A pair PBGC does not honor is left out of the file — it needs no decision, and it does not block Generate.
- You: add a conversion the scraper missed, under "Additional conversions". Pick any from-form and to-form, fill in the BCV arguments (or copy them from an existing BFCF set — the survivor percent is never copied, it derives from the new to-form). If the documents print a factor table for that pair, paste it (one row per line: partAge, benAge, factor). A pair PBGC does not honor needs the "Include it anyway" tick: that is the override, and the audit log records it. Adding approves it at once. Remove takes it back out.
- Missing sets: approve is refused. Reject them, or fill them first.
- Rejected sets stay out of the workbook.

## 5. Generate

- You: click "Preview print layout" to see the tabs before generating. Table values as printed, formula text where Excel computes.
- You: click "Generate the workbook".
- App: locked until the header is filled and each set has a decision.
- App: writes one tab per approved set: honored scraped sets, and user-added sets. Two sets that would share a tab name are refused.
- App: sets print area, print titles, landscape, fit, margins on each tab.
- App: writes the audit report: generator and schema versions, plan and case, input JSON hash, one traceability line per set (source, effective dates, rule, decision, PBGC-honors result, formula), then every addition, edit, approval, rejection, and exclusion. The workbook's document properties carry the generator version too.
- App: builds deterministically — the same approved inputs always give the same bytes.

## 6. Download

- You: click "Download".
- App: downloads `<case>PF.xlsx`.
- You: click "Download audit log" for the report.
- Open the file in Excel with the ATPBGC add-in. The BCV formulas compute there.
