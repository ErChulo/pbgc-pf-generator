# PBGC honored conversions — Book of Job check (2026-11-11)

Question: which benefit conversion factors does PBGC actually honor, and
is there another set the PF generator may have to provide for?

Sources read (Drive, "PBGC the book of job"):
- `Annuity Benefit Forms.pdf`, issue date 1/27/2022 (10 pp.)
- `Paying and Converting Complex Benefit Forms.pdf`, issue date
  12/22/2016 (4 pp.)

## What the guidance says

### 1. Plan forms elected before trusteeship are paid (Annuity Benefit
Forms §D.1)

If a payee filed a valid plan application on or before the date of
trusteeship (DoTR) and elected a life-annuity form, PBGC accepts it
and pays the elected form. Limits: hybrid forms with a lump sum are
paid only if the lump sum is $5,000 or less; other hybrid/other
annuity forms need a PSDGuidance determination. PPA §436(d) limits
also apply (a form prohibited during underfunding is not accepted).

### 2. Post-trusteeship, the payable forms are the plan's automatic
forms plus PBGC optional forms (§D.2, §E)

- Married participant: the plan's automatic form for a married
  participant (the QJSA), unless waived with spousal consent.
- Unmarried participant: the plan's automatic form for an
  unmarried participant.
- On waiver/election, a payee may elect PBGC optional forms:
  - Single-life: straight-life annuity; 5-, 10-, or 15-year
    certain-and-continuous annuity.
  - Joint-life (participants only): joint-and-50%, -75%, or -100%
    survivor annuity; joint-and-50% survivor "pop-up" annuity.

### 3. PBGC optional forms use PBGC factors, not plan factors (§G.1)

"If a payee elects a PBGC optional benefit form, PBGC will convert
the payee's benefit amount under the plan's automatic form to the
optional benefit form amount using PBGC factors. The PBGC factors
are based on an interest rate of six percent and unisex mortality
rates that are a fixed blend of 50 percent of the male mortality
rates and 50 percent of the female mortality rates from the 1983
Group Annuity Mortality Table as prescribed in Rev. Rul. 95-6."

- Single-life optional forms convert from the plan's automatic form
  for unmarried participants.
- Joint-life optional forms convert from the plan's automatic form
  for married participants.
- Limits (§G.3): amounts limited to the automatic unmarried form
  converted to SLA; PBGC will not pay an optional form worth half
  or less of the SLA amount (it may offer an actuarially equivalent
  version instead, e.g. JS90 instead of JS100).

### 4. Complex forms (second guidance)

A PBGC optional joint-and-survivor annuity is actuarially
equivalent to the plan's automatic form for a married participant;
a PBGC optional single-life annuity is actuarially equivalent to
the plan's automatic form for an unmarried participant. Free
surviving spouse benefits, five-year term certain benefits,
temporary supplements, and QJSA "pop-up" annuities have their own
conversion rules into PBGC optional forms.

## What this means for the PF generator

- The user's v0.2.2 rule stands for the plan-factor tabs: in the PF
  workbook, the BFCF tabs that matter are the plan's own
  conversions from the normal single form to the normal married
  form (the plan's automatic forms). Other plan conversion pairs
  the prior administrator used are left out.
- The "another set" is the PBGC optional-form set: JS75, JS100,
  JS50 pop-up, and 5/10/15-year certain-and-continuous annuities.
  These are converted with PBGC factors (6%, unisex 1983 GAM),
  not with plan factors, and they convert FROM the plan's
  automatic forms — so they are not plan-factor BFCF tabs of the
  kind the PF file holds today.
- The PF generator today has no way to write a PBGC-factor
  conversion tab (its BFCF formulas take interest/mortality from
  the plan documents). Whether PBGC optional-form conversions
  belong in the PF workbook at all, and in what shape, is an open
  decision for the user — not settled by these two documents.
- Not checked in this pass: the valuation-side (V1/PC2) treatment
  of plan conversion factors, and 29 CFR 4022.8 itself. The
  "Priority Category 2 Benefits Calculation" doc mentions plan
  early/late retirement factors and benefit form conversion
  factors at lines ~260–316 but was not read in full.

## Second check (2026-11-11, user-asked): is the NSF→NMF-only rule
## written anywhere, and are PBGC optional forms outside the PF file?

Searched: Drive fullText for "normal married form", "conversion
factor", "benefit form conversion factor", "plan factors",
"optional benefit form"; read Annuity Benefit Forms §D/§E/§G,
Paying and Converting Complex Benefit Forms (full), Priority
Category 2 Benefits Calculation (conversion-factor passages),
Actuarial Case Report Checklist (Jan 2024); grepped the BCV Data
Dictionary (local copy).

Finding: NO sentence was found that states, as a written policy,
"PBGC honors only normal single form to normal married form
conversions." That sentence does not appear in the documents read.
What the source does show, in four pieces:

1. The PF example file itself (24884900PF.v0.7.13.xlsx): its BFCF
   tabs are ONLY SLA->JS50 and 3CC->JS50 — normal single form to
   normal married form (the plan's QJSA). No JS75, JS100, pop-up,
   or certain-and-continuous tabs exist in the file.
2. BCV Data Dictionary: the valuation machinery is built around
   exactly two forms — FORM_CODE_NSF (Normal Single Benefit
   Form) and FORM_CODE_NMF (Normal Married Benefit Form), with
   SPCNSF/SPCNMF (survivor percents) and MTHSNSF/MTHSNMF
   (months certain). These fields feed BSRS/BET. BFCF_XRD is
   "XRD Benefit Form Conversion Factor". VB is the "Vested
   Monthly Benefit in the Normal Single Form (NSF) at NRA".
   Nothing in the dictionary frames a conversion outside NSF/NMF.
3. Annuity Benefit Forms §G.1 (already noted above): PBGC
   optional forms convert with PBGC factors (6%, unisex 1983
   GAM), not plan factors — so they are calculated in the V1 /
   payment administration (BSRS config), not from the PF file's
   plan-factor tabs. This matches the user's statement that
   optional forms are not part of the PF file.
4. Actuarial Case Report Checklist (Jan 2024): "Conversion
   factor tables (early, late, form conversion, etc.) are correct
   and consistent with the valuation programming", verified "Using
   AEQ Functions", "NPVF Calculator output", or "Plan Provided
   Tables verified to match factor tables used in valuation
   programming." The PF tables must match the valuation — which
   runs in NSF/NMF terms (see 2).

Conclusion: the user's rule is consistent with everything found,
and the optional-forms-outside-PF point is confirmed by §G.1,
but the NSF→NMF-only sentence itself was not found as a written
policy. Still to check if the user wants the sentence: 29 CFR
§4022.8 itself, and any BSRS configuration guidance that names
which conversion factors the config carries.

## Third check (2026-11-11): 29 CFR §4022.8 itself (eCFR, read
## 2026-11-11)

- §4022.8(b): the automatic PBGC form is the form the plan would
  pay to a married participant (or unmarried participant) in the
  absence of an election. That is the plan's automatic form —
  the normal married / normal single form.
- §4022.8(c)(6): to price an optional PBGC form, PBGC first
  determines the benefit in the automatic form — unmarried form
  for single-life optional forms, married form for joint-life
  optional forms.
- §4022.8(c)(7): PBGC then converts that amount to the optional
  form elected "using PBGC factors based on" unisex mortality
  (50/50 blend, 1983 GAM, Rev. Rul. 95-6) and 6% interest.
- §4022.8(c)(8): the optional-form amount is limited to the
  straight-life annuity amount.
- §4022.8(c)(4)–(5): the optional menu is SLA, 5/10/15-yr C&C,
  JS50, JS50 pop-up, JS75, JS100.

The regulation still does not state, in words, that PBGC honors
only normal-single → normal-married plan conversion factors.
What it does confirm at the regulation level: PBGC pays the
automatic form, and every other form is reached by converting
FROM the automatic form with PBGC factors — never with plan
factors. So the optional-form set is outside the PF file by
regulation, not just by internal guidance. The NSF→NMF-only
rule for plan-factor tabs remains the user's practice rule,
consistent with the PF example file, the BCV Dictionary
(NSF/NMF), and the checklist, but without a single written
sentence found anywhere so far.

## v0.2.3 — Additional conversions (2026-11-11, user-asked)

The user asked for a section in the PF app where he can specify
any from-form to to-form pair by hand, so the final PF file can
hold conversion factors the scraper (or he) might miss. Built as
`additionalConversions` in the JSON and an "Additional
conversions" form in Review. A user-added pair gets a tab even
when PBGC does not honor it — the review says "included by your
choice" and the audit log records it. The v0.2.2 rule is unchanged
for scraped sets. Demo: the JS100 pair is user-added; workbook
has 4 tabs. Full design note: `docs/PF_NOTES.md`, "Additional
conversions" section.
