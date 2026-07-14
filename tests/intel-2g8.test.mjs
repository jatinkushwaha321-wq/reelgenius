/**
 * INTEL-2G.8 — Updated tests for Candidate Copy Epistemic Boundary
 * after INTEL-2G FINAL field-role narrowing.
 *
 * Groups 2/3 (universal/collective, outcome/efficacy) now apply ONLY to
 * reasoning fields (noveltyReason, derivationBasis). Creative copy fields
 * (title, hook, concept, topic) are checked only against Group 1 (NIVO
 * intelligence violations).
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import { containsEpistemicViolation } from '../src/lib/validations/ideas-generation.js';

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

console.log('\n=== INTEL-2G.8 EPISTEMIC BOUNDARY TESTS (post field-role narrowing) ===\n');

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

// === SECTION 1: REASONING-FIELD REJECTS (Groups 2/3 in noveltyReason/derivationBasis) ===
console.log('--- Reasoning-field rejects (Groups 2/3) ---');

const reasoningRejects = [
  { field: 'noveltyReason', text: "We've all been there, so this is novel." },
  { field: 'noveltyReason', text: "Everyone knows this feeling among devs." },
  { field: 'noveltyReason', text: "All programmers experience this problem." },
  { field: 'noveltyReason', text: "Developers always make this mistake." },
  { field: 'derivationBasis', text: "This framework lands interviews reliably." },
  { field: 'derivationBasis', text: "This format doubles engagement based on patterns." },
  { field: 'derivationBasis', text: "This approach beats ATS screening processes." },
];

reasoningRejects.forEach(({ field, text }, i) => {
  const input = { candidates: [makeCandidate({ [field]: text })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `REASONING REJECT ${i+1}: "${text}" in [${field}]`);
});

// === SECTION 2: GLOBAL REJECTS (Group 1 — NIVO intelligence in any field) ===
console.log('\n--- Global NIVO intelligence rejects (Group 1) ---');

const globalRejects = [
  { field: 'title', text: "Your Audience Loves Git Content" },
  { field: 'hook', text: "This Format Will Go Viral" },
  { field: 'concept', text: "This concept resonates deeply with the audience and builds community building momentum." },
  { field: 'noveltyReason', text: "This resonates deeply with the audience" },
  { field: 'title', text: "Guaranteed Engagement With This One Trick" },
];

globalRejects.forEach(({ field, text }, i) => {
  let content = text;
  if (field === 'concept' && content.length < 20) content = content.padEnd(21, ' ');
  const input = { candidates: [makeCandidate({ [field]: content })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `GLOBAL REJECT ${i+1}: "${text}" in [${field}]`);
});

// === SECTION 3: CREATIVE-COPY ALLOWS (Groups 2/3 in title/hook — now allowed) ===
console.log('\n--- Creative-copy allows (Groups 2/3 now allowed in creative fields) ---');

const creativeAllows = [
  "3 Things Tech Recruiters Immediately Look For",
  "Build a Resume That Beats ATS",
  "The Resume Framework That Lands Interviews",
  "The Git Mistake Every Beginner Makes",
  "We've All Been There: Debugging Edition",
  "A resume that passes ATS screening",
  "Make recruiters notice you with this trick",
];

creativeAllows.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `CREATIVE ALLOW ${i+1}: "${title}" should be allowed in title`);
});

// === SECTION 4: EXISTING ALLOW FIXTURES (unchanged) ===
console.log('\n--- Existing allow fixtures ---');

const existingAllows = [
  "POV: When your code works locally but fails in production",
  "That moment when one typo breaks the build",
  "A resume can be easier to scan with clearer bullet points",
  "4 ways to improve resume clarity",
  "Tips for writing ATS-aware resume bullets",
  "This may help improve discoverability",
  "Why I prefer rebase over merge",
  "My take on REST vs GraphQL",
  "REST vs GraphQL: when to use each",
  "A common debugging scenario developers encounter",
];

existingAllows.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `EXISTING ALLOW ${i+1}: "${title}"`);
});

// === SECTION 5: containsEpistemicViolation union backward compat ===
console.log('\n--- containsEpistemicViolation backward compatibility ---');
assert(containsEpistemicViolation('This resonates deeply with the audience'), 'COMPAT 1: Group 1 detected by union');
assert(containsEpistemicViolation("addresses the audience's pain point"), 'COMPAT 2: Group 1 pain point detected by union');
assert(containsEpistemicViolation("Every developer struggles with this"), 'COMPAT 3: Group 2 detected by union');
assert(containsEpistemicViolation("This format lands interviews"), 'COMPAT 4: Group 3 detected by union');

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
