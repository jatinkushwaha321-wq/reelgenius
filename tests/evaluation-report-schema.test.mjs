import { evaluationReportSchema } from '../src/lib/evaluator/evaluation-report-schema.js';

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

console.log('\n=== EVALUATION REPORT SCHEMA TESTS ===\n');

const createValidPayload = () => ({
  identityAlignment: {
    score: 85,
    explanation: 'Matches the creator tone and tech skills niche.'
  },
  reasoningAlignment: {
    score: 90,
    explanation: 'Aligned with technical system design thesis.'
  },
  opportunityFidelity: {
    score: 95,
    explanation: 'Direct execution of deployment opportunites.'
  },
  generationContractCompliance: {
    score: 100,
    explanation: 'Violated zero active constraints.',
    violatedConstraints: []
  },
  audienceAlignment: {
    score: 80,
    explanation: 'Addresses key beginner setup frustration.'
  },
  novelty: {
    score: 75,
    explanation: 'Different topic from last 10 posts.'
  },
  strategicValue: {
    score: 88,
    explanation: 'Helps solidify backend authority.'
  },
  overallVerdict: {
    recommendation: 'APPROVE',
    summary: 'High strategic value, fully aligned.'
  },
  validatedLearnings: ['Clear code examples get higher saves'],
  rejectionReasons: []
});

// 1. Successful Validation
console.log('--- 1. Successful Validation ---');
try {
  const result = evaluationReportSchema.safeParse(createValidPayload());
  assert(result.success === true, 'Valid evaluation report payload parses successfully');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Missing Required Fields
console.log('\n--- 2. Missing Required Fields ---');
try {
  const payloadMissingVerdict = createValidPayload();
  delete payloadMissingVerdict.overallVerdict;
  assert(evaluationReportSchema.safeParse(payloadMissingVerdict).success === false, 'Rejects payload missing overallVerdict');

  const payloadMissingScore = createValidPayload();
  delete payloadMissingScore.identityAlignment.score;
  assert(evaluationReportSchema.safeParse(payloadMissingScore).success === false, 'Rejects payload missing identityAlignment score');

  const payloadMissingExplanation = createValidPayload();
  delete payloadMissingExplanation.strategicValue.explanation;
  assert(evaluationReportSchema.safeParse(payloadMissingExplanation).success === false, 'Rejects payload missing strategicValue explanation');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Invalid Score Ranges
console.log('\n--- 3. Invalid Score Ranges ---');
try {
  const payloadNegative = createValidPayload();
  payloadNegative.identityAlignment.score = -1;
  assert(evaluationReportSchema.safeParse(payloadNegative).success === false, 'Rejects score < 0');

  const payloadTooLarge = createValidPayload();
  payloadTooLarge.audienceAlignment.score = 101;
  assert(evaluationReportSchema.safeParse(payloadTooLarge).success === false, 'Rejects score > 100');

  const payloadFloat = createValidPayload();
  payloadFloat.novelty.score = 85.5;
  assert(evaluationReportSchema.safeParse(payloadFloat).success === false, 'Rejects non-integer float score values');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Invalid Recommendation Values
console.log('\n--- 4. Invalid Recommendation Values ---');
try {
  const payloadInvalidRec = createValidPayload();
  payloadInvalidRec.overallVerdict.recommendation = 'MAYBE';
  assert(evaluationReportSchema.safeParse(payloadInvalidRec).success === false, 'Rejects recommendation values other than APPROVE/REJECT');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Validated Learnings Structure
console.log('\n--- 5. Validated Learnings Structure ---');
try {
  const payloadNonArray = createValidPayload();
  payloadNonArray.validatedLearnings = 'not an array';
  assert(evaluationReportSchema.safeParse(payloadNonArray).success === false, 'Rejects non-array validatedLearnings');

  const payloadNonStringArray = createValidPayload();
  payloadNonStringArray.validatedLearnings = [123];
  assert(evaluationReportSchema.safeParse(payloadNonStringArray).success === false, 'Rejects non-string element in validatedLearnings array');
} catch (err) {
  console.error(err);
  fail++;
}

// 6. Rejection Reasons Validation
console.log('\n--- 6. Rejection Reasons Validation ---');
try {
  const payloadNonArray = createValidPayload();
  payloadNonArray.rejectionReasons = 'not an array';
  assert(evaluationReportSchema.safeParse(payloadNonArray).success === false, 'Rejects non-array rejectionReasons');

  const payloadNonStringArray = createValidPayload();
  payloadNonStringArray.rejectionReasons = [null];
  assert(evaluationReportSchema.safeParse(payloadNonStringArray).success === false, 'Rejects non-string element in rejectionReasons array');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
