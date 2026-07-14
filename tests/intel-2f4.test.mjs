/**
 * INTEL-2F.4 — Focused local tests
 *
 *   1. Autobiography guard (5 patterns)
 *   2. Pain-point guard (real failure phrases + safe phrases)
 *   3. Ranking comparator & rankKey encoding
 *   4. Cross-batch ordering verification
 *   5. Parser regression (autobiography + epistemic + placeholder phases)
 */

import {
  containsAutobiographyClaim,
  containsEpistemicViolation,
  containsPlaceholder,
} from '../src/lib/validations/ideas-generation.js';

import {
  rankCandidates,
  computeRankKey,
  getConfidenceBand,
  getTrendOrdinal,
} from '../src/lib/ideas/rank-candidates.js';

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';

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

// ===================================================================
// 1. AUTOBIOGRAPHY GUARD
// ===================================================================
console.log('\n=== 1. AUTOBIOGRAPHY GUARD ===\n');

// Pattern 1: Quantified system ownership
assert(containsAutobiographyClaim('My 1-Rule System to Beat Procrastination'), 'P1: my 1-rule system');
assert(containsAutobiographyClaim('my 3-step framework for productivity'), 'P1: my 3-step framework');
assert(containsAutobiographyClaim('My 5-Habit Method For Waking Up'), 'P1: my 5-habit method');
assert(!containsAutobiographyClaim('my take on system design'), 'P1a SAFE: my take on system design');
assert(!containsAutobiographyClaim('my favorite tutorial format'), 'P1a SAFE: my favorite tutorial format');
assert(!containsAutobiographyClaim('my approach to debugging'), 'P1a SAFE: my approach to debugging');

// Pattern 1b: Named framework/system ownership (no digit quantifier)
assert(containsAutobiographyClaim('My Public Goal-Setting Framework'), 'P1b: My Public Goal-Setting Framework');
assert(containsAutobiographyClaim('My Morning Routine System'), 'P1b: My Morning Routine System');
assert(containsAutobiographyClaim('My Accountability Framework'), 'P1b: My Accountability Framework');
assert(containsAutobiographyClaim('My Personal Productivity System'), 'P1b: My Personal Productivity System');
assert(!containsAutobiographyClaim('my take on system design'), 'P1b SAFE: my take on system design');
assert(!containsAutobiographyClaim('my approach to system design'), 'P1b SAFE: my approach to system design');
assert(!containsAutobiographyClaim('my thoughts on framework selection'), 'P1b SAFE: my thoughts on framework selection');
assert(!containsAutobiographyClaim('my perspective on system architecture'), 'P1b SAFE: my perspective on system architecture');

// Pattern 2: Transformation claims
assert(containsAutobiographyClaim('changed my accountability game'), 'P2: changed my');
assert(containsAutobiographyClaim('How building in public transformed my workflow'), 'P2: transformed my');
assert(containsAutobiographyClaim('This revolutionized my morning routine'), 'P2: revolutionized my');
assert(containsAutobiographyClaim('changed how I approach big projects'), 'P2: changed how I');
assert(!containsAutobiographyClaim('changed the industry forever'), 'P2 SAFE: changed the industry');
assert(!containsAutobiographyClaim('this will change how you think'), 'P2 SAFE: change how you (viewer)');
assert(!containsAutobiographyClaim('10 things that changed web development'), 'P2 SAFE: changed [non-personal noun]');

// Pattern 3: Temporal history
assert(containsAutobiographyClaim('I used to struggle with consistency'), 'P3: I used to');
assert(containsAutobiographyClaim('I spent six months learning DSA'), 'P3: I spent ... months');
assert(containsAutobiographyClaim('I spent three years building this'), 'P3: I spent ... years');
assert(containsAutobiographyClaim('I spent 2 weeks on this'), 'P3: I spent ... weeks');
assert(!containsAutobiographyClaim('I recommend starting with'), 'P3 SAFE: I recommend');
assert(!containsAutobiographyClaim('I think this is useful'), 'P3 SAFE: I think');

// Pattern 4: Struggle/overcoming
assert(containsAutobiographyClaim('I struggled with procrastination for years'), 'P4: I struggled with');
assert(containsAutobiographyClaim('I overcame burnout as an engineer'), 'P4: I overcame');
assert(containsAutobiographyClaim('I conquered my fear of public speaking'), 'P4: I conquered');
assert(containsAutobiographyClaim('I battled imposter syndrome'), 'P4: I battled');
assert(!containsAutobiographyClaim('I recommend this framework'), 'P4 SAFE: I recommend');
assert(!containsAutobiographyClaim('Many engineers struggle with burnout'), 'P4 SAFE: third-person struggle');

// Pattern 5: Creator-name attribution
assert(containsAutobiographyClaim("Deepanshi's productivity system", 'Deepanshi'), 'P5: Name\'s [adj] system (possessive)');
assert(containsAutobiographyClaim('Deepanshi personally uses this method', 'Deepanshi'), 'P5: Name personally uses');
assert(containsAutobiographyClaim('Deepanshi developed a unique approach', 'Deepanshi'), 'P5: Name developed');
assert(containsAutobiographyClaim('Deepanshi system', 'Deepanshi'), 'P5: Name system (direct)');
assert(!containsAutobiographyClaim('Deepanshi explains system design', 'Deepanshi'), 'P5 SAFE: Name explains system design');
assert(!containsAutobiographyClaim("Someone's productivity system", 'Deepanshi'), 'P5 SAFE: wrong name');

// Real failure cases from INTEL-2F audit
assert(containsAutobiographyClaim("My Public Goal-Setting Framework: How 'Building in Public' Fuels My Progress"), 'REAL FAIL: Goal-Setting Framework title');
assert(containsAutobiographyClaim("Here's how 'building in public' changed my accountability game."), 'REAL FAIL: changed my accountability hook');
assert(containsAutobiographyClaim("My 1-Rule System to Beat Procrastination as an Engineer"), 'REAL FAIL: 1-Rule System title');

// Legitimate non-autobiographical first-person (MUST PASS)
assert(!containsAutobiographyClaim("Share why consistency is difficult for developers"), 'LEGIT: non-personal framing');
assert(!containsAutobiographyClaim("A rule for staying consistent while learning DSA"), 'LEGIT: general advice');
assert(!containsAutobiographyClaim("Why Starting Again Feels Harder Than Starting"), 'LEGIT: general observation');
assert(!containsAutobiographyClaim("I think the biggest mistake developers make"), 'LEGIT: I think (opinion)');
assert(!containsAutobiographyClaim("Here's what I'd tell my younger self"), 'LEGIT: hypothetical framing');

// ===================================================================
// 2. PAIN-POINT GUARD
// ===================================================================
console.log('\n=== 2. PAIN-POINT GUARD ===\n');

// CASE B real failures (must now be caught)
assert(
  containsEpistemicViolation("directly aligning with the audience's pain point of improving professional skills like Git/GitHub"),
  'CASE B1: audience\'s pain point'
);
assert(
  containsEpistemicViolation("directly addressing an audience pain point related to maintaining motivation"),
  'CASE B2: audience pain point (no possessive)'
);
assert(
  containsEpistemicViolation("aligning with the audience's pain point"),
  'BYPASS: aligning with audience\'s pain point'
);
assert(
  containsEpistemicViolation("directly addresses the audience's pain point"),
  'BYPASS: directly addresses audience\'s pain point'
);
assert(
  containsEpistemicViolation("this represents an audience pain point"),
  'ORIGINAL: represents an audience pain point'
);

// Safe phrases (must NOT trigger)
assert(
  !containsEpistemicViolation("procrastination is a common pain point in engineering education"),
  'SAFE: common pain point (no audience)'
);
assert(
  !containsEpistemicViolation("The profile documents Git/GitHub as a broad pain-point category"),
  'SAFE: pain-point category (no audience phrase)'
);
assert(
  !containsEpistemicViolation("a plausible educational opportunity aligned with observed patterns"),
  'SAFE: calibrated educational framing'
);
assert(
  !containsEpistemicViolation("debugging is a known pain point for beginners"),
  'SAFE: known pain point (no audience)'
);

// ===================================================================
// 3. RANKING COMPARATOR & RANKKEY ENCODING
// ===================================================================
console.log('\n=== 3. RANKING COMPARATOR ===\n');

// Band tests
assert(getConfidenceBand(95) === 4, 'Band: 95 → 4');
assert(getConfidenceBand(90) === 4, 'Band: 90 → 4');
assert(getConfidenceBand(89) === 3, 'Band: 89 → 3');
assert(getConfidenceBand(80) === 3, 'Band: 80 → 3');
assert(getConfidenceBand(79) === 2, 'Band: 79 → 2');
assert(getConfidenceBand(70) === 2, 'Band: 70 → 2');
assert(getConfidenceBand(69) === 1, 'Band: 69 → 1');
assert(getConfidenceBand(60) === 1, 'Band: 60 → 1');

// Trend ordinal tests
assert(getTrendOrdinal('rising') === 3, 'Trend: rising → 3');
assert(getTrendOrdinal('stable') === 2, 'Trend: stable → 2');
assert(getTrendOrdinal('unknown') === 1, 'Trend: unknown → 1');
assert(getTrendOrdinal('falling') === 0, 'Trend: falling → 0');

// rankKey encoding
function makeCand(title, primaryConf, primaryTrend, suppConfs) {
  const snapshots = [
    { key: 'primary', displayName: 'P', strength: 80, confidence: primaryConf, trend: primaryTrend, directionImplication: '' },
    ...suppConfs.map((c, i) => ({
      key: `supp_${i}`, displayName: `S${i}`, strength: 70, confidence: c, trend: 'stable', directionImplication: '',
    })),
  ];
  return {
    title,
    topic: 'test',
    concept: 'a valid concept that is long enough for the schema',
    whyNow: 'a valid whyNow reason',
    format: 'tutorial',
    contentPillar: 'test',
    hook: 'a valid hook for testing',
    directionReasoning: 'a valid direction reasoning text',
    noveltyReason: 'differs from existing content',
    sourceSignalKeys: snapshots.map(s => s.key),
    sourceSignalSnapshots: snapshots,
  };
}

// Band dominates: band 4 > band 3 regardless of trend or supporting confidence
const candA = makeCand('A', 92, 'stable', [85]);  // band 4, stable, mean=(92+85)/2=88.5→89
const candB = makeCand('B', 89, 'rising', [95]);   // band 3, rising, mean=(89+95)/2=92
rankCandidates([candA, candB]);
assert(candA.rankKey > candB.rankKey, 'Band dominance: band 4 stable > band 3 rising');

// Within same band, momentum differentiates
const candC = makeCand('C', 92, 'rising', [85]);   // band 4, rising
const candD = makeCand('D', 95, 'stable', [85]);   // band 4, stable
rankCandidates([candC, candD]);
assert(candC.rankKey > candD.rankKey, 'Momentum: rising > stable within same band');

// Within same band and trend, mean confidence differentiates
const candE = makeCand('E', 93, 'rising', [90, 95]);  // band 4, rising, mean=(93+90+95)/3=93
const candF = makeCand('F', 91, 'rising', [80, 70]);  // band 4, rising, mean=(91+80+70)/3=80
rankCandidates([candE, candF]);
assert(candE.rankKey > candF.rankKey, 'Mean conf: higher mean > lower mean');

// Signal COUNT does NOT matter — quality over quantity
const candG = makeCand('G', 90, 'stable', []);              // 1 signal, mean=90
const candH = makeCand('H', 90, 'stable', [65, 65, 65]);    // 4 signals, mean=(90+65+65+65)/4=71
rankCandidates([candG, candH]);
assert(candG.rankKey > candH.rankKey, 'No count bonus: 1 strong signal > 4 weaker signals');

// Title tie-break (same rankKey → alphabetical)
const candI = makeCand('Zebra Topic', 90, 'stable', [90]);   // mean 90
const candJ = makeCand('Alpha Topic', 90, 'stable', [90]);   // mean 90
const sorted = rankCandidates([candI, candJ]);
assert(sorted[0].title === 'Alpha Topic', 'Title tie-break: alphabetical wins');
assert(candI.rankKey === candJ.rankKey, 'Title tie-break: rankKeys are equal');

// Explicit encoding verification
const candK = makeCand('K', 95, 'rising', [90]);  // band=4, trend=3, mean=round((95+90)/2)=93
const expectedKey = (4 * 10000) + (3 * 1000) + 93;
assert(computeRankKey(candK) === expectedKey, `Encoding: expected ${expectedKey}, got ${computeRankKey(candK)}`);

// ===================================================================
// 4. CROSS-BATCH ORDERING (single active batch verification)
// ===================================================================
console.log('\n=== 4. CROSS-BATCH ORDERING ===\n');

// Since only one candidate batch exists at a time (persistIdeas deletes prior candidates),
// rankKey-first sort is always correct. Verify that candidates sort correctly
// when mixed with non-candidate Ideas (which have no rankKey).
// Non-candidate Ideas have rankKey: null → MongoDB sorts null LAST with -1 sort.

const candidatesOnly = [
  makeCand('Low', 65, 'stable', [60]),    // band 1
  makeCand('High', 95, 'rising', [90]),   // band 4
  makeCand('Mid', 82, 'stable', [80]),    // band 3
];
rankCandidates(candidatesOnly);
assert(candidatesOnly[0].title === 'High', 'Batch sort: highest ranked first');
assert(candidatesOnly[1].title === 'Mid', 'Batch sort: mid second');
assert(candidatesOnly[2].title === 'Low', 'Batch sort: lowest last');

// ===================================================================
// 5. PARSER REGRESSION — autobiography + epistemic + placeholder
// ===================================================================
console.log('\n=== 5. PARSER REGRESSION ===\n');

// Build a valid signalRefMap
const signalRefMap = new Map();
signalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
});

function makeValidRaw(overrides = {}) {
  return {
    candidates: [{
      requiresPersonalFact: false,
      primarySignalRef: 'sig_001',
      derivationBasis: 'This is a valid derivation basis for the candidate at least 10 chars',
      title: 'A Valid Idea Title For Testing',
      topic: 'testing patterns',
      concept: 'This is a complete concept description that is long enough to pass the minimum character validation threshold.',
      whyNow: 'Timely because the pattern is currently active',
      format: 'tutorial',
      contentPillar: 'Engineering',
      hook: 'Ever wondered why this matters?',
      supportingSignalRefs: ['sig_001'],
      directionReasoning: 'The primary signal direction shows a clear opportunity in this area.',
      noveltyReason: 'This differs from existing content by focusing on specifics.',
      ...overrides,
    }],
  };
}

// Valid candidate passes all phases
try {
  const result = parseIdeaOutput(makeValidRaw(), signalRefMap, 'TestCreator');
  assert(result.length === 1, 'Regression: valid candidate survives all phases');
} catch (e) {
  assert(false, `Regression: valid candidate threw: ${e.message}`);
}

// Autobiography in title → dropped
try {
  const result = parseIdeaOutput(makeValidRaw({ title: 'My 3-Step Framework for Productivity' }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: autobiography title drops candidate');
} catch (e) {
  // NO_VALID_CANDIDATES is also acceptable (zero candidates)
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: autobiography title → NO_VALID_CANDIDATES');
}

// Autobiography in hook → dropped
try {
  const result = parseIdeaOutput(makeValidRaw({ hook: 'How building in public changed my workflow forever' }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: autobiography hook drops candidate');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: autobiography hook → NO_VALID_CANDIDATES');
}

// Creator-name attribution → dropped
try {
  const result = parseIdeaOutput(makeValidRaw({ title: "TestCreator's productivity system" }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: creator name attribution drops candidate');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: creator name attribution → NO_VALID_CANDIDATES');
}

// Epistemic violation still caught
try {
  const result = parseIdeaOutput(makeValidRaw({ noveltyReason: "This resonates deeply with the audience" }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: epistemic violation still caught');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: epistemic violation → NO_VALID_CANDIDATES');
}

// Placeholder still caught
try {
  const result = parseIdeaOutput(makeValidRaw({ title: 'How to [Your Topic] in 2025' }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: placeholder still caught');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: placeholder → NO_VALID_CANDIDATES');
}

// Pain-point in reasoning → caught
try {
  const result = parseIdeaOutput(makeValidRaw({ 
    noveltyReason: "directly aligning with the audience's pain point of improving Git skills" 
  }), signalRefMap, 'TestCreator');
  assert(result.length === 0, 'Regression: audience pain point caught in reasoning');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'Regression: audience pain point → NO_VALID_CANDIDATES');
}

// Non-autobiographical first-person passes
try {
  const result = parseIdeaOutput(makeValidRaw({ 
    title: 'Why I Think Every Dev Should Learn System Design',
    hook: "Here's what I'd tell my younger self about system design",
  }), signalRefMap, 'TestCreator');
  assert(result.length === 1, 'Regression: non-autobiographical first-person survives');
} catch (e) {
  assert(false, `Regression: non-autobiographical threw: ${e.message}`);
}

// ===================================================================
// REPORT
// ===================================================================
console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
