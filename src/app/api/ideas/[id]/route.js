import connectDB from '@/lib/mongodb';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * DELETE /api/ideas/[id]
 * 
 * Dismisses an Idea candidate by deleting it from the database.
 * Confirms that only 'candidate' status ideas can be deleted through this endpoint.
 */
export async function DELETE(request, { params }) {
  try {
    // 1. Authenticate request
    const { user, error: authError } = await getAuthUser();
    if (authError) {
      return authError;
    }

    const userId = user.id;

    // 2. Resolve parameters (Awaited for Next.js 15)
    const resolvedParams = await params;
    const ideaId = resolvedParams.id;

    // 3. Validate ObjectId format
    if (!ideaId || !objectIdRegex.test(ideaId)) {
      return errorResponse('Invalid Idea ID format.', 'INVALID_IDEA_ID', null, 400);
    }

    // 4. Establish DB Connection
    await connectDB();

    // 5. Atomically delete only if owned and status is candidate
    const deletedIdea = await Idea.findOneAndDelete({
      _id: ideaId,
      userId,
      status: 'candidate',
    });

    // 6. Handle deletion failure
    if (!deletedIdea) {
      const existingDoc = await Idea.findOne({ _id: ideaId, userId });
      if (!existingDoc) {
        return errorResponse('Idea candidate not found.', 'IDEA_NOT_FOUND', null, 404);
      }
      return errorResponse(
        'Idea is no longer an active candidate.',
        'IDEA_NOT_CANDIDATE',
        null,
        409
      );
    }

    // 7. Return success response (Memory is not mutated on dismissal)
    return successResponse(
      {
        ideaId,
        dismissed: true,
      },
      'Idea candidate dismissed successfully'
    );

  } catch (error) {
    console.error('DELETE /api/ideas/[id] API route failed:', error);
    return errorResponse(
      error.message || 'An unexpected error occurred during idea dismissal.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
