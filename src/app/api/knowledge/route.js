import connectDB from '@/lib/mongodb';
import KnowledgeItem from '@/models/KnowledgeItem';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

/**
 * GET /api/knowledge
 * Returns the authenticated user's validated knowledge base principles.
 */
export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    await connectDB();

    // Retrieve validated principles for the profile
    const items = await KnowledgeItem.find({ 
      userId: user.id, 
      lifecycleStatus: 'VALIDATED' 
    }).sort({ updatedAt: -1 });

    return successResponse(
      { items },
      'Validated knowledge base retrieved successfully'
    );
  } catch (err) {
    console.error('[API] Knowledge GET error:', err);
    return errorResponse(
      'Failed to retrieve validated knowledge base principles',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : null,
      500
    );
  }
}
