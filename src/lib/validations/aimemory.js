import { z } from 'zod';
import { AIMEMORY_LIMITS } from '../constants/ai-memory.js';

// MongoDB ObjectId Regex validation constant
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Base schema properties with whitespace normalization and length boundaries
const creatorSummarySchema = z.string()
  .max(AIMEMORY_LIMITS.CREATOR_SUMMARY_MAX_LENGTH, 'Creator summary exceeds maximum length limit')
  .trim()
  .refine((val) => val.trim().length > 0 || val === '', {
    message: 'Creator summary cannot be whitespace-only',
  });

const topicSchema = z.string()
  .trim()
  .min(1, 'Topic cannot be empty or whitespace-only')
  .max(AIMEMORY_LIMITS.TOPIC_MAX_LENGTH, 'Topic exceeds maximum length limit');

const hookSchema = z.string()
  .trim()
  .min(1, 'Hook cannot be empty or whitespace-only')
  .max(AIMEMORY_LIMITS.HOOK_MAX_LENGTH, 'Hook exceeds maximum length limit');

const scriptSummarySchema = z.string()
  .trim()
  .min(1, 'Script summary cannot be empty or whitespace-only')
  .max(AIMEMORY_LIMITS.SCRIPT_SUMMARY_MAX_LENGTH, 'Script summary exceeds maximum length limit');

const pillarSchema = z.string()
  .trim()
  .min(1, 'Content pillar cannot be empty or whitespace-only')
  .max(AIMEMORY_LIMITS.PILLAR_MAX_LENGTH, 'Content pillar exceeds maximum length limit');

// 1. Full internal schema matching database structure
export const aiMemorySchema = z.object({
  userId: z.string().regex(objectIdRegex, { message: 'Invalid User ID format' }),
  profileId: z.string().regex(objectIdRegex, { message: 'Invalid Profile ID format' }),
  creatorSummary: creatorSummarySchema.optional().default(''),
  recentTopics: z.array(topicSchema).max(AIMEMORY_LIMITS.TOPICS_MAX_COUNT).optional().default([]),
  recentHooks: z.array(hookSchema).max(AIMEMORY_LIMITS.HOOKS_MAX_COUNT).optional().default([]),
  recentScriptSummaries: z.array(scriptSummarySchema).max(AIMEMORY_LIMITS.SCRIPT_SUMMARIES_MAX_COUNT).optional().default([]),
  contentPillars: z.array(pillarSchema).max(AIMEMORY_LIMITS.PILLARS_MAX_COUNT).optional().default([]),
});

// 2. Update schema (explicity excludes userId and profileId to prevent ownership overwrites)
export const aiMemoryUpdateSchema = z.object({
  creatorSummary: creatorSummarySchema.optional(),
  recentTopics: z.array(topicSchema).max(AIMEMORY_LIMITS.TOPICS_MAX_COUNT).optional(),
  recentHooks: z.array(hookSchema).max(AIMEMORY_LIMITS.HOOKS_MAX_COUNT).optional(),
  recentScriptSummaries: z.array(scriptSummarySchema).max(AIMEMORY_LIMITS.SCRIPT_SUMMARIES_MAX_COUNT).optional(),
  contentPillars: z.array(pillarSchema).max(AIMEMORY_LIMITS.PILLARS_MAX_COUNT).optional(),
}).strict();
