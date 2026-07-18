import { generateJson, DEFAULT_GEMINI_MODEL } from '../gemini.js';
import { buildReasoningV2Prompt } from './build-reasoning-v2-prompt.js';
import { reasoningEngineV2Schema } from './reasoning-engine-v2-schema.js';

/**
 * Runs the Reasoning Engine V2 pipeline.
 *
 * @param {object} params
 * @param {object} params.packet - Assembled idea packet
 * @param {string} params.userId - Authenticated user ID string for rate limiting
 * @param {string} [params.modelName] - Gemini model string
 * @param {object} [params.memoryContext] - Optional memory context
 * @returns {Promise<object>} Parsed and validated Reasoning Engine V2 contract
 */
export async function runReasoningEngineV2({ packet, userId, modelName = DEFAULT_GEMINI_MODEL, memoryContext = null, knowledgeContext = null }) {
  if (!packet) {
    throw new Error('Reasoning Engine V2 run failed: "packet" parameter is required.');
  }
  if (!userId) {
    throw new Error('Reasoning Engine V2 run failed: "userId" parameter is required.');
  }

  // 1. Compile the structured prompt
  const prompt = buildReasoningV2Prompt({ packet, memoryContext, knowledgeContext });

  // 2. Invoke the rate-limited JSON generator
  const limiterKey = `user_reasoning_${userId}`;

  try {
    const validatedJson = await generateJson(limiterKey, prompt, reasoningEngineV2Schema, {
      model: modelName,
    });
    return validatedJson;
  } catch (err) {
    console.error('[NIVO] Reasoning Engine V2 execution failed:', err);
    throw err;
  }
}
