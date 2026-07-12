import { GoogleGenAI } from '@google/genai';
import { TokenBucketRateLimiter } from './rate-limiter.js';

// Bounded constants for retry configuration (M4.4)
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 10000;

// Central V1 model identifier (M4.4 Model Configuration)
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

// Best-effort process-local rate limiter instance (10 RPM limit)
const appRateLimiter = new TokenBucketRateLimiter(10, 60000);

/**
 * Custom error class representing classified NIVO AI exceptions
 */
export class NivoAIError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.name = 'NivoAIError';
    this.code = code;
    this.cause = originalError;
  }
}


// Client instantiation helper (ensures key is validated before creation)
let clientInstance = null;
function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new NivoAIError(
      'AUTHENTICATION_ERROR',
      'AI client initialization failed: GEMINI_API_KEY environment variable is missing.'
    );
  }
  if (!clientInstance) {
    clientInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return clientInstance;
}

/**
 * Helper to calculate exponential backoff delay with bounded jitter (+0-200ms)
 */
function calculateDelay(attempt) {
  const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
  const jitter = Math.random() * 200;
  return delay + jitter;
}

/**
 * Helper utility to delay execution
 */
async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Maps raw provider errors to classified NIVO AI errors
 */
function classifyError(err) {
  if (err instanceof NivoAIError) {
    return err;
  }

  const message = err.message || '';
  const status = err.status || err.statusCode;

  // Authentication/Authorization check
  if (
    message.includes('API key not valid') ||
    message.includes('API_KEY_INVALID') ||
    status === 401 ||
    status === 403
  ) {
    return new NivoAIError(
      'AUTHENTICATION_ERROR',
      'AI authentication failed. Verify that your API key is correct.',
      err
    );
  }

  // Quota limit / 429 check
  if (
    message.includes('Quota exceeded') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    status === 429
  ) {
    return new NivoAIError(
      'PROVIDER_RATE_LIMIT',
      'AI service rate limit exceeded. Please try again shortly.',
      err
    );
  }

  // Model overload / 503 check
  if (
    message.includes('overloaded') ||
    message.includes('SERVICE_UNAVAILABLE') ||
    status === 503
  ) {
    return new NivoAIError(
      'MODEL_OVERLOADED',
      'AI service is currently overloaded. Retrying...',
      err
    );
  }

  // Default provider error mapping
  return new NivoAIError(
    'PROVIDER_ERROR',
    'AI service encountered an unexpected error.',
    err
  );
}

/**
 * Generates structured, validated JSON matching a caller-provided Zod schema.
 * 
 * @param {string} limiterKey - Key identifier for rate-limiting bucket
 * @param {string} prompt - Prompt contents
 * @param {import('zod').ZodSchema} zodSchema - Zod validation schema
 * @param {object} [configOverrides] - Optional model and configuration parameter overrides
 * @returns {Promise<any>} Validated JSON matching Zod schema
 */
export async function generateJson(limiterKey, prompt, zodSchema, configOverrides = {}) {
  // 1. Validate local API key configuration first (throws AUTHENTICATION_ERROR if missing)
  getGeminiClient();

  // 2. Enforce local rate limiter
  const limitCheck = appRateLimiter.checkLimit(limiterKey);
  if (!limitCheck.allowed) {
    throw new NivoAIError(
      'LOCAL_RATE_LIMIT',
      'Local rate limit exceeded. Best-effort process-local throttle blocked this generation.'
    );
  }

  const model = configOverrides.model || DEFAULT_GEMINI_MODEL;
  let attempt = 0;

  // Retry loop using exponential backoff
  while (true) {
    try {
      const client = getGeminiClient();

      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          ...configOverrides.config,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new NivoAIError(
          'INVALID_STRUCTURED_OUTPUT',
          'Provider returned an empty response.'
        );
      }

      // Parse JSON safely
      let parsedJson;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseErr) {
        throw new NivoAIError(
          'INVALID_STRUCTURED_OUTPUT',
          'Provider response is not valid JSON.',
          parseErr
        );
      }

      // Validate parsed content against caller-provided Zod schema
      const validation = zodSchema.safeParse(parsedJson);
      if (!validation.success) {
        throw new NivoAIError(
          'INVALID_STRUCTURED_OUTPUT',
          'Provider JSON output failed Zod schema validation rules.',
          validation.error
        );
      }

      return validation.data;

    } catch (err) {
      const classified = classifyError(err);
      
      // Determine retry eligibility (Transient HTTP 429 / 503)
      const isRetryable =
        classified.code === 'PROVIDER_RATE_LIMIT' || classified.code === 'MODEL_OVERLOADED';

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        const waitTime = calculateDelay(attempt);
        await wait(waitTime);
        continue;
      }

      throw classified;
    }
  }
}

/**
 * Generates stream text chunks via an Async Generator.
 * 
 * @param {string} limiterKey - Key identifier for rate-limiting bucket
 * @param {string} prompt - Prompt contents
 * @param {object} [configOverrides] - Optional model and configuration overrides
 * @returns {AsyncGenerator<string, void, unknown>} Text chunk streams
 */
export async function* generateStream(limiterKey, prompt, configOverrides = {}) {
  // 1. Validate local API key configuration first (throws AUTHENTICATION_ERROR if missing)
  getGeminiClient();

  // 2. Enforce local rate limiter
  const limitCheck = appRateLimiter.checkLimit(limiterKey);
  if (!limitCheck.allowed) {
    throw new NivoAIError(
      'LOCAL_RATE_LIMIT',
      'Local rate limit exceeded. Best-effort process-local throttle blocked this generation.'
    );
  }

  const model = configOverrides.model || DEFAULT_GEMINI_MODEL;
  let attempt = 0;
  let responseStream = null;

  // Retry boundary: Transient errors BEFORE first yield chunk can be retried
  while (true) {
    try {
      const client = getGeminiClient();
      responseStream = await client.models.generateContentStream({
        model,
        contents: prompt,
        ...configOverrides.config,
      });
      break; // Stream successfully initialized
    } catch (err) {
      const classified = classifyError(err);
      const isRetryable =
        classified.code === 'PROVIDER_RATE_LIMIT' || classified.code === 'MODEL_OVERLOADED';

      if (isRetryable && attempt < MAX_RETRIES) {
        attempt++;
        const waitTime = calculateDelay(attempt);
        await wait(waitTime);
        continue;
      }

      throw classified;
    }
  }

  // Stream consuming loop: Once chunks start yielding, propagation is direct (no retries)
  try {
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (err) {
    throw classifyError(err);
  }
}
