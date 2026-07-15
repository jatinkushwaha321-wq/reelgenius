import { intelligenceResponseSchema } from '../src/lib/intelligence/intelligence-response-schema.js';
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

// Helper to recursively check for forbidden keys in a schema object
function hasForbiddenKeys(obj, keys) {
  if (!obj || typeof obj !== 'object') return false;
  for (const k of Object.keys(obj)) {
    if (keys.includes(k)) return true;
    if (hasForbiddenKeys(obj[k], keys)) return true;
  }
  return false;
}

console.log('\n=== PROVIDER SCHEMA CONTRACT ALIGNMENT TEST ===\n');

try {
  // B. Top-level provider schema requires creatorContext and signals.
  assert(
    intelligenceResponseSchema.required.includes('creatorContext') &&
    intelligenceResponseSchema.required.includes('signals'),
    'B: Provider schema requires creatorContext and signals'
  );

  const creatorContextProps = intelligenceResponseSchema.properties.creatorContext.properties;
  const signalProps = intelligenceResponseSchema.properties.signals.items.properties;

  // C. signals is an ARRAY of OBJECT items.
  assert(
    intelligenceResponseSchema.properties.signals.type === 'ARRAY' &&
    intelligenceResponseSchema.properties.signals.items.type === 'OBJECT',
    'C: signals is an ARRAY of OBJECT items'
  );

  // D. Every provider Signal requires evidence.
  assert(
    intelligenceResponseSchema.properties.signals.items.required.includes('evidence'),
    'D: Signal items require evidence'
  );

  // E. evidence is an ARRAY of OBJECT items.
  assert(
    signalProps.evidence.type === 'ARRAY' &&
    signalProps.evidence.items.type === 'OBJECT',
    'E: evidence is an ARRAY of OBJECT items'
  );

  // F. Evidence item requires type, ref, and fact.
  const evidenceRequired = signalProps.evidence.items.required;
  assert(
    evidenceRequired.includes('type') &&
    evidenceRequired.includes('ref') &&
    evidenceRequired.includes('fact'),
    'F: Evidence items require type, ref, and fact'
  );

  // G-J: Provider schema does NOT contain detailed constraints.
  const forbiddenKeys = ['maxLength', 'minimum', 'maximum', 'maxItems', 'minItems', 'enum'];
  const hasForbidden = hasForbiddenKeys(intelligenceResponseSchema, forbiddenKeys);
  assert(
    !hasForbidden,
    'G-J: Provider schema does NOT contain maxLength, minimum, maximum, maxItems, minItems, or enum'
  );

  // K-P: Zod still rejects invalid payloads
  const getBaseValidPayload = () => ({
    creatorContext: {
      niche: 'Tech',
      subNiches: ['Coding'],
      contentPillars: [{ name: 'Tutorials', description: 'Tech tutorials', percentage: 100 }],
      audiencePersona: {
        behaviorProfile: 'Engages with code.',
      },
      brandIdentity: {
        tone: ['Professional'],
      },
      postingFrequency: 'Weekly',
      aiSummary: 'A tech creator.',
      strategicDirection: 'Lean into technical tutorials.'
    },
    signals: [
      {
        existingKey: null,
        displayName: 'Reels Outperform Images',
        category: 'content-format',
        strength: 85,
        confidence: 90,
        creatorTrait: 'Posts mostly reels',
        audienceBehavior: 'Higher engagement on reels',
        directionImplication: 'Lean into reels',
        evidence: [
          {
            type: 'metric',
            ref: 'post_001',
            fact: 'Has 50k views',
            metrics: { views: 50000 }
          }
        ]
      }
    ]
  });

  const validPayload = getBaseValidPayload();
  assert(intelligenceOutputSchema.safeParse(validPayload).success, 'Valid evidence accepted');

  const omittedPayload = getBaseValidPayload();
  delete omittedPayload.signals[0].evidence;
  assert(!intelligenceOutputSchema.safeParse(omittedPayload).success, 'K: Zod still rejects omitted evidence');

  const emptyPayload = getBaseValidPayload();
  emptyPayload.signals[0].evidence = [];
  assert(!intelligenceOutputSchema.safeParse(emptyPayload).success, 'L: Zod still rejects empty evidence');

  const frequencyPayload = getBaseValidPayload();
  frequencyPayload.creatorContext.postingFrequency = 'a'.repeat(201);
  assert(!intelligenceOutputSchema.safeParse(frequencyPayload).success, 'M: Zod still rejects postingFrequency over 200 chars');

  const boundPayload = getBaseValidPayload();
  boundPayload.signals[0].strength = 101;
  assert(!intelligenceOutputSchema.safeParse(boundPayload).success, 'N: Zod still rejects strength/confidence outside 0-100');

  const enumCatPayload = getBaseValidPayload();
  enumCatPayload.signals[0].category = 'invalid-category';
  assert(!intelligenceOutputSchema.safeParse(enumCatPayload).success, 'O: Zod still rejects invalid category enum');

  const enumEvPayload = getBaseValidPayload();
  enumEvPayload.signals[0].evidence[0].type = 'invalid-type';
  assert(!intelligenceOutputSchema.safeParse(enumEvPayload).success, 'P: Zod still rejects invalid evidence type enum');

  const strategicDirPayload = getBaseValidPayload();
  delete strategicDirPayload.creatorContext.strategicDirection;
  const parsed = intelligenceOutputSchema.safeParse(strategicDirPayload);
  assert(parsed.success && parsed.data.creatorContext.strategicDirection === '', 'Q: strategicDirection remains optional/provider-compatible and Zod behavior is preserved');

} catch (err) {
  console.error(err);
  assert(false, 'Unexpected test execution error');
}

console.log(`\nTotals: ${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
