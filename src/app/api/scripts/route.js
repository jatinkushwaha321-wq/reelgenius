import connectDB from '@/lib/mongodb';
import Script from '@/models/Script';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { enrichIdeasWithLiveSignals } from '@/lib/ideas/live-signal-context';

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
    const idea = await Idea.findOne({ _id: ideaId, userId: user.id });

    let enrichedIdea = null;
    if (idea) {
      const serialized = serializeIdea(idea);
      const enriched = await enrichIdeasWithLiveSignals([serialized]);
      enrichedIdea = enriched[0];
    }
    
    if (!script) {
      return successResponse({ script: null, idea: enrichedIdea }, 'No script found for this idea.');
    }

    return successResponse({ script: serializeScript(script), idea: enrichedIdea }, 'Script retrieved successfully');
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
