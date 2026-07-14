import AIMemory from '../models/AIMemory.js';
import { AIMEMORY_LIMITS } from './constants/ai-memory.js';

// MongoDB ObjectId Regex validation constant
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validates MongoDB ObjectId format for parameters.
 * 
 * @param {string} id - Identifier to validate
 * @param {string} name - Field name for error logging
 */
function validateObjectId(id, name) {
  if (typeof id !== 'string' || !objectIdRegex.test(id)) {
    throw new Error(`Invalid identifier: "${name}" must be a 24-character hexadecimal string.`);
  }
}

/**
 * Deterministically normalizes creative memory text fields.
 * Trims outer margins and collapses internal whitespace gaps to single spaces (M4.7 Normalization).
 * 
 * @param {string} text 
 * @returns {string} Normalized string
 */
export function normalizeMemoryText(text) {
  if (typeof text !== 'string') return '';
  return text.trim().replace(/\s+/g, ' ');
}

function mergeHistoryArray(existingArray, incomingArray, maxLimit) {
  // Helper to normalize strings for comparison (trim, lowercase, collapse repeated whitespace)
  const normalizeForComparison = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  let result = [...(existingArray || [])];

  for (const incomingItem of (incomingArray || [])) {
    if (typeof incomingItem !== 'string') continue;
    const incomingTrimmed = incomingItem.trim();
    if (incomingTrimmed.length === 0) continue;

    const incomingNormalized = normalizeForComparison(incomingTrimmed);

    // Remove ALL older normalized duplicates (case-insensitive, whitespace-collapsed)
    result = result.filter((item) => normalizeForComparison(item) !== incomingNormalized);

    // Append the new accepted value (trimmed at boundaries, but preserving casing & internal whitespace)
    result.push(incomingTrimmed);
  }

  // Cap the array keeping only the N newest elements
  return result.slice(-maxLimit);
}

/**
 * Processes content pillars, performing trimming, case-insensitive deduplication, 
 * order preservation, and rejecting overflows (M4.7 Pillars Behavior).
 */
function processContentPillars(pillarsArray, maxLimit) {
  if (!pillarsArray) return [];

  const normalized = pillarsArray.map(normalizeMemoryText).filter(Boolean);
  const seen = new Set();
  const result = [];

  for (const item of normalized) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }

  // Reject overflow explicitly instead of silently slicing
  if (result.length > maxLimit) {
    throw new Error(`Content pillars exceed the maximum allowed limit of ${maxLimit} entries.`);
  }

  return result;
}

/**
 * Retrieves the AIMemory document associated with the creator profile (Read-only).
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.profileId
 * @returns {Promise<import('mongoose').Document|null>} Memory document or null
 */
export async function getAIMemory({ userId, profileId }) {
  validateObjectId(userId, 'userId');
  validateObjectId(profileId, 'profileId');
  return AIMemory.findOne({ userId, profileId });
}

/**
 * Retrieves the AIMemory document, creating an empty database record if it is absent.
 * Implements a read-after-conflict strategy to resolve duplicate-key conflicts (M4.7 Concurrency).
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.profileId
 * @returns {Promise<import('mongoose').Document>} Memory document
 */
export async function ensureAIMemory({ userId, profileId }) {
  validateObjectId(userId, 'userId');
  validateObjectId(profileId, 'profileId');

  let doc = await AIMemory.findOne({ userId, profileId });
  if (doc) {
    return doc;
  }

  try {
    doc = await AIMemory.create({
      userId,
      profileId,
      recentTopics: [],
      recentHooks: [],
      recentScriptSummaries: [],
    });
    return doc;
  } catch (err) {
    // Catch duplicate index writes (code 11000) due to concurrent operations
    if (err.code === 11000) {
      doc = await AIMemory.findOne({ userId, profileId });
      if (doc) {
        return doc;
      }
    }
    throw err;
  }
}

// Bounded concurrency retry parameters (M4.7 Concurrency Correction)
const MAX_MUTATION_ATTEMPTS = 3;

/**
 * Custom error class representing memory transaction conflict exhaustion
 */
export class NivoMemoryConflictError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'NivoMemoryConflictError';
    this.code = 'MEMORY_CONFLICT';
    this.cause = originalError;
  }
}

/**
 * Appends data to rolling recent-history arrays (topics, hooks, summaries).
 * Uses read-modify-save with Mongoose optimistic concurrency retries.
 */
export async function appendAIMemory({ userId, profileId, topics, hooks, scriptSummaries }) {
  validateObjectId(userId, 'userId');
  validateObjectId(profileId, 'profileId');

  if (topics && !Array.isArray(topics)) throw new Error('topics must be an array.');
  if (hooks && !Array.isArray(hooks)) throw new Error('hooks must be an array.');
  if (scriptSummaries && !Array.isArray(scriptSummaries)) throw new Error('scriptSummaries must be an array.');

  let attempt = 0;
  while (true) {
    try {
      const doc = await ensureAIMemory({ userId, profileId });

      if (topics) {
        doc.recentTopics = mergeHistoryArray(doc.recentTopics, topics, AIMEMORY_LIMITS.TOPICS_MAX_COUNT);
      }

      if (hooks) {
        doc.recentHooks = mergeHistoryArray(doc.recentHooks, hooks, AIMEMORY_LIMITS.HOOKS_MAX_COUNT);
      }

      if (scriptSummaries) {
        doc.recentScriptSummaries = mergeHistoryArray(
          doc.recentScriptSummaries,
          scriptSummaries,
          AIMEMORY_LIMITS.SCRIPT_SUMMARIES_MAX_COUNT
        );
      }

      return await doc.save();
    } catch (err) {
      if (err.name === 'VersionError' && attempt < MAX_MUTATION_ATTEMPTS - 1) {
        attempt++;
        continue;
      }
      if (err.name === 'VersionError') {
        throw new NivoMemoryConflictError(
          'Failed to append AI creative memory due to persistent concurrent version conflicts.',
          err
        );
      }
      throw err;
    }
  }
}
