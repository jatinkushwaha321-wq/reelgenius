/**
 * INTEL-2G.4 — Focused local test suite.
 */

import fs from 'fs';
import path from 'path';
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

console.log('\n=== INTEL-2G.4 CANDIDATE-SPECIFIC REASONING TESTS ===\n');

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

const makeRawInput = (overrides = {}) => ({
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
    ...overrides,
  }],
});

// 1. Two candidates sharing the SAME primarySignalRef but using DIFFERENT topics produce different directionReasoning strings.
const inputTopic1 = makeRawInput({ topic: 'first topic' });
const inputTopic2 = makeRawInput({ topic: 'second topic' });
const resT1 = parseIdeaOutput(inputTopic1, signalRefMap, 'TestCreator')[0];
const resT2 = parseIdeaOutput(inputTopic2, signalRefMap, 'TestCreator')[0];
assert(resT1.directionReasoning !== resT2.directionReasoning, '1: different topics produce different directionReasoning');
assert(resT1.directionReasoning.includes('first topic') && resT2.directionReasoning.includes('second topic'), '1: reasoning includes the topic values');

// 2. Two candidates sharing the SAME primarySignalRef but using DIFFERENT formats produce different directionReasoning strings.
const inputFormat1 = makeRawInput({ format: 'tutorial' });
const inputFormat2 = makeRawInput({ format: 'pov' });
const resF1 = parseIdeaOutput(inputFormat1, signalRefMap, 'TestCreator')[0];
const resF2 = parseIdeaOutput(inputFormat2, signalRefMap, 'TestCreator')[0];
assert(resF1.directionReasoning !== resF2.directionReasoning, '2: different formats produce different directionReasoning');
assert(resF1.directionReasoning.includes('tutorial') && resF2.directionReasoning.includes('pov'), '2: reasoning includes the format values');

// 3. directionReasoning includes the verified observedFact when evidence exists.
assert(resT1.directionReasoning.includes('Reels averaged 1.8x median engagement'), '3: directionReasoning includes verified observedFact');

// 4. directionReasoning identifies format as proposed content structure rather than observed fact.
assert(resT1.directionReasoning.includes('propose a tutorial format'), '4: identifies format as proposed content structure');

// 5. directionReasoning identifies topic as the proposed focus rather than observed audience demand.
assert(resT1.directionReasoning.includes('focused on first topic'), '5: identifies topic as proposed focus');

// 6. Empty/malformed signal evidence triggers the deterministic fallback.
const signalMapEmpty = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'stable',
    evidence: [],
  }]
]);
const resFallback = parseIdeaOutput(makeRawInput({ topic: 'fallback topic', format: 'pov' }), signalMapEmpty, 'TestCreator')[0];
assert(
  resFallback.directionReasoning === "This direction expands on an active content signal from the analyzed content set to propose a pov format focused on fallback topic.",
  `6: fallback format and topic interpolation works: got "${resFallback.directionReasoning}"`
);

// 7. No double terminal punctuation occurs when observedFact already ends with ".", "!", "?"
const signalMapPunc1 = new Map([['sig_001', { key: 'test', displayName: 'Test', strength: 80, confidence: 90, trend: 'stable', evidence: [{ fact: 'engagement.' }] }]]);
const signalMapPunc2 = new Map([['sig_001', { key: 'test', displayName: 'Test', strength: 80, confidence: 90, trend: 'stable', evidence: [{ fact: 'engagement!' }] }]]);
const signalMapPunc3 = new Map([['sig_001', { key: 'test', displayName: 'Test', strength: 80, confidence: 90, trend: 'stable', evidence: [{ fact: 'engagement?' }] }]]);

const resP1 = parseIdeaOutput(makeRawInput({ topic: 'topic.' }), signalMapPunc1, 'TestCreator')[0];
const resP2 = parseIdeaOutput(makeRawInput({ topic: 'topic!' }), signalMapPunc2, 'TestCreator')[0];
const resP3 = parseIdeaOutput(makeRawInput({ topic: 'topic?' }), signalMapPunc3, 'TestCreator')[0];

assert(!resP1.directionReasoning.includes('..') && resP1.directionReasoning.endsWith('.'), '7: period normalization: ends in single period');
assert(!resP2.directionReasoning.includes('!.') && resP2.directionReasoning.endsWith('.'), '7: exclamation normalization: ends in single period');
assert(!resP3.directionReasoning.includes('?.') && resP3.directionReasoning.endsWith('.'), '7: question normalization: ends in single period');

// 8. Existing deterministic whyNow reconstruction remains unchanged.
assert(resT1.whyNow === 'Derived from a high-strength content signal that shows rising momentum relative to the analyzed content set.', '8: whyNow remains correct');

// 9. Existing autobiography regression tests still pass.
assert(containsAutobiographyClaim('My Unfiltered Truth: What it costs'), '9: autobiography fixture My Unfiltered Truth caught');
assert(!containsAutobiographyClaim('POV: When You Debug at 2 AM'), '9: POV matches pass');

// 10. Existing epistemic/pain-point regression tests still pass.
assert(containsEpistemicViolation('This resonates deeply with the audience'), '10: epistemic check works');

// 11. The user-facing Ideas candidate card label is exactly "Signal context".
const ideasPagePath = path.join(process.cwd(), 'src/app/dashboard/ideas/page.js');
const pageContent = fs.readFileSync(ideasPagePath, 'utf8');
assert(pageContent.includes('Signal context'), '11: page label renamed to "Signal context"');
assert(!pageContent.includes('<span className="text-[9px] tracking-[0.15em] uppercase text-white/30">Why now</span>'), '11: old "Why now" span is removed');

// 12. No provider contract field was added.
const generationSchemaPath = path.join(process.cwd(), 'src/lib/validations/ideas-generation.js');
const schemaContent = fs.readFileSync(generationSchemaPath, 'utf8');
assert(!schemaContent.includes('directionReasoning:'), '12: directionReasoning not in validation schema');
assert(!schemaContent.includes('whyNow:'), '12: whyNow not in validation schema');

console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
