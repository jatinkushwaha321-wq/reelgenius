import connectDB from '../../lib/mongodb.js';
import Idea from '../../models/Idea.js';
import CreatorProfile from '../../models/CreatorProfile.js';
import AIMemory from '../../models/AIMemory.js';
import Script from '../../models/Script.js';
import { generateJson, DEFAULT_GEMINI_MODEL } from '../gemini.js';
import { scriptOutputSchema } from '../validations/script-generation.js';
import { buildScriptPacket } from './build-script-packet.js';
import { buildScriptPrompt } from './build-script-prompt.js';
import { parseScriptOutput, ScriptHygieneError } from './parse-script-output.js';
import { persistScript, ScriptFinalizedError } from './persist-script.js';
import { logActivity } from '../activity-logger.js';

/**
 * Orchestrates Script Generation.
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.profileId
 * @param {string} params.ideaId
 * @param {string} [params.modelName]
 * @returns {Promise<object>} The persisted Script
 */
export async function runScriptGeneration({ userId, profileId, ideaId, modelName = DEFAULT_GEMINI_MODEL }) {
  await connectDB();

  // 1. Load Idea
  const idea = await Idea.findOne({ _id: ideaId, userId, profileId });
  if (!idea) {
    const error = new Error('Idea not found or access denied.');
    error.code = 'IDEA_NOT_FOUND';
    throw error;
  }

  // 2. Verify Idea Eligibility
  // Current source indicates 'idea' is the pre-script approved state
  if (idea.status !== 'idea') {
    const error = new Error(`Idea is not in eligible state for Script generation (current: ${idea.status}).`);
    error.code = 'INVALID_IDEA_STATUS';
    throw error;
  }

  // Verify existing Script is not final (pre-generation check)
  const existingScript = await Script.findOne({ sourceIdeaId: idea._id, userId });
  if (existingScript && existingScript.status === 'final') {
    throw new ScriptFinalizedError();
  }

  // Load Profile and AIMemory
  const profile = await CreatorProfile.findById(profileId);
  if (!profile) {
    const error = new Error('Creator profile not found.');
    error.code = 'PROFILE_NOT_FOUND';
    throw error;
  }
  const aiMemory = await AIMemory.findOne({ profileId });

  // 3. Build Packet
  const packet = buildScriptPacket({ idea, profile, aiMemory });

  // 4. Build Prompt
  const prompt = buildScriptPrompt(packet);

  // 5. Call Provider
  const limiterKey = `user_scripts_${userId}`;
  let rawJsonObj;
  try {
    rawJsonObj = await generateJson(limiterKey, prompt, scriptOutputSchema, {
      model: modelName,
    });
  } catch (err) {
    console.error('[NIVO] Gemini script generation call failed:', err);
    throw err;
  }

  // 6. Parse, Validate, and Hygiene Scan
  // generateJson returns a parsed/validated object, but our parser expects a raw string
  // to ensure full independent validation and preprocessing.
  const rawJsonString = JSON.stringify(rawJsonObj);
  const { script, totalWordCount, estimatedDurationSeconds } = parseScriptOutput(
    rawJsonString,
    profile.displayName
  );

  // 7. Prepare Script Document Data
  const scriptData = {
    userId,
    profileId,
    sourceIdeaId: idea._id,
    ideaSnapshot: {
      title: idea.title,
      topic: idea.topic,
      description: idea.description,
      hook: idea.hook,
      format: idea.format,
      contentPillar: idea.contentPillar,
      sourceSignalKeys: idea.sourceSignalKeys || [],
    },
    hook: script.hook,
    beats: script.beats,
    cta: script.cta,
    caption: script.caption,
    scriptSummary: script.scriptSummary,
    estimatedDurationSeconds,
    totalWordCount,
    generationModel: modelName,
    generatedAt: new Date(),
    status: 'draft',
  };

  // 8. Persist Safely
  const persistedScript = await persistScript(scriptData);

  // 9. Log Activity
  await logActivity(userId, 'script_generated', 'script', persistedScript._id.toString(), {
    ideaId: idea._id.toString(),
    generationModel: modelName,
  });

  return persistedScript;
}
