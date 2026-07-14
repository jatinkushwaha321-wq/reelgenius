import { z } from 'zod';

// Preprocess helper for metrics map (maximum 5 keys)
const metricsPreprocess = z.preprocess((val) => {
  if (val === null) return null;
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const keys = Object.keys(val);
    if (keys.length > 5) {
      const truncated = {};
      keys.slice(0, 5).forEach((k) => {
        truncated[k] = val[k];
      });
      return truncated;
    }
  }
  return val;
}, z.record(z.string(), z.number().refine(Number.isFinite)).nullable().optional());

// Gemini evidence output schema
const geminiEvidenceSchema = z.object({
  type: z.enum(['metric', 'attribute', 'comment', 'fact', 'comparative']),
  ref: z.string().min(1).max(20), // "post_001" or "profile"
  fact: z.string().min(1).max(500).trim(),
  metrics: metricsPreprocess,
});

// Preprocess helper for evidence array (maximum 5 items)
const evidencePreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(geminiEvidenceSchema).min(1).max(5));

// Gemini signal output schema
const geminiSignalSchema = z.object({
  existingKey: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/).nullable().optional(),
  displayName: z.string().min(1).max(200).trim(),
  category: z.enum(['audience-engagement', 'content-format', 'creator-style']),
  strength: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  creatorTrait: z.string().min(1).max(500).trim(),
  audienceBehavior: z.string().min(1).max(500).trim(),
  directionImplication: z.string().min(1).max(500).trim(),
  evidence: evidencePreprocess,
});

// Content pillar output schema
const contentPillarSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(300).trim(),
  percentage: z.number().int().min(0).max(100),
});

// Preprocess helper for subNiches (maximum 5 items)
const subNichesPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(z.string().max(100).trim()).min(1).max(5));

// Preprocess helper for contentPillars (maximum 6 items)
const contentPillarsPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 6);
  return val;
}, z.array(contentPillarSchema).min(1).max(6));

// Preprocess helper for interests (maximum 8 items)
const interestsPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 8);
  return val;
}, z.array(z.string().max(100).trim()).max(8).nullable().optional());

// Preprocess helper for painPoints (maximum 5 items)
const painPointsPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(z.string().max(200).trim()).max(5).nullable().optional());

// Preprocess helper for brand tone (maximum 5 items)
const tonePreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(z.string().max(50).trim()).min(1).max(5));

// Preprocess helper for vocabulary (maximum 10 items)
const vocabularyPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 10);
  return val;
}, z.array(z.string().max(100).trim()).max(10).nullable().optional());

// Preprocess helper for brand values (maximum 5 items)
const valuesPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(z.string().max(100).trim()).max(5).nullable().optional());

// Preprocess helper for USPs (maximum 5 items)
const uspPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 5);
  return val;
}, z.array(z.string().max(200).trim()).max(5).nullable().optional());

// Preprocess helper for signals (maximum 10 items)
const signalsPreprocess = z.preprocess((val) => {
  if (val === null) return [];
  if (Array.isArray(val)) return val.slice(0, 10);
  return val;
}, z.array(geminiSignalSchema).min(0).max(10));

// Full Gemini intelligence output schema
export const intelligenceOutputSchema = z.object({
  creatorContext: z.object({
    niche: z.string().min(1).max(200).trim(),
    subNiches: subNichesPreprocess,
    contentPillars: contentPillarsPreprocess,
    audiencePersona: z.object({
      behaviorProfile: z.string().min(1).max(500).trim(),
      interests: interestsPreprocess,
      painPoints: painPointsPreprocess,
    }),
    brandIdentity: z.object({
      tone: tonePreprocess,
      vocabulary: vocabularyPreprocess,
      values: valuesPreprocess,
      uniqueSellingPoints: uspPreprocess,
    }),
    postingFrequency: z.string().min(1).max(200).trim(),
    aiSummary: z.string().min(1).max(2000).trim(),
  }),
  signals: signalsPreprocess,
});
