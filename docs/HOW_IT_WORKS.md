# How the PF Generator works

ASD STE 100. One idea per line. User action, then app behavior.

## Open

- Open `pf-generator.html`. No server. No install.
- The menu has three pages: PF generator, Welcome, Help.
- The landing page shows only the work steps.

## 1. Download the prompt

- You: click "Download the scraper prompt".
- App: downloads `pf-scraper-prompt.md`.

## 2. Scrape (outside the app)

- You: feed the prompt and the plan documents to an LLM. Copilot in the office, any LLM at home.
- LLM: returns JSON. It only proposes.
- LLM: finds every distinct factor set. Each era. Each type. Each form pair. No merging. No dropping.
- LLM: quotes the plan's rule sentence into `ruleText`, then states the matching `rule`. Words first, formula second.
- LLM: copies every BCV argument from the plan's definition: interest, mortality tables, calc method, deferral mortality, months certain, sexes, survivor percent, temporary months. Nothing assumed.
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
- You: edit a set title in place.
- You: read the plan's words (`ruleText`) under each set, and the source: table values or formulas.
- You: read, for each BFCF set, whether PBGC honors it. Honored pairs only. A pair PBGC does not honor is left out of the file — it needs no decision, and it does not block Generate.
- You: add a conversion the scraper missed, under "Additional conversions". Pick any from-form and to-form, fill in the BCV arguments (or copy them from an existing BFCF set — the survivor percent is never copied, it derives from the new to-form). Adding approves it at once. A pair PBGC does not honor is still included, by your choice: the review says so, and the audit log records it. Remove takes it back out.
- Missing sets: approve is refused. Reject them, or fill them first.
- Rejected sets stay out of the workbook.

## 5. Generate

- You: click "Generate the workbook".
- App: locked until the header is filled and each set has a decision.
- App: writes one tab per approved set: honored scraped sets, and user-added sets.
- App: sets print area, print titles, landscape, fit, margins on each tab.
- App: writes the audit log, per set: table values and formulas counted. It names every set left out by the PBGC rule and why, names every user-added set and that it is included by choice, and records the normal married form used.

## 6. Download

- You: click "Download".
- App: downloads `<case>PF.xlsx`.
- You: click "Download audit log" for the log.
- Open the file in Excel with the ATPBGC add-in. The BCV formulas compute there.
