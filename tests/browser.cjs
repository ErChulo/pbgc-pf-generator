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
  check('Part 1: PF version is 0.2.3', window.PF && window.PF.VERSION === '0.2.3');

  // Demo from the PF view: use the public loader (same as the button).
  window.pfLoadDemo();
  check('Part 1: demo loads 5 factor sets', window.PF.state.data && window.PF.state.data.factorSets.length === 5);
  check('Part 1: demo loads 1 additional conversion', window.PF.state.data && window.PF.state.data.additionalConversions && window.PF.state.data.additionalConversions.length === 1);
  check('Part 1: demo step is Review (2)', window.PF.state.step === 2);
  const rev = document.getElementById('review-box');
  check('Part 1: review renders 7 rows (5 scraped + 1 user-added + the Additional conversions block)', rev && rev.querySelectorAll('.revrow').length === 7, rev ? String(rev.querySelectorAll('.revrow').length) : 'no review box');
  check('Part 1: review shows the Additional conversions form', rev && !!document.getElementById('pf-add-from') && !!document.getElementById('pf-add-to'));
  check('Part 1: review says the user-added JS100 set is included by choice', rev && rev.textContent.includes('included by your choice'));
  check('Part 1: review shows the plan words (ruleText)', rev && rev.textContent.includes('Plan words:'), rev ? rev.textContent.slice(0, 200) : 'no review box');
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
  // A pair the scraper did not propose: 3CC to JS75.
  document.getElementById('pf-add-era').value = '2020';
  document.getElementById('pf-add-from').value = '3CC';
  document.getElementById('pf-add-to').value = 'JS75';
  document.getElementById('pf-add-ruletext').value = 'joint and 75% survivor conversion by actuarial equivalence';
  document.querySelector('#review-box [data-action="add-conversion"]').click();
  check('Part 7: adding the pair appends it to additionalConversions', window.PF.state.data.additionalConversions.length === 2 && window.PF.state.data.additionalConversions.some((s) => s.id === 'BFCF-2020-3CC-JS75'));
  check('Part 7: adding approves the pair at once', window.PF.state.decisions['BFCF-2020-3CC-JS75'] === 'approved');
  check('Part 7: the new row has a Remove button', !!document.querySelector('#review-box [data-action="remove-conversion"][data-id="BFCF-2020-3CC-JS75"]'));
  check('Part 7: the new row says it is included by choice (PBGC does not honor 3CC->JS75)', document.getElementById('review-box').textContent.includes('included by your choice'));
  check('Part 7: audit log records the added conversion', window.PF.state.audit.some((a) => a.action === 'additional conversion added' && a.detail.indexOf('BFCF-2020-3CC-JS75') === 0));
  // Removing it takes it back out.
  document.querySelector('#review-box [data-action="remove-conversion"][data-id="BFCF-2020-3CC-JS75"]').click();
  check('Part 7: removing the pair takes it back out', window.PF.state.data.additionalConversions.length === 1 && !window.PF.state.data.additionalConversions.some((s) => s.id === 'BFCF-2020-3CC-JS75'));
  check('Part 7: audit log records the removal', window.PF.state.audit.some((a) => a.action === 'additional conversion removed' && a.detail === 'BFCF-2020-3CC-JS75'));
}

console.log('\n' + failures + ' failure(s)');
process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error('FAIL  harness error:', e.message); process.exit(1); });
