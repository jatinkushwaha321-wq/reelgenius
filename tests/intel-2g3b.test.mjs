/**
 * INTEL-2G.3B — V1 Autobiography Scope Reduction & Observed-Fact Fix test suite.
 */

import { deriveObservedFact } from '../src/lib/ideas/signal-helpers.js';
import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import {
  containsAutobiographyClaim,
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

console.log('\n=== INTEL-2G.3B OBSERVED-FACT & AUTOBIOGRAPHY TESTS ===\n');

// --- A-F. deriveObservedFact tests ---

// A. deriveObservedFact derives a fact from raw Signal.evidence.
const singleEv = [{ fact: 'First evidence item' }];
assert(deriveObservedFact(singleEv) === 'First evidence item', 'A: derives single fact');

// B. Multiple valid evidence facts preserve existing bounded helper semantics.
const multEv = [
  { fact: 'First item' },
  { fact: 'Second item' },
  { fact: 'Third item' },
  { fact: 'Fourth item' } // should be skipped (max 3)
];
assert(deriveObservedFact(multEv) === 'First item; Second item; Third item', 'B: max 3 items and joined with semicolon');

const longFact = 'a'.repeat(150);
assert(deriveObservedFact([{ fact: longFact }]).length === 120, 'B: per-item limit is 120 chars');

// C. Missing evidence returns "".
assert(deriveObservedFact(undefined) === '', 'C: undefined evidence returns ""');

// D. Null evidence returns "".
assert(deriveObservedFact(null) === '', 'D: null evidence returns ""');

// E. Empty evidence returns "".
assert(deriveObservedFact([]) === '', 'E: empty array returns ""');

// F. Malformed evidence items are ignored.
const malformedEv = [
  null,
  { fact: 123 }, // fact not string
  'string-not-object',
  { missingFactField: 'text' },
  { fact: 'Valid fact' }
];
assert(deriveObservedFact(malformedEv) === 'Valid fact', 'F: malformed evidence items ignored');

// --- G-J. Parser directionReasoning tests ---

const signalRefMap = new Map();
signalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
  evidence: [{ fact: 'Observed content metric detail' }]
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

// G. Parser directionReasoning uses raw primarySignalDoc.evidence.
const resG = parseIdeaOutput(rawInput, signalRefMap, 'TestCreator');
assert(
  resG[0].directionReasoning === "This direction expands on an active content signal to propose a tutorial format focused on testing patterns. One supporting observation: Observed content metric detail.",
  'G: directionReasoning matches derived observedFact'
);

// H. Parser does not fall back when valid evidence.fact exists.
assert(!resG[0].directionReasoning.includes('derived from an active content signal identified'), 'H: does not fall back when facts exist');

// I. Parser uses generic fallback when evidence is absent.
const signalMapNoEv = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'stable',
    directionImplication: '',
    evidence: [] // absent
  }]
]);
const resI = parseIdeaOutput(rawInput, signalMapNoEv, 'TestCreator');
assert(
  resI[0].directionReasoning === "This direction expands on an active content signal from the analyzed content set to propose a tutorial format focused on testing patterns.",
  'I: uses fallback when evidence is absent'
);

// J. Parser uses generic fallback when evidence is malformed.
const signalMapMalformedEv = new Map([
  ['sig_001', {
    key: 'test',
    displayName: 'Test',
    strength: 80,
    confidence: 90,
    trend: 'stable',
    directionImplication: '',
    evidence: [{ fact: 123 }] // malformed
  }]
]);
const resJ = parseIdeaOutput(rawInput, signalMapMalformedEv, 'TestCreator');
assert(
  resJ[0].directionReasoning === "This direction expands on an active content signal from the analyzed content set to propose a tutorial format focused on testing patterns.",
  'J: uses fallback when evidence is malformed'
);

// --- K-V. AUTOBIOGRAPHY REJECTION FIXTURES ---

assert(containsAutobiographyClaim('My Unfiltered Truth: What it costs'), 'K: "My Unfiltered Truth: What it costs" rejected');
assert(containsAutobiographyClaim('My Truth About Building in Public'), 'L: "My Truth About Building in Public" rejected');
assert(containsAutobiographyClaim("My 'Building in Public' Reality"), 'M: "My \'Building in Public\' Reality" rejected');
assert(containsAutobiographyClaim('3 Mindset Shifts That Helped Me Break Through'), 'N: "3 Mindset Shifts That Helped Me Break Through" rejected');
assert(containsAutobiographyClaim('The Shift That Guided Me Through Burnout'), 'O: "The Shift That Guided Me Through Burnout" rejected');
assert(containsAutobiographyClaim('Why I Keep Going Despite Late Nights'), 'P: "Why I Keep Going Despite Late Nights" rejected');
assert(containsAutobiographyClaim('I Almost Gave Up Learning Programming'), 'Q: "I Almost Gave Up Learning Programming" rejected');
assert(containsAutobiographyClaim('I Gave Up Learning Programming'), 'R: "I Gave Up Learning Programming" rejected');
assert(containsAutobiographyClaim('I Almost Quit Coding'), 'S: "I Almost Quit Coding" rejected');
assert(containsAutobiographyClaim('I Quit Coding'), 'T: "I Quit Coding" rejected');
assert(containsAutobiographyClaim('The Side I Never Talk About'), 'U: "The Side I Never Talk About" rejected');
assert(containsAutobiographyClaim('The Side of Building in Public I Never Talk About'), 'V: "The Side of Building in Public I Never Talk About" rejected');

// --- W-AA. SAFE CREATIVE FIXTURES ---

assert(!containsAutobiographyClaim('POV: When You Debug at 2 AM'), 'W: "POV: When You Debug at 2 AM" passes');
assert(!containsAutobiographyClaim('Me Thinking My Code Change Is Harmless'), 'X: "Me Thinking My Code Change Is Harmless" passes');
assert(!containsAutobiographyClaim('Why I Prefer Rebase Over Merge'), 'Y: "Why I Prefer Rebase Over Merge" passes');
assert(!containsAutobiographyClaim('When You Finally Fix a Bug You Created Days Ago'), 'Z: "When You Finally Fix a Bug You Created Days Ago" passes');

// AA. Existing valid parser candidate still passes.
assert(resG.length === 1, 'AA: valid candidate still passes parser');

console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
