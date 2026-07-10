import { z } from 'zod';

// MongoDB ObjectId Regex matching standard hexadecimal length of 24
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const activityLogSchema = z.object({
  userId: z
    .string()
    .regex(objectIdRegex, { message: 'Invalid User ID format' }),
  action: z.enum([
    'user_registered',
    'user_logged_in',
    'user_logged_out',
    'profile_analyzed',
    'profile_updated',
    'strategy_generated',
    'idea_created',
    'idea_updated',
    'idea_deleted',
    'script_generated',
    'script_updated',
    'script_deleted',
    'cover_generated',
    'pipeline_status_changed',
  ], { message: 'Invalid action type' }),
  entityType: z.enum(['user', 'profile', 'idea', 'script', 'calendar', 'cover']).nullable().optional(),
  entityId: z
    .string()
    .regex(objectIdRegex, { message: 'Invalid Entity ID format' })
    .nullable()
    .optional(),
  metadata: z
    .record(z.any())
    .optional(),
});
