/**
 * INTEL-2H.1 — Cross-Niche Regression Coverage Suite.
 *
 * Tests the INTEL-2G architecture's domain-agnostic portability.
 * Architecture intentionally uses:
 * 1. requiresPersonalFact as the PRIMARY semantic autobiography gateway.
 * 2. AUTOBIOGRAPHY_PATTERNS as SECONDARY bounded deterministic hygiene.
 * 
 * Note: AUTOBIOGRAPHY_PATTERNS is explicitly bounded secondary hygiene. 
 * It is not treated as semantic completeness and should not be expanded 
 * into a niche vocabulary catalogue.
 */

import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import {
  containsAutobiographyClaim,
  containsNivoIntelligenceViolation,
  containsReasoningEpistemicViolation,
  ideaCandidateSchema
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

console.log('\n=== INTEL-2H.1 CROSS-NICHE PORTABILITY TESTS ===\n');

// Standard signal for creative copy tests
const standardSignalRefMap = new Map();
standardSignalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
  evidence: [{ fact: 'Test evidence facts' }]
});

function makeCandidate(overrides = {}) {
  return {
    requiresPersonalFact: false,
    primarySignalRef: 'sig_001',
    derivationBasis: 'Observed content-performance pattern warrants a focused direction.',
    title: 'A Valid Idea Title For Testing',
    topic: 'testing patterns',
    concept: 'This is a complete concept description that is long enough to pass the minimum character validation threshold.',
    format: 'tutorial',
    contentPillar: 'Education',
    hook: 'Ever wondered why this matters?',
    supportingSignalRefs: ['sig_001'],
    noveltyReason: 'This differs from existing content by focusing on specifics.',
    ...overrides,
  };
}

// ===================================================================
// SECTION 3: SAFE CREATIVE COPY REGRESSION
// ===================================================================
console.log('--- Safe Creative Copy Regression ---');

const safeFixtures = [
  // FITNESS
  "3 Ways to Improve Squat Bracing",
  "POV: You Forget Which Set You're On",
  // SKINCARE
  "Retinol vs Retinal: What's the Difference?",
  "A Skincare Layering Mistake to Watch For",
  // PERSONAL FINANCE
  "SIP vs Lump Sum: When Does Each Approach Make Sense?",
  "A Budget Can Be Easier to Review with Clear Categories",
  // FOOD
  "A Simple Method for Crispier Potatoes",
  "That Moment When Your Sauce Finally Emulsifies",
  // CINEMATOGRAPHY
  "Why Your Grade Can Look Muddy After Adding Contrast",
  "Tips for Choosing a Focal Length",
  // FASHION
  "3 Ways to Balance an Oversized Silhouette",
  "A Simple Outfit Formula for Neutral Colors",
  // TRAVEL
  "How to Plan a 5-Day Japan Itinerary",
  "Ways to Compare Train and Flight Options",
  // STUDY
  "4 Ways to Structure an Exam Revision Week",
  "Active Recall vs Rereading: When to Use Each"
];

safeFixtures.forEach((title, i) => {
  assert(!containsAutobiographyClaim(title, 'TestCreator'), `SAFE AUTO ${i+1}: "${title}"`);
  assert(!containsNivoIntelligenceViolation(title), `SAFE EPISTEMIC ${i+1}: "${title}"`);
  
  // containsReasoningEpistemicViolation should not be strictly forced onto title, 
  // but we verify its behavior is consistent (it shouldn't fire on these educational titles either).
  assert(!containsReasoningEpistemicViolation(title), `SAFE REASONING ${i+1}: "${title}"`);

  const input = { candidates: [makeCandidate({ title })] };
  let passed = false;
  try {
    const res = parseIdeaOutput(input, standardSignalRefMap, 'TestCreator');
    if (res.length === 1) passed = true;
  } catch (e) {}
  assert(passed, `SAFE ALLOW ${i+1}: "${title}"`);
});

// ===================================================================
// SECTION 4: PRIMARY PERSONAL-FACT GATEWAY CONTRACT COVERAGE
// ===================================================================
console.log('\n--- Primary Personal-Fact Gateway Contract Coverage ---');

const gatewayFixtures = [
  "My Exact Push Day",
  "My Acne Transformation",
  "How I Made ₹10 Lakh Investing",
  "My Grandmother's Secret Recipe",
  "The LUT I Use on Every Reel",
  "My Everyday Wardrobe",
  "My Exact Japan Itinerary",
  "How I Scored 95%"
];

gatewayFixtures.forEach((title, i) => {
  // We test that requiresPersonalFact === true causes rejection
  const input = { candidates: [makeCandidate({ title, requiresPersonalFact: true })] };
  let dropped = false;
  try {
    parseIdeaOutput(input, standardSignalRefMap, 'TestCreator');
  } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `PRIMARY GATEWAY REJECT ${i+1}: "${title}"`);
});

// ===================================================================
// SECTION 5: SECONDARY HYGIENE ROLE REGRESSION
// ===================================================================
console.log('\n--- Secondary Hygiene Role Regression ---');

// As documented, AUTOBIOGRAPHY_PATTERNS is bounded secondary hygiene.
// Verify currently protected structural families still reject when requiresPersonalFact is incorrectly false.
const secondaryHygieneFixtures = [
  "The Routine I Use Every Morning",
  "How I Transformed My Body",
  "The Strategy I Use to Beat the Market",
  "My Exact Grading Workflow",
  "My Exact Study Routine"
];

secondaryHygieneFixtures.forEach((title, i) => {
  // requiresPersonalFact is FALSE, but the regex should catch these specific structural patterns.
  const input = { candidates: [makeCandidate({ title, requiresPersonalFact: false })] };
  let dropped = false;
  try {
    parseIdeaOutput(input, standardSignalRefMap, 'TestCreator');
  } catch (e) {
    if (e.code === 'NO_VALID_CANDIDATES') dropped = true;
  }
  assert(dropped, `SECONDARY HYGIENE REJECT ${i+1}: "${title}"`);
});

// ===================================================================
// SECTION 6 & 7: SIGNAL SHAPE AND FORMAT PORTABILITY FIXTURES
// ===================================================================
console.log('\n--- Signal Shape and Format Portability ---');

const nicheMocks = [
  {
    niche: 'fitness',
    format: 'tutorial',
    topic: 'squat bracing',
    signal: {
      key: 'sig_fit',
      displayName: 'Beginner Strength',
      strength: 75,
      confidence: 85,
      trend: 'rising',
      directionImplication: 'Create beginner-focused form guides',
      evidence: [{ fact: 'Beginner strength demonstrations performed well', type: 'fact' }]
    }
  },
  {
    niche: 'skincare',
    format: 'other',
    topic: 'retinol',
    signal: {
      key: 'sig_skin',
      displayName: 'Ingredient Comparison',
      strength: 82,
      confidence: 92,
      trend: 'stable',
      directionImplication: 'Compare active ingredients',
      evidence: [{ fact: 'Ingredient comparison content drove comments', type: 'fact' }]
    }
  },
  {
    niche: 'finance',
    format: 'listicle',
    topic: 'SIP vs Lump Sum',
    signal: {
      key: 'sig_fin',
      displayName: 'Financial Explainers',
      strength: 65,
      confidence: 70,
      trend: 'rising',
      directionImplication: 'Break down complex financial concepts',
      evidence: [{ fact: 'Financial comparison explainers saw high saves', type: 'fact' }]
    }
  },
  {
    niche: 'food',
    format: 'tutorial',
    topic: 'crispy potatoes',
    signal: {
      key: 'sig_food',
      displayName: 'Quick Recipes',
      strength: 90,
      confidence: 95,
      trend: 'rising',
      directionImplication: 'Demonstrate quick techniques',
      evidence: [{ fact: 'Quick recipe demonstrations had high retention', type: 'fact' }]
    }
  },
  {
    niche: 'cinematography',
    format: 'behind-the-scenes',
    topic: 'color grading',
    signal: {
      key: 'sig_cine',
      displayName: 'Before/After Grading',
      strength: 80,
      confidence: 85,
      trend: 'stable',
      directionImplication: 'Show grading transformations',
      evidence: [{ fact: 'Before/after grading content is popular', type: 'fact' }]
    }
  },
  {
    niche: 'fashion',
    format: 'tutorial',
    topic: 'oversized silhouettes',
    signal: {
      key: 'sig_fash',
      displayName: 'Outfit Breakdowns',
      strength: 72,
      confidence: 88,
      trend: 'falling',
      directionImplication: 'Break down outfit proportions',
      evidence: [{ fact: 'Outfit breakdown content is well received', type: 'fact' }]
    }
  },
  {
    niche: 'travel',
    format: 'listicle',
    topic: 'Japan itinerary',
    signal: {
      key: 'sig_trav',
      displayName: 'Itinerary Style',
      strength: 88,
      confidence: 90,
      trend: 'rising',
      directionImplication: 'Provide structured itineraries',
      evidence: [{ fact: 'Itinerary-style travel content performed 2x', type: 'fact' }]
    }
  },
  {
    niche: 'study',
    format: 'storytime',
    topic: 'exam revision',
    signal: {
      key: 'sig_study',
      displayName: 'Practical Study Explainers',
      strength: 78,
      confidence: 82,
      trend: 'unknown',
      directionImplication: 'Explain study frameworks',
      evidence: [{ fact: 'Practical study explainers are highly saved', type: 'fact' }]
    }
  }
];

nicheMocks.forEach((mock, i) => {
  const signalMap = new Map();
  signalMap.set(mock.signal.key, mock.signal);
  
  // Verify format validity in schema
  const formatValid = ideaCandidateSchema.shape.format.safeParse(mock.format).success;
  assert(formatValid, `FORMAT PORTABILITY ${i+1} (${mock.niche}): "${mock.format}" is valid enum`);

  const input = {
    candidates: [
      makeCandidate({
        primarySignalRef: mock.signal.key,
        supportingSignalRefs: [mock.signal.key],
        format: mock.format,
        topic: mock.topic,
      })
    ]
  };

  let res = null;
  try {
    res = parseIdeaOutput(input, signalMap, 'TestCreator')[0];
  } catch (e) {
    console.error(e);
  }

  assert(res !== null, `SIGNAL SHAPE ${i+1} (${mock.niche}): Candidate resolved correctly`);
  
  if (res) {
    assert(res.sourceSignalKeys.includes(mock.signal.key), `  -> Preserved sourceSignalKeys`);
    assert(res.sourceSignalSnapshots.length === 1 && res.sourceSignalSnapshots[0].key === mock.signal.key, `  -> Preserved sourceSignalSnapshots`);
    assert(res.directionReasoning.includes(mock.format) && res.directionReasoning.includes(mock.topic), `  -> Reconstructed directionReasoning domain-neutrally`);
    assert(typeof res.whyNow === 'string' && res.whyNow.length > 0, `  -> Reconstructed whyNow domain-neutrally`);
  }
});

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
