import crypto from 'crypto';
import Idea from '../../models/Idea.js';

/**
 * Handles persistence of generated candidate ideas in a failure-safe manner.
 * 
 * FAILURE-SAFE REPLACEMENT SEMANTICS:
 * 1. Capture existing 'candidate'-status Idea IDs for the profile.
 * 2. Persist the new candidates first using a fresh generationRunId.
 * 3. Verify that the new candidates were successfully saved to the database.
 * 4. Only after successful new candidate persistence, delete the old candidate Ideas
 *    excluding the newly created candidate IDs.
 * 5. If new candidate persistence fails, old candidates remain untouched.
 * 6. If cleanup of old candidates fails, we do not roll back the new candidates. Instead,
 *    we log the warning, return the new candidates, and let future cleanups handle it.
 * 
 * @param {object} params
 * @param {object} params.profile - CreatorProfile document
 * @param {string} params.userId - Authenticated user ID string
 * @param {Array<object>} params.candidates - Validated candidates list from parsing
 * @param {string} params.modelName - The name of the Gemini model used for generation
 * @returns {Promise<object>} Persistence report containing saved candidates
 */
export async function persistIdeas({ profile, userId, candidates, modelName }) {
  const profileId = profile._id.toString();
  const generationRunId = crypto.randomUUID();
  const generatedAt = new Date();

  // 1. Capture/identify existing candidate-status Ideas for the profile
  const existingCandidates = await Idea.find({
    profileId,
    status: 'candidate',
  }).select({ _id: 1 });
  const oldIds = existingCandidates.map(c => c._id.toString());

  // 2. Prepare documents to insert
  const docsToCreate = candidates.map(cand => ({
    userId,
    profileId,
    title: cand.title,
    topic: cand.topic,
    description: cand.concept, // map concept to description
    format: cand.format,
    contentPillar: cand.contentPillar,
    hook: cand.hook,
    status: 'candidate',
    generationRunId,
    sourceSignalKeys: cand.sourceSignalKeys,
    sourceSignalSnapshots: cand.sourceSignalSnapshots,
    directionSnapshot: cand.directionReasoning, // map directionReasoning to directionSnapshot
    whyNow: cand.whyNow,
    noveltyReason: cand.noveltyReason,
    rankKey: cand.rankKey ?? null,
    evaluationReport: cand.evaluationReport || null,
    intelligenceAnalyzedAt: profile.analyzedAt,
    generatedAt,
    generationModel: modelName,
  }));

  // 3. Persist new candidates first
  let createdDocs = [];
  try {
    createdDocs = await Idea.insertMany(docsToCreate);
  } catch (err) {
    console.error('[NIVO] Idea insertion failed during candidate persistence:', err);
    const error = new Error('Failed to persist new candidate ideas in DB');
    error.code = 'IDEA_PERSISTENCE_ERROR';
    throw error;
  }

  // 4. Verify persistence success (insertMany returns the list of created docs)
  if (!createdDocs || createdDocs.length === 0) {
    const error = new Error('Verification failed: zero candidate ideas saved.');
    error.code = 'IDEA_PERSISTENCE_ERROR';
    throw error;
  }

  const newIds = new Set(createdDocs.map(doc => doc._id.toString()));

  // 5. Clean up old candidates
  // Filter out any IDs that might overlap (should not happen as we just inserted new ones)
  const idsToDelete = oldIds.filter(id => !newIds.has(id));

  if (idsToDelete.length > 0) {
    try {
      await Idea.deleteMany({
        _id: { $in: idsToDelete },
      });
    } catch (cleanupErr) {
      // CLEANUP-FAILURE SEMANTICS:
      // If deleting old candidates fails, we do NOT delete the new candidates to hide the failure.
      // We log it clearly and proceed, ensuring the newly generated ideas are available to the user.
      console.error('[NIVO] Warning: Failed to clean up old candidate ideas from DB:', cleanupErr);
    }
  }

  return {
    generationRunId,
    candidates: createdDocs,
  };
}
