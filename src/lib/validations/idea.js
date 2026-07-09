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

export const ideaSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format'),
  profileId: z.string().regex(objectIdRegex, 'Invalid Profile ID format'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),
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
      'idea',
      'scripted',
      'shooting',
      'editing',
      'scheduled',
      'published',
      'performance',
    ])
    .default('idea'),
  scheduledFor: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()).nullable().optional(),
  publishedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date()).nullable().optional(),
  tags: z.array(z.string().max(50).trim()).optional(),
  isFavorited: z.boolean().optional(),
  notes: z.string().trim().optional(),
  coverConcepts: z.array(coverConceptSchema).optional(),
});
