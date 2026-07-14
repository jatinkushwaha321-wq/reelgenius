import connectDB from '@/lib/mongodb';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { appendAIMemory } from '@/lib/ai-memory';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Serializes an Idea document into a plain JSON-safe object.
 */
function serializeIdea(idea) {
  const doc = idea.toObject ? idea.toObject() : idea;
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    profileId: doc.profileId.toString(),
    title: doc.title,
    topic: doc.topic || '',
    description: doc.description || '',
    format: doc.format,
    contentPillar: doc.contentPillar || '',
    hook: doc.hook || '',
    status: doc.status,
    tags: doc.tags || [],
    isFavorited: !!doc.isFavorited,
    notes: doc.notes || '',
    coverConcepts: (doc.coverConcepts || []).map(cc => ({
      concept: cc.concept || '',
      headline: cc.headline || '',
      layout: cc.layout || '',
      colorPalette: cc.colorPalette || [],
      composition: cc.composition || '',
      expressionSuggestion: cc.expressionSuggestion || '',
      aiImagePrompt: cc.aiImagePrompt || '',
    })),
    scheduledFor: doc.scheduledFor ? doc.scheduledFor.toISOString() : null,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    generationRunId: doc.generationRunId || null,
    sourceSignalKeys: doc.sourceSignalKeys || [],
    sourceSignalSnapshots: (doc.sourceSignalSnapshots || []).map(sig => ({
      key: sig.key,
      displayName: sig.displayName,
      strength: sig.strength,
      confidence: sig.confidence,
      trend: sig.trend,
      directionImplication: sig.directionImplication,
    })),
    directionSnapshot: doc.directionSnapshot || '',
    whyNow: doc.whyNow || '',
    noveltyReason: doc.noveltyReason || '',
    intelligenceAnalyzedAt: doc.intelligenceAnalyzedAt ? doc.intelligenceAnalyzedAt.toISOString() : null,
    generatedAt: doc.generatedAt ? doc.generatedAt.toISOString() : null,
    generationModel: doc.generationModel || '',
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

/**
 * POST /api/ideas/[id]/accept
 * 
 * Accepts an Idea candidate, transitioning status to 'idea' and updating AIMemory.
 */
export async function POST(request, { params }) {
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

    // 5. Atomic transition: candidate -> idea
    const transitionedIdea = await Idea.findOneAndUpdate(
      {
        _id: ideaId,
        userId,
        status: 'candidate',
      },
      {
        $set: {
          status: 'idea',
        },
      },
      {
        returnDocument: 'after',
      }
    );

    // 6. Handle transition failure (non-existent, cross-user, or already transitioned)
    if (!transitionedIdea) {
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

    // 7. Update AIMemory with accepted topic/hook context
    // Exclude empty, whitespace-only, or missing values
    const topicVal = transitionedIdea.topic ? transitionedIdea.topic.trim() : '';
    const hookVal = transitionedIdea.hook ? transitionedIdea.hook.trim() : '';

    const topics = topicVal.length > 0 ? [topicVal] : null;
    const hooks = hookVal.length > 0 ? [hookVal] : null;

    let memoryUpdated = {
      topic: false,
      hook: false,
    };

    if (topics || hooks) {
      try {
        await appendAIMemory({
          userId,
          profileId: transitionedIdea.profileId.toString(),
          topics: topics || undefined,
          hooks: hooks || undefined,
        });
        if (topics) memoryUpdated.topic = true;
        if (hooks) memoryUpdated.hook = true;
      } catch (memErr) {
        // Partial-failure: Acceptance is authoritative, we return 500 without rolling back
        console.error('[NIVO] AIMemory update failed after Idea accepted:', memErr);
        return errorResponse(
          'Idea candidate was accepted, but the creative memory update failed.',
          'IDEA_ACCEPTANCE_MEMORY_ERROR',
          null,
          500
        );
      }
    }

    // 8. Return success response
    return successResponse(
      {
        idea: serializeIdea(transitionedIdea),
        memoryUpdated,
      },
      'Idea candidate accepted successfully'
    );

  } catch (error) {
    console.error('POST /api/ideas/[id]/accept API route failed:', error);
    return errorResponse(
      error.message || 'An unexpected error occurred during idea acceptance.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
