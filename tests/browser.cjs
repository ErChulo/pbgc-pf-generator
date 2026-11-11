// Browser test: loads pf-generator.html in jsdom and drives it like a user.
// Part 1 — opaque origin (a file: URL): every storage access must go
// through pfSafeStorage(); this proves the app survives a blocked
// localStorage and the demo button works.
// Part 2 — theme toggle: the toggle flips data-theme on the root, the
// dark page background is #000, the header stays brand blue.
// Part 3 — HeaderNav: skip link first, nav links (not buttons) with
// aria-current, hash links + hashchange, disclosure menu with Escape
// and focus return.
// Part 4 — Welcome and Help are their own pages: 3 nav links, the
// landing page shows only the PF workflow, Try the demo from the
// Welcome page loads the demo and switches to the PF view.
// Part 5 — persistence (http:// origin, storage works): a saved dark
// choice loads dark; toggling writes the choice back.
// Part 6 — Review + generate: demo loads 5 sets, decisions gate the
// generate button, approving 3 and rejecting 1 unlocks it; the JS75
// set needs no decision (PBGC rule leaves it out).
// Part 7 — Additional conversions: the form in Review adds a pair the
// scraper missed; copying arguments fills the BCV fields but never
// the survivor percent; adding approves it and the audit log records it.
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

let failures = 0;
function check(name, ok, extra) {
  console.log((ok ? '  ok  ' : 'FAIL  ') + name + (extra !== undefined ? ' — ' + extra : ''));
  if (!ok) failures++;
}

const html = fs.readFileSync(path.join(__dirname, '..', 'pf-generator.html'), 'utf8');

function makeDom(url, beforeParse) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e && e.message || e)));
  vc.on('error', (...a) => errors.push(a.join(' ')));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url,
    virtualConsole: vc,
    pretendToBeVisual: true,
    beforeParse
  });
  return { dom, errors };
}
// The app inits on DOMContentLoaded; drive the UI only after load.
function loaded(dom) {
  return new Promise((resolve) => {
    if (dom.window.document.readyState === 'complete') return resolve();
    dom.window.addEventListener('load', () => resolve(), { once: true });
    setTimeout(resolve, 2000);
  });
}

async function main() {
// ---- Parts 1 + 2: opaque origin (file: URL, localStorage throws) ----
const opaque = makeDom('file:///pf-generator.html');
await loaded(opaque.dom);

// ---- Part 5: storage works (http: origin), seeded dark ----
const stored = makeDom('http://localhost/', (window) => {
  window.localStorage.setItem('pf-theme', 'dark');
});
await loaded(stored.dom);

// jsdom 27 does not resolve var() in computed background-color (it returns
// transparent), so background colors are checked on the CSS rules
// themselves, not on computed style.
function cssRule(document, selector) {
  for (const sheet of document.styleSheets) {
    for (const r of sheet.cssRules) {
      if (r.selectorText === selector) return r;
    }
  }
  return null;
}
function ruleHas(rule, prop, value) {
  if (!rule) return false;
  const v = rule.style.getPropertyValue(prop);
  if (!v) return false;
  const t = v.trim().toLowerCase();
  if (t === value.toLowerCase()) return true;
  // jsdom serialises #000000 as rgb(0, 0, 0).
  if (value.toLowerCase() === '#000000') return t === 'rgb(0, 0, 0)';
  return false;
}

{
  const { dom, errors } = opaque;
  const { window } = dom;
  const { document } = window;
  check('Part 1: page loads on an opaque origin with no script errors', errors.length === 0, errors.join('; '));
  check('Part 1: PF global exists', !!window.PF);
  check('Part 1: PF version is 0.4.1', window.PF && window.PF.VERSION === '0.4.1');

  // Demo from the PF view: use the public loader (same as the button).
  window.pfLoadDemo();
  check('Part 1: demo loads 5 factor sets', window.PF.state.data && window.PF.state.data.factorSets.length === 5);
  check('Part 1: demo loads 1 additional conversion', window.PF.state.data && window.PF.state.data.additionalConversions && window.PF.state.data.additionalConversions.length === 1);
  check('Part 1: demo step is Review (2)', window.PF.state.step === 2);
  const rev = document.getElementById('review-box');
  check('Part 1: review renders 7 rows (5 scraped + 1 user-added + the Additional conversions block)', rev && rev.querySelectorAll('.revrow').length === 7, rev ? String(rev.querySelectorAll('.revrow').length) : 'no review box');
  check('Part 1: review shows the Additional conversions form', rev && !!document.getElementById('pf-add-from') && !!document.getElementById('pf-add-to'));
  check('Part 1: review says the user-added JS100 set is included by choice', rev && rev.textContent.includes('included by your choice'));
  check('Part 1: review shows the formula preview', rev && rev.textContent.includes('Formula: =ROUND(BFCFAEQ'));
  check('Part 1: review shows the effective dates', rev && rev.textContent.includes('Effective'));
  check('Part 1: review shows the version and progress', rev && rev.textContent.includes('PF Generator v0.4.1') && rev.textContent.includes('Step 3 of 5'));
  check('Part 1: review flags the missing set', rev && rev.textContent.includes('Needs attention') && rev.textContent.includes('ERF-DIS-2020 (missing'));
  // Edit panel: open it, save a bad value (refused), save a good one.
  document.querySelector('#review-box [data-action="edit"][data-id="ERF-2020"]').click();
  check('Part 1: Edit opens the edit panel for the set', !!document.querySelector('[data-edit-set="ERF-2020"][data-edit-field="interest"]') || !!document.querySelector('[data-edit-set="ERF-2020"][data-edit-field="title"]'));
  const titleInput = document.querySelector('[data-edit-set="ERF-2020"][data-edit-field="title"]');
  titleInput.value = '';
  document.querySelector('#review-box [data-action="save-edit"][data-id="ERF-2020"]').click();
  const editErr = document.getElementById('pf-edit-error-ERF-2020');
  check('Part 1: saving an empty title is refused and names the field', editErr && editErr.textContent.includes('title'), editErr ? editErr.textContent : 'no error box');
  check('Part 1: refused save writes nothing', window.PF.state.data.factorSets.find((s) => s.id === 'ERF-2020').title === 'Early Retirement Factors from NRA of 65 (2020 Plan)');
  titleInput.value = 'Early Retirement Factors from NRA of 65 (2020 Plan, edited)';
  document.querySelector('#review-box [data-action="save-edit"][data-id="ERF-2020"]').click();
  check('Part 1: saving a good edit applies it', window.PF.state.data.factorSets.find((s) => s.id === 'ERF-2020').title === 'Early Retirement Factors from NRA of 65 (2020 Plan, edited)');
  check('Part 1: a saved edit clears the decision (approve again)', !window.PF.state.decisions['ERF-2020']);
  check('Part 1: audit log records the edit and the changed field', window.PF.state.audit.some((a) => a.action === 'edit set' && a.detail.indexOf('ERF-2020') === 0 && a.detail.includes('title')));
  check('Part 1: review shows the source label (Table / Formulas)', rev && rev.textContent.includes('Source: Table:') && rev.textContent.includes('Source: Formulas from the rule'));
  check('Part 1: review says PBGC honors the JS50 set', rev && rev.textContent.includes('PBGC honors: Yes'));
  check('Part 1: review says PBGC does not honor the JS75 set, with the reason', rev && rev.textContent.includes('PBGC honors: No') && rev.textContent.includes('to-form JS75 is not the normal married form JS50'));
  check('Part 1: excluded set has no approve button', rev && !rev.querySelector('[data-action="approve"][data-id="BFCF-2020-JS75"]'));

  // Theme toggle.
  const toggle = document.getElementById('theme-toggle');
  check('Part 2: theme toggle exists', !!toggle);
  const root = document.documentElement;
  check('Part 2: starts light (no data-theme)', !root.hasAttribute('data-theme'));
  toggle.click();
  check('Part 2: toggle flips to dark', root.getAttribute('data-theme') === 'dark');
  check('Part 2: toggle label becomes Light', toggle.textContent.includes('Light'));
  check('Part 2: toggle aria-pressed is true', toggle.getAttribute('aria-pressed') === 'true');
  toggle.click();
  check('Part 2: toggle flips back to light', !root.hasAttribute('data-theme'));
  const darkBg = cssRule(document, ':root[data-theme="dark"] body');
  check('Part 2: dark page background rule is #000', ruleHas(darkBg, 'background', '#000000'), darkBg ? darkBg.style.cssText : 'no rule');
  const topbar = cssRule(document, '.topbar');
  check('Part 2: header stays brand blue #002D72', ruleHas(topbar, 'background', 'var(--blue)') || (topbar && topbar.style.cssText.includes('var(--blue)')), topbar ? topbar.style.cssText : 'no rule');
}

{
  const { dom, errors } = stored;
  const { window } = dom;
  const { document } = window;
  check('Part 5: page loads with working storage, no errors', errors.length === 0, errors.join('; '));
  check('Part 5: saved dark choice loads dark', document.documentElement.getAttribute('data-theme') === 'dark');
  const toggle = document.getElementById('theme-toggle');
  toggle.click();
  check('Part 5: toggling to light writes the choice back', window.localStorage.getItem('pf-theme') === 'light');
}

// ---- Parts 3 + 4 + 6: fresh opaque dom for nav + workflow ----
{
  const { dom, errors } = makeDom('file:///pf-generator.html');
  await loaded(dom);
  const { window } = dom;
  const { document } = window;
  check('Part 3: fresh load has no script errors', errors.length === 0, errors.join('; '));

  // Skip link is the first element in the body.
  const first = document.body.firstElementChild;
  check('Part 3: skip link is first in the body', first && first.classList.contains('skip-link') && first.getAttribute('href') === '#main');

  // Nav links, not buttons.
  const navLinks = Array.from(document.querySelectorAll('#views-list a[data-view]'));
  check('Part 3: 3 nav links', navLinks.length === 3, String(navLinks.length));
  check('Part 3: nav items are links with hash hrefs', navLinks.every(a => a.tagName === 'A' && a.getAttribute('href').startsWith('#')));
  const pfLink = document.getElementById('nav-pf');
  check('Part 3: PF link has aria-current on landing', pfLink && pfLink.getAttribute('aria-current') === 'page');
  check('Part 3: landing shows only the PF workflow', !document.getElementById('view-pf').hidden && document.getElementById('view-welcome').hidden && document.getElementById('view-help').hidden);

  // Hash routing: welcome link switches the view.
  const welcomeLink = document.getElementById('nav-welcome');
  welcomeLink.click();
  check('Part 4: Welcome link switches to the Welcome page', !document.getElementById('view-welcome').hidden && document.getElementById('view-pf').hidden);
  check('Part 4: aria-current moves to Welcome', welcomeLink.getAttribute('aria-current') === 'page' && !pfLink.hasAttribute('aria-current'));
  window.dispatchEvent(new window.Event('hashchange'));
  check('Part 4: hashchange keeps the Welcome view', !document.getElementById('view-welcome').hidden);

  // Try the demo from the Welcome page loads the demo and switches to PF.
  const demoBtn = document.querySelector('#view-welcome [data-action="demo"]');
  check('Part 4: Try the demo button exists on Welcome', !!demoBtn);
  demoBtn.click();
  check('Part 4: demo loads and switches to the PF view', !document.getElementById('view-pf').hidden && window.PF.state.data !== null);
  check('Part 4: demo case is the synthetic Riverbend plan', window.PF.state.data.planMetadata.planName === 'Riverbend Manufacturing Pension Plan');

  // Menu disclosure: open, Escape closes and returns focus.
  const menuBtn = document.getElementById('menu-toggle');
  const nav = document.getElementById('views-nav');
  menuBtn.click();
  check('Part 3: menu opens', nav.classList.contains('open') && menuBtn.getAttribute('aria-expanded') === 'true');
  document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  check('Part 3: Escape closes the menu', !nav.classList.contains('open') && menuBtn.getAttribute('aria-expanded') === 'false');
  check('Part 3: Escape returns focus to the menu button', document.activeElement === menuBtn);

  // Part 6: generate is locked until every decidable set is decided.
  // The JS75 set needs no decision: the PBGC rule leaves it out.
  const genBtn = document.querySelector('#generate-box [data-action="generate"]');
  check('Part 6: generate button starts disabled', genBtn && genBtn.disabled);
  const approveBtns = Array.from(document.querySelectorAll('#review-box [data-action="approve"]'));
  const rejectBtns = Array.from(document.querySelectorAll('#review-box [data-action="reject"]'));
  check('Part 6: 5 approve buttons, 5 reject buttons (excluded set has none)', approveBtns.length === 5 && rejectBtns.length === 5, approveBtns.length + '/' + rejectBtns.length);
  // Re-query before each click: approving re-renders the review list.
  ['ERF-2020', 'LRF-2020', 'BFCF-2020', 'BFCF-2020-JS100', 'ERF-DIS-2020'].forEach((id) => {
    document.querySelector('#review-box [data-action="approve"][data-id="' + id + '"]').click();
  });
  // The missing disability set is approved here too; the gate must block it.
  const genBtn2 = document.querySelector('#generate-box [data-action="generate"]');
  check('Part 6: approving a missing set keeps generate locked', genBtn2 && genBtn2.disabled);
  const warn = document.querySelector('#generate-box .warn');
  check('Part 6: gate explains the block', warn && warn.textContent.includes('ERF-DIS-2020'), warn ? warn.textContent : 'no warning');
  // Fix: reject the missing set instead. The JS75 set stays undecided.
  const disReject = document.querySelector('#review-box [data-action="reject"][data-id="ERF-DIS-2020"]');
  disReject.click();
  const genBtn3 = document.querySelector('#generate-box [data-action="generate"]');
  check('Part 6: rejecting the missing set unlocks generate (excluded set still undecided)', genBtn3 && !genBtn3.disabled);
  genBtn3.click();
  check('Part 6: generate produces 98765400PF.xlsx', window.PF.state.generated && window.PF.state.generated.name === '98765400PF.xlsx');
  check('Part 6: generated workbook has 4 tabs (3 honored + 1 user-added)', window.PF.state.generated && window.PF.state.generated.tabs === 4);
  check('Part 6: download step shows the filename', document.getElementById('download-box').textContent.includes('98765400PF.xlsx'));

  // Part 7: add a conversion the scraper missed, through the form.
  window.pfLoadDemo();
  // Empty form first: adding must fail and say what is missing.
  document.querySelector('#review-box [data-action="add-conversion"]').click();
  const addErr = document.getElementById('pf-add-error');
  check('Part 7: adding with an empty form shows the missing fields', addErr && addErr.textContent.includes('fromForm'), addErr ? addErr.textContent : 'no error box');
  check('Part 7: failed add adds nothing', window.PF.state.data.additionalConversions.length === 1);
  // Copy the BCV arguments from the honored BFCF set.
  const copySel = document.getElementById('pf-add-copy');
  copySel.value = 'BFCF-2020';
  document.querySelector('#review-box [data-action="copy-conversion-args"]').click();
  check('Part 7: copying arguments fills interest and mortality', document.getElementById('pf-add-interest').value === '0.08' && document.getElementById('pf-add-mort1').value === 'UP84M2' && document.getElementById('pf-add-calcmethod').value === 'MP');
  check('Part 7: copying arguments does not copy the survivor percent', document.getElementById('pf-add-survivorpct').value === '');
  // A pair the scraper did not propose: 3CC to JS75. PBGC does not
  // honor it (from-form 3CC is not the normal single form SLA), so
  // adding needs the explicit override confirmation first.
  document.getElementById('pf-add-era').value = '2020';
  document.getElementById('pf-add-from').value = '3CC';
  document.getElementById('pf-add-to').value = 'JS75';
  document.getElementById('pf-add-ruletext').value = 'joint and 75% survivor conversion by actuarial equivalence';
  document.querySelector('#review-box [data-action="add-conversion"]').click();
  const confErr = document.getElementById('pf-add-error');
  check('Part 7: adding a non-honored pair without the override tick is refused', window.PF.state.data.additionalConversions.length === 1 && confErr && confErr.textContent.includes('Include it anyway'), confErr ? confErr.textContent : 'no error box');
  document.getElementById('pf-add-confirm').checked = true;
  document.querySelector('#review-box [data-action="add-conversion"]').click();
  check('Part 7: adding the pair appends it to additionalConversions', window.PF.state.data.additionalConversions.length === 2 && window.PF.state.data.additionalConversions.some((s) => s.id === 'BFCF-2020-3CC-JS75'));
  check('Part 7: the 3CC from-form is kept as written (the app maps it to SLA + 36 in the formula)', window.PF.state.data.additionalConversions.find((s) => s.id === 'BFCF-2020-3CC-JS75').fromForm === '3CC');
  check('Part 7: adding approves the pair at once', window.PF.state.decisions['BFCF-2020-3CC-JS75'] === 'approved');
  check('Part 7: audit log records the override confirmation', window.PF.state.audit.some((a) => a.action === 'additional conversion added' && a.detail.indexOf('BFCF-2020-3CC-JS75') === 0 && a.detail.includes('override confirmed')));
  check('Part 7: the new row has a Remove button', !!document.querySelector('#review-box [data-action="remove-conversion"][data-id="BFCF-2020-3CC-JS75"]'));
  check('Part 7: the new row says it is included by choice (PBGC does not honor 3CC->JS75)', document.getElementById('review-box').textContent.includes('included by your choice'));
  check('Part 7: audit log records the added conversion', window.PF.state.audit.some((a) => a.action === 'additional conversion added' && a.detail.indexOf('BFCF-2020-3CC-JS75') === 0));
  // Removing it takes it back out.
  document.querySelector('#review-box [data-action="remove-conversion"][data-id="BFCF-2020-3CC-JS75"]').click();
  check('Part 7: removing the pair takes it back out', window.PF.state.data.additionalConversions.length === 1 && !window.PF.state.data.additionalConversions.some((s) => s.id === 'BFCF-2020-3CC-JS75'));
  check('Part 7: audit log records the removal', window.PF.state.audit.some((a) => a.action === 'additional conversion removed' && a.detail === 'BFCF-2020-3CC-JS75'));

  // Part 8 (v0.4.1): logo, per-type prompts, intMethod, printed table, print preview.
  window.pfLoadDemo();
  const logo = document.querySelector('header .brand-logo');
  check('Part 8: white PBGC logo sits in the header', !!logo && logo.getAttribute('src').startsWith('data:image/png;base64,') && logo.getAttribute('alt').includes('Pension Benefit Guaranty Corporation'));
  const typeBtns = Array.from(document.querySelectorAll('#prompt-card [data-action="prompt"][data-type]'));
  check('Part 8: four per-type prompt buttons (ERF, LRF, BFCF, OTHER)', typeBtns.length === 4 && typeBtns.map((b) => b.getAttribute('data-type')).join(',') === 'ERF,LRF,BFCF,OTHER', typeBtns.map((b) => b.getAttribute('data-type')).join(','));
  check('Part 8: add form asks for the interest method, not deferral mortality', !!document.getElementById('pf-add-intmethod') && !document.getElementById('pf-add-deferral'));
  check('Part 8: add form has a printed factor table box', !!document.getElementById('pf-add-table'));
  document.getElementById('pf-add-copy').value = 'BFCF-2020';
  document.querySelector('#review-box [data-action="copy-conversion-args"]').click();
  check('Part 8: copying arguments copies the interest method N', document.getElementById('pf-add-intmethod').value === 'N');
  // Add a pair with a printed table: 3CC to JS100, two grid rows
  // (inside the demo set's small age ranges, 55-60 and 0-5).
  document.getElementById('pf-add-era').value = '2020';
  document.getElementById('pf-add-from').value = '3CC';
  document.getElementById('pf-add-to').value = 'JS100';
  document.getElementById('pf-add-ruletext').value = 'joint and 100% survivor conversion by actuarial equivalence';
  document.getElementById('pf-add-table').value = '55, 0, 0.8123\n56, 1, 0.8001';
  document.getElementById('pf-add-confirm').checked = true;
  document.querySelector('#review-box [data-action="add-conversion"]').click();
  const added = window.PF.state.data.additionalConversions.find((s) => s.id === 'BFCF-2020-3CC-JS100');
  check('Part 8: adding a pair with a printed table keeps the table', !!added && added.table && added.table.kind === 'grid' && added.table.rows.length === 2, added ? JSON.stringify(added.table) : 'no set');
  check('Part 8: the table value is read back for its age pair', !!added && window.PF.pfTableValue(added, null, 55, 0) === 0.8123);
  check('Part 8: the added set carries intMethod N and no deferralMortality', !!added && added.intMethod === 'N' && added.deferralMortality === null);
  // Edit panel: BFCF sets edit the interest method, not deferral mortality.
  document.querySelector('#review-box [data-action="edit"][data-id="BFCF-2020"]').click();
  check('Part 8: edit panel for a BFCF set has an interest method field, no deferral field', !!document.querySelector('[data-edit-set="BFCF-2020"][data-edit-field="intMethod"]') && !document.querySelector('[data-edit-set="BFCF-2020"][data-edit-field="deferralMortality"]'));
  const intInput = document.querySelector('[data-edit-set="BFCF-2020"][data-edit-field="intMethod"]');
  intInput.value = 'Y';
  document.querySelector('#review-box [data-action="save-edit"][data-id="BFCF-2020"]').click();
  const intErr = document.getElementById('pf-edit-error-BFCF-2020');
  check('Part 8: saving interest method Y is refused', intErr && intErr.textContent.includes('intMethod'), intErr ? intErr.textContent : 'no error box');
  intInput.value = 'LPQ';
  document.querySelector('#review-box [data-action="save-edit"][data-id="BFCF-2020"]').click();
  check('Part 8: saving interest method LPQ applies it', window.PF.state.data.factorSets.find((s) => s.id === 'BFCF-2020').intMethod === 'LPQ');
  // Approve everything decidable, reject the missing set, then preview.
  ['ERF-2020', 'LRF-2020', 'BFCF-2020', 'BFCF-2020-JS100'].forEach((id) => {
    document.querySelector('#review-box [data-action="approve"][data-id="' + id + '"]').click();
  });
  document.querySelector('#review-box [data-action="reject"][data-id="ERF-DIS-2020"]').click();
  const previewBtn = document.querySelector('#generate-box [data-action="preview"]');
  check('Part 8: preview button is enabled once generate is ready', previewBtn && !previewBtn.disabled);
  previewBtn.click();
  const previewBox = document.getElementById('pf-preview');
  check('Part 8: preview shows the tabs and a BFCF formula', previewBox && previewBox.textContent.includes('Tab: ERF-2020') && previewBox.textContent.includes('BFCFAEQ'), previewBox ? previewBox.textContent.slice(0, 120) : 'no preview');
  check('Part 8: preview shows the added table value, not a formula, for its age pair', previewBox && previewBox.textContent.includes('0.8123'));
  document.querySelector('#generate-box [data-action="generate"]').click();
  check('Part 8: generate still produces the workbook with the table set', window.PF.state.generated && window.PF.state.generated.tabs === 5, window.PF.state.generated ? String(window.PF.state.generated.tabs) : 'no workbook');
  check('Part 8: audit log records the added table values', window.PF.state.audit.some((a) => a.action === 'generate set' && a.detail.indexOf('BFCF-2020-3CC-JS100') === 0 && a.detail.includes('table values: 2')));
}

console.log('\n' + failures + ' failure(s)');
process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error('FAIL  harness error:', e.message); process.exit(1); });
