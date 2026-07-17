import { generateJson, DEFAULT_GEMINI_MODEL } from '../gemini.js';
import { buildEvaluatorPrompt } from './build-evaluator-prompt.js';
import { evaluationReportSchema } from './evaluation-report-schema.js';

/**
 * Runs the Evaluator V1 pipeline.
 *
 * @param {object} params
 * @param {object} params.creatorIdentity - Creator identity layer object
 * @param {object} params.reasoningContext - Strategic reasoning contract from Reasoning Engine V2
 * @param {object} params.candidate - The generated candidate idea to judge
 * @param {string} params.userId - Authenticated user ID string for rate limiting
 * @param {string} [params.modelName] - Gemini model string
 * @returns {Promise<object>} Parsed and validated Evaluation Report contract
 */
export async function runEvaluator({
  creatorIdentity,
  reasoningContext,
  candidate,
  userId,
  modelName = DEFAULT_GEMINI_MODEL,
}) {
  if (!creatorIdentity) {
    throw new Error('Evaluator run failed: "creatorIdentity" parameter is required.');
  }
  if (!reasoningContext) {
    throw new Error('Evaluator run failed: "reasoningContext" parameter is required.');
  }
  if (!candidate) {
    throw new Error('Evaluator run failed: "candidate" parameter is required.');
  }
  if (!userId) {
    throw new Error('Evaluator run failed: "userId" parameter is required.');
  }

  // 1. Compile structured prompt
  const prompt = buildEvaluatorPrompt({ creatorIdentity, reasoningContext, candidate });

  // 2. Invoke rate-limited JSON generator
  const limiterKey = `user_evaluation_${userId}`;

  try {
    const validatedJson = await generateJson(limiterKey, prompt, evaluationReportSchema, {
      model: modelName,
    });
    return validatedJson;
  } catch (err) {
    console.error('[NIVO] Evaluator execution failed:', err);
    throw err;
  }
}
