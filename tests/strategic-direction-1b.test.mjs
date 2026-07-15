import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseIntelligenceOutput } from '../src/lib/intelligence/parse-intelligence-output.js';
import { intelligenceOutputSchema } from '../src/lib/validations/intelligence.js';

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

console.log('\n=== STRATEGIC-DIRECTION-1B: Validation & Parser Semantics ===\n');

const mockRefMap = new Map([
  ['post_001', { type: 'content', id: '111' }],
  ['post_002', { type: 'content', id: '222' }],
  ['profile', { type: 'profile', id: '333' }]
]);

const existingSignalsMap = new Map();

const getValidRawOutput = () => ({
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
    strategicDirection: 'Lean into specific technical explanations while maintaining a supportive tone.'
  },
  signals: []
});

// 1 & 7. Valid strategicDirection passes validation and parse
try {
  const raw = getValidRawOutput();
  const result = parseIntelligenceOutput(raw, mockRefMap, 'full', existingSignalsMap);
  assert(result.creatorContext.strategicDirection === raw.creatorContext.strategicDirection, '1 & 7: Valid strategicDirection passes validation and parse');
} catch (e) {
  assert(false, '1 & 7: Valid strategicDirection passes validation and parse - threw error');
}

// 2. Empty string passes validation
try {
  const raw = getValidRawOutput();
  raw.creatorContext.strategicDirection = '';
  const result = parseIntelligenceOutput(raw, mockRefMap, 'full', existingSignalsMap);
  assert(result.creatorContext.strategicDirection === '', '2: Empty string passes validation');
} catch (e) {
  assert(false, '2: Empty string passes validation - threw error');
}

// 3 & 4. Omitted or null strategicDirection normalizes to empty string
try {
  const rawOmitted = getValidRawOutput();
  delete rawOmitted.creatorContext.strategicDirection;
  const resultOmitted = parseIntelligenceOutput(rawOmitted, mockRefMap, 'full', existingSignalsMap);
  assert(resultOmitted.creatorContext.strategicDirection === '', '3: Omitted strategicDirection normalizes to empty string');

  const rawNull = getValidRawOutput();
  rawNull.creatorContext.strategicDirection = null;
  const resultNull = parseIntelligenceOutput(rawNull, mockRefMap, 'full', existingSignalsMap);
  assert(resultNull.creatorContext.strategicDirection === '', '4: Null strategicDirection normalizes to empty string');
} catch (e) {
  assert(false, '3 & 4: Normalization threw error');
}

// 5 & 6. Max length and whitespace trimming
try {
  const raw = getValidRawOutput();
  raw.creatorContext.strategicDirection = '   Short direction   ';
  const result = parseIntelligenceOutput(raw, mockRefMap, 'full', existingSignalsMap);
  assert(result.creatorContext.strategicDirection === 'Short direction', '6: Whitespace trimming works');

  const longString = 'a'.repeat(1501);
  raw.creatorContext.strategicDirection = longString;
  let didThrow = false;
  try {
    parseIntelligenceOutput(raw, mockRefMap, 'full', existingSignalsMap);
  } catch (err) {
    didThrow = true;
  }
  assert(didThrow, '5: Max length validation works');
} catch (e) {
  assert(false, '5 & 6 threw unexpected error');
}

// 8 & 9. Epistemic violation in strategicDirection rejects the entire output
try {
  const raw = getValidRawOutput();
  // Use an explicitly forbidden pattern
  raw.creatorContext.strategicDirection = 'The audience answered the question in the comments.';
  
  let error;
  try {
    parseIntelligenceOutput(raw, mockRefMap, 'full', existingSignalsMap);
  } catch (e) {
    error = e;
  }
  
  assert(error !== undefined && error.code === 'EPISTEMIC_VIOLATION' && error.fieldPath === 'creatorContext.strategicDirection', '8 & 9: Epistemic violation in strategicDirection rejects the entire output');
} catch (e) {
  assert(false, '8 & 9 threw unexpected error');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptContent = fs.readFileSync(path.join(__dirname, '../src/lib/intelligence/build-intelligence-prompt.js'), 'utf8');

assert(promptContent.includes("WHERE to lean next over a 2-4 week strategic horizon"), '15 & 16: Provider contract specifies 2-4 week horizon and WHERE to lean');
assert(promptContent.includes("must NOT summarize the creator"), '17: No creator summary duplication');
assert(promptContent.includes("must NOT repeat individual Signals as a concatenated list"), '18: No Signal concatenation');
assert(promptContent.includes("must NOT become a content calendar"), '19: No content calendar');
assert(promptContent.includes("must NOT predict views, reach, engagement"), '20: No performance prediction');
assert(promptContent.includes("set 'creatorContext.strategicDirection' to EXACTLY an empty string"), '21: zero-Signal direction must be empty string');
assert(promptContent.includes("acknowledge that the strategic direction is tentative"), '22: sparse evidence requires tentative framing');
assert(promptContent.includes("may provide full strategic synthesis grounded in the identified signals"), '23: full evidence permits synthesis');

const outputContractContent = fs.readFileSync(path.join(__dirname, '../src/lib/intelligence/run-intelligence.js'), 'utf8');
assert(outputContractContent.includes("strategic direction synthesis; follow the strategic direction and evidence-tier instructions in the prompt"), '24: Strategic direction synthesis is explicitly described in contract');

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
