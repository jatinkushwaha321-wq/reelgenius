import connectDB from '@/lib/mongodb';
import CreatorProfile from '@/models/CreatorProfile';
import ObservedContent from '@/models/ObservedContent';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { runCreatorIntelligence } from '@/lib/intelligence/run-intelligence';
import { NivoAIError } from '@/lib/gemini';

// Module-scope Set for in-process concurrency guard per user
const activeAnalyses = new Set();

/**
 * POST /api/intelligence/analyze
 *
 * Triggers the creator intelligence engine.
 */
export async function POST() {
  let userId = null;

  try {
    // 1. Authenticate user
    const { user, error: authError } = await getAuthUser();
    if (authError) {
      return authError; // Returns standard NextAuth unauthorized response
    }

    userId = user.id;

    // 2. Concurrency Guard Check
    if (activeAnalyses.has(userId)) {
      return errorResponse(
        'An intelligence analysis run is already in progress for this profile.',
        'ANALYSIS_IN_PROGRESS',
        null,
        409
      );
    }

    // Acquire lock
    activeAnalyses.add(userId);

    // 3. Connect to Database
    await connectDB();

    // 4. Find CreatorProfile for user
    const profile = await CreatorProfile.findOne({ userId });
    if (!profile) {
      return errorResponse(
        'Creator profile not found. Please establish a profile with an Instagram username first.',
        'PROFILE_NOT_FOUND',
        null,
        404
      );
    }

    const profileId = profile._id.toString();

    // 5. Check if at least one ObservedContent item exists
    const observedCount = await ObservedContent.countDocuments({ profileId });
    if (observedCount === 0) {
      return errorResponse(
        'Insufficient observations. Please observe your Instagram profile to acquire content data before running analysis.',
        'INSUFFICIENT_OBSERVATIONS',
        null,
        400
      );
    }

    // 6. Enforce 5-Minute Cooldown Check based on analyzedAt
    if (profile.analyzedAt) {
      const cooldownMs = 300000; // 5 minutes
      const elapsed = Date.now() - new Date(profile.analyzedAt).getTime();

      if (elapsed < cooldownMs) {
        const retryAfterSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
        return errorResponse(
          `Analysis is on cooldown. Please wait ${retryAfterSeconds} seconds before requesting a new run.`,
          'ANALYSIS_COOLDOWN',
          { retryAfter: retryAfterSeconds },
          429
        );
      }
    }

    // 7. Run Creator Intelligence Orchestrator
    const result = await runCreatorIntelligence({ profile, userId });

    // 8. Return Success Response
    return successResponse(result, 'Creator intelligence analysis completed successfully');

  } catch (error) {
    console.error('Creator intelligence analysis API endpoint failed:', error);

    // Handle classified NivoAIError instances
    if (error instanceof NivoAIError) {
      let status = 502; // Bad Gateway by default for third-party AI issues
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

    // Handle epistemic violation (output contained unsupported claims)
    if (error.code === 'EPISTEMIC_VIOLATION') {
      return errorResponse(
        error.message || 'AI generation failed: Intelligence output contained claims exceeding available evidence boundaries.',
        'EPISTEMIC_VIOLATION',
        null,
        422
      );
    }

    // Handle persistence error specifically
    if (error.code === 'INTELLIGENCE_PERSISTENCE_ERROR') {
      return errorResponse(
        `Failed to save intelligence results: ${error.message}`,
        'INTELLIGENCE_PERSISTENCE_ERROR',
        null,
        500
      );
    }

    // General fallback error
    return errorResponse(
      error.message || 'An unexpected error occurred during intelligence analysis.',
      'INTERNAL_SERVER_ERROR',
      null,
      500
    );

  } finally {
    // Release concurrency lock
    if (userId) {
      activeAnalyses.delete(userId);
    }
  }
}
