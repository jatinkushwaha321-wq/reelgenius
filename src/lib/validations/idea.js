import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const coverConceptSchema = z.object({
  concept: z.string().max(500).trim().optional(),
  headline: z.string().max(100).trim().optional(),
  layout: z.string().max(200).trim().optional(),
  colorPalette: z.array(z.string().max(10).trim()).optional(),
  composition: z.string().max(500).trim().optional(),
  expressionSuggestion: z.string().max(200).trim().optional(),
  aiImagePrompt: z.string().max(1000).trim().optional(),
});

const datePreprocess = z.preprocess((arg) => {
  if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
}, z.date()).nullable().optional();

const sourceSignalSnapshotSchema = z.object({
  key: z.string().trim(),
  displayName: z.string().trim(),
  strength: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  trend: z.enum(['unknown', 'rising', 'stable', 'falling']),
  directionImplication: z.string().trim(),
});

export const ideaSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format'),
  profileId: z.string().regex(objectIdRegex, 'Invalid Profile ID format'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
  topic: z.string().max(100, 'Topic cannot exceed 100 characters').trim().optional().default(''),
  description: z.string().trim().optional(),
  format: z
    .enum([
      'talking-head',
      'tutorial',
      'pov',
      'broll',
      'storytime',
      'listicle',
      'challenge',
      'behind-the-scenes',
      'other',
    ])
    .default('other'),
  contentPillar: z.string().max(100).trim().optional(),
  hook: z.string().max(500).trim().optional(),
  estimatedReach: z.enum(['viral', 'growth', 'niche']).default('growth'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  estimatedDuration: z.string().max(50).trim().optional(),
  status: z
    .enum([
      'candidate',
      'idea',
      'scripted',
      'shooting',
      'editing',
      'scheduled',
      'published',
      'performance',
    ])
    .default('idea'),
  scheduledFor: datePreprocess,
  publishedAt: datePreprocess,
  tags: z.array(z.string().max(50).trim()).optional(),
  isFavorited: z.boolean().optional(),
  notes: z.string().trim().optional(),
  coverConcepts: z.array(coverConceptSchema).optional(),
  generationRunId: z.string().trim().nullable().optional(),
  sourceSignalKeys: z.array(z.string().trim()).optional().default([]),
  sourceSignalSnapshots: z.array(sourceSignalSnapshotSchema).optional().default([]),
  directionSnapshot: z.string().max(500).trim().optional().default(''),
  whyNow: z.string().max(300).trim().optional().default(''),
  noveltyReason: z.string().max(300).trim().optional().default(''),
  intelligenceAnalyzedAt: datePreprocess,
  generatedAt: datePreprocess,
  generationModel: z.string().trim().optional().default(''),
});
