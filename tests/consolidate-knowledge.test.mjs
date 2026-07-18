import { consolidateKnowledge } from '../src/lib/knowledge/consolidate-knowledge.js';

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

console.log('\n=== KNOWLEDGE CONSOLIDATION TESTS ===\n');

const mockUserId = '1234567890abcdef12345678';
const mockProfileId = 'abcdef1234567890abcdef12';

const createCand = (statement, category, reportId, verdict = 'APPROVE') => ({
  userId: mockUserId,
  profileId: mockProfileId,
  normalizedStatement: statement,
  category,
  evidenceReferences: [
    {
      evaluationReportId: reportId,
      candidateIdeaId: '111122223333444455556666',
      ideaTitle: 'Idea Title',
      timestamp: new Date(),
      verdict
    }
  ],
  lifecycleStatus: 'CANDIDATE',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {}
});

// 1. Accumulate evidence on Candidate
console.log('--- 1. Evidence Accumulation ---');
try {
  const store = [];
  const cand1 = createCand('Code snippets must have explanations.', 'Strategy', '111111111111111111111111');
  const cand2 = createCand('  code snippets must have explanations.  ', 'Strategy', '222222222222222222222222');

  const store1 = consolidateKnowledge(store, [cand1]);
  assert(store1.length === 1 && store1[0].lifecycleStatus === 'CANDIDATE', 'Adds new candidate to empty store');

  const store2 = consolidateKnowledge(store1, [cand2]);
  assert(store2.length === 1, 'Merges identical candidates');
  assert(store2[0].evidenceReferences.length === 2, 'Accumulates evidence list to 2 items');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Candidate Promotion (supporting evidence only)
console.log('\n--- 2. Promotion to Validated Knowledge ---');
try {
  const store = [];
  const c1 = createCand('Always use a visual hook.', 'Strategy', '111111111111111111111111');
  const c2 = createCand('Always use a visual hook.', 'Strategy', '222222222222222222222222');
  const c3 = createCand('Always use a visual hook.', 'Strategy', '333333333333333333333333');

  let s = consolidateKnowledge(store, [c1], { promotionThreshold: 3 });
  assert(s[0].lifecycleStatus === 'CANDIDATE', 'Remains candidate with 1 citation');
  
  s = consolidateKnowledge(s, [c2], { promotionThreshold: 3 });
  assert(s[0].lifecycleStatus === 'CANDIDATE', 'Remains candidate with 2 citations');

  s = consolidateKnowledge(s, [c3], { promotionThreshold: 3, supportIncrement: 10 });
  assert(s[0].lifecycleStatus === 'VALIDATED', 'Promotes to VALIDATED status with 3 citations');
  assert(s[0].strengthMetrics.strength === 50, 'Initial promoted strength is 50');
  assert(s[0].strengthMetrics.supportCount === 3, 'Support count is 3');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Strengthening Validated Knowledge
console.log('\n--- 3. Strengthening Validated Knowledge ---');
try {
  const v1 = {
    userId: mockUserId,
    profileId: mockProfileId,
    normalizedStatement: 'Walkthrough formats perform best.',
    category: 'Strategy',
    evidenceReferences: [
      { evaluationReportId: '111111111111111111111111', ideaTitle: 'T1', timestamp: new Date(), verdict: 'APPROVE' }
    ],
    strengthMetrics: { strength: 60, supportCount: 1, contradictionCount: 0 },
    contradictionHistory: [],
    lifecycleStatus: 'VALIDATED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const newSupport = createCand('Walkthrough formats perform best.', 'Strategy', '222222222222222222222222', 'APPROVE');
  const s = consolidateKnowledge([v1], [newSupport], { supportIncrement: 10 });
  assert(s[0].strengthMetrics.strength === 70, 'Increments strength by slower supportIncrement (60 -> 70)');
  assert(s[0].strengthMetrics.supportCount === 2, 'Increments supportCount');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Weakening Validated Knowledge
console.log('\n--- 4. Weakening and Contradiction Handling ---');
try {
  const v1 = {
    userId: mockUserId,
    profileId: mockProfileId,
    normalizedStatement: 'Walkthrough formats perform best.',
    category: 'Strategy',
    evidenceReferences: [
      { evaluationReportId: '111111111111111111111111', ideaTitle: 'T1', timestamp: new Date(), verdict: 'APPROVE' }
    ],
    strengthMetrics: { strength: 60, supportCount: 1, contradictionCount: 0 },
    contradictionHistory: [],
    lifecycleStatus: 'VALIDATED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const contradiction = createCand('Walkthrough formats perform best.', 'Strategy', '222222222222222222222222', 'REJECT');
  const s = consolidateKnowledge([v1], [contradiction], { contradictionDecrement: 20 });
  assert(s[0].strengthMetrics.strength === 40, 'Decrements strength by contradictionDecrement (60 -> 40)');
  assert(s[0].strengthMetrics.contradictionCount === 1, 'Increments contradictionCount');
  assert(s[0].contradictionHistory.length === 1, 'Appends contradiction history references');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Deprecating Obsolete Knowledge
console.log('\n--- 5. Deprecating Knowledge ---');
try {
  const v1 = {
    userId: mockUserId,
    profileId: mockProfileId,
    normalizedStatement: 'Code walk is best.',
    category: 'Strategy',
    evidenceReferences: [
      { evaluationReportId: '111111111111111111111111', ideaTitle: 'T1', timestamp: new Date(), verdict: 'APPROVE' }
    ],
    strengthMetrics: { strength: 20, supportCount: 1, contradictionCount: 0 },
    contradictionHistory: [],
    lifecycleStatus: 'VALIDATED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const contradiction = createCand('Code walk is best.', 'Strategy', '222222222222222222222222', 'REJECT');
  const s = consolidateKnowledge([v1], [contradiction], { contradictionDecrement: 25 });
  assert(s[0].strengthMetrics.strength === 0, 'Strength drops to 0');
  assert(s[0].lifecycleStatus === 'DEPRECATED', 'Transition lifecycleStatus to DEPRECATED');
} catch (err) {
  console.error(err);
  fail++;
}

// 6. Reactivate Deprecated Knowledge
console.log('\n--- 6. Reactivating Deprecated Knowledge ---');
try {
  const v1 = {
    userId: mockUserId,
    profileId: mockProfileId,
    normalizedStatement: 'Code walk is best.',
    category: 'Strategy',
    evidenceReferences: [
      { evaluationReportId: '111111111111111111111111', ideaTitle: 'T1', timestamp: new Date(), verdict: 'APPROVE' },
      { evaluationReportId: '333333333333333333333333', ideaTitle: 'T1', timestamp: new Date(), verdict: 'APPROVE' }
    ],
    strengthMetrics: { strength: 0, supportCount: 2, contradictionCount: 1 },
    contradictionHistory: [
      { evaluationReportId: '222222222222222222222222', ideaTitle: 'T1', timestamp: new Date(), verdict: 'REJECT' }
    ],
    lifecycleStatus: 'DEPRECATED',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const support = createCand('Code walk is best.', 'Strategy', '444444444444444444444444', 'APPROVE');
  let s = consolidateKnowledge([v1], [support], { supportIncrement: 10, recoveryThreshold: 50 });
  assert(s[0].strengthMetrics.strength === 10, 'Strength increases back to 10');
  assert(s[0].lifecycleStatus === 'DEPRECATED', 'Remains deprecated because strength is below recoveryThreshold of 50');

  const secondSupport = createCand('Code walk is best.', 'Strategy', '555555555555555555555555', 'APPROVE');
  s = consolidateKnowledge(s, [secondSupport], { supportIncrement: 40, recoveryThreshold: 50 });
  assert(s[0].strengthMetrics.strength === 50, 'Strength climbs to 50');
  assert(s[0].lifecycleStatus === 'VALIDATED', 'Restores status to VALIDATED once recoveryThreshold is reached');
} catch (err) {
  console.error(err);
  fail++;
}

// 7. Statement-only match & category mismatch tracking
console.log('\n--- 7. Statement-only Matching and Category Tracking ---');
try {
  const store = [];
  const c1 = createCand('Always use clean code tutorials.', 'Creator', '111111111111111111111111');
  const c2 = createCand('Always use clean code tutorials.', 'Strategy', '222222222222222222222222');

  const store1 = consolidateKnowledge(store, [c1]);
  const store2 = consolidateKnowledge(store1, [c2]);

  assert(store2.length === 1, 'Matches statement regardless of category difference');
  assert(store2[0].category === 'Creator', 'Preserves original category of the matched item');
  assert(store2[0].metadata.mismatchedCategories.includes('Strategy'), 'Tracks mismatched categories inside metadata list');
} catch (err) {
  console.error(err);
  fail++;
}

// 8. Mixed evidence promotion block
console.log('\n--- 8. Mixed Evidence Promotion Prevention ---');
try {
  const store = [];
  const c1 = createCand('Interactive visual skits build community.', 'Creator', '111111111111111111111111', 'APPROVE');
  const c2 = createCand('Interactive visual skits build community.', 'Creator', '222222222222222222222222', 'REJECT'); // contradiction
  const c3 = createCand('Interactive visual skits build community.', 'Creator', '333333333333333333333333', 'APPROVE');

  let s = consolidateKnowledge(store, [c1], { promotionThreshold: 2 });
  s = consolidateKnowledge(s, [c2], { promotionThreshold: 2 });
  s = consolidateKnowledge(s, [c3], { promotionThreshold: 2 });

  assert(s[0].lifecycleStatus === 'CANDIDATE', 'Blocks promotion due to net-support rule (2 approvals - 1 rejection = 1 net support, which is < promotionThreshold of 2)');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
