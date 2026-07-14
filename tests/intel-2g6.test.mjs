/**
 * INTEL-2G.6 — Focused local tests for Evidence-Role Wording & Personal-Fact Gateway.
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import { ideaGenerationOutputSchema } from '../src/lib/validations/ideas-generation.js';

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

console.log('\n=== INTEL-2G.6 EVIDENCE-ROLE & PERSONAL-FACT TESTS ===\n');

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

// G. REQUIRED SCHEMA FIELD
// Omit requiresPersonalFact: should fail schema validation.
const inputWithoutField = {
  candidates: [makeCandidate({ requiresPersonalFact: undefined })]
};
const valResult = ideaGenerationOutputSchema.safeParse(inputWithoutField);
assert(!valResult.success, 'G: Omission of requiresPersonalFact fails schema validation');
if (!valResult.success) {
  const issues = valResult.error.issues;
  assert(issues.some(i => i.path.includes('requiresPersonalFact')), 'G: fails specifically on requiresPersonalFact');
}

// A. PERSONAL FACT TRUE IS REJECTED
const inputWithTrue = {
  candidates: [makeCandidate({
    requiresPersonalFact: true,
    title: 'My Weekly Habit Tracker'
  })]
};
try {
  parseIdeaOutput(inputWithTrue, signalRefMap, 'TestCreator');
  assert(false, 'A: requiresPersonalFact: true candidate did not throw structural error');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'A: requiresPersonalFact: true candidate correctly dropped resulting in empty array error');
}

// B. SITUATIONAL POV REMAINS ALLOWED
const inputPOV = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'POV: When you debug at 2 AM',
    format: 'pov'
  })]
};
const resB = parseIdeaOutput(inputPOV, signalRefMap, 'TestCreator');
assert(resB.length === 1 && resB[0].title === 'POV: When you debug at 2 AM', 'B: situational POV remains allowed');

// C. EXAGGERATED SKIT REMAINS ALLOWED
const inputSkit = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'Me thinking my code change is harmless',
    format: 'pov'
  })]
};
const resC = parseIdeaOutput(inputSkit, signalRefMap, 'TestCreator');
assert(resC.length === 1 && resC[0].title === 'Me thinking my code change is harmless', 'C: exaggerated skit remains allowed');

// D. TECHNICAL OPINION REMAINS ALLOWED
const inputOpinion = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'Why I prefer rebase over merge',
    format: 'talking-head'
  })]
};
const resD = parseIdeaOutput(inputOpinion, signalRefMap, 'TestCreator');
assert(resD.length === 1 && resD[0].title === 'Why I prefer rebase over merge', 'D: technical opinion remains allowed');

// E. GENERAL EDUCATIONAL FRAMEWORK REMAINS ALLOWED
const inputFramework = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'A simple weekly habit tracker for developers',
    concept: 'A video explaining how developers can track consistency without detailing any personal use.',
    format: 'tutorial'
  })]
};
const resE = parseIdeaOutput(inputFramework, signalRefMap, 'TestCreator');
assert(resE.length === 1 && resE[0].title === 'A simple weekly habit tracker for developers', 'E: general educational framework remains allowed');

// F. PROVIDER FALSE DOES NOT BYPASS REGEX HYGIENE
const inputBypass = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    title: 'My Unfiltered Truth: What it costs'
  })]
};
try {
  parseIdeaOutput(inputBypass, signalRefMap, 'TestCreator');
  assert(false, 'F: provider false did not throw structural error on autobiography claim');
} catch (e) {
  assert(e.code === 'NO_VALID_CANDIDATES', 'F: provider false does not bypass static regex hygiene (is dropped)');
}

// H. DIRECTION REASONING USES EXPANSION SEMANTICS
const inputReasoning = {
  candidates: [makeCandidate({
    requiresPersonalFact: false,
    format: 'tutorial',
    topic: 'git workflows'
  })]
};
const resH = parseIdeaOutput(inputReasoning, signalRefMap, 'TestCreator')[0];
assert(resH.directionReasoning.includes('This direction expands on an active content signal to propose a tutorial format focused on git workflows.'), 'H: reasoning contains expands on phrase');
assert(!resH.directionReasoning.includes('This direction applies an active content signal'), 'H: reasoning does not contain old applies phrase');

// I. RAW EVIDENCE PRESENTATION REMAINS UNCHANGED
assert(resH.directionReasoning.endsWith('One supporting observation: Reels averaged 1.8x median engagement.'), 'I: raw evidence presentation follows expected format exactly');

console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
