import connectDB from '@/lib/mongodb';
import Script from '@/models/Script';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { appendAIMemory } from '@/lib/ai-memory';
import { logActivity } from '@/lib/activity-logger';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

function serializeScript(script) {
  const doc = script.toObject ? script.toObject() : script;
  const snapshot = doc.ideaSnapshot || {};
  return {
    _id: doc._id.toString(),
    sourceIdeaId: doc.sourceIdeaId.toString(),
    ideaSnapshot: {
      title: snapshot.title || '',
      topic: snapshot.topic || '',
      description: snapshot.description || '',
      hook: snapshot.hook || '',
      format: snapshot.format || '',
      contentPillar: snapshot.contentPillar || '',
      sourceSignalKeys: snapshot.sourceSignalKeys || [],
      directionSnapshot: snapshot.directionSnapshot || '',
      whyNow: snapshot.whyNow || '',
      noveltyReason: snapshot.noveltyReason || '',
      sourceSignalSnapshots: (snapshot.sourceSignalSnapshots || []).map(sig => ({
        key: sig.key,
        displayName: sig.displayName,
        strength: sig.strength,
        confidence: sig.confidence,
        trend: sig.trend,
        directionImplication: sig.directionImplication,
      })),
    },
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

export async function POST(request, { params }) {
  try {
    const { user, error: authError } = await getAuthUser();
    if (authError) return authError;

    const resolvedParams = await params;
    const scriptId = resolvedParams.id;

    if (!scriptId || !objectIdRegex.test(scriptId)) {
      return errorResponse('Invalid Script ID format.', 'INVALID_SCRIPT_ID', null, 400);
    }

    await connectDB();

    const finalizedScript = await Script.findOneAndUpdate(
      {
        _id: scriptId,
        userId: user.id,
        status: 'draft',
      },
      {
        $set: {
          status: 'final',
        },
      },
      {
        returnDocument: 'after',
      }
    );

    if (!finalizedScript) {
      const existingScript = await Script.findOne({ _id: scriptId, userId: user.id });
      if (!existingScript) {
        return errorResponse('Script not found.', 'SCRIPT_NOT_FOUND', null, 404);
      }
      return errorResponse('Script is not a draft or already finalized.', 'SCRIPT_NOT_DRAFT', null, 409);
    }

    const scriptSummaryVal = finalizedScript.scriptSummary ? finalizedScript.scriptSummary.trim() : '';
    let memoryUpdated = false;

    if (scriptSummaryVal.length > 0) {
      try {
        await appendAIMemory({
          userId: user.id,
          profileId: finalizedScript.profileId.toString(),
          scriptSummaries: [scriptSummaryVal],
        });
        memoryUpdated = true;
      } catch (memErr) {
        console.error('[NIVO] AIMemory update failed after Script finalized:', memErr);
        return errorResponse(
          'Script was finalized successfully, but the creative memory update failed.',
          'SCRIPT_FINALIZATION_MEMORY_ERROR',
          null,
          500
        );
      }
    }

    return successResponse(
      {
        script: serializeScript(finalizedScript),
        memoryUpdated,
      },
      'Script finalized successfully'
    );
  } catch (error) {
    console.error('Script finalize route handler failed:', error);
    return errorResponse(
      error.message || 'An unexpected error occurred during script finalization.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );
  }
}
