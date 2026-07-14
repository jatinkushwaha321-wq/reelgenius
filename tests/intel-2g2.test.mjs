/**
 * INTEL-2G.2 — Deterministic Reasoning Boundary test suite.
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import {
  containsAutobiographyClaim,
  containsEpistemicViolation,
} from '../src/lib/validations/ideas-generation.js';

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

console.log('\n=== INTEL-2G.2 DETERMINISTIC BOUNDARY TESTS ===\n');

// Build default signalRefMap
const signalRefMap = new Map();
signalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
  evidence: [{ fact: 'Reels averaged 1.8x median engagement' }],
});

const rawInput = {
  candidates: [{
    requiresPersonalFact: false,
    primarySignalRef: 'sig_001',
    derivationBasis: 'This is a valid derivation basis for the candidate at least 10 chars',
    title: 'A Valid Idea Title For Testing',
    topic: 'testing patterns',
    concept: 'This is a complete concept description that is long enough to pass the minimum character validation threshold.',
    format: 'tutorial',
    contentPillar: 'Engineering',
    hook: 'Ever wondered why this matters?',
    supportingSignalRefs: ['sig_001'],
    noveltyReason: 'This differs from existing content by focusing on specifics.',
  }],
};

// A. Provider candidate without directionReasoning/whyNow passes structural parsing.
let result;
try {
  result = parseIdeaOutput(rawInput, signalRefMap, 'TestCreator');
  assert(result.length === 1, 'A: parses successfully without directionReasoning/whyNow');
} catch (e) {
  assert(false, `A: threw error: ${e.message}`);
}

if (result && result.length > 0) {
  const cand = result[0];
  
  // B. Parser reconstructs directionReasoning from observedFact.
  assert(
    cand.directionReasoning === "This direction expands on an active content signal to propose a tutorial format focused on testing patterns. One supporting observation: Reels averaged 1.8x median engagement.",
    `B: directionReasoning is reconstructed: got "${cand.directionReasoning}"`
  );
}

// C. observedFact terminal punctuation does not produce double punctuation.
const signalMapWithPunc = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 85,
    confidence: 90,
    trend: 'stable',
    directionImplication: '',
    evidence: [{ fact: 'Reels averaged 1.8x median engagement.' }], // ends with period
  }]
]);
const resWithPunc = parseIdeaOutput(rawInput, signalMapWithPunc, 'TestCreator');
assert(
  resWithPunc[0].directionReasoning === "This direction expands on an active content signal to propose a tutorial format focused on testing patterns. One supporting observation: Reels averaged 1.8x median engagement.",
  `C: no double period: got "${resWithPunc[0].directionReasoning}"`
);

// D. Empty observedFact uses the exact safe fallback.
const signalMapEmptyFact = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 85,
    confidence: 90,
    trend: 'stable',
    directionImplication: '',
    evidence: [], // empty
  }]
]);
const resEmptyFact = parseIdeaOutput(rawInput, signalMapEmptyFact, 'TestCreator');
assert(
  resEmptyFact[0].directionReasoning === "This direction expands on an active content signal from the analyzed content set to propose a tutorial format focused on testing patterns.",
  'D: empty observedFact uses fallback'
);

// E. rising trend produces rising-momentum semantics.
const signalRising = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'rising',
    evidence: [],
  }]
]);
const resRising = parseIdeaOutput(rawInput, signalRising, 'TestCreator');
assert(
  resRising[0].whyNow.includes('shows rising momentum'),
  `E: rising trend matches: got "${resRising[0].whyNow}"`
);

// F. stable trend produces stable/consistent semantics.
const signalStable = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'stable',
    evidence: [],
  }]
]);
const resStable = parseIdeaOutput(rawInput, signalStable, 'TestCreator');
assert(
  resStable[0].whyNow.includes('shows stable, consistent performance'),
  `F: stable trend matches: got "${resStable[0].whyNow}"`
);

// G. falling trend explicitly preserves declining momentum.
const signalFalling = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'falling',
    evidence: [],
  }]
]);
const resFalling = parseIdeaOutput(rawInput, signalFalling, 'TestCreator');
assert(
  resFalling[0].whyNow.includes('is showing declining momentum'),
  `G: falling trend matches: got "${resFalling[0].whyNow}"`
);

// H. unknown trend explicitly states unresolved momentum and is NOT described as baseline/stable.
const signalUnknown = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'unknown',
    evidence: [],
  }]
]);
const resUnknown = parseIdeaOutput(rawInput, signalUnknown, 'TestCreator');
assert(
  resUnknown[0].whyNow.includes('does not yet have a resolved momentum trend in the analyzed content set'),
  `H: unknown trend matches: got "${resUnknown[0].whyNow}"`
);
assert(!resUnknown[0].whyNow.includes('baseline') && !resUnknown[0].whyNow.includes('stable'), 'H: unknown trend is not described as baseline/stable');

// I. strength >= 80 maps to high-strength.
const signalHigh = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 85,
    confidence: 90,
    trend: 'rising',
    evidence: [],
  }]
]);
const resHigh = parseIdeaOutput(rawInput, signalHigh, 'TestCreator');
assert(resHigh[0].whyNow.includes('high-strength'), 'I: strength >= 80 is high-strength');

// J. strength 60-79 maps to moderate-strength.
const signalMod = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 75,
    confidence: 90,
    trend: 'rising',
    evidence: [],
  }]
]);
const resMod = parseIdeaOutput(rawInput, signalMod, 'TestCreator');
assert(resMod[0].whyNow.includes('moderate-strength'), 'J: strength 60-79 is moderate-strength');

// K. strength < 60 maps to developing.
const signalLow = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 55,
    confidence: 90,
    trend: 'rising',
    evidence: [],
  }]
]);
const resLow = parseIdeaOutput(rawInput, signalLow, 'TestCreator');
assert(resLow[0].whyNow.includes('developing'), 'K: strength < 60 is developing');

// L. confidence percentage is not exposed in reconstructed prose.
assert(!resRising[0].whyNow.includes('90%') && !resRising[0].whyNow.includes('90'), 'L: confidence percentage is not exposed');

// M, N, O, P. Signal interpretation/derivation fields are not copied.
const signalWithInterpret = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'DisplayNameValue',
    strength: 80,
    confidence: 90,
    trend: 'rising',
    creatorTrait: 'CreatorTraitValue',
    audienceBehavior: 'AudienceBehaviorValue',
    directionImplication: 'DirectionImplicationValue',
    evidence: [{ fact: 'ObservedFactValue' }],
  }]
]);
const resInterpret = parseIdeaOutput(rawInput, signalWithInterpret, 'TestCreator')[0];
assert(!resInterpret.directionReasoning.includes('CreatorTraitValue') && !resInterpret.whyNow.includes('CreatorTraitValue'), 'M: creatorTrait is not copied');
assert(!resInterpret.directionReasoning.includes('AudienceBehaviorValue') && !resInterpret.whyNow.includes('AudienceBehaviorValue'), 'N: audienceBehavior is not copied');
assert(!resInterpret.directionReasoning.includes('DirectionImplicationValue') && !resInterpret.whyNow.includes('DirectionImplicationValue'), 'O: directionImplication is not copied');
assert(!resInterpret.directionReasoning.includes('at least 10 chars') && !resInterpret.whyNow.includes('at least 10 chars'), 'P: derivationBasis is not copied');

// Q. Existing autobiography guard still rejects known fabricated-biography fixtures.
assert(containsAutobiographyClaim('My 1-Rule System to Beat Procrastination'), 'Q: static autobiography check works');
assert(containsAutobiographyClaim('Deepanshi developed a productivity method', 'Deepanshi'), 'Q: dynamic autobiography check works');

// R. Existing epistemic guard still rejects known audience-state/pain-point fixtures.
assert(containsEpistemicViolation('This resonates deeply with the audience'), 'R: epistemic violation check works');
assert(containsEpistemicViolation("addresses the audience's pain point"), 'R: pain point check works');

// S. primarySignalRef provenance remains enforced.
try {
  parseIdeaOutput(
    { candidates: [{ ...rawInput.candidates[0], primarySignalRef: '' }] },
    signalRefMap,
    'TestCreator'
  );
  assert(false, 'S: empty primarySignalRef should fail');
} catch (e) {
  assert(true, 'S: empty primarySignalRef threw expected error');
}

try {
  parseIdeaOutput(
    { candidates: [{ ...rawInput.candidates[0], primarySignalRef: 'sig_999' }] },
    signalRefMap,
    'TestCreator'
  );
  assert(false, 'S: unresolvable primarySignalRef should fail');
} catch (e) {
  assert(true, 'S: unresolvable primarySignalRef threw expected error');
}

// T. supportingSignalRefs provenance remains preserved.
try {
  parseIdeaOutput(
    { candidates: [{ ...rawInput.candidates[0], supportingSignalRefs: ['sig_999'] }] },
    signalRefMap,
    'TestCreator'
  );
  assert(false, 'T: unresolvable supportingSignalRefs should fail');
} catch (e) {
  assert(true, 'T: unresolvable supportingSignalRefs threw expected error');
}

console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
