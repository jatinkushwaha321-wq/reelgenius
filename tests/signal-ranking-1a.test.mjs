/**
 * SIGNAL-RANKING-1A
 * 
 * Focused tests for the shared signal priority authority.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { scoreSignal, rankSignals } from '../src/lib/intelligence/signal-ranking.js';
import { selectActiveSignals, buildIdeaPacket } from '../src/lib/ideas/build-idea-packet.js';

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

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const REF_TIME = new Date('2026-07-01T12:00:00Z').getTime();

// Helper to create basic signals
const makeSig = (overrides = {}) => ({
  strength: 0,
  confidence: 0,
  trend: 'unknown',
  updatedAt: new Date(REF_TIME - SEVEN_DAYS_MS - 1000).toISOString(), // stale by default
  ...overrides
});

console.log('\n=== SCORE COMPONENT TESTS ===\n');

// TEST 1 — STRENGTH WEIGHT
const sigStrength50 = makeSig({ strength: 50 });
const sigStrength100 = makeSig({ strength: 100 });
assert(scoreSignal(sigStrength50, REF_TIME) === 20, 'TEST 1: strength contributes exactly 0.4');
assert(scoreSignal(sigStrength100, REF_TIME) === 40, 'TEST 1: strength difference scales exactly');

// TEST 2 — CONFIDENCE WEIGHT
const sigConf50 = makeSig({ confidence: 50 });
assert(scoreSignal(sigConf50, REF_TIME) === 20, 'TEST 2: confidence contributes exactly 0.4');

// TEST 3 — RISING TREND MODIFIER
const sigRising = makeSig({ trend: 'rising' });
assert(scoreSignal(sigRising, REF_TIME) === 10, 'TEST 3: rising trend modifies by +10');

// TEST 4 — FALLING TREND MODIFIER
const sigFalling = makeSig({ trend: 'falling' });
assert(scoreSignal(sigFalling, REF_TIME) === -5, 'TEST 4: falling trend modifies by -5');

// TEST 5 — STABLE / UNKNOWN MODIFIER
const sigStable = makeSig({ trend: 'stable' });
const sigUnknown = makeSig({ trend: 'unknown' });
const sigNonsense = makeSig({ trend: 'nonsense' });
assert(scoreSignal(sigStable, REF_TIME) === 0, 'TEST 5: stable trend modifier is 0');
assert(scoreSignal(sigUnknown, REF_TIME) === 0, 'TEST 5: unknown trend modifier is 0');
assert(scoreSignal(sigNonsense, REF_TIME) === 0, 'TEST 5: unexpected trend modifier is 0');

// TEST 6 — FRESH SIGNAL MODIFIER
const freshTime = REF_TIME - (3 * 24 * 60 * 60 * 1000); // 3 days ago
const sigFresh = makeSig({ updatedAt: new Date(freshTime).toISOString() });
assert(scoreSignal(sigFresh, REF_TIME) === 5, 'TEST 6: fresh signal modifier is +5');

// TEST 7 — EXACT 7-DAY BOUNDARY
const exactTime = REF_TIME - SEVEN_DAYS_MS;
const sigExact = makeSig({ updatedAt: new Date(exactTime).toISOString() });
assert(scoreSignal(sigExact, REF_TIME) === 5, 'TEST 7: exact 7-day boundary modifier is +5');

// TEST 8 — STALE SIGNAL
const staleTime = REF_TIME - SEVEN_DAYS_MS - 1;
const sigStale = makeSig({ updatedAt: new Date(staleTime).toISOString() });
assert(scoreSignal(sigStale, REF_TIME) === 0, 'TEST 8: stale signal modifier is 0');


console.log('\n=== RANKING CONTRACT TESTS ===\n');

// TEST 9 — SCORE DESCENDING ORDER
const sA = makeSig({ key: 'A', strength: 100 }); // score 40
const sB = makeSig({ key: 'B', strength: 80 });  // score 32
const sC = makeSig({ key: 'C', strength: 50 });  // score 20
const rankedScore = rankSignals([sB, sA, sC], REF_TIME);
assert(rankedScore[0].key === 'A', 'TEST 9: highest score first');
assert(rankedScore[1].key === 'B', 'TEST 9: middle score second');
assert(rankedScore[2].key === 'C', 'TEST 9: lowest score last');

// TEST 10 — KEY TIE-BREAKER
const tie1 = makeSig({ key: 'Zeta', strength: 50 });
const tie2 = makeSig({ key: 'Alpha', strength: 50 });
const tie3 = makeSig({ key: 'Gamma', strength: 50 });
const rankedTies = rankSignals([tie1, tie2, tie3], REF_TIME);
assert(rankedTies[0].key === 'Alpha', 'TEST 10: exact score ties ordered ascending by key (Alpha)');
assert(rankedTies[1].key === 'Gamma', 'TEST 10: exact score ties ordered ascending by key (Gamma)');
assert(rankedTies[2].key === 'Zeta', 'TEST 10: exact score ties ordered ascending by key (Zeta)');

// TEST 11 — INPUT NON-MUTATION
const inputList = [sA, sC, sB];
const inputRef = inputList.slice();
rankSignals(inputList, REF_TIME);
assert(inputList[0].key === 'A' && inputList[1].key === 'C' && inputList[2].key === 'B', 'TEST 11: original input array is not mutated');

// TEST 12 — EMPTY / NULL INPUT
assert(rankSignals([], REF_TIME).length === 0, 'TEST 12: empty array returns empty array');
assert(rankSignals(null, REF_TIME).length === 0, 'TEST 12: null returns empty array');
assert(rankSignals(undefined, REF_TIME).length === 0, 'TEST 12: undefined returns empty array');

// TEST 13 — NULL SCORE INPUT
assert(scoreSignal(null, REF_TIME) === 0, 'TEST 13: scoreSignal null is 0');
assert(scoreSignal(undefined, REF_TIME) === 0, 'TEST 13: scoreSignal undefined is 0');

// TEST 14 — ORIGINAL OBJECT IDENTITY
const sIdTest = makeSig({ key: 'ID' });
const rankedId = rankSignals([sIdTest], REF_TIME);
assert(rankedId[0] === sIdTest, 'TEST 14: rankSignals returns original object references');

// TEST 15 — SINGLE REFERENCE TIME CONTRACT
// If we don't pass reference time, rankSignals uses Date.now().
// We'll mock Date.now temporarily.
const originalDateNow = Date.now;
let nowCalls = 0;
Date.now = () => {
  nowCalls++;
  return REF_TIME;
};
rankSignals([sA, sB, sC]);
assert(nowCalls === 1, 'TEST 15: rankSignals resolves Date.now() exactly once per operation');
Date.now = originalDateNow;


console.log('\n=== IDEA PACKET PRESERVATION TESTS ===\n');

const ideaSignals = [
  makeSig({ key: 'sig1', strength: 90, confidence: 90, category: 'audience-engagement' }), // score 72
  makeSig({ key: 'sig2', strength: 80, confidence: 80, category: 'content-format' }), // score 64
  makeSig({ key: 'sig3', strength: 70, confidence: 70, category: 'audience-engagement' }), // score 56
  makeSig({ key: 'sig4', strength: 60, confidence: 60, category: 'creator-style' }), // score 48
  makeSig({ key: 'sig5', strength: 50, confidence: 50, category: 'audience-engagement' }), // score 40
  makeSig({ key: 'sig6', strength: 40, confidence: 40, category: 'audience-engagement' }), // score 32
  makeSig({ key: 'sig7', strength: 30, confidence: 30, category: 'audience-engagement' }), // excludes (< 40 conf)
  makeSig({ key: 'sig8', strength: 20, confidence: 20, category: 'audience-engagement' }), // excludes
];

// TEST 16 — BUILD IDEA PACKET RANKING PRESERVATION
// TEST 18 — TOP-8 PRESERVATION
const { selectedSignals } = selectActiveSignals(ideaSignals);
assert(selectedSignals.length === 6, 'TEST 16 & 18: selectActiveSignals preserves eligibility (<40 excluded) and bounds');
assert(selectedSignals[0].key === 'sig1', 'TEST 16: selectActiveSignals top signal preserved');
assert(selectedSignals[1].key === 'sig2', 'TEST 16: selectActiveSignals 2nd signal preserved');
assert(selectedSignals[2].key === 'sig3', 'TEST 16: selectActiveSignals 3rd signal preserved');
assert(selectedSignals[3].key === 'sig4', 'TEST 16: selectActiveSignals 4th signal preserved');

// TEST 17 — CATEGORY BALANCING PRESERVATION
// We want m1 and m2 to be outside top 8, but belong to missing categories.
const balanceSignals = [
  makeSig({ key: 't1', strength: 100, confidence: 100, category: 'audience-engagement' }), // 80
  makeSig({ key: 't2', strength: 95, confidence: 100, category: 'audience-engagement' }), // 78
  makeSig({ key: 't3', strength: 90, confidence: 100, category: 'audience-engagement' }), // 76
  makeSig({ key: 't4', strength: 85, confidence: 100, category: 'audience-engagement' }), // 74
  makeSig({ key: 't5', strength: 80, confidence: 100, category: 'audience-engagement' }), // 72
  makeSig({ key: 't6', strength: 75, confidence: 100, category: 'audience-engagement' }), // 70
  makeSig({ key: 't7', strength: 70, confidence: 100, category: 'audience-engagement' }), // 68
  makeSig({ key: 't8', strength: 65, confidence: 100, category: 'audience-engagement' }), // 66 (lowest of top 8)
  makeSig({ key: 'm1', strength: 60, confidence: 100, category: 'creator-style' }), // 64 (ranked 9th)
  makeSig({ key: 'm2', strength: 55, confidence: 100, category: 'content-format' }), // 62 (ranked 10th)
];

const { selectedSignals: balSelected } = selectActiveSignals(balanceSignals);
assert(balSelected.length === 8, 'TEST 17: returns 8 signals');
const hasCreatorStyle = balSelected.some(s => s.category === 'creator-style');
const hasContentFormat = balSelected.some(s => s.category === 'content-format');
const missingT8 = !balSelected.some(s => s.key === 't8');
const missingT7 = !balSelected.some(s => s.key === 't7');

assert(hasCreatorStyle && hasContentFormat, 'TEST 17: missing categories were swapped into the top 8');
assert(missingT8 && missingT7, 'TEST 17: lowest ranked over-represented signals were swapped out');

console.log('\n=== STATIC BOUNDARY ASSERTIONS ===\n');

const helperContent = fs.readFileSync(path.join(__dirname, '../src/lib/intelligence/signal-ranking.js'), 'utf8');
assert(!helperContent.includes('mongoose'), 'STATIC: does not import mongoose');
assert(!helperContent.includes('Signal.js'), 'STATIC: does not import Signal model');
assert(!helperContent.includes('slice('), 'STATIC: does not contain slice limit');
assert(!helperContent.includes('categories'), 'STATIC: does not contain category balancing');
assert(!helperContent.includes('confidence >='), 'STATIC: does not contain eligibility filtering');

const builderContent = fs.readFileSync(path.join(__dirname, '../src/lib/ideas/build-idea-packet.js'), 'utf8');
assert(builderContent.includes('rankSignals'), 'STATIC: buildIdeaPacket imports rankSignals');
assert(!builderContent.includes('const score = (strength * 0.4)'), 'STATIC: old duplicated score formula removed');


console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
