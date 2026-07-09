import connectDB from './mongodb';
import ActivityLog from '@/models/ActivityLog';
import { activityLogSchema } from '@/lib/validations/activity';

/**
 * Reusable server-side utility to log user activities in the database.
 * This utility should always be awaited (`await logActivity(...)`) to ensure 
 * deterministic requests. Since it handles its own database and validation errors 
 * internally, it will never throw or crash the main request flow.
 *
 * @param {string} userId - The ID of the authenticated user performing the action
 * @param {string} action - The action enum key (e.g. 'user_logged_in')
 * @param {string|null} [entityType=null] - The target entity type (e.g. 'idea', 'script')
 * @param {string|null} [entityId=null] - The target entity ID
 * @param {Object} [metadata={}] - Optional event-specific metadata context
 * @returns {Promise<{success: boolean, activityId?: string, error?: string}>} Unified result payload
 */
export async function logActivity(userId, action, entityType = null, entityId = null, metadata = {}) {
  try {
    // 1. Zod input validation
    const validation = activityLogSchema.safeParse({
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });

    if (!validation.success) {
      const errorMessage = 'Activity log validation failed';
      console.error(errorMessage, validation.error.format());
      return { success: false, error: errorMessage };
    }

    // 2. Ensure connection is active
    await connectDB();

    // 3. Create and save the audit record
    const log = await ActivityLog.create({
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });

    return { 
      success: true, 
      activityId: log._id.toString() 
    };
  } catch (error) {
    // 4. Fail gracefully: logging failures must NEVER crash the main app flow
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error logging activity';
    console.error('Graceful failure inside logActivity:', error);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}
