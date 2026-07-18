import {
  knowledgeCandidateSchema,
  validatedKnowledgeSchema,
  knowledgeRetrievalSchema
} from '../src/lib/knowledge/knowledge-contracts.js';

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

console.log('\n=== KNOWLEDGE CONTRACT SCHEMA TESTS ===\n');

const mockUserId = '1234567890abcdef12345678';
const mockProfileId = 'abcdef1234567890abcdef12';
const mockReportId = '87654321fedcba0987654321';
const mockIdeaId = '111122223333444455556666';

const createValidCandidate = () => ({
  userId: mockUserId,
  profileId: mockProfileId,
  normalizedStatement: 'Curiosity-focused hooks perform better on advanced systems topics.',
  category: 'Strategy',
  evidenceReferences: [
    {
      evaluationReportId: mockReportId,
      candidateIdeaId: mockIdeaId,
      ideaTitle: 'Advanced Kubernetes Deployment Guide',
      timestamp: '2026-07-18T12:00:00.000Z',
      verdict: 'APPROVE'
    }
  ],
  lifecycleStatus: 'CANDIDATE',
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: { model: 'gemini-2.5-flash' }
});

const createValidValidated = () => ({
  userId: mockUserId,
  profileId: mockProfileId,
  normalizedStatement: 'Creator prefers live-action tutorial format for developer walkthroughs.',
  category: 'Creator',
  evidenceReferences: [
    {
      evaluationReportId: mockReportId,
      candidateIdeaId: mockIdeaId,
      ideaTitle: 'Interactive React Walkthrough',
      timestamp: '2026-07-18T12:00:00.000Z',
      verdict: 'APPROVE'
    }
  ],
  strengthMetrics: {
    strength: 80,
    supportCount: 4,
    contradictionCount: 0
  },
  contradictionHistory: [],
  lifecycleStatus: 'VALIDATED',
  createdAt: '2026-07-18T12:00:00.000Z',
  updatedAt: '2026-07-18T13:00:00.000Z',
  metadata: {}
});

const createValidLightweight = () => ({
  id: mockReportId,
  normalizedStatement: 'Creator prefers live-action tutorial format.',
  category: 'Creator',
  strength: 80,
  metadata: {}
});

const createValidRetrieval = () => ({
  groupedKnowledge: {
    Creator: [createValidLightweight()],
    Audience: [],
    Strategy: [],
    Experiment: [],
    Evolution: []
  },
  rankingMetadata: [
    {
      itemId: '888899990000111122223333',
      score: 95,
      reasons: ['Direct category match', 'High historical strength']
    }
  ],
  retrievedAt: new Date(),
  summaryMetadata: {
    totalRetrieved: 1,
    categoriesPresent: ['Creator']
  }
});

// 1. Valid Candidate Payload Validation
console.log('--- 1. Valid Candidate Validation ---');
try {
  const result = knowledgeCandidateSchema.safeParse(createValidCandidate());
  assert(result.success === true, 'Valid Knowledge Candidate payload parses successfully');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Valid Validated Knowledge Validation
console.log('\n--- 2. Valid Validated Knowledge Validation ---');
try {
  const result = validatedKnowledgeSchema.safeParse(createValidValidated());
  assert(result.success === true, 'Valid Validated Knowledge payload parses successfully');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Valid Retrieval Context Validation
console.log('\n--- 3. Valid Retrieval Context Validation ---');
try {
  const result = knowledgeRetrievalSchema.safeParse(createValidRetrieval());
  assert(result.success === true, 'Valid Knowledge Retrieval payload parses successfully');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Rejection of Invalid Categories
console.log('\n--- 4. Invalid Category Rejection ---');
try {
  const badCategoryCandidate = createValidCandidate();
  badCategoryCandidate.category = 'InvalidCategory';
  assert(knowledgeCandidateSchema.safeParse(badCategoryCandidate).success === false, 'Rejects invalid category value on candidates');

  const badCategoryValidated = createValidValidated();
  badCategoryValidated.category = 'Niche';
  assert(validatedKnowledgeSchema.safeParse(badCategoryValidated).success === false, 'Rejects invalid category value on validated knowledge');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Rejection of Invalid Lifecycle States
console.log('\n--- 5. Invalid Lifecycle Status Rejection ---');
try {
  const badStateCandidate = createValidCandidate();
  badStateCandidate.lifecycleStatus = 'VALIDATED';
  assert(knowledgeCandidateSchema.safeParse(badStateCandidate).success === false, 'Rejects Knowledge Candidate with VALIDATED status');

  const badStateValidated = createValidValidated();
  badStateValidated.lifecycleStatus = 'CANDIDATE';
  assert(validatedKnowledgeSchema.safeParse(badStateValidated).success === false, 'Rejects Validated Knowledge with CANDIDATE status');

  const invalidStateValidated = createValidValidated();
  invalidStateValidated.lifecycleStatus = 'DRAFT';
  assert(validatedKnowledgeSchema.safeParse(invalidStateValidated).success === false, 'Rejects completely invalid status values');
} catch (err) {
  console.error(err);
  fail++;
}

// 6. Malformed Evidence Verification
console.log('\n--- 6. Malformed Evidence Rejection ---');
try {
  const badEvidenceReportId = createValidCandidate();
  badEvidenceReportId.evidenceReferences[0].evaluationReportId = 'too-short-id';
  assert(knowledgeCandidateSchema.safeParse(badEvidenceReportId).success === false, 'Rejects evidence with malformed evaluationReportId format');

  const badEvidenceVerdict = createValidCandidate();
  badEvidenceVerdict.evidenceReferences[0].verdict = 'MAYBE';
  assert(knowledgeCandidateSchema.safeParse(badEvidenceVerdict).success === false, 'Rejects evidence with invalid verdict enum value');

  const emptyEvidenceArray = createValidCandidate();
  emptyEvidenceArray.evidenceReferences = [];
  assert(knowledgeCandidateSchema.safeParse(emptyEvidenceArray).success === false, 'Rejects candidate payload with empty evidenceReferences array');
} catch (err) {
  console.error(err);
  fail++;
}

// 7. Malformed Timestamps Validation
console.log('\n--- 7. Malformed Timestamps Rejection ---');
try {
  const badTimestampCandidate = createValidCandidate();
  badTimestampCandidate.createdAt = 'not-a-valid-date-string';
  assert(knowledgeCandidateSchema.safeParse(badTimestampCandidate).success === false, 'Rejects candidate payload with unparseable createdAt date string');
  
  const invalidDateObj = createValidCandidate();
  invalidDateObj.createdAt = new Date('invalid');
  assert(knowledgeCandidateSchema.safeParse(invalidDateObj).success === false, 'Rejects candidate payload containing an Invalid Date object');
} catch (err) {
  console.error(err);
  fail++;
}

// 8. Invalid Metrics Verification
console.log('\n--- 8. Invalid Strength & Counter Metrics Rejection ---');
try {
  const negativeStrength = createValidValidated();
  negativeStrength.strengthMetrics.strength = -5;
  assert(validatedKnowledgeSchema.safeParse(negativeStrength).success === false, 'Rejects negative strength values');

  const strengthTooLarge = createValidValidated();
  strengthTooLarge.strengthMetrics.strength = 101;
  assert(validatedKnowledgeSchema.safeParse(strengthTooLarge).success === false, 'Rejects strength > 100');

  const floatStrength = createValidValidated();
  floatStrength.strengthMetrics.strength = 75.5;
  assert(validatedKnowledgeSchema.safeParse(floatStrength).success === false, 'Rejects non-integer strength values');

  const zeroSupportCount = createValidValidated();
  zeroSupportCount.strengthMetrics.supportCount = 0;
  assert(validatedKnowledgeSchema.safeParse(zeroSupportCount).success === false, 'Rejects supportCount < 1');

  const negativeContradiction = createValidValidated();
  negativeContradiction.strengthMetrics.contradictionCount = -1;
  assert(validatedKnowledgeSchema.safeParse(negativeContradiction).success === false, 'Rejects negative contradictionCount');
} catch (err) {
  console.error(err);
  fail++;
}

// 9. Required Fields Validation
console.log('\n--- 9. Required Fields Validation ---');
try {
  const missingUserId = createValidCandidate();
  delete missingUserId.userId;
  assert(knowledgeCandidateSchema.safeParse(missingUserId).success === false, 'Rejects candidate missing userId');

  const missingNormalizedStatement = createValidValidated();
  delete missingNormalizedStatement.normalizedStatement;
  assert(validatedKnowledgeSchema.safeParse(missingNormalizedStatement).success === false, 'Rejects validated knowledge missing normalizedStatement');
} catch (err) {
  console.error(err);
  fail++;
}

// 10. Boundary and Preprocessing Validation
console.log('\n--- 10. Boundary and Preprocessing Validation ---');
try {
  const zeroStrength = createValidValidated();
  zeroStrength.strengthMetrics.strength = 0;
  assert(validatedKnowledgeSchema.safeParse(zeroStrength).success === true, 'Accepts strength boundary of 0');

  const hundredStrength = createValidValidated();
  hundredStrength.strengthMetrics.strength = 100;
  assert(validatedKnowledgeSchema.safeParse(hundredStrength).success === true, 'Accepts strength boundary of 100');

  const parsedCandidate = knowledgeCandidateSchema.parse(createValidCandidate());
  assert(parsedCandidate.createdAt instanceof Date, 'Correctly preprocesses string date inputs into Date objects');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
