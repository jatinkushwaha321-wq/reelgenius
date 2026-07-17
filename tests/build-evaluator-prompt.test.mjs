import { buildEvaluatorPrompt } from '../src/lib/evaluator/build-evaluator-prompt.js';

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

console.log('\n=== BUILD EVALUATOR PROMPT TESTS ===\n');

const mockCreatorIdentity = {
  identity: { displayName: 'Mock Evaluator Creator', niche: 'AI Engineering' }
};

const mockReasoningContext = {
  strategicDirection: { positioningThesis: 'Metrics focus' },
  opportunityPlanning: []
};

const mockCandidate = {
  title: 'Is coding dead?',
  concept: 'Debunking code generation hype.'
};

// 1. Prompt Compilation Success
console.log('--- 1. Prompt Compilation Success ---');
try {
  const prompt = buildEvaluatorPrompt({
    creatorIdentity: mockCreatorIdentity,
    reasoningContext: mockReasoningContext,
    candidate: mockCandidate
  });

  assert(typeof prompt === 'string' && prompt.length > 0, 'buildEvaluatorPrompt returns a non-empty string prompt');
  assert(prompt.includes('Mock Evaluator Creator'), 'Creator identity is serialized in context block');
  assert(prompt.includes('Metrics focus'), 'Reasoning context is serialized in context block');
  assert(prompt.includes('Is coding dead?'), 'Candidate idea is serialized in context block');
} catch (err) {
  console.error(err);
  fail++;
}

// 2. Required Sections
console.log('\n--- 2. Required Sections ---');
try {
  const prompt = buildEvaluatorPrompt({
    creatorIdentity: mockCreatorIdentity,
    reasoningContext: mockReasoningContext,
    candidate: mockCandidate
  });

  assert(prompt.includes('1. SYSTEM ROLE'), 'Prompt contains 1. SYSTEM ROLE');
  assert(prompt.includes('2. CREATOR IDENTITY'), 'Prompt contains 2. CREATOR IDENTITY');
  assert(prompt.includes('3. REASONING CONTRACT'), 'Prompt contains 3. REASONING CONTRACT');
  assert(prompt.includes('4. CANDIDATE IDEA'), 'Prompt contains 4. CANDIDATE IDEA');
  assert(prompt.includes('5. EVALUATION TASK'), 'Prompt contains 5. EVALUATION TASK');
  assert(prompt.includes('6. OUTPUT CONTRACT'), 'Prompt contains 6. OUTPUT CONTRACT');
  assert(prompt.includes('7. RULES'), 'Prompt contains 7. RULES');
} catch (err) {
  console.error(err);
  fail++;
}

// 3. Evaluation Dimensions & Output Contract Instructions
console.log('\n--- 3. Evaluation Dimensions & Output Instructions ---');
try {
  const prompt = buildEvaluatorPrompt({
    creatorIdentity: mockCreatorIdentity,
    reasoningContext: mockReasoningContext,
    candidate: mockCandidate
  });

  assert(prompt.includes('Reasoning Contract Validation'), 'Task details include Reasoning Contract Validation');
  assert(prompt.includes('Opportunity Fidelity'), 'Task details include Opportunity Fidelity');
  assert(prompt.includes('evaluation-report-schema.js'), 'Prompt references evaluation-report-schema.js');
  assert(prompt.includes('identityAlignment'), 'Output contract includes identityAlignment');
  assert(prompt.includes('generationContractCompliance'), 'Output contract includes generationContractCompliance');
} catch (err) {
  console.error(err);
  fail++;
}

// 4. Evaluation Rules
console.log('\n--- 4. Evaluation Rules ---');
try {
  const prompt = buildEvaluatorPrompt({
    creatorIdentity: mockCreatorIdentity,
    reasoningContext: mockReasoningContext,
    candidate: mockCandidate
  });

  assert(prompt.includes('Never rewrite or suggest replacements'), 'Rules explicitly ban suggestions/rewriting');
  assert(prompt.includes('Never modify Creator Identity'), 'Rules explicitly ban identity modifications');
  assert(prompt.includes('Never reinterpret strategic reasoning'), 'Rules explicitly ban reasoning reinterpretation');
  assert(prompt.includes('Judge only the supplied candidate idea'), 'Rules explicitly command focusing only on the candidate');
} catch (err) {
  console.error(err);
  fail++;
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
