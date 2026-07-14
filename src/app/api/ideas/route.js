import connectDB from '@/lib/mongodb';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const ALLOWED_STATUS_VALUES = [
  'candidate',
  'idea',
  'scripted',
  'shooting',
  'editing',
  'scheduled',
  'published',
  'performance',
];

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
    rankKey: doc.rankKey ?? null,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

/**
 * GET /api/ideas
 * 
 * Retrieves ideas for the authenticated user, optionally filtered by status.
 */
export async function GET(request) {
  try {
    // 1. Authenticate request
    const { user, error: authError } = await getAuthUser();
    if (authError) {
      return authError;
    }

    const userId = user.id;

    // 2. Extract and validate status query parameter
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status && !ALLOWED_STATUS_VALUES.includes(status)) {
      return errorResponse(
        `Invalid status parameter. Allowed values are: ${ALLOWED_STATUS_VALUES.join(', ')}`,
        'INVALID_IDEA_STATUS',
        null,
        400
      );
    }

    // 3. Connect to Database
    await connectDB();

    // 4. Construct query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // 5. Fetch ideas with deterministic ordering:
    // generatedAt desc, createdAt desc, _id desc
    const ideas = await Idea.find(query).sort({
      rankKey: -1,
      generatedAt: -1,
      createdAt: -1,
      _id: -1,
    });

    // 6. Serialize Mongoose documents
    const serializedIdeas = ideas.map(serializeIdea);

    // 7. Return success response
    return successResponse(
      {
        count: serializedIdeas.length,
        ideas: serializedIdeas,
      },
      'Ideas retrieved successfully'
    );

  } catch (error) {
    console.error('GET /api/ideas route failed:', error);
    return errorResponse(
      error.message || 'An unexpected error occurred while retrieving ideas.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
