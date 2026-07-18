import { extractKnowledgeCandidates } from '../src/lib/knowledge/extract-knowledge-candidate.js';

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

console.log('\n=== KNOWLEDGE CANDIDATE EXTRACTION TESTS ===\n');

const mockUserId = '1234567890abcdef12345678';
const mockProfileId = 'abcdef1234567890abcdef12';
const mockReportId = '87654321fedcba0987654321';
const mockIdeaId = '111122223333444455556666';

const mockApprovedReport = {
  id: mockReportId,
  overallVerdict: {
    recommendation: 'APPROVE',
    summary: 'Strong tutorial post.'
  },
  validatedLearnings: [
    '  creator prefers using \n raw typescript \t examples for walkthroughs   ',
    'audience struggles with complex webpack setup.'
  ],
  rejectionReasons: []
};

const mockRejectedReport = {
  id: mockReportId,
  overallVerdict: {
    recommendation: 'REJECT',
    summary: 'Violated style guide.'
  },
  validatedLearnings: [],
  rejectionReasons: [
    'underperformed because video was too long'
  ]
};

const mockIdea = {
  id: mockIdeaId,
  userId: mockUserId,
  profileId: mockProfileId,
  title: 'NextJS Performance Optimizations'
};

// 1. Approved Report learnings extraction
console.log('--- 1. Extraction from Approved Report ---');
try {
  const candidates = extractKnowledgeCandidates(mockApprovedReport, mockIdea);
  assert(candidates.length === 2, 'Extracts exactly 2 candidates from approved report');
  assert(candidates[0].lifecycleStatus === 'CANDIDATE', 'Sets candidates status to CANDIDATE');
  assert(candidates[0].category === 'Creator', 'Correctly categorizes statement containing "creator" as Creator');
  assert(candidates[0].normalizedStatement === 'Creator prefers using raw typescript examples for walkthroughs.', 'Collapses newlines, tabs, and duplicate spaces');
  assert(candidates[1].category === 'Audience', 'Correctly categorizes statement containing "audience" as Audience');
  assert(candidates[1].normalizedStatement === 'Audience struggles with complex webpack setup.', 'Ensures statement ends with a period');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Rejected Report learnings extraction
console.log('\n--- 2. Extraction from Rejected Report ---');
try {
  const candidates = extractKnowledgeCandidates(mockRejectedReport, mockIdea);
  assert(candidates.length === 1, 'Extracts exactly 1 candidate from rejected report');
  assert(candidates[0].category === 'Experiment', 'Categorizes failure reasons containing "underperform" as Experiment');
  assert(candidates[0].normalizedStatement === 'Underperformed because video was too long.', 'Normalizes rejection reason statement');
  assert(candidates[0].evidenceReferences[0].verdict === 'REJECT', 'Preserves REJECT verdict in evidence references');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Keyword categorization mapping rules
console.log('\n--- 3. Keyword Categorization Rules ---');
try {
  const testCategory = (text, expected) => {
    const report = {
      id: mockReportId,
      overallVerdict: { recommendation: 'APPROVE', summary: '' },
      validatedLearnings: [text]
    };
    const c = extractKnowledgeCandidates(report, mockIdea);
    return c[0].category;
  };

  assert(testCategory('Creator prefers walkthroughs.', 'Creator') === 'Creator', 'Maps "creator" to Creator');
  assert(testCategory('my style is coding live.', 'Creator') === 'Creator', 'Maps "my style" to Creator');
  assert(testCategory('Audience likes visuals.', 'Audience') === 'Audience', 'Maps "audience" to Audience');
  assert(testCategory('viewer engagement dropped.', 'Audience') === 'Audience', 'Maps "viewer" to Audience');
  assert(testCategory('unsuccessful experiment with carousels.', 'Experiment') === 'Experiment', 'Maps "unsuccessful" to Experiment');
  assert(testCategory('advanced developers want deep dives.', 'Evolution') === 'Evolution', 'Maps "advanced" to Evolution');
  assert(testCategory('generic strategy for content.', 'Strategy') === 'Strategy', 'Defaults to Strategy for generic statements');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Missing IDs and parameters checks
console.log('\n--- 4. Param Validation ---');
try {
  let threw = false;
  try {
    extractKnowledgeCandidates(null, mockIdea);
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Throws when EvaluationReport is missing');

  threw = false;
  try {
    const reportNoId = { overallVerdict: { recommendation: 'APPROVE' } };
    extractKnowledgeCandidates(reportNoId, mockIdea);
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Throws when EvaluationReport ID is missing');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Deduplication of candidate learnings per report
console.log('\n--- 5. Statement Deduplication ---');
try {
  const reportDuplicate = {
    id: mockReportId,
    overallVerdict: { recommendation: 'APPROVE', summary: '' },
    validatedLearnings: [
      'Creator prefers walkthrough formats.',
      '   creator prefers walkthrough formats.  ' // matches normalized statement
    ]
  };
  const candidates = extractKnowledgeCandidates(reportDuplicate, mockIdea);
  assert(candidates.length === 1, 'Deduplicates identical normalized statements down to 1 candidate');
} catch (err) {
  console.error(err);
  fail++;
}

// 6. Timestamp fallback validation
console.log('\n--- 6. Timestamp Fallback Tracing ---');
try {
  const fixedReportDate = new Date('2026-01-01T12:00:00Z');
  const reportWithDate = {
    id: mockReportId,
    createdAt: fixedReportDate,
    overallVerdict: { recommendation: 'APPROVE', summary: '' },
    validatedLearnings: ['Creator prefers walkthrough formats.']
  };
  const candidates = extractKnowledgeCandidates(reportWithDate, mockIdea);
  assert(candidates[0].evidenceReferences[0].timestamp.getTime() === fixedReportDate.getTime(), 'Uses report.createdAt when available');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
