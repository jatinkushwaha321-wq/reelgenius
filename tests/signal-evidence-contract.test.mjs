import { intelligenceOutputSchema } from '../src/lib/validations/intelligence.js';

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

console.log('\n=== SIGNAL EVIDENCE CONTRACT BEHAVIORAL TEST ===\n');

const getBaseValidPayload = () => ({
  creatorContext: {
    niche: 'Tech',
    subNiches: ['Coding'],
    contentPillars: [{ name: 'Tutorials', description: 'Tech tutorials', percentage: 100 }],
    audiencePersona: {
      behaviorProfile: 'Engages with code.',
      interests: [],
      painPoints: []
    },
    brandIdentity: {
      tone: ['Professional'],
      vocabulary: [],
      values: [],
      uniqueSellingPoints: []
    },
    postingFrequency: 'Weekly',
    aiSummary: 'A tech creator.',
    strategicDirection: 'Lean into specific technical explanations while maintaining a supportive tone.'
  },
  signals: []
});

const getValidSignal = () => ({
  existingKey: null,
  displayName: 'Reels Outperform Images',
  category: 'content-format',
  strength: 85,
  confidence: 90,
  creatorTrait: 'Posts mostly reels',
  audienceBehavior: 'Higher engagement on reels',
  directionImplication: 'Lean into reels',
  evidence: [
    {
      type: 'metric',
      ref: 'post_001',
      fact: 'Has 50k views',
      metrics: { views: 50000 }
    }
  ]
});

// CASE A — VALID SIGNAL EVIDENCE
try {
  const payload = getBaseValidPayload();
  payload.signals.push(getValidSignal());
  
  const validation = intelligenceOutputSchema.safeParse(payload);
  assert(validation.success, 'CASE A: Valid Signal with evidence passes schema validation');
} catch (err) {
  assert(false, 'CASE A: Valid Signal threw an unexpected error');
}

// CASE B — OMITTED SIGNAL EVIDENCE
try {
  const payload = getBaseValidPayload();
  const sig = getValidSignal();
  delete sig.evidence;
  payload.signals.push(sig);
  
  const validation = intelligenceOutputSchema.safeParse(payload);
  assert(!validation.success, 'CASE B: Signal with omitted evidence is rejected');
  
  if (!validation.success) {
    const hasEvidenceError = validation.error.issues.some(
      (issue) => issue.path.includes('evidence') || issue.message.includes('Expected array') || issue.message.includes('Required')
    );
    assert(hasEvidenceError, 'CASE B: Rejection is specifically due to the evidence field missing');
  }
} catch (err) {
  assert(false, 'CASE B: Omitted evidence threw an unexpected error');
}

// CASE C — EMPTY SIGNAL EVIDENCE
try {
  const payload = getBaseValidPayload();
  const sig = getValidSignal();
  sig.evidence = [];
  payload.signals.push(sig);
  
  const validation = intelligenceOutputSchema.safeParse(payload);
  assert(!validation.success, 'CASE C: Signal with empty evidence array is rejected');
  
  if (!validation.success) {
    const hasMinError = validation.error.issues.some(
      (issue) => issue.path.includes('evidence') && (issue.message.includes('at least 1') || issue.code === 'too_small')
    );
    assert(hasMinError, 'CASE C: Rejection is specifically due to minimum array length');
  }
} catch (err) {
  assert(false, 'CASE C: Empty evidence threw an unexpected error');
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
