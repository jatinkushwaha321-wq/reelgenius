import connectDB from '@/lib/mongodb';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { runScriptGeneration } from '@/lib/scripts/run-script-generation';
import { ScriptFinalizedError } from '@/lib/scripts/persist-script';
import { ScriptHygieneError } from '@/lib/scripts/parse-script-output';
import { acquireScriptLock, releaseScriptLock } from '@/lib/scripts/script-lock';

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

export async function POST(request) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const body = await request.json();
    const { ideaId } = body;

    if (!ideaId || !objectIdRegex.test(ideaId)) {
      return errorResponse('Invalid Idea ID format.', 'INVALID_IDEA_ID', null, 400);
    }

    await connectDB();

    const idea = await Idea.findOne({ _id: ideaId, userId: user.id });
    if (!idea) {
      return errorResponse('Idea not found.', 'IDEA_NOT_FOUND', null, 404);
    }

    if (idea.status !== 'idea') {
      return errorResponse(
        'Idea is not in the approved state for script generation.',
        'INVALID_IDEA_STATUS',
        null,
        409
      );
    }

    if (!acquireScriptLock(user.id, ideaId)) {
      return errorResponse(
        'A script generation request is already in progress for this idea.',
        'SCRIPT_GENERATION_IN_PROGRESS',
        null,
        409
      );
    }

    try {

      const script = await runScriptGeneration({
        userId: user.id,
        profileId: idea.profileId,
        ideaId: idea._id,
      });

      return successResponse(serializeScript(script), 'Script generated successfully');
    } finally {
      releaseScriptLock(user.id, ideaId);
    }
  } catch (error) {
    console.error('Script generation route handler failed:', error);

    if (error instanceof ScriptFinalizedError) {
      return errorResponse(error.message, 'SCRIPT_FINALIZED', null, 409);
    }
    
    if (error.code === 'SCRIPT_CONFLICT') {
      return errorResponse(error.message, 'SCRIPT_CONFLICT', null, 409);
    }

    if (error instanceof ScriptHygieneError) {
      return errorResponse(`Script rejected due to hygiene boundaries: ${error.message}`, 'SCRIPT_HYGIENE_ERROR', { field: error.field, category: error.category }, 422);
    }

    if (error.code === 'IDEA_NOT_FOUND') {
      return errorResponse(error.message, 'IDEA_NOT_FOUND', null, 404);
    }

    if (error.code === 'INVALID_IDEA_STATUS') {
      return errorResponse(error.message, 'INVALID_IDEA_STATUS', null, 409);
    }

    if (error.code === 'PROFILE_NOT_FOUND') {
      return errorResponse(error.message, 'PROFILE_NOT_FOUND', null, 404);
    }

    return errorResponse(
      error.message || 'An unexpected error occurred during script generation.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
