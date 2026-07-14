import { z } from 'zod';

// Regex constants
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const semanticKeyRegex = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const metricKeyRegex = /^[a-zA-Z0-9]+$/;

// Flat numeric-only evidence metrics schema (Correction 1)
const metricsSchema = z.record(
  z.string().regex(metricKeyRegex, { message: 'Invalid metric key format' }),
  z.number().refine((val) => Number.isFinite(val), {
    message: 'Metric values must be finite numbers (no NaN or Infinity)',
  })
).refine((val) => {
  if (!val) return true;
  return Object.keys(val).length <= 5;
}, {
  message: 'Metrics map cannot exceed 5 keys',
});

// Evidence subdocument validation rules (Correction 3)
const evidenceSchema = z.object({
  type: z.enum(['metric', 'attribute', 'comment', 'fact', 'comparative']),
  sourceId: z.string().nullable().optional(),
  fact: z.string().min(1, 'Fact is required').max(500, 'Fact cannot exceed 500 characters').trim(),
  metrics: metricsSchema.optional(),
});

// Observation subdocument validation rules (Correction 2)
const observationSchema = z.object({
  strength: z.number().min(0).max(100).refine(Number.isFinite),
  confidence: z.number().min(0).max(100).refine(Number.isFinite),
  observedAt: z.coerce.date(), // Automatically coerces JSON date strings / milliseconds to Date objects
});

// 1. AI/Generated signal input schema (does NOT include trend or observation history)
export const aiSignalInputSchema = z.object({
  key: z.string().regex(semanticKeyRegex, { message: 'Invalid semantic key format' }),
  displayName: z.string().min(1, 'Display name is required').trim(),
  category: z.enum(['audience-engagement', 'content-format', 'creator-style']),
  strength: z.number().min(0).max(100).refine(Number.isFinite),
  confidence: z.number().min(0).max(100).refine(Number.isFinite),
  creatorTrait: z.string().min(1, 'Creator trait description is required').trim(),
  audienceBehavior: z.string().min(1, 'Audience behavior description is required').trim(),
  directionImplication: z.string().min(1, 'Direction implication description is required').trim(),
  evidence: z.array(evidenceSchema).max(5, 'Evidence array cannot exceed 5 items').optional(),
});

// 2. Persisted internal signal schema (fully aligns with Signal.js model, containing trend)
export const signalSchema = z.object({
  userId: z.string().regex(objectIdRegex, { message: 'Invalid User ID format' }),
  profileId: z.string().regex(objectIdRegex, { message: 'Invalid Profile ID format' }),
  key: z.string().regex(semanticKeyRegex, { message: 'Invalid semantic key format' }),
  displayName: z.string().min(1, 'Display name is required').trim(),
  category: z.enum(['audience-engagement', 'content-format', 'creator-style']),
  strength: z.number().min(0).max(100).refine(Number.isFinite),
  confidence: z.number().min(0).max(100).refine(Number.isFinite),
  trend: z.enum(['unknown', 'rising', 'stable', 'falling']),
  creatorTrait: z.string().min(1, 'Creator trait description is required').trim(),
  audienceBehavior: z.string().min(1, 'Audience behavior description is required').trim(),
  directionImplication: z.string().min(1, 'Direction implication description is required').trim(),
  evidence: z.array(evidenceSchema).max(5, 'Evidence array cannot exceed 5 items').optional(),
  observationHistory: z.array(observationSchema).max(10, 'Observation history cannot exceed 10 items').optional(),
});
