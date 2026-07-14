/**
 * INTEL-2G.7 — Focused local tests for Creator-Specific Ownership Claim Enforcement.
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import { ideaGenerationOutputSchema } from '../src/lib/validations/ideas-generation.js';

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) {
    pass++;
    console.log(`  ✓ PASS: ${label}`);
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

console.log('\n=== INTEL-2G.7 CREATOR-SPECIFIC OWNERSHIP TESTS ===\n');

// Build a valid signalRefMap
const signalRefMap = new Map();
signalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
  evidence: [{ fact: 'Reels averaged 1.8x median engagement' }]
});

function makeCandidate(overrides = {}) {
  return {
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
  };
}

// 1. REJECT FIXTURES (Mundane Ownership/Use Claims)
const rejects = [
  "My Content Workflow",
  "My DSA Tracking System",
  "My Weekly Routine",
  "My Simple Workflow for Creating Tech Content",
  "The Workflow I Use for Every Reel",
  "The Method I Follow to Learn DSA",
  "How I Organize My Content Workflow",
  "What I Do Before Recording Every Reel",
  "My Strategy for Staying Consistent"
];

rejects.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let dropped = false;
  try {
    parseIdeaOutput(input, signalRefMap, 'TestCreator');
  } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `REJECT ${i+1}: "${title}" should be dropped by hygiene fallback`);
});

// 2. ALLOW FIXTURES (Safe phrasing)
const allows = [
  "My code won't compile",
  "POV: My code works locally",
  "Why I prefer rebase over merge",
  "My take on REST vs GraphQL",
  "A workflow for creating tech content",
  "A simple system for tracking DSA progress",
  "How to organize a content workflow",
  "What to do before recording a Reel",
  "Me checking my code after one tiny change"
];

allows.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1 && res[0].title === title) passed = true;
  } catch (e) {}
  assert(passed, `ALLOW ${i+1}: "${title}" should remain allowed`);
});

// 3. BOOLEAN GATEWAY CHECK
const inputWithTrue = {
  candidates: [makeCandidate({
    requiresPersonalFact: true,
    title: 'A safe title'
  })]
};
try {
  parseIdeaOutput(inputWithTrue, signalRefMap, 'TestCreator');
  assert(false, 'BOOLEAN: requiresPersonalFact: true candidate did not throw structural error');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'BOOLEAN: requiresPersonalFact: true correctly dropped otherwise safe candidate');
}

// 4. SCHEMA VALIDATION CHECK
const inputWithoutField = {
  candidates: [makeCandidate({ requiresPersonalFact: undefined })]
};
const valResult = ideaGenerationOutputSchema.safeParse(inputWithoutField);
assert(!valResult.success, 'SCHEMA: Missing requiresPersonalFact fails candidate validation');

// 5. EXISTING AUTOBIOGRAPHY HYGIENE CHECK
const inputAutobio = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'How I overcame burnout'
  })]
};
let droppedAutobio = false;
try {
  parseIdeaOutput(inputAutobio, signalRefMap, 'TestCreator');
} catch (e) {
  if (e.code === 'NO_VALID_CANDIDATES') droppedAutobio = true;
}
assert(droppedAutobio, 'HYGIENE: Existing autobiography hygiene remains active ("How I overcame burnout")');

// 6. EXISTING POV FIXTURE
const inputPOV = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'POV: When you finally understand pointers',
    format: 'pov'
  })]
};
let passedPOV = false;
try {
  const res = parseIdeaOutput(inputPOV, signalRefMap, 'TestCreator');
  if (res.length === 1) passedPOV = true;
} catch (e) {}
assert(passedPOV, 'HYGIENE: Existing situational POV remains accepted');

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
