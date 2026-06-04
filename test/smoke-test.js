#!/usr/bin/env node
/* =========================================================
   Atlas demo — smoke test (zero dependencies, no browser)
   ---------------------------------------------------------
   Validates:
     1. Required files exist.
     2. index.html contains the required sections / DOM hooks / copy.
     3. app.js contains the real conversation-engine copy.
     4. personalize.js FUNCTIONALLY personalizes from ?business=
        (run as actual code, not just string-matched).

   Run:  node test/smoke-test.js
   Exit: 0 = all pass, 1 = one or more failures.
========================================================= */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var pass = 0, fail = 0;
var failures = [];

function ok(name) { pass++; console.log('  ✓ ' + name); }
function bad(name, detail) {
  fail++; failures.push(name + (detail ? ' — ' + detail : ''));
  console.log('  ✗ ' + name + (detail ? ' — ' + detail : ''));
}
function check(name, cond, detail) { cond ? ok(name) : bad(name, detail); }

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
  catch (e) { return null; }
}

console.log('\nAtlas demo smoke test\n=====================');

/* ---------- 1. Files exist ---------- */
console.log('\n[1] Required files');
var FILES = ['index.html', 'styles.css', 'app.js', 'personalize.js', 'README.md'];
FILES.forEach(function (f) {
  check(f + ' exists', read(f) !== null, 'missing');
});

var html = read('index.html') || '';
var app = read('app.js') || '';

/* ---------- 2. index.html DOM hooks + sections ---------- */
console.log('\n[2] Landing page structure & DOM hooks');
var REQUIRED_IDS = [
  'thread', 'composer', 'input', 'send', 'start', 'reset',     // simulator
  'dash-rows', 'stat-total', 'stat-confirmed', 'stat-active', 'stat-recovered', // dashboard
  'biz-hero', 'biz-demo', 'biz-cta', 'phone-biz',              // personalization targets
  'book-email', 'book-call',                                    // CTA
];
REQUIRED_IDS.forEach(function (id) {
  check('has #' + id, new RegExp('id=["\']' + id + '["\']').test(html), 'id not found in index.html');
});

console.log('\n[3] Required sections present');
var SECTIONS = [
  ['demo section', /id=["']demo["']/],
  ['live-pilot section', /id=["']pilot["']/],
  ['book/CTA section', /id=["']book["']/],
];
SECTIONS.forEach(function (s) { check(s[0], s[1].test(html), 'section anchor missing'); });

console.log('\n[4] Conversion copy & tone');
var COPY = [
  ['mentions Peterborough/Kawartha', /Peterborough|Kawartha/i],
  ['mentions missed call', /missed call/i],
  ['10-minute demo CTA', /10[\s-]?min/i],
  ['transparent communications provider note', /trusted communications provider/i],
  ['mentions dashboard', /dashboard/i],
  ['recovered opportunity framing', /recover/i],
];
COPY.forEach(function (c) { check(c[0], c[1].test(html), 'copy not found'); });

// Tone guard: avoid leading with scary AI language in headline area.
var heroBlock = (html.split('id="demo"')[0] || '');
check('hero does not lead with "AI" buzzword', !/\bAI\b/.test(heroBlock),
  'found "AI" in hero — keep tone benefit-first');

/* ---------- 5. app.js conversation engine copy ---------- */
console.log('\n[5] Conversation engine copy (mirrors MVP)');
var ENGINE = [
  ['greeting "Sorry we missed your call"', /Sorry we missed your call/],
  ['issue step "who am I speaking with"', /who am I speaking with/],
  ['time step prompt', /good time for us to come by/i],
  ['confirm step "Reply YES"', /Reply YES to confirm/i],
  ['confirmed close "You\'re all set"', /You.{0,2}re all set/],
];
ENGINE.forEach(function (e) { check(e[0], e[1].test(app), 'engine copy not found in app.js'); });

/* ---------- 6. Personalization — FUNCTIONAL ---------- */
console.log('\n[6] Query-param personalization (functional)');
var P;
try { P = require(path.join(ROOT, 'personalize.js')); }
catch (e) { P = null; bad('personalize.js loads as module', e.message); }

if (P) {
  ok('personalize.js loads as module');
  check('default when no param',
    P.getBusinessName('') === 'your business',
    'got "' + (P && P.getBusinessName('')) + '"');

  check('reads ?business=Acme%20Plumbing (URL-encoded)',
    P.getBusinessName('?business=Acme%20Plumbing') === 'Acme Plumbing',
    'got "' + P.getBusinessName('?business=Acme%20Plumbing') + '"');

  check('reads plain ?business=Bob HVAC',
    P.getBusinessName('?business=Bob HVAC') === 'Bob HVAC');

  check('trims whitespace',
    P.getBusinessName('?business=%20%20Spaced%20%20') === 'Spaced');

  check('isPersonalized true with param',
    P.isPersonalized('?business=Acme') === true);

  check('isPersonalized false without param',
    P.isPersonalized('') === false);

  check('caps absurdly long input (<=60 chars)',
    P.getBusinessName('?business=' + encodeURIComponent('x'.repeat(200))).length === 60,
    'len=' + P.getBusinessName('?business=' + encodeURIComponent('x'.repeat(200))).length);

  check('initials derive "AP" from "Acme Plumbing"',
    P.initials('Acme Plumbing') === 'AP',
    'got "' + P.initials('Acme Plumbing') + '"');

  // index.html must actually load personalize.js before app.js.
  check('index.html loads personalize.js then app.js',
    html.indexOf('personalize.js') !== -1 &&
    html.indexOf('personalize.js') < html.indexOf('app.js'),
    'script order wrong or missing');
}

/* ---------- Summary ---------- */
console.log('\n=====================');
console.log('Passed: ' + pass + '   Failed: ' + fail);
if (fail > 0) {
  console.log('\nFailures:');
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
console.log('All checks passed. ✅\n');
process.exit(0);
