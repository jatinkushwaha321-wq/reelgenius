import { z } from 'zod';

export const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const datePreprocess = z.preprocess((arg) => {
  if (typeof arg === 'string' || arg instanceof Date) {
    const date = new Date(arg);
    if (!isNaN(date.getTime())) return date;
  }
  return arg;
}, z.date());

export const evidenceReferenceSchema = z.object({
  evaluationReportId: z.string().regex(objectIdRegex, 'Invalid Evaluation Report ID format'),
  candidateIdeaId: z.string().regex(objectIdRegex, 'Invalid Candidate Idea ID format').optional().nullable(),
  ideaTitle: z.string().trim().min(1, 'Idea title is required'),
  timestamp: datePreprocess,
  verdict: z.enum(['APPROVE', 'REJECT']),
});

export const knowledgeCategorySchema = z.enum([
  'Creator',
  'Audience',
  'Strategy',
  'Experiment',
  'Evolution',
]);

export const knowledgeStatusSchema = z.enum([
  'CANDIDATE',
  'VALIDATED',
  'DEPRECATED',
]);

export const knowledgeStrengthSchema = z.number().int().min(0, 'Strength must be at least 0').max(100, 'Strength cannot exceed 100');

export const knowledgeCandidateSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format'),
  profileId: z.string().regex(objectIdRegex, 'Invalid Profile ID format'),
  normalizedStatement: z.string().trim().min(1, 'Normalized statement is required'),
  category: knowledgeCategorySchema,
  evidenceReferences: z.array(evidenceReferenceSchema).min(1, 'At least one evidence reference is required'),
  lifecycleStatus: z.literal('CANDIDATE').default('CANDIDATE'),
  createdAt: datePreprocess,
  updatedAt: datePreprocess,
  metadata: z.object({}).catchall(z.unknown()).optional().default({}),
});

export const validatedKnowledgeSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format'),
  profileId: z.string().regex(objectIdRegex, 'Invalid Profile ID format'),
  normalizedStatement: z.string().trim().min(1, 'Normalized statement is required'),
  category: knowledgeCategorySchema,
  evidenceReferences: z.array(evidenceReferenceSchema).min(1, 'At least one evidence reference is required'),
  strengthMetrics: z.object({
    strength: knowledgeStrengthSchema,
    supportCount: z.number().int().min(1, 'Support count must be at least 1'),
    contradictionCount: z.number().int().min(0, 'Contradiction count cannot be negative'),
  }),
  contradictionHistory: z.array(evidenceReferenceSchema).default([]),
  lifecycleStatus: z.enum(['VALIDATED', 'DEPRECATED']).default('VALIDATED'),
  createdAt: datePreprocess,
  updatedAt: datePreprocess,
  metadata: z.object({}).catchall(z.unknown()).optional().default({}),
});

export const lightweightKnowledgeSchema = z.object({
  id: z.string().regex(objectIdRegex, 'Invalid item ID format'),
  normalizedStatement: z.string().trim().min(1, 'Normalized statement is required'),
  category: knowledgeCategorySchema,
  strength: knowledgeStrengthSchema,
  metadata: z.object({}).catchall(z.unknown()).optional().default({}),
});

export const knowledgeRetrievalSchema = z.object({
  groupedKnowledge: z.object({
    Creator: z.array(lightweightKnowledgeSchema).default([]),
    Audience: z.array(lightweightKnowledgeSchema).default([]),
    Strategy: z.array(lightweightKnowledgeSchema).default([]),
    Experiment: z.array(lightweightKnowledgeSchema).default([]),
    Evolution: z.array(lightweightKnowledgeSchema).default([]),
  }).default({}),
  rankingMetadata: z.array(
    z.object({
      itemId: z.string().regex(objectIdRegex, 'Invalid item ID format'),
      score: z.number().min(0).max(100),
      reasons: z.array(z.string().trim()).default([]),
    })
  ).default([]),
  retrievedAt: datePreprocess,
  summaryMetadata: z.object({
    totalRetrieved: z.number().int().min(0),
    categoriesPresent: z.array(knowledgeCategorySchema).default([]),
  }),
});
