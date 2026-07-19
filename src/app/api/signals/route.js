import connectDB from '@/lib/mongodb';
import Signal from '@/models/Signal';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rankSignals } from '@/lib/intelligence/signal-ranking';

function serializeSignal(sig) {
  const doc = sig.toObject ? sig.toObject() : sig;
  
  const serializedEvidence = (doc.evidence || []).map(ev => {
    let metricsObj = null;
    if (ev.metrics) {
      metricsObj = ev.metrics instanceof Map ? Object.fromEntries(ev.metrics) : ev.metrics;
    }
    return {
      type: ev.type,
      sourceId: ev.sourceId || null,
      fact: ev.fact,
      metrics: metricsObj,
    };
  });

  const serializedHistory = (doc.observationHistory || []).map(obs => ({
    strength: obs.strength,
    confidence: obs.confidence,
    observedAt: obs.observedAt ? obs.observedAt.toISOString() : null,
    timestamp: obs.observedAt ? obs.observedAt.toISOString() : null,
  }));

  return {
    id: doc._id.toString(),
    key: doc.key,
    displayName: doc.displayName,
    category: doc.category,
    strength: doc.strength,
    confidence: doc.confidence,
    trend: doc.trend,
    creatorTrait: doc.creatorTrait,
    audienceBehavior: doc.audienceBehavior,
    directionImplication: doc.directionImplication,
    evidence: serializedEvidence,
    observationHistory: serializedHistory,
  };
}

/**
 * GET /api/signals
 * Retrieves the authenticated user's active, ranked signals.
 */
export async function GET(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    let limit = 4;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      }
    }

    await connectDB();

    const rawSignals = await Signal.find({ userId: user.id });

    // ELIGIBILITY: Filter out weakened signals (confidence >= 40)
    // This matches the exact Idea generation active-signal eligibility.
    const eligibleSignals = rawSignals.filter(sig => sig.confidence >= 40);

    // RANK BEFORE SLICE
    // The shared helper resolves Date.now() once and sorts by score descending, key ascending.
    const rankedSignals = rankSignals(eligibleSignals);

    // PRESENTATION SUBSET (max 4 by default, or configured limit)
    const topSignals = rankedSignals.slice(0, limit);

    // SERIALIZATION BOUNDARY
    // Expose all fields required for creator-facing interpretation on the Strategy page and Overview.
    const serializedSignals = topSignals.map(serializeSignal);

    return successResponse(
      { signals: serializedSignals },
      'Signals retrieved'
    );
  } catch (err) {
    console.error('Signals GET error:', err);
    return errorResponse(
      'Failed to retrieve signals',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : null,
      500
    );
  }
}
