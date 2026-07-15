/**
 * OVERVIEW-1B
 * 
 * Focused tests for the Creator Intelligence Overview.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== SIGNAL API TESTS ===\n');

const apiContent = fs.readFileSync(path.join(__dirname, '../src/app/api/signals/route.js'), 'utf8');

assert(apiContent.includes('rankSignals'), 'TEST 1 & 2 & 7: Signal API imports and uses rankSignals shared helper');
assert(!apiContent.includes('strength *') && !apiContent.includes('confidence *'), 'TEST 4: Signal API does not duplicate ranking formula');
assert(apiContent.includes('confidence >= 40'), 'TEST 3: Signal API filters eligible signals matching Idea generation semantics');
assert(apiContent.indexOf('rankSignals') < apiContent.indexOf('slice('), 'TEST 3 & 8: Signal API ranks the complete eligible set before slicing');
assert(!apiContent.includes('score:') && !apiContent.includes('strength:') && !apiContent.includes('confidence:'), 'TEST 5 & 10: Signal API does not serialize numeric ranking score, strength, or confidence');
assert(apiContent.includes('directionImplication:'), 'TEST 9: Signal API exposes directionImplication');
assert(apiContent.includes('trend:'), 'TEST 9: Signal API exposes trend');

console.log('\n=== OVERVIEW PAGE TESTS ===\n');

const pageContent = fs.readFileSync(path.join(__dirname, '../src/app/dashboard/page.js'), 'utf8');

assert(pageContent.includes('Promise.allSettled'), 'TEST 17 & 18 & 19: Overview uses Promise.allSettled for failure isolation');
assert(pageContent.includes('SIGNALS UNAVAILABLE'), 'TEST 11 & 14: Signal failure state is distinct from empty state');
assert(pageContent.includes('AWAITING CREATOR SIGNAL'), 'TEST 11 & 13: Signal empty state is present');
assert(pageContent.includes('DIRECTION UNAVAILABLE'), 'TEST 16 & 18: Direction failure state is distinct from empty state');
assert(pageContent.includes('NO DIRECTION DERIVED'), 'TEST 16 & 17: Direction empty state is present');
assert(pageContent.includes('aiSummary'), 'TEST 12 & 15: Direction uses the exact existing CreatorProfile aiSummary authority');
assert(!pageContent.includes('/api/ideas/generate'), 'TEST 14 & 21: Overview does not call Idea generation directly');
assert(pageContent.includes('href="/dashboard/ideas"'), 'TEST 15: Overview links to /dashboard/ideas');
assert(!pageContent.includes('niche') && !pageContent.includes('subNiches') && !pageContent.includes('contentPillars'), 'TEST 19 & 20: Overview does not duplicate Profile field surfaces');
assert(!pageContent.includes('30s') && !pageContent.includes('duration'), 'TEST 20: No 30s or Idea duration fallback is introduced');
assert(!pageContent.includes('score') && !pageContent.includes('priority'), 'TEST 21: No internal priority score is shown');


console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
