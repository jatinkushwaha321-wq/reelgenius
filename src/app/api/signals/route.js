import connectDB from '@/lib/mongodb';
import Signal from '@/models/Signal';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { rankSignals } from '@/lib/intelligence/signal-ranking';

/**
 * GET /api/signals
 * Retrieves the authenticated user's active, ranked signals.
 */
export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    await connectDB();

    const rawSignals = await Signal.find({ userId: user.id });

    // ELIGIBILITY: Filter out weakened signals (confidence >= 40)
    // This matches the exact Idea generation active-signal eligibility.
    const eligibleSignals = rawSignals.filter(sig => sig.confidence >= 40);

    // RANK BEFORE SLICE
    // The shared helper resolves Date.now() once and sorts by score descending, key ascending.
    const rankedSignals = rankSignals(eligibleSignals);

    // PRESENTATION SUBSET (max 4 for Overview layout)
    const topSignals = rankedSignals.slice(0, 4);

    // SERIALIZATION BOUNDARY
    // Only expose fields required for creator-facing interpretation on the Overview.
    const serializedSignals = topSignals.map(sig => ({
      id: sig._id.toString(),
      key: sig.key,
      displayName: sig.displayName,
      trend: sig.trend,
      directionImplication: sig.directionImplication,
    }));

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
