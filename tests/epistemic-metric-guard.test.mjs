import { parseIntelligenceOutput } from '../src/lib/intelligence/parse-intelligence-output.js';
import { buildIntelligencePrompt } from '../src/lib/intelligence/build-intelligence-prompt.js';

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
// Helper to build a valid base payload with an injected phrase
// ---------------------------------------------------------
function createTestPayload(fieldPath, phrase) {
  const payload = {
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
      strategicDirection: 'Lean into technical tutorials.'
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
          {
            type: 'metric',
            ref: 'post_001',
            fact: 'Has 50k views',
            metrics: { views: 50000 }
          },
          {
            type: 'metric',
            ref: 'post_002',
            fact: 'Has 40k views',
            metrics: { views: 40000 }
          }
        ]
      }
    ]
  };

  if (fieldPath === 'strategicDirection') {
    payload.creatorContext.strategicDirection = phrase;
  } else if (fieldPath === 'audienceBehavior') {
    payload.signals[0].audienceBehavior = phrase;
  } else if (fieldPath === 'creatorTrait') {
    payload.signals[0].creatorTrait = phrase;
  } else if (fieldPath === 'directionImplication') {
    payload.signals[0].directionImplication = phrase;
  } else if (fieldPath === 'displayName') {
    payload.signals[0].displayName = phrase;
  }

  return payload;
}

const refMap = new Map([
  ['post_001', { type: 'content', id: 'cid1' }],
  ['post_002', { type: 'content', id: 'cid2' }],
]);

function testGuard(fieldPath, phrase, expectRejection, label) {
  const payload = createTestPayload(fieldPath, phrase);
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
  } else {
    assert(!rejected, `${label} (should NOT reject)`);
  }
  return category;
}

console.log('\n=== PARSER UNAVAILABLE-METRIC & EPISTEMIC GUARD TESTS ===\n');

// 1. Rejected metric claims
testGuard('strategicDirection', 'Maintaining this cadence is crucial for consistent audience reach and content discoverability.', true, 'A: rejects "consistent audience reach"');
testGuard('audienceBehavior', 'This format produced higher reach.', true, 'B: rejects "higher reach"');
testGuard('audienceBehavior', 'The post received more impressions.', true, 'C: rejects "more impressions"');
testGuard('audienceBehavior', 'This topic has a high save count.', true, 'D: rejects "high save count"');
testGuard('audienceBehavior', 'This framing drives shares.', true, 'E: rejects "drives shares"');

// directionImplication metric claim rejections
testGuard('directionImplication', 'This format produced higher reach.', true, 'R1: directionImplication rejects "higher reach"');
testGuard('directionImplication', 'This framing drives shares.', true, 'R2: directionImplication rejects "drives shares"');

// 2. Safe lexical cases
testGuard('creatorTrait', 'The creator shares technical insights.', false, 'F: permits "creator shares"');
testGuard('creatorTrait', 'This saves time when explaining the concept.', false, 'G: permits "saves time"');
testGuard('strategicDirection', 'Creators can reach out to peers.', false, 'H: permits "reach out"');

// 3. Existing comment-text dependency intact
const cat = testGuard('audienceBehavior', 'The audience answered the question in comments.', true, 'I: existing comment-text dependency behavior remains intact');
assert(cat === 'comment-text-dependency', 'I: correct rejection category for comment dependency');
const catR3 = testGuard('directionImplication', 'The audience answered the question.', true, 'R3: directionImplication rejects comment text dependency');
assert(catR3 === 'comment-text-dependency', 'R3: correct rejection category for comment dependency');

// 3.5 directionImplication preservation cases
testGuard('directionImplication', 'Continue leaning into technical reels.', false, 'P1: permits "Continue leaning into technical reels."');
testGuard('directionImplication', 'Narrow this content pillar into practical developer topics.', false, 'P2: permits "Narrow this content pillar into practical developer topics."');
testGuard('directionImplication', 'This pattern appears associated with higher observed comment counts.', false, 'P3: permits "This pattern appears associated with higher observed comment counts."');

// Other preservation cases
testGuard('strategicDirection', 'The current evidence favors technical Reels with question-led framing.', false, 'P4: permits "The current evidence favors technical Reels with question-led framing."');
testGuard('strategicDirection', 'A defensible direction is to prioritize concise explanations.', false, 'P5: permits "A defensible direction is to prioritize concise explanations."');
testGuard('creatorTrait', 'The creator shares technical insights.', false, 'P6: permits "The creator shares technical insights."');
testGuard('audienceBehavior', 'Received higher observed play counts on reels.', false, 'P7: permits "Received higher observed play counts on reels."');

// 4. Predictive wording is NOT a parser rejection (it relies on prompt rules)
testGuard('strategicDirection', 'This format will likely resonate strongly.', false, 'J: "will likely resonate strongly" is NOT rejected by the parser (prompt-only)');

// 5. Prompt Contract Assertions
console.log('\n=== PROMPT CALIBRATION TESTS ===\n');

const promptText = buildIntelligencePrompt({
  packet: {},
  existingSignals: [],
  contentTier: 'full',
  outputContract: {}
});

assert(promptText.includes('frame recommendations as evidence-grounded directional choices'), 'Prompt requires evidence-grounded framing');
assert(promptText.includes('The observed signals support leaning toward'), 'Prompt provides acceptable directional examples');
assert(promptText.includes('will resonate'), 'Prompt explicitly blocks "will resonate"');
assert(promptText.includes('will perform'), 'Prompt explicitly blocks "will perform"');
assert(promptText.includes('Do not convert historical correlation into predicted future performance or causal certainty'), 'Prompt explicitly blocks causal certainty overreach');

// C1, C2: Rule 21 explicitly prohibits causal certainty and future performance prediction
assert(promptText.includes('MUST NOT predict future views, play counts, comments, engagement'), 'C2: Rule 21 prohibits future performance prediction');
assert(promptText.includes('MUST NOT claim that a theme causes engagement or drives engagement as an established causal mechanism'), 'C1: Rule 21 prohibits causal certainty');

// C3, C4, C5: Rule 23 displayName semantic contract exists
assert(promptText.includes('SIGNAL DISPLAY NAME BOUNDARY'), 'C3: A semantic contract for displayName exists');
assert(promptText.includes('MAY express an observable pattern') && promptText.includes('calibrated evidence-grounded inference'), 'C4: displayName permits observable pattern or calibrated inference');
assert(promptText.includes('Prefer observable-pattern wording over audience-psychology shorthand'), 'C5: displayName discourages unsupported audience psychology');

// C6: directionImplication is included in scanning
// Proved by test R1/R2/R3 above.

// C7, C8: No generic predictive regex was introduced.
testGuard('directionImplication', 'This pattern drives engagement.', false, 'C8: "drives engagement" is NOT rejected by parser (prompt-only)');

// === DISPLAYNAME SCANNING TESTS ===
console.log('\n=== DISPLAYNAME SCANNING TESTS ===\n');

// D-R: displayName rejection cases (existing guards apply)
testGuard('displayName', 'Audience Reach Increased on Technical Reels', true, 'D-R1: displayName rejects "Audience Reach"');
testGuard('displayName', 'High Save Counts on Career Posts', true, 'D-R2: displayName rejects "High Save Counts"');
testGuard('displayName', 'More Impressions on Reels', true, 'D-R3: displayName rejects "More Impressions"');
const catDA = testGuard('displayName', 'Audience Answered Questions on Technical Posts', true, 'D-R4: displayName rejects "Audience Answered Questions"');
assert(catDA === 'comment-text-dependency', 'D-R4: correct category is comment-text-dependency');

// D-A: displayName acceptance cases
testGuard('displayName', 'Technical Explanations Drive High Engagement', false, 'D-A1: displayName permits "Technical Explanations Drive High Engagement"');
testGuard('displayName', 'Question-Led Framing Shows a Stronger Interaction Pattern', false, 'D-A2: displayName permits "Question-Led Framing Shows a Stronger Interaction Pattern"');
testGuard('displayName', 'Reels as Primary Engagement Format', false, 'D-A3: displayName permits "Reels as Primary Engagement Format"');
testGuard('displayName', 'Motivational & Career Guidance Content Resonates', false, 'D-A4: displayName permits "Motivational & Career Guidance Content Resonates"');
testGuard('displayName', 'Broad & Niche Hashtag Strategy for Discoverability', false, 'D-A5: displayName permits "Broad & Niche Hashtag Strategy for Discoverability"');
testGuard('displayName', 'Creator Shares Technical Insights', false, 'D-A6: displayName permits "Creator Shares Technical Insights"');

// === REACH CONTEXT AUDIT TESTS ===
console.log('\n=== REACH CONTEXT AUDIT TESTS ===\n');

// Reach as distribution outcome claim — should be rejected
testGuard('directionImplication', 'Use this strategy to reach relevant audiences.', true, 'REACH-R1: rejects "reach relevant audiences"');
testGuard('directionImplication', 'Hashtags help reach a broader audience.', true, 'REACH-R2: rejects "reach a broader audience"');
testGuard('directionImplication', 'This format can reach more viewers.', true, 'REACH-R3: rejects "reach more viewers"');
testGuard('directionImplication', 'Use niche keywords to reach new audiences.', true, 'REACH-R4: rejects "reach new audiences"');

// Reach as ordinary verb — should be accepted
testGuard('strategicDirection', 'Creators can reach out to peers.', false, 'REACH-A1: permits "reach out"');
testGuard('directionImplication', 'Reach out to collaborators.', false, 'REACH-A2: permits "Reach out to collaborators"');
testGuard('creatorTrait', 'The creator shares technical insights.', false, 'REACH-A3: permits "creator shares" (control)');
testGuard('creatorTrait', 'This saves time when explaining the concept.', false, 'REACH-A4: permits "saves time" (control)');

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
