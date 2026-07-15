import { parseIntelligenceOutput } from '../src/lib/intelligence/parse-intelligence-output.js';

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

// ---------------------------------------------------------
// Helper to build a valid base payload with strategicDirection
// ---------------------------------------------------------
function createSDPayload(phrase) {
  return {
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
      strategicDirection: phrase
    },
    signals: [
      {
        existingKey: null,
        displayName: 'Reels Outperform Images',
        category: 'content-format',
        strength: 85,
        confidence: 90,
        creatorTrait: 'Posts mostly reels',
        audienceBehavior: 'Higher engagement on reels',
        directionImplication: 'Lean into reels',
        evidence: [
          { type: 'metric', ref: 'post_001', fact: 'Has 50k views', metrics: { views: 50000 } },
          { type: 'metric', ref: 'post_002', fact: 'Has 40k views', metrics: { views: 40000 } }
        ]
      }
    ]
  };
}

const refMap = new Map([
  ['post_001', { type: 'content', id: 'cid1' }],
  ['post_002', { type: 'content', id: 'cid2' }],
]);

function testScheduleGuard(phrase, expectRejection, label) {
  const payload = createSDPayload(phrase);
  let rejected = false;
  let category = null;
  try {
    parseIntelligenceOutput(payload, refMap, 'full', new Map());
  } catch (err) {
    if (err.code === 'EPISTEMIC_VIOLATION') {
      rejected = true;
      category = err.violationCategory;
    }
  }

  if (expectRejection) {
    assert(rejected, `${label} (should reject)`);
    if (rejected) {
      assert(category === 'strategic-direction-schedule-recommendation', `${label} correct category`);
    }
  } else {
    assert(!rejected, `${label} (should NOT reject)`);
  }
  return category;
}

console.log('\n=== STRATEGIC DIRECTION SCHEDULE GUARD TESTS ===\n');

// --- REJECTION CASES ---
console.log('--- Schedule Rejection Cases ---\n');

testScheduleGuard('Post around 16:00 UTC.', true, 'R1: "Post around 16:00 UTC."');
testScheduleGuard('Maintain the 16:00 UTC posting time.', true, 'R2: "Maintain the 16:00 UTC posting time."');
testScheduleGuard('The weekday posting schedule should be maintained.', true, 'R3: "The weekday posting schedule should be maintained."');
testScheduleGuard('Continue posting on Tuesdays and Thursdays.', true, 'R4: "Continue posting on Tuesdays and Thursdays."');
testScheduleGuard('Publish at 6 PM for stronger engagement.', true, 'R5: "Publish at 6 PM for stronger engagement."');
testScheduleGuard('Keep posting every 2 days.', true, 'R6: "Keep posting every 2 days."');
testScheduleGuard('Maintain the current posting cadence.', true, 'R7: "Maintain the current posting cadence."');
testScheduleGuard('The creator should post on weekdays.', true, 'R8: "The creator should post on weekdays."');
testScheduleGuard('Schedule Reels for 4 PM.', true, 'R9: "Schedule Reels for 4 PM."');

// --- ACCEPTANCE CASES ---
console.log('\n--- Schedule Acceptance Cases ---\n');

testScheduleGuard('Posts were predominantly published around 16:00 UTC.', false, 'A1: "Posts were predominantly published around 16:00 UTC."');
testScheduleGuard('The observed posting median was 2.05 days.', false, 'A2: "The observed posting median was 2.05 days."');
testScheduleGuard('76.7% of observed posts were published on weekdays.', false, 'A3: "76.7% of observed posts were published on weekdays."');
testScheduleGuard('The creator has historically posted on Tuesdays and Thursdays.', false, 'A4: "The creator has historically posted on Tuesdays and Thursdays."');
testScheduleGuard('Observed content was published approximately every 4-5 days.', false, 'A5: "Observed content was published approximately every 4-5 days."');
testScheduleGuard('The current evidence favors concise technical Reels.', false, 'A6: "The current evidence favors concise technical Reels."');
testScheduleGuard('A defensible direction is to prioritize technical explanations.', false, 'A7: "A defensible direction is to prioritize technical explanations."');

// --- LIVE FAILURE SENTENCE ---
console.log('\n--- Live Failure Sentence ---\n');

testScheduleGuard(
  'The consistent weekday posting schedule around 16:00 UTC should be maintained as it aligns with observed engagement patterns.',
  true,
  'LIVE: rejects actual live Gemini sentence'
);

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
