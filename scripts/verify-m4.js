import { TokenBucketRateLimiter } from '../src/lib/rate-limiter.js';
import { calculateTrend } from '../src/lib/utils/trend.js';
import { aiSignalInputSchema, signalSchema } from '../src/lib/validations/signal.js';
import { aiMemorySchema, aiMemoryUpdateSchema } from '../src/lib/validations/aimemory.js';
import { normalizeMemoryText } from '../src/lib/ai-memory.js';

function runMilestone4Verification() {
  console.log('=== RUNNING DETAILED NIVO MILESTONE 4 AUDIT TESTS ===');

  // --- PART 1: RATE LIMITER ---
  console.log('\n[Limiter Check]');
  const limiter = new TokenBucketRateLimiter(10, 60000);
  const key = 'user_audit_test';
  
  // Consume 10 immediate tokens
  for (let i = 0; i < 10; i++) {
    const res = limiter.checkLimit(key);
    if (!res.allowed) {
      throw new Error(`Rate limiter failed: blocked request ${i + 1} when capacity should remain.`);
    }
  }
  
  // 11th immediate token must be blocked
  const res11 = limiter.checkLimit(key);
  if (res11.allowed) {
    throw new Error('Rate limiter failed: allowed 11th request when limit was configured to 10.');
  }
  console.log('✓ Bounded capacity and blocking behavior verified.');

  // --- PART 2: DETERMINISTIC TREND ---
  console.log('\n[Trend Calculations]');
  const risingObservations = [
    { strength: 20, observedAt: new Date(Date.now() - 3000) },
    { strength: 40, observedAt: new Date(Date.now() - 2000) },
    { strength: 60, observedAt: new Date(Date.now() - 1000) }
  ];
  if (calculateTrend(risingObservations) !== 'rising') {
    throw new Error('Trend linear regression math failed on rising sequence.');
  }

  const fallingObservations = [
    { strength: 90, observedAt: new Date(Date.now() - 4000) },
    { strength: 90, observedAt: new Date(Date.now() - 3000) },
    { strength: 90, observedAt: new Date(Date.now() - 2000) },
    { strength: 50, observedAt: new Date(Date.now() - 1000) },
    { strength: 55, observedAt: new Date() }
  ];
  if (calculateTrend(fallingObservations) !== 'falling') {
    throw new Error('Trend linear regression math failed on falling sequence.');
  }
  console.log('✓ Trend linear regression sorting and slope thresholds verified.');

  // --- PART 3: SIGNAL SCHEMA AND VALIDATION ---
  console.log('\n[Signal Schema]');
  const validAIInput = {
    key: 'content_engagement',
    displayName: 'High Engagement Content',
    category: 'audience-engagement',
    strength: 75,
    confidence: 80,
    creatorTrait: 'Speaks clearly.',
    audienceBehavior: 'Saves video.',
    directionImplication: 'Keep speaking pace.',
    evidence: [
      {
        type: 'fact',
        fact: 'Verified engagement observation.',
        metrics: { saves: 10 }
      }
    ]
  };
  const parseAI = aiSignalInputSchema.safeParse(validAIInput);
  if (!parseAI.success) {
    throw new Error(`aiSignalInputSchema failed on valid input: ${JSON.stringify(parseAI.error)}`);
  }

  // Ensure trend input is stripped or rejected
  const inputWithTrend = { ...validAIInput, trend: 'rising' };
  const parseWithTrend = aiSignalInputSchema.safeParse(inputWithTrend);
  if (parseWithTrend.success && parseWithTrend.data.trend !== undefined) {
    throw new Error('aiSignalInputSchema failed to exclude or strip trend attribute.');
  }
  console.log('✓ Signal schema segregation (AI inputs vs complete internal models) verified.');

  // --- PART 4: AIMEMORY ENGINE TRANSFORMS ---
  console.log('\n[AIMemory Transformations]');
  const rawString = '  Lighting   Basics   and   Design  ';
  const expectedNorm = 'Lighting Basics and Design';
  if (normalizeMemoryText(rawString) !== expectedNorm) {
    throw new Error('normalizeMemoryText failed to collapse internal duplicate whitespace.');
  }
  console.log('✓ String trimming and double-space collapse verified.');

  console.log('\n=== ALL DETAILED INFRASTRUCTURE AUDIT CHECKS PASSED ===');
}

runMilestone4Verification();
