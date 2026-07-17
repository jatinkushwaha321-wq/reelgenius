import { reasoningEngineV2Schema } from '../src/lib/reasoning/reasoning-engine-v2-schema.js';

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

console.log('\n=== REASONING ENGINE V2 SCHEMA TESTS ===\n');

const createValidPayload = () => ({
  situationAssessment: {
    observations: ['Observed pattern A', 'Observed pattern B'],
    emergingPatterns: ['Emerging pattern C']
  },
  identityInterpretation: {
    identityAlignment: 'Creator aligns with developer positioning.',
    reinforcedBeliefs: ['Skills over credentials'],
    creatorStrengths: ['Technical accuracy', 'Practical examples']
  },
  audienceInterpretation: {
    currentState: 'Struggling to build side projects.',
    desiredState: 'Configuring custom workflows independently.',
    audienceTensions: ['Fear of generic tutorial hell']
  },
  strategicDirection: {
    positioningThesis: 'Anchor on technical explanation of backend workflows.',
    strategicGoal: 'Establish authoritative system design voice.'
  },
  opportunityPlanning: [
    {
      title: 'Dockerizing side projects guide',
      creatorPerspective: 'Simplify Docker for beginners',
      audienceProblem: 'Struggling to dockerize locally',
      supportingEvidence: ['High comment count on deployment reels'],
      evidenceStrength: 85
    }
  ],
  generationContract: {
    identityConstraints: ['Do not list generic AI tools'],
    memoryConstraints: ['Avoid resume advice'],
    reasoningConstraints: ['Top Docker tools list is rejected']
  }
});

// 1. Successful Validation
console.log('--- 1. Successful Validation ---');
try {
  const result = reasoningEngineV2Schema.safeParse(createValidPayload());
  assert(result.success === true, 'Valid Reasoning Engine V2 payload parses successfully');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Missing Required Fields
console.log('\n--- 2. Missing Required Fields ---');
try {
  const payload = createValidPayload();
  delete payload.strategicDirection;
  const result = reasoningEngineV2Schema.safeParse(payload);
  assert(result.success === false, 'Schema rejects payload missing strategicDirection');

  const payload2 = createValidPayload();
  delete payload2.situationAssessment.observations;
  const result2 = reasoningEngineV2Schema.safeParse(payload2);
  assert(result2.success === false, 'Schema rejects situationAssessment missing observations');

  const payload3 = createValidPayload();
  payload3.situationAssessment.observations = [];
  const result3 = reasoningEngineV2Schema.safeParse(payload3);
  assert(result3.success === false, 'Schema rejects empty observations array');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Invalid Opportunity Structure
console.log('\n--- 3. Invalid Opportunity Structure ---');
try {
  const payload = createValidPayload();
  payload.opportunityPlanning = [];
  const result = reasoningEngineV2Schema.safeParse(payload);
  assert(result.success === false, 'Schema rejects empty opportunityPlanning array');

  const payload2 = createValidPayload();
  payload2.opportunityPlanning[0].title = '';
  const result2 = reasoningEngineV2Schema.safeParse(payload2);
  assert(result2.success === false, 'Schema rejects empty opportunity title');

  const payload3 = createValidPayload();
  delete payload3.opportunityPlanning[0].audienceProblem;
  const result3 = reasoningEngineV2Schema.safeParse(payload3);
  assert(result3.success === false, 'Schema rejects opportunity missing audienceProblem');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. evidenceStrength Boundaries
console.log('\n--- 4. evidenceStrength Boundaries ---');
try {
  const payloadValidMin = createValidPayload();
  payloadValidMin.opportunityPlanning[0].evidenceStrength = 0;
  assert(reasoningEngineV2Schema.safeParse(payloadValidMin).success === true, 'Accepts strength of 0');

  const payloadValidMax = createValidPayload();
  payloadValidMax.opportunityPlanning[0].evidenceStrength = 100;
  assert(reasoningEngineV2Schema.safeParse(payloadValidMax).success === true, 'Accepts strength of 100');

  const payloadNegative = createValidPayload();
  payloadNegative.opportunityPlanning[0].evidenceStrength = -5;
  assert(reasoningEngineV2Schema.safeParse(payloadNegative).success === false, 'Rejects negative strength');

  const payloadTooLarge = createValidPayload();
  payloadTooLarge.opportunityPlanning[0].evidenceStrength = 101;
  assert(reasoningEngineV2Schema.safeParse(payloadTooLarge).success === false, 'Rejects strength > 100');

  const payloadFloat = createValidPayload();
  payloadFloat.opportunityPlanning[0].evidenceStrength = 75.5;
  assert(reasoningEngineV2Schema.safeParse(payloadFloat).success === false, 'Rejects non-integer strength values');
} catch (err) {
  console.error(err);
  fail++;
}

// 5. Constraint Namespace Validation
console.log('\n--- 5. Constraint Namespace Validation ---');
try {
  const payload = createValidPayload();
  payload.generationContract.identityConstraints = ['Constraint 1'];
  payload.generationContract.memoryConstraints = ['Constraint 2'];
  payload.generationContract.reasoningConstraints = ['Constraint 3'];
  const result = reasoningEngineV2Schema.safeParse(payload);
  assert(result.success === true, 'Accepts valid constraints across all namespaces');

  const payloadInvalidType = createValidPayload();
  payloadInvalidType.generationContract.identityConstraints = 'Not an array';
  const resultInvalidType = reasoningEngineV2Schema.safeParse(payloadInvalidType);
  assert(resultInvalidType.success === false, 'Rejects constraints that are not arrays');

  const payloadInvalidElement = createValidPayload();
  payloadInvalidElement.generationContract.memoryConstraints = [123];
  const resultInvalidElement = reasoningEngineV2Schema.safeParse(payloadInvalidElement);
  assert(resultInvalidElement.success === false, 'Rejects non-string array elements in constraints');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
