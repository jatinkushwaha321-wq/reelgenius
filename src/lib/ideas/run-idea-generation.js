import connectDB from '../mongodb.js';
import CreatorProfile from '../../models/CreatorProfile.js';
import ObservedContent from '../../models/ObservedContent.js';
import Signal from '../../models/Signal.js';
import Idea from '../../models/Idea.js';
import AIMemory from '../../models/AIMemory.js';
import { generateJson, DEFAULT_GEMINI_MODEL } from '../gemini.js';
import { ideaGenerationOutputSchema, reasoningOutputSchema } from '../validations/ideas-generation.js';
import { buildReasoningPrompt } from './build-reasoning-prompt.js';
import { buildIdeaPacket } from './build-idea-packet.js';
import { buildIdeaPrompt } from './build-idea-prompt.js';
import { parseIdeaOutput, filterDuplicateCandidates } from './parse-idea-output.js';
import { rankCandidates } from './rank-candidates.js';
import { persistIdeas } from './persist-ideas.js';
import { loadCreatorIdentity } from '../identity/load-creator-identity.js';
import { runReasoningEngineV2 } from '../reasoning/run-reasoning-engine-v2.js';
import { runEvaluator } from '../evaluator/run-evaluator.js';

/**
 * Orchestrates the full candidate idea generation cycle.
 * 
 * @param {object} params
 * @param {object} params.profile - CreatorProfile document
 * @param {string} params.userId - Authenticated user ID string
 * @param {string} [modelName] - Optional override model name
 * @returns {Promise<object>} Orchestration report for API response
 */
export async function runIdeaGeneration({ profile, userId, modelName = DEFAULT_GEMINI_MODEL }) {
  if (!profile) {
    const error = new Error('Profile parameter is required');
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }
  if (!userId) {
    const error = new Error('UserId parameter is required');
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  // 1. Establish DB Connection
  await connectDB();

  const profileId = profile._id.toString();

  // 2. Verify Profile ownership and existence
  const freshProfile = await CreatorProfile.findOne({ _id: profileId, userId });
  if (!freshProfile) {
    const error = new Error('Creator profile not found or access denied.');
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }

  // 3. Verify Intelligence Eligibility
  if (!freshProfile.analyzedAt || !freshProfile.niche) {
    const error = new Error('Creator profile has not been analyzed yet. Intelligence required.');
    error.code = 'INTELLIGENCE_REQUIRED';
    throw error;
  }

  // 4. Verify ObservedContent existence
  const observedCount = await ObservedContent.countDocuments({ profileId });
  if (observedCount === 0) {
    const error = new Error('No observed content available for the profile.');
    error.code = 'INSUFFICIENT_OBSERVATIONS';
    throw error;
  }

  // 5. Verify Observation / Intelligence Ordering (Staleness Gate)
  const latestObs = await ObservedContent.findOne({ profileId }).sort({ observedAt: -1 });
  if (latestObs && latestObs.observedAt && freshProfile.analyzedAt) {
    if (new Date(latestObs.observedAt).getTime() > new Date(freshProfile.analyzedAt).getTime()) {
      const error = new Error('Creator profile intelligence is stale. Please re-run intelligence analysis first.');
      error.code = 'STALE_INTELLIGENCE';
      throw error;
    }
  }

  // 6. Load Signals
  const signals = await Signal.find({ profileId });

  // 7. Verify Signal Eligibility (Require at least 3 active signals with confidence >= 40)
  const eligibleSignals = signals.filter(sig => sig.confidence >= 40);
  if (eligibleSignals.length < 3) {
    const error = new Error(`Insufficient active signals. Found ${eligibleSignals.length}, but at least 3 are required.`);
    error.code = 'INSUFFICIENT_SIGNALS';
    throw error;
  }

  // 8. Fetch Novelty Context (Existing Ideas + AIMemory recentTopics)
  const existingIdeas = await Idea.find({ profileId }).select({ title: 1 });
  const existingIdeaTitles = existingIdeas.map(id => id.title);

  const aiMemory = await AIMemory.findOne({ profileId });

  // Load all observed content to build the packet
  const allObservedContent = await ObservedContent.find({ profileId });

  // 8c. Load Creator Identity (Milestone 1)
  const creatorIdentity = loadCreatorIdentity({ profile: freshProfile, signals });

  // 9. Build Generation Packet
  const packet = buildIdeaPacket({
    profile: freshProfile,
    signals,
    observedContent: allObservedContent,
    existingIdeaTitles,
    aiMemory,
    creatorIdentity,
  });

  // 9b. Conditionally trigger the Reasoning Engine stage
  if (process.env.ENABLE_REASONING_ENGINE_V2 === 'true') {
    try {
      const reasoningJson = await runReasoningEngineV2({
        packet,
        userId,
        modelName,
        memoryContext: aiMemory,
      });
      packet.reasoningContext = reasoningJson;
    } catch (err) {
      console.error('[NIVO] Reasoning Engine V2 stage failed:', err);
      throw err;
    }
  } else if (process.env.ENABLE_REASONING_ENGINE_MVP === 'true') {
    const reasoningPrompt = buildReasoningPrompt({ packet });
    const reasoningLimiterKey = `user_reasoning_${userId}`;
    try {
      const reasoningJson = await generateJson(reasoningLimiterKey, reasoningPrompt, reasoningOutputSchema, {
        model: modelName,
      });
      packet.reasoningContext = reasoningJson;
    } catch (err) {
      console.error('[NIVO] Reasoning Engine MVP stage failed:', err);
      throw err;
    }
  }

  // 10. Build Generation Prompt
  const prompt = buildIdeaPrompt({
    packet,
    outputContract: {
      candidates: [
        {
          requiresPersonalFact: "boolean (true if the idea requires the creator to present an unverified personal routine, history, struggle, transformation, or private fact as true; false if general, skit, POV, or opinion)",
          primarySignalRef: "string (opaque ref of the single primary generative signal, e.g. 'sig_001')",
          derivationBasis: "string (1-2 sentence explanation of the observed creator pattern and directional opportunity that generated this idea, max 300 chars)",
          title: "string (max 150 chars)",
          topic: "string (concise normalized subject, max 100 chars)",
          concept: "string (max 500 chars)",
          format: "enum ('talking-head', 'tutorial', 'pov', 'broll', 'storytime', 'listicle', 'challenge', 'behind-the-scenes', 'other')",
          contentPillar: "string (max 100 chars)",
          hook: "string (max 200 chars)",
          supportingSignalRefs: ["string (references to sig_001, sig_002, etc. max 4 items, must include primarySignalRef)"],
          noveltyReason: "string (distinction from recent content/topics, max 300 chars)",
        }
      ]
    },
  });

  // 11. Call generateJson (using user-scoped rate-limiter bucket)
  const limiterKey = `user_ideas_${userId}`;
  let rawResponse;
  try {
    rawResponse = await generateJson(limiterKey, prompt, ideaGenerationOutputSchema, {
      model: modelName,
    });
  } catch (err) {
    console.error('[NIVO] Gemini candidate generation call failed:', err);
    throw err; // Propagates NivoAIError
  }

  // 12. Parse, Validate, and Resolve Provenance
  const creatorDisplayName = packet.creatorContext.displayName || '';
  const validatedCandidates = parseIdeaOutput(rawResponse, packet.signalRefMap, creatorDisplayName);

  // 13. Filter Duplicate & Near-Duplicate Titles
  const filteredCandidates = filterDuplicateCandidates(validatedCandidates, existingIdeaTitles);

  if (filteredCandidates.length === 0) {
    const error = new Error('All generated candidate ideas were filtered out as duplicates.');
    error.code = 'NO_VALID_CANDIDATES';
    throw error;
  }

  // 13b. Execute Evaluator V1 if enabled
  let approvedCandidates = [];
  // Retained for future analytics, telemetry, and Memory/Evaluator loop integration
  let rejectedCandidates = [];

  if (process.env.ENABLE_EVALUATOR_V1 === 'true' && packet.reasoningContext) {
    for (const candidate of filteredCandidates) {
      const evaluationReport = await runEvaluator({
        creatorIdentity,
        reasoningContext: packet.reasoningContext,
        candidate,
        userId,
        modelName,
      });

      if (evaluationReport.overallVerdict.recommendation === 'APPROVE') {
        approvedCandidates.push({
          ...candidate,
          evaluationReport,
        });
      } else {
        rejectedCandidates.push({
          ...candidate,
          evaluationReport,
        });
      }
    }
  } else {
    approvedCandidates = filteredCandidates;
  }

  if (approvedCandidates.length === 0) {
    const error = new Error('All generated candidate ideas failed evaluation.');
    error.code = 'NO_VALID_CANDIDATES';
    throw error;
  }

  // 14. Rank candidates (banded lexicographic — assigns rankKey)
  rankCandidates(approvedCandidates);

  // 15. Persist Candidates (with failure-safe replacement)
  const report = await persistIdeas({
    profile: freshProfile,
    userId,
    candidates: approvedCandidates,
    modelName,
  });

  const persistedCandidates = report.candidates.map((doc, idx) => {
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
    const original = approvedCandidates[idx];
    if (original && original.evaluationReport) {
      obj.evaluationReport = original.evaluationReport;
    }
    return obj;
  });

  return {
    generationRunId: report.generationRunId,
    candidatesCreated: persistedCandidates.length,
    candidates: persistedCandidates,
    model: modelName,
    intelligenceAnalyzedAt: freshProfile.analyzedAt,
  };
}
