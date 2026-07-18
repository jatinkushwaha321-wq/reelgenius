import { retrieveKnowledge, BASE_STRENGTH_WEIGHT } from '../src/lib/knowledge/retrieve-knowledge.js';

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

console.log('\n=== KNOWLEDGE RETRIEVAL TESTS ===\n');

const mockUserId = '1234567890abcdef12345678';
const mockProfileId = 'abcdef1234567890abcdef12';

const createValItem = (statement, category, strength, id) => ({
  id,
  userId: mockUserId,
  profileId: mockProfileId,
  normalizedStatement: statement,
  category,
  evidenceReferences: [
    { evaluationReportId: '111111111111111111111111', ideaTitle: 'Idea Title', timestamp: new Date(), verdict: 'APPROVE' }
  ],
  strengthMetrics: { strength, supportCount: 1, contradictionCount: 0 },
  contradictionHistory: [],
  lifecycleStatus: 'VALIDATED',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {}
});

// 1. Basic retrieval and keyword matching
console.log('--- 1. Basic Retrieval and Keyword Ranking ---');
try {
  const store = [
    createValItem('Creator prefers live-action format.', 'Creator', 80, '111111111111111111111111'),
    createValItem('Curiosity hooks perform better.', 'Strategy', 50, '222222222222222222222222'),
    createValItem('Kubernetes guides need deep technical walkthroughs.', 'Strategy', 90, '333333333333333333333333')
  ];

  const result = retrieveKnowledge(store, { topic: 'kubernetes hooks' });
  assert(result.summaryMetadata.totalRetrieved === 3, 'Retrieves all 3 items matching topic and base metrics');
  
  // High-strength Kubernetes item matching the keyword should be ranked first
  assert(result.rankingMetadata[0].itemId === '333333333333333333333333', 'Ranks high-strength keyword match first');
  assert(result.groupedKnowledge.Creator.length === 1, 'Correctly groups Creator category items');
  
  // Verify lightweight schema properties
  const item = result.groupedKnowledge.Creator[0];
  assert(item.id === '111111111111111111111111', 'Lightweight output contains item ID string');
  assert(item.normalizedStatement === 'Creator prefers live-action format.', 'Lightweight output contains statement');
  assert(item.strength === 80, 'Lightweight output contains strength number');
  assert(item.evidenceReferences === undefined, 'Lightweight retrieval DTO excludes persistable evidenceReferences');
  assert(item.strengthMetrics === undefined, 'Lightweight retrieval DTO excludes data models strengthMetrics');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Status Exclusion Validation
console.log('\n--- 2. Exclusion of Candidates and Deprecated Items ---');
try {
  const store = [
    createValItem('Active validated guideline.', 'Strategy', 70, '111111111111111111111111'),
    {
      ...createValItem('Candidate hypothesis.', 'Strategy', 70, '222222222222222222222222'),
      lifecycleStatus: 'CANDIDATE'
    },
    {
      ...createValItem('Deprecated guideline.', 'Strategy', 70, '333333333333333333333333'),
      lifecycleStatus: 'DEPRECATED'
    }
  ];

  const result = retrieveKnowledge(store, { topic: 'guideline' });
  assert(result.summaryMetadata.totalRetrieved === 1, 'Retrieves exactly 1 item');
  assert(result.rankingMetadata[0].itemId === '111111111111111111111111', 'Retrieves only VALIDATED status item');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Relevance Threshold check
console.log('\n--- 3. Relevance Threshold Filtering ---');
try {
  const store = [
    createValItem('Low relevance item.', 'Strategy', 10, '111111111111111111111111'),
    createValItem('High relevance item.', 'Strategy', 90, '222222222222222222222222')
  ];

  const result = retrieveKnowledge(store, { topic: 'high' }, { relevanceThreshold: 30 });
  assert(result.summaryMetadata.totalRetrieved === 1, 'Excludes items falling below the threshold score');
  assert(result.rankingMetadata[0].itemId === '222222222222222222222222', 'Retrieves only the high relevance item');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Max items capping per category
console.log('\n--- 4. Max Items Category Capping ---');
try {
  const store = [
    createValItem('Strategy item 1.', 'Strategy', 80, '111111111111111111111111'),
    createValItem('Strategy item 2.', 'Strategy', 75, '222222222222222222222222'),
    createValItem('Strategy item 3.', 'Strategy', 70, '333333333333333333333333')
  ];

  const result = retrieveKnowledge(store, {}, { maxItemsPerCategory: 2 });
  assert(result.groupedKnowledge.Strategy.length === 2, 'Limits strategy items retrieved to the category max limit of 2');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Token vs Substring matching check
console.log('\n--- 5. Token Exact Match Check ---');
try {
  const store = [
    createValItem('Using a visual chair hook.', 'Strategy', 80, '111111111111111111111111')
  ];
  // Search keyword "ai" should NOT match substring "chair"
  const result = retrieveKnowledge(store, { topic: 'ai' });
  const expectedBaseScore = Math.round(80 * BASE_STRENGTH_WEIGHT);
  assert(result.rankingMetadata[0].score === expectedBaseScore, 'Token matching prevents false positive substring matches (e.g. "ai" does not match "chair")');
} catch (err) {
  console.error(err);
  fail++;
}

// 6. Category neutrality check
console.log('\n--- 6. Category Neutrality Check ---');
try {
  const store = [
    createValItem('Visual hook check.', 'Creator', 80, '111111111111111111111111'),
    createValItem('Visual hook check.', 'Strategy', 80, '222222222222222222222222')
  ];
  // Creator and Strategy should earn the exact same score (no hardcoded category bonus)
  const result = retrieveKnowledge(store, { topic: 'visual' });
  assert(result.rankingMetadata[0].score === result.rankingMetadata[1].score, 'Retrieval scores are category-neutral');
} catch (err) {
  console.error(err);
  fail++;
}

// 7. Deterministic tie-breaking check
console.log('\n--- 7. Deterministic Tie-breaking ---');
try {
  const store = [
    createValItem('Apple guide walkthrough.', 'Strategy', 50, '111111111111111111111111'),
    createValItem('Zeta guide walkthrough.', 'Strategy', 50, '222222222222222222222222'),
    createValItem('Beta guide walkthrough.', 'Strategy', 80, '333333333333333333333333')
  ];
  // Searching "guide":
  // - All 3 get the same keyword bonus (e.g. +15)
  // - Beta has strength 80 (highest score), ranks 1st
  // - Apple and Zeta tie on score (50 * 0.4 + 15 = 35) and strength (50). Apple (A) ranks before Zeta (Z) alphabetically
  const result = retrieveKnowledge(store, { topic: 'guide' });
  assert(result.rankingMetadata[0].itemId === '333333333333333333333333', 'Ranks highest score/strength first');
  assert(result.rankingMetadata[1].itemId === '111111111111111111111111', 'Resolves tie alphabetically (Apple before Zeta)');
} catch (err) {
  console.error(err);
  fail++;
}

// 8. Fail-fast on missing IDs
console.log('\n--- 8. Fail Fast on Missing ID ---');
try {
  const store = [
    {
      userId: mockUserId,
      profileId: mockProfileId,
      normalizedStatement: 'Statement without ID.',
      category: 'Strategy',
      strengthMetrics: { strength: 80, supportCount: 1, contradictionCount: 0 },
      lifecycleStatus: 'VALIDATED'
    }
  ];
  let threw = false;
  try {
    retrieveKnowledge(store, { topic: 'statement' });
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Throws a descriptive error when a validated knowledge item lacks an ID');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
