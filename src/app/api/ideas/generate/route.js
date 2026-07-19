import connectDB from '@/lib/mongodb';
import CreatorProfile from '@/models/CreatorProfile';
import Idea from '@/models/Idea';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { runIdeaGeneration } from '@/lib/ideas/run-idea-generation';
import { enrichIdeasWithLiveSignals } from '@/lib/ideas/live-signal-context';
import { NivoAIError } from '@/lib/gemini';

// In-process module-scope Set for generation active lock.
// Note: This is process-local and does not act as a distributed lock in multi-instance environments.
const activeGenerations = new Set();

function serializeEvaluationReport(report) {
  if (!report) return null;
  const doc = report.toObject ? report.toObject() : report;
  return {
    identityAlignment: doc.identityAlignment ? {
      score: doc.identityAlignment.score,
      explanation: doc.identityAlignment.explanation || '',
    } : null,
    reasoningAlignment: doc.reasoningAlignment ? {
      score: doc.reasoningAlignment.score,
      explanation: doc.reasoningAlignment.explanation || '',
    } : null,
    opportunityFidelity: doc.opportunityFidelity ? {
      score: doc.opportunityFidelity.score,
      explanation: doc.opportunityFidelity.explanation || '',
    } : null,
    generationContractCompliance: doc.generationContractCompliance ? {
      score: doc.generationContractCompliance.score,
      explanation: doc.generationContractCompliance.explanation || '',
      violatedConstraints: doc.generationContractCompliance.violatedConstraints || [],
    } : null,
    audienceAlignment: doc.audienceAlignment ? {
      score: doc.audienceAlignment.score,
      explanation: doc.audienceAlignment.explanation || '',
    } : null,
    novelty: doc.novelty ? {
      score: doc.novelty.score,
      explanation: doc.novelty.explanation || '',
    } : null,
    strategicValue: doc.strategicValue ? {
      score: doc.strategicValue.score,
      explanation: doc.strategicValue.explanation || '',
    } : null,
    overallVerdict: doc.overallVerdict ? {
      recommendation: doc.overallVerdict.recommendation,
      summary: doc.overallVerdict.summary || '',
    } : null,
    validatedLearnings: doc.validatedLearnings || [],
    rejectionReasons: doc.rejectionReasons || [],
  };
}

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
    evaluationReport: serializeEvaluationReport(doc.evaluationReport),
    intelligenceAnalyzedAt: doc.intelligenceAnalyzedAt ? doc.intelligenceAnalyzedAt.toISOString() : null,
    generatedAt: doc.generatedAt ? doc.generatedAt.toISOString() : null,
    generationModel: doc.generationModel || '',
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

/**
 * POST /api/ideas/generate
 * 
 * Generates candidate Ideas based on creator intelligence.
 */
export async function POST() {
  let userId = null;

  try {
    // 1. Authenticate request
    const { user, error: authError } = await getAuthUser();
    if (authError) {
      return authError;
    }

    userId = user.id;

    // 2. Concurrency Lock Check
    if (activeGenerations.has(userId)) {
      return errorResponse(
        'An idea generation request is already in progress for this profile.',
        'IDEA_GENERATION_IN_PROGRESS',
        null,
        409
      );
    }

    // 3. Connect to Database to check profile and cooldown
    await connectDB();

    // 4. Resolve CreatorProfile by userId
    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) {
      return errorResponse(
        'Creator profile not found. Please establish a profile with an Instagram username first.',
        'PROFILE_NOT_FOUND',
        null,
        404
      );
    }

    // 5. Cooldown Check (60 seconds, based on newest generated Idea regardless of status)
    const latestGeneratedIdea = await Idea.findOne({
      profileId: profile._id,
      generatedAt: { $ne: null },
      generationRunId: { $ne: null },
    }).sort({
      generatedAt: -1,
      createdAt: -1,
      _id: -1,
    });

    if (latestGeneratedIdea && latestGeneratedIdea.generatedAt) {
      const elapsed = Date.now() - new Date(latestGeneratedIdea.generatedAt).getTime();
      const cooldownMs = 60000; // 60 seconds
      if (elapsed < cooldownMs) {
        const retryAfter = Math.ceil((cooldownMs - elapsed) / 1000);
        return errorResponse(
          `Idea generation is on cooldown. Please wait ${retryAfter} seconds before requesting a new generation.`,
          'IDEA_GENERATION_COOLDOWN',
          { retryAfter },
          429
        );
      }
    }

    // 6. Acquire Lock (with second defensive check to cover the DB query window)
    if (activeGenerations.has(userId)) {
      return errorResponse(
        'An idea generation request is already in progress for this profile.',
        'IDEA_GENERATION_IN_PROGRESS',
        null,
        409
      );
    }
    activeGenerations.add(userId);

    // 7. Run Idea Generation Orchestrator
    const result = await runIdeaGeneration({ profile, userId });

    // 8. Serialize and enrich candidates
    const serializedCandidates = (result.candidates || []).map(serializeIdea);
    const enrichedCandidates = await enrichIdeasWithLiveSignals(serializedCandidates);

    // 9. Return success response
    return successResponse(
      {
        generationRunId: result.generationRunId,
        generatedAt: result.candidates[0]?.generatedAt
          ? result.candidates[0].generatedAt.toISOString()
          : new Date().toISOString(),
        candidateCount: enrichedCandidates.length,
        candidates: enrichedCandidates,
      },
      'Idea candidates generated successfully'
    );

  } catch (error) {
    console.error('Idea generation route handler failed:', error);

    // Map Engine / Provider errors to HTTP responses
    if (error instanceof NivoAIError) {
      let status = 502; // Bad Gateway for model issues
      if (error.code === 'LOCAL_RATE_LIMIT') status = 429;
      if (error.code === 'PROVIDER_RATE_LIMIT') status = 429;
      if (error.code === 'AUTHENTICATION_ERROR') status = 500;

      return errorResponse(
        `AI generation failed: ${error.message}`,
        error.code,
        null,
        status
      );
    }

    if (error.code === 'PROFILE_NOT_FOUND') {
      return errorResponse(error.message, 'PROFILE_NOT_FOUND', null, 404);
    }

    if (error.code === 'INTELLIGENCE_REQUIRED') {
      return errorResponse(error.message, 'INTELLIGENCE_REQUIRED', null, 400);
    }

    if (error.code === 'STALE_INTELLIGENCE') {
      return errorResponse(error.message, 'STALE_INTELLIGENCE', null, 409);
    }

    if (error.code === 'INSUFFICIENT_SIGNALS') {
      return errorResponse(error.message, 'INSUFFICIENT_SIGNALS', null, 400);
    }

    if (error.code === 'INSUFFICIENT_OBSERVATIONS') {
      return errorResponse(error.message, 'INSUFFICIENT_OBSERVATIONS', null, 400);
    }

    if (error.code === 'NO_VALID_CANDIDATES') {
      return errorResponse(error.message, 'NO_VALID_CANDIDATES', null, 422);
    }

    if (error.code === 'IDEA_PERSISTENCE_ERROR') {
      return errorResponse(error.message, 'IDEA_PERSISTENCE_ERROR', null, 500);
    }

    // Default internal fallback error
    return errorResponse(
      error.message || 'An unexpected error occurred during idea generation.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );

  } finally {
    // Release active generation lock in finally
    if (userId) {
      activeGenerations.delete(userId);
    }
  }
}
