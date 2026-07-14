import Signal from '@/models/Signal.js';
import CreatorProfile from '@/models/CreatorProfile.js';
import { calculateTrend } from '../utils/trend.js';

/**
 * Handles signal-first, profile-last persistence of intelligence results.
 *
 * @param {object} params
 * @param {object} params.profile - CreatorProfile document
 * @param {string} params.userId - Authenticated user ID string
 * @param {object} params.creatorContext - derived creatorContext from Gemini
 * @param {Array<object>} params.resolvedSignals - Resolved signals list from parsing
 * @param {Array<object>} params.existingSignals - Existing Signals from database
 * @returns {Promise<object>} Persistence report
 */
export async function persistIntelligence({
  profile,
  userId,
  creatorContext,
  resolvedSignals,
  existingSignals,
}) {
  const analysisTimestamp = new Date();
  const profileId = profile._id.toString();

  // Create a map of existing signals for easy lookup
  const existingMap = new Map();
  existingSignals.forEach((sig) => {
    existingMap.set(sig.key, sig);
  });

  const signalOps = [];
  const returnedKeys = new Set();

  let signalsGenerated = 0;
  let signalsUpdated = 0;
  let signalsWeakened = 0;

  // 1. Prepare Signal Upserts
  for (const sig of resolvedSignals) {
    returnedKeys.add(sig.key);

    let history = [];
    const isExisting = existingMap.has(sig.key);

    if (isExisting) {
      const existingDoc = existingMap.get(sig.key);
      history = [...(existingDoc.observationHistory || [])];
      signalsUpdated++;
    } else {
      signalsGenerated++;
    }

    // Append current observation
    history.push({
      strength: sig.strength,
      confidence: sig.confidence,
      observedAt: analysisTimestamp,
    });

    // Limit to latest 10
    if (history.length > 10) {
      history = history.slice(-10);
    }

    // Calculate trend AFTER appending current observation
    const trend = calculateTrend(history);

    // Build bulk upsert operation
    signalOps.push({
      updateOne: {
        filter: { profileId, key: sig.key },
        update: {
          $set: {
            userId,
            profileId,
            key: sig.key,
            displayName: sig.displayName,
            category: sig.category,
            strength: sig.strength,
            confidence: sig.confidence,
            trend,
            creatorTrait: sig.creatorTrait,
            audienceBehavior: sig.audienceBehavior,
            directionImplication: sig.directionImplication,
            evidence: sig.evidence,
            observationHistory: history,
          },
        },
        upsert: true,
      },
    });
  }

  // 2. Prepare Signal Weakenings for Absent Signals (Signals present in db but not returned by Gemini)
  for (const [key, existingDoc] of existingMap.entries()) {
    if (!returnedKeys.has(key)) {
      signalsWeakened++;

      const weakenedStrength = Math.max(0, existingDoc.strength - 20);
      let history = [...(existingDoc.observationHistory || [])];

      // Append weakening observation
      history.push({
        strength: weakenedStrength,
        confidence: 0,
        observedAt: analysisTimestamp,
      });

      // Limit to latest 10
      if (history.length > 10) {
        history = history.slice(-10);
      }

      const trend = calculateTrend(history);

      signalOps.push({
        updateOne: {
          filter: { profileId, key },
          update: {
            $set: {
              strength: weakenedStrength,
              confidence: 0,
              trend,
              observationHistory: history,
            },
          },
        },
      });
    }
  }

  // 3. Execute Signal Writes First
  if (signalOps.length > 0) {
    try {
      await Signal.bulkWrite(signalOps, { ordered: true });
    } catch (err) {
      console.error('Signal bulkWrite failed:', err);
      const error = new Error('Failed to persist signals in DB');
      error.code = 'INTELLIGENCE_PERSISTENCE_ERROR';
      throw error;
    }
  }

  // 4. Update CreatorProfile intelligence fields (Only if Signal bulkWrite succeeded)
  try {
    const updatedProfile = await CreatorProfile.findOneAndUpdate(
      { _id: profileId },
      {
        $set: {
          niche: creatorContext.niche,
          subNiches: creatorContext.subNiches || [],
          contentPillars: (creatorContext.contentPillars || []).map((pillar) => ({
            name: pillar.name,
            description: pillar.description || '',
            percentage: typeof pillar.percentage === 'number' ? pillar.percentage : 0,
          })),
          audiencePersona: {
            behaviorProfile: creatorContext.audiencePersona.behaviorProfile,
            interests: creatorContext.audiencePersona.interests || [],
            painPoints: creatorContext.audiencePersona.painPoints || [],
          },
          brandIdentity: {
            tone: creatorContext.brandIdentity.tone || [],
            vocabulary: creatorContext.brandIdentity.vocabulary || [],
            values: creatorContext.brandIdentity.values || [],
            uniqueSellingPoints: creatorContext.brandIdentity.uniqueSellingPoints || [],
          },
          postingFrequency: creatorContext.postingFrequency,
          aiSummary: creatorContext.aiSummary,
          analyzedAt: analysisTimestamp,
        },
      },
      { new: true }
    );

    if (!updatedProfile) {
      const error = new Error('CreatorProfile not found during intelligence update');
      error.code = 'INTELLIGENCE_PERSISTENCE_ERROR';
      throw error;
    }
  } catch (err) {
    console.error('CreatorProfile update failed:', err);
    if (err.code === 'INTELLIGENCE_PERSISTENCE_ERROR') {
      throw err;
    }
    const error = new Error('Failed to update CreatorProfile intelligence fields');
    error.code = 'INTELLIGENCE_PERSISTENCE_ERROR';
    throw error;
  }

  return {
    signalsGenerated,
    signalsUpdated,
    signalsWeakened,
    analyzedAt: analysisTimestamp,
  };
}
