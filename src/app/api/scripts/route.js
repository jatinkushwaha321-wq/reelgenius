import connectDB from '@/lib/mongodb';
import Script from '@/models/Script';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function serializeScript(script) {
  const doc = script.toObject ? script.toObject() : script;
  return {
    _id: doc._id.toString(),
    sourceIdeaId: doc.sourceIdeaId.toString(),
    ideaSnapshot: doc.ideaSnapshot,
    hook: doc.hook,
    beats: doc.beats,
    cta: doc.cta,
    caption: doc.caption,
    scriptSummary: doc.scriptSummary,
    estimatedDurationSeconds: doc.estimatedDurationSeconds,
    totalWordCount: doc.totalWordCount,
    generationModel: doc.generationModel,
    generatedAt: doc.generatedAt ? doc.generatedAt.toISOString() : null,
    status: doc.status,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

export async function GET(request) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');

    await connectDB();

    // If no ideaId is provided, return all scripts for the user (list behavior)
    if (!ideaId) {
      const scripts = await Script.find({ userId: user.id }).sort({ updatedAt: -1 });
      return successResponse({ scripts: scripts.map(serializeScript) }, 'Scripts retrieved successfully');
    }

    if (!objectIdRegex.test(ideaId)) {
      return errorResponse('Invalid Idea ID format.', 'INVALID_IDEA_ID', null, 400);
    }

    const script = await Script.findOne({ sourceIdeaId: ideaId, userId: user.id });
    
    if (!script) {
      return successResponse({ script: null }, 'No script found for this idea.');
    }

    return successResponse({ script: serializeScript(script) }, 'Script retrieved successfully');
  } catch (error) {
    console.error('Script GET route handler failed:', error);

    return errorResponse(
      error.message || 'An unexpected error occurred during script retrieval.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
