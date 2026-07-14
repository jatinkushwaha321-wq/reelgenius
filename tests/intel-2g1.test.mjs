/**
 * INTEL-2G.1 — Focused local tests
 *
 * Verifies:
 *   1. observedFact derivation, boundaries, constraints, and empty/malformed handling
 *   2. Existing active signal fields preservation
 *   3. No evidenceClass field introduction
 *   4. Intelligence prompt contains calibration rule for directionImplication
 *   5. Idea prompt contains observedFact vs directionImplication boundary
 *   6. Existing INTEL-2F contracts and ranking behavior are untouched
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { selectActiveSignals } from '../src/lib/ideas/build-idea-packet.js';
import { deriveObservedFact } from '../src/lib/ideas/signal-helpers.js';
import { buildIntelligencePrompt } from '../src/lib/intelligence/build-intelligence-prompt.js';
import { buildIdeaPrompt } from '../src/lib/ideas/build-idea-prompt.js';
import { rankCandidates, computeRankKey } from '../src/lib/ideas/rank-candidates.js';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===================================================================
// 1. observedFact DERIVATION & BOUNDS
// ===================================================================
console.log('\n=== 1. observedFact DERIVATION & BOUNDS ===\n');

// Missing/empty behavior
assert(deriveObservedFact(null) === '', 'deriveObservedFact(null) returns empty string');
assert(deriveObservedFact(undefined) === '', 'deriveObservedFact(undefined) returns empty string');
assert(deriveObservedFact([]) === '', 'deriveObservedFact([]) returns empty string');
assert(deriveObservedFact('not an array') === '', 'deriveObservedFact(non-array) returns empty string');

// Malformed individual evidence items
const malformedEv = [
  null,
  undefined,
  {},
  { type: 'metric' }, // missing fact
  { type: 'metric', fact: 123 }, // fact not string
  { type: 'metric', fact: '' }, // empty fact
  { type: 'fact', fact: 'Valid fact 1' },
];
assert(deriveObservedFact(malformedEv) === 'Valid fact 1', 'safely ignores malformed items');

// Bounded items and multiple items limits
const longFact = 'A'.repeat(200);
const evidenceLong = [
  { type: 'metric', fact: longFact },
];
const derivedLong = deriveObservedFact(evidenceLong);
assert(derivedLong.length === 120, `derived fact is sliced to 120 chars: got ${derivedLong.length}`);

const manyEvidence = [
  { type: 'metric', fact: 'Fact One' },
  { type: 'metric', fact: 'Fact Two' },
  { type: 'metric', fact: 'Fact Three' },
  { type: 'metric', fact: 'Fact Four' },
];
const derivedMany = deriveObservedFact(manyEvidence);
assert(derivedMany.includes('Fact One'), 'Fact One included');
assert(derivedMany.includes('Fact Two'), 'Fact Two included');
assert(derivedMany.includes('Fact Three'), 'Fact Three included');
assert(!derivedMany.includes('Fact Four'), 'Fact Four is excluded (max 3 items)');

// Final field bound
const oversizedFacts = [
  { type: 'metric', fact: 'B'.repeat(120) },
  { type: 'metric', fact: 'C'.repeat(120) },
  { type: 'metric', fact: 'D'.repeat(120) },
];
const derivedOversized = deriveObservedFact(oversizedFacts);
assert(derivedOversized.length <= 350, `final output is sliced to 350 chars: got ${derivedOversized.length}`);

// Deterministic test
const evInput1 = [
  { type: 'metric', fact: 'User engagement is rising.' },
  { type: 'comparative', fact: 'Reels have 2x plays.' },
];
const evInput2 = [
  { type: 'metric', fact: 'User engagement is rising.' },
  { type: 'comparative', fact: 'Reels have 2x plays.' },
];
assert(deriveObservedFact(evInput1) === deriveObservedFact(evInput2), 'identical inputs yield identical output');

// ===================================================================
// 2. ACTIVE SIGNAL SERIALIZATION & FIELDS PRESERVATION
// ===================================================================
console.log('\n=== 2. ACTIVE SIGNAL SERIALIZATION & FIELDS PRESERVATION ===\n');

const testSignals = [
  {
    key: 'tech_posts_perform',
    displayName: 'Tech posts perform',
    category: 'audience-engagement',
    strength: 80,
    confidence: 85,
    trend: 'rising',
    creatorTrait: 'Regularly posts code',
    audienceBehavior: 'Likes tech posts',
    directionImplication: 'Do more tech posts',
    evidence: [
      { type: 'metric', fact: 'Observed tech post has 500 likes' },
    ],
    updatedAt: new Date(),
  },
  {
    key: 'reels_format',
    displayName: 'Reels format performs',
    category: 'content-format',
    strength: 70,
    confidence: 75,
    trend: 'stable',
    creatorTrait: 'Regularly posts reels',
    audienceBehavior: 'Plays reels longer',
    directionImplication: 'Double down on reels',
    evidence: [],
    updatedAt: new Date(),
  },
  {
    key: 'humorous_tone',
    displayName: 'Humorous tone',
    category: 'creator-style',
    strength: 60,
    confidence: 65,
    trend: 'stable',
    creatorTrait: 'Uses meme captions',
    audienceBehavior: 'Comments on memes',
    directionImplication: 'Inject humor',
    evidence: null,
    updatedAt: new Date(),
  }
];

const { selectedSignals } = selectActiveSignals(testSignals);

assert(selectedSignals.length >= 3, 'generates active signals correctly');
const firstSig = selectedSignals[0];

// Verify all existing fields are preserved
assert(firstSig.ref === 'sig_001', 'ref preserved');
assert(firstSig.key === 'tech_posts_perform', 'key preserved');
assert(firstSig.displayName === 'Tech posts perform', 'displayName preserved');
assert(firstSig.category === 'audience-engagement', 'category preserved');
assert(firstSig.strength === 80, 'strength preserved');
assert(firstSig.confidence === 85, 'confidence preserved');
assert(firstSig.trend === 'rising', 'trend preserved');
assert(firstSig.creatorTrait === 'Regularly posts code', 'creatorTrait preserved');
assert(firstSig.audienceBehavior === 'Likes tech posts', 'audienceBehavior preserved');
assert(firstSig.directionImplication === 'Do more tech posts', 'directionImplication preserved');

// Verify observedFact serialization
assert(firstSig.observedFact === 'Observed tech post has 500 likes', `observedFact successfully serialized: got ${firstSig.observedFact}`);
assert(selectedSignals[1].observedFact === '', 'observedFact is empty for empty evidence array');
assert(selectedSignals[2].observedFact === '', 'observedFact is empty for null evidence');

// Verify no evidenceClass field is introduced in serialization
assert(!('evidenceClass' in firstSig), 'no evidenceClass field is present on serialized signals');

// ===================================================================
// 3. NO SCHEMA CHANGES / STATIC CHECKS
// ===================================================================
console.log('\n=== 3. SCHEMA AND PROMPT STATIC CHECKS ===\n');

// Read files for static schema checks
const signalSchemaContent = fs.readFileSync(path.join(__dirname, '../src/models/Signal.js'), 'utf8');
const ideaSchemaContent = fs.readFileSync(path.join(__dirname, '../src/models/Idea.js'), 'utf8');

assert(!signalSchemaContent.includes('evidenceClass'), 'Signal schema does not include evidenceClass field');
assert(!ideaSchemaContent.includes('evidenceClass'), 'Idea schema does not include evidenceClass field');

// ===================================================================
// 4. PROMPT CONTENT BOUNDARY VERIFICATION
// ===================================================================
console.log('\n=== 4. PROMPT CONTENT BOUNDARY VERIFICATION ===\n');

const intelligencePromptText = buildIntelligencePrompt({
  packet: {},
  existingSignals: [],
  contentTier: 'full',
  outputContract: {},
  cadence: null,
});

assert(
  intelligencePromptText.includes('DIRECTION IMPLICATION CALIBRATION') &&
  intelligencePromptText.includes('Content-performance evidence does NOT authorize audience-state claims'),
  'Intelligence prompt contains the explicit directionImplication content-performance -> audience-state calibration rule'
);

const ideaPromptText = buildIdeaPrompt({
  packet: {},
  outputContract: {},
});

assert(
  ideaPromptText.includes('OBSERVED EVIDENCE vs. DIRECTIONAL RECOMMENDATION BOUNDARY') &&
  ideaPromptText.includes('observedFact') &&
  ideaPromptText.includes('directionImplication'),
  'Idea prompt explicitly distinguishes observedFact from directionImplication and sets clear claim boundaries'
);

// ===================================================================
// 5. EXISTING INTEL-2F CONTRACTS & RANKING UNTOUCHED
// ===================================================================
console.log('\n=== 5. EXISTING INTEL-2F CONTRACTS & RANKING UNTOUCHED ===\n');

// Verify ranking deterministic ordering is untouched
const makeCand = (title, primaryConf, primaryTrend, suppConfs) => {
  const snapshots = [
    { key: 'primary', displayName: 'P', strength: 80, confidence: primaryConf, trend: primaryTrend, directionImplication: '' },
    ...suppConfs.map((c, i) => ({
      key: `supp_${i}`, displayName: `S${i}`, strength: 70, confidence: c, trend: 'stable', directionImplication: '',
    })),
  ];
  return {
    title,
    topic: 'test',
    concept: 'concept text concept text concept text concept text',
    whyNow: 'whyNow text whyNow text',
    format: 'tutorial',
    contentPillar: 'test',
    hook: 'hook text hook text',
    directionReasoning: 'directionReasoning text directionReasoning text',
    noveltyReason: 'noveltyReason text',
    sourceSignalKeys: snapshots.map(s => s.key),
    sourceSignalSnapshots: snapshots,
  };
};

const candA = makeCand('A', 92, 'stable', [85]);
const candB = makeCand('B', 89, 'rising', [95]);
rankCandidates([candA, candB]);
assert(candA.rankKey > candB.rankKey, 'Ranking untouched: band 4 stable dominates band 3 rising');

const candK = makeCand('K', 95, 'rising', [90]);
const expectedKey = (4 * 10000) + (3 * 1000) + 93; // band 4, trend rising (3), mean(95+90)/2=92.5->93
assert(computeRankKey(candK) === expectedKey, `rankKey computation remains unchanged: got ${computeRankKey(candK)}`);

// ===================================================================
// REPORT
// ===================================================================
console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
