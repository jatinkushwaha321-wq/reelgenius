import connectDB from '@/lib/mongodb';
import ObservedContent from '@/models/ObservedContent';
import Signal from '@/models/Signal';
import { generateJson } from '../gemini.js';
import { intelligenceOutputSchema } from '../validations/intelligence.js';
import { buildEvidencePacket } from './build-evidence-packet.js';
import { buildIntelligencePrompt } from './build-intelligence-prompt.js';
import { computeCadence } from './compute-cadence.js';
import { parseIntelligenceOutput } from './parse-intelligence-output.js';
import { persistIntelligence } from './persist-intelligence.js';

/**
 * Orchestrates the full creator intelligence generation cycle.
 *
 * @param {object} params
 * @param {object} params.profile - CreatorProfile document
 * @param {string} params.userId - Authenticated user ID string
 * @returns {Promise<object>} Orchestration report for API response
 */
export async function runCreatorIntelligence({ profile, userId }) {
  if (!profile) {
    throw new Error('Profile parameter is required');
  }
  if (!userId) {
    throw new Error('UserId parameter is required');
  }

  // 1. Establish DB Connection
  await connectDB();

  const profileId = profile._id.toString();

  // 2. Load ObservedContent items
  const observedContent = await ObservedContent.find({ profileId });

  // 3. Reject Zero Observed Items
  if (!observedContent || observedContent.length === 0) {
    const error = new Error('No observed content available for analysis');
    error.code = 'INSUFFICIENT_OBSERVATIONS';
    throw error;
  }

  // 4. Load Existing Signals
  const existingSignals = await Signal.find({ profileId });
  const existingSignalsMap = new Map();
  existingSignals.forEach((sig) => {
    existingSignalsMap.set(sig.key, sig);
  });

  // 5. Build Evidence Packet & Determine Content Tier
  const { packet, refMap, contentTier } = buildEvidencePacket(profile, observedContent);

  // If tier is insufficient, throw error (though already handled by observedContent.length === 0 check)
  if (contentTier === 'insufficient') {
    const error = new Error('No observed content available for analysis');
    error.code = 'INSUFFICIENT_OBSERVATIONS';
    throw error;
  }

  // 5b. Compute deterministic cadence from observed timestamps
  const cadence = computeCadence(observedContent);

  // 6. Define descriptive target JSON output contract for Gemini prompt
  const outputContractDesc = {
    creatorContext: {
      niche: "string (max 200 chars)",
      subNiches: ["string (max 100 chars, 1 to 5 items)"],
      contentPillars: [
        {
          name: "string (max 100 chars)",
          description: "string (max 300 chars)",
          percentage: "integer (0-100)"
        }
      ],
      audiencePersona: {
        behaviorProfile: "string (max 500 chars, describing observed metrics and format/topic patterns)",
        interests: ["string (max 100 chars) (optional, max 8 items)"],
        painPoints: ["string (max 200 chars) (optional, max 5 items)"]
      },
      brandIdentity: {
        tone: ["string (max 50 chars) (1 to 5 items)"],
        vocabulary: ["string (max 100 chars) (optional, max 10 items)"],
        values: ["string (max 100 chars) (optional, max 5 items)"],
        uniqueSellingPoints: ["string (max 200 chars) (optional, max 5 items)"]
      },
      postingFrequency: "string (max 200 chars)",
      aiSummary: "string (max 2000 chars, holistic summary referencing metadata patterns and bio details only)"
    },
    signals: [
      {
        existingKey: "string (strict snake_case existing key, e.g. 'reels_outperform_images') or null (if new signal)",
        displayName: "string (max 200 chars)",
        category: "enum ('audience-engagement', 'content-format', 'creator-style')",
        strength: "integer (0-100)",
        confidence: "integer (0-100)",
        creatorTrait: "string (max 500 chars, describing creator behavior visible in metadata/text)",
        audienceBehavior: "string (max 500 chars, describing audience response pattern visible in metadata)",
        directionImplication: "string (max 500 chars, creative direction implication)",
        evidence: [
          {
            type: "enum ('metric', 'attribute', 'comment', 'fact', 'comparative')",
            ref: "string (opaque reference e.g. 'post_001' or 'profile')",
            fact: "string (max 500 chars)",
            metrics: "object map of string to number (optional, e.g. { 'viewCount': 45000 })"
          }
        ]
      }
    ]
  };

  // 7. Build Prompt (with deterministic cadence facts injected)
  const prompt = buildIntelligencePrompt({
    packet,
    existingSignals,
    contentTier,
    outputContract: outputContractDesc,
    cadence,
  });

  // 8. Call generateJson (using the user ID as the rate limit bucket key)
  const limiterKey = `user_intel_${userId}`;
  let rawResponse;
  try {
    rawResponse = await generateJson(limiterKey, prompt, intelligenceOutputSchema);
  } catch (err) {
    console.error('Gemini content generation failed in runCreatorIntelligence:', err);
    throw err; // Propagate classified NivoAIError
  }

  // 9. Parse and Resolve Output (includes epistemic guardrails + pillar normalization)
  let creatorContext, resolvedSignals;
  try {
    ({ creatorContext, resolvedSignals } = parseIntelligenceOutput(
      rawResponse,
      refMap,
      contentTier,
      existingSignalsMap
    ));
  } catch (parseErr) {
    if (parseErr.code === 'EPISTEMIC_VIOLATION') {
      console.error(`[NIVO] Intelligence rejected due to epistemic violation: ${parseErr.fieldPath} (${parseErr.violationCategory})`);
      const error = new Error('AI generation failed: Intelligence output contained claims exceeding available evidence boundaries.');
      error.code = 'EPISTEMIC_VIOLATION';
      throw error;
    }
    throw parseErr;
  }

  // 10. Persist Intelligence Results (Signal-first, Profile-last)
  const report = await persistIntelligence({
    profile,
    userId,
    creatorContext,
    resolvedSignals,
    existingSignals,
  });

  // 11. Return Final Success Orchestration Report
  return {
    profileId,
    analyzedAt: report.analyzedAt.toISOString(),
    contentTier,
    signalsGenerated: report.signalsGenerated,
    signalsUpdated: report.signalsUpdated,
    signalsWeakened: report.signalsWeakened,
  };
}
