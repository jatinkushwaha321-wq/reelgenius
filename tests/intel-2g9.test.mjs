/**
 * INTEL-2G.9 — Final Field-Role Hygiene Verification Suite.
 *
 * Tests the complete approved architecture:
 * - Group 1 (NIVO intelligence) → GLOBAL across all fields
 * - Groups 2/3 (universal/collective, outcome/efficacy) → reasoning-only
 * - Fabricated source/statistics → GLOBAL
 * - Autobiography/ownership → unchanged
 * - Safe numeric/educational content → allowed
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import {
  containsNivoIntelligenceViolation,
  containsReasoningEpistemicViolation,
  containsEpistemicViolation,
} from '../src/lib/validations/ideas-generation.js';

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

console.log('\n=== INTEL-2G.9 FINAL FIELD-ROLE HYGIENE TESTS ===\n');

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
    derivationBasis: 'Observed content-performance pattern in tech education Reels warrants a focused direction.',
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

// ===================================================================
// SECTION 1: CREATIVE-COPY FREEDOM (title/hook — Groups 2/3 allowed)
// ===================================================================
console.log('--- Creative-copy freedom (title/hook) ---');

const creativeFreedomTitles = [
  "3 Things Tech Recruiters Immediately Look For",
  "Build a Resume That Beats ATS",
  "The Resume Framework That Lands Interviews",
  "The Git Mistake Every Beginner Makes",
  "Why Your API Keeps Breaking",
  "Stop Doing This in Your Side Projects",
  "You're Probably Using PATCH Wrong",
  // Educational/career safe:
  "How to Prepare for a Google Interview",
  "A Method for Improving Interview Preparation",
  "Tips to Help Prepare for Your First Internship",
  "A Strategy for Job Applications",
  "How Developers Can Prepare for Technical Interviews",
  "POV: You finally get the interview call",
];

creativeFreedomTitles.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `CREATIVE ALLOW ${i+1}: title="${title}"`);
});

// Hook-level creative freedom
const creativeFreedomHooks = [
  "Why Your API Keeps Breaking",
  "Stop Doing This in Your Side Projects",
  "You're Probably Using PATCH Wrong",
];

creativeFreedomHooks.forEach((hook, i) => {
  const input = { candidates: [makeCandidate({ hook })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `CREATIVE HOOK ALLOW ${i+1}: hook="${hook}"`);
});

// ===================================================================
// SECTION 2: GLOBAL NIVO INTELLIGENCE REJECTS (title/hook — Group 1)
// ===================================================================
console.log('\n--- Global NIVO intelligence rejects in title/hook ---');

const globalRejectTitles = [
  { field: 'title', text: "Your Audience Loves Git Content" },
  { field: 'hook', text: "This Format Will Go Viral for Sure" },
  { field: 'title', text: "Guaranteed Engagement With This Format" },
];

globalRejectTitles.forEach(({ field, text }, i) => {
  const input = { candidates: [makeCandidate({ [field]: text })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `GLOBAL TITLE/HOOK REJECT ${i+1}: "${text}" in [${field}]`);
});

// ===================================================================
// SECTION 3: REASONING-ONLY REJECTS (noveltyReason/derivationBasis)
// ===================================================================
console.log('\n--- Reasoning-only rejects (Groups 2/3) ---');

const reasoningRejects = [
  { field: 'noveltyReason', text: "Every developer struggles with this problem in practice." },
  { field: 'derivationBasis', text: "This format doubles engagement across observed tech content patterns." },
  { field: 'noveltyReason', text: "This framework lands interviews based on audience needs." },
  { field: 'derivationBasis', text: "This approach beats ATS screening processes effectively." },
];

reasoningRejects.forEach(({ field, text }, i) => {
  const input = { candidates: [makeCandidate({ [field]: text })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `REASONING REJECT ${i+1}: "${text}" in [${field}]`);
});

// ===================================================================
// SECTION 4: FABRICATED SOURCE / STATISTICS (GLOBAL REJECT)
// ===================================================================
console.log('\n--- Fabricated source/statistics global rejects ---');

const fabricatedRejects = [
  { field: 'title', text: "According to Google, 93% of Resumes Fail Because of This" },
  { field: 'hook', text: "Research shows 87% of developers make this mistake" },
  { field: 'concept', text: "Studies prove 9 out of 10 developers fail at this. This is a concept that addresses that with 90% of programmers in mind and enough padding." },
];

fabricatedRejects.forEach(({ field, text }, i) => {
  const input = { candidates: [makeCandidate({ [field]: text })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `FABRICATED REJECT ${i+1}: "${text.slice(0,60)}..." in [${field}]`);
});

// ===================================================================
// SECTION 5: SAFE NUMERIC / EDUCATIONAL CONTENT (ALLOW)
// ===================================================================
console.log('\n--- Safe numeric/educational allows ---');

const safeNumeric = [
  "3 Resume Mistakes to Review",
  "HTTP 404 vs 500",
  "A 30-Day Learning Plan",
  "Top 3 Git Commands to Learn",
  "5 Ways to Improve Resume Clarity",
];

safeNumeric.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, signalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `SAFE NUMERIC ${i+1}: "${title}"`);
});

// ===================================================================
// SECTION 6: AUTOBIOGRAPHY REGRESSION (unchanged)
// ===================================================================
console.log('\n--- Autobiography regression ---');

const autobioRejects = [
  "I Used This Method to Get Hired at Google",
  "I Followed This Strategy to Land My First Internship",
  "I Used These Tips to Get My First Job",
  "How I Got Hired at Microsoft",
  "How I Landed My First Internship",
  "The Strategy I Used to Get a Job",
  "My Weekly Habit Tracker",
  "The Workflow I Use for Every Reel",
  "How I overcame burnout",
];

autobioRejects.forEach((title, i) => {
  const input = { candidates: [makeCandidate({ title })] };
  let dropped = false;
  try { parseIdeaOutput(input, signalRefMap, 'TestCreator'); } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `AUTOBIO REJECT ${i+1}: "${title}"`);
});

// ===================================================================
// SECTION 7: UNIT-LEVEL FUNCTION VERIFICATION
// ===================================================================
console.log('\n--- Unit-level function verification ---');

// containsNivoIntelligenceViolation
assert(containsNivoIntelligenceViolation('audience loves this'), 'UNIT 1: Group 1 detected by NIVO fn');
assert(containsNivoIntelligenceViolation('viral potential here'), 'UNIT 2: Group 1 viral detected');
assert(!containsNivoIntelligenceViolation('Build a Resume That Beats ATS'), 'UNIT 3: Group 3 NOT detected by NIVO fn');
assert(!containsNivoIntelligenceViolation('Every developer struggles'), 'UNIT 4: Group 2 NOT detected by NIVO fn');
assert(containsNivoIntelligenceViolation('According to Google, 93% of resumes fail'), 'UNIT 5: Fabricated stats detected by NIVO fn');
assert(!containsNivoIntelligenceViolation('3 Resume Mistakes to Review'), 'UNIT 6: Safe number NOT detected by NIVO fn');

// containsReasoningEpistemicViolation
assert(containsReasoningEpistemicViolation('Every developer struggles with this'), 'UNIT 7: Group 2 detected by reasoning fn');
assert(containsReasoningEpistemicViolation('This format lands interviews'), 'UNIT 8: Group 3 detected by reasoning fn');
assert(!containsReasoningEpistemicViolation('audience loves this'), 'UNIT 9: Group 1 NOT detected by reasoning fn');

// containsEpistemicViolation (union — backward compat)
assert(containsEpistemicViolation('audience loves this'), 'UNIT 10: union catches Group 1');
assert(containsEpistemicViolation('Every developer struggles with this'), 'UNIT 11: union catches Group 2');
assert(containsEpistemicViolation('This format lands interviews'), 'UNIT 12: union catches Group 3');

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
