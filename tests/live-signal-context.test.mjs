/**
 * LIVE-SIGNAL-CONTEXT — Hybrid Architecture & Presentation Derivation Tests
 *
 * Verifies:
 * 1. deriveSignalContextWording returns exact dynamic wording based on current signal trend.
 * 2. enrichIdeasWithLiveSignals resolves live Signal records without mutating Idea documents.
 * 3. Fallback behavior when live signal documents are missing.
 */

import { deriveSignalContextWording } from '../src/lib/ideas/signal-helpers.js';
import { enrichIdeasWithLiveSignals } from '../src/lib/ideas/live-signal-context.js';
import Signal from '../src/models/Signal.js';

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

console.log('\n=== LIVE-SIGNAL-CONTEXT HYBRID ARCHITECTURE TESTS ===\n');

// -----------------------------------------------------------------------------
// SECTION 1: deriveSignalContextWording Presentation Logic
// -----------------------------------------------------------------------------
console.log('--- 1. deriveSignalContextWording Semantics ---');

assert(
  deriveSignalContextWording({ trend: 'unknown' }) === 'Observed pattern with insufficient longitudinal history.',
  'A. unknown trend returns "Observed pattern with insufficient longitudinal history."'
);

assert(
  deriveSignalContextWording({ trend: 'stable' }) === 'Supported by a stable engagement pattern across repeated observations.',
  'B. stable trend returns "Supported by a stable engagement pattern across repeated observations."'
);

assert(
  deriveSignalContextWording({ trend: 'rising' }) === 'Supported by a rising engagement trend across multiple observation cycles.',
  'C. rising trend returns "Supported by a rising engagement trend across multiple observation cycles."'
);

assert(
  deriveSignalContextWording({ trend: 'falling' }) === 'Supported by a declining engagement trend across multiple observation cycles.',
  'D. falling trend returns "Supported by a declining engagement trend across multiple observation cycles."'
);

assert(
  deriveSignalContextWording(null, 'Fallback Text') === 'Fallback Text',
  'E. null/undefined signal falls back cleanly to provided fallback text'
);

// -----------------------------------------------------------------------------
// SECTION 2: enrichIdeasWithLiveSignals Dynamic Resolution
// -----------------------------------------------------------------------------
console.log('\n--- 2. enrichIdeasWithLiveSignals Resolution & Enrichment ---');

// Mock Signal.find
const originalFind = Signal.find;
const mockSignalsDB = [
  {
    profileId: 'prof_123',
    key: 'sig_alpha',
    displayName: 'Alpha Pattern',
    strength: 85,
    confidence: 90,
    trend: 'stable',
    directionImplication: 'Keep focusing on Alpha',
  },
  {
    profileId: 'prof_123',
    key: 'sig_beta',
    displayName: 'Beta Trend',
    strength: 95,
    confidence: 95,
    trend: 'rising',
    directionImplication: 'Double down on Beta',
  }
];

Signal.find = function(query) {
  return {
    lean: async () => {
      // Filter mockSignalsDB by profileId and key
      const queriedProfileIds = query?.profileId?.$in || [];
      const queriedKeys = query?.key?.$in || [];
      return mockSignalsDB.filter(
        s => queriedProfileIds.includes(s.profileId) && queriedKeys.includes(s.key)
      );
    }
  };
};

async function testEnrichment() {
  const inputIdeas = [
    {
      _id: 'idea_1',
      profileId: 'prof_123',
      title: 'Idea One',
      sourceSignalKeys: ['sig_alpha', 'sig_missing'],
      sourceSignalSnapshots: [
        { key: 'sig_alpha', displayName: 'Old Alpha', strength: 50, confidence: 50, trend: 'unknown' },
        { key: 'sig_missing', displayName: 'Missing Sig', strength: 60, confidence: 60, trend: 'unknown' }
      ],
      whyNow: 'Old static snapshot text from initial derivation run.'
    },
    {
      _id: 'idea_2',
      profileId: 'prof_123',
      title: 'Idea Two',
      sourceSignalKeys: ['sig_beta'],
      sourceSignalSnapshots: [
        { key: 'sig_beta', displayName: 'Old Beta', strength: 70, confidence: 70, trend: 'unknown' }
      ],
      whyNow: 'Another old static snapshot.'
    }
  ];

  const enriched = await enrichIdeasWithLiveSignals(inputIdeas);

  assert(enriched.length === 2, 'A. returns enriched ideas corresponding 1:1 with input array');
  
  const idea1 = enriched[0];
  assert(
    idea1.whyNow === 'Supported by a stable engagement pattern across repeated observations.',
    'B. dynamically computes whyNow using primary live signal trend (stable)'
  );
  assert(
    idea1.sourceSignalSnapshots[0].displayName === 'Alpha Pattern' &&
    idea1.sourceSignalSnapshots[0].strength === 85 &&
    idea1.sourceSignalSnapshots[0].trend === 'stable',
    'C. updates sourceSignalSnapshots with latest live signal state'
  );
  assert(
    idea1.sourceSignalSnapshots[1].key === 'sig_missing' &&
    idea1.sourceSignalSnapshots[1].displayName === 'Missing Sig',
    'D. gracefully preserves historical snapshot if live signal is not found in DB'
  );

  const idea2 = enriched[1];
  assert(
    idea2.whyNow === 'Supported by a rising engagement trend across multiple observation cycles.',
    'E. dynamically computes whyNow for rising trend without mutating input object'
  );
  assert(
    inputIdeas[0].whyNow === 'Old static snapshot text from initial derivation run.',
    'F. input objects remain unmutated (pure presentation layer enhancement)'
  );
}

async function runAll() {
  try {
    await testEnrichment();
  } finally {
    Signal.find = originalFind;
  }

  console.log(`\nTotals: ${pass} PASS, ${fail} FAIL\n`);
  if (fail > 0) process.exit(1);
}

runAll().catch(console.error);
