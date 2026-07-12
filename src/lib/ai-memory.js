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

/**
 * Merges and filters rolling-history arrays, ensuring exact case-insensitive deduplication,
 * recency movement, display casing preservation, and size bounds (M4.7 Deduplication).
 */
function mergeHistoryArray(existingArray, incomingArray, maxLimit) {
  const normalizedExisting = existingArray.map(normalizeMemoryText).filter(Boolean);
  
  // Track original casing variations: lowercaseKey -> originalCase
  const casingMap = new Map();
  normalizedExisting.forEach((val) => {
    casingMap.set(val.toLowerCase(), val);
  });

  const normalizedIncoming = (incomingArray || [])
    .map(normalizeMemoryText)
    .filter(Boolean);

  let result = [...normalizedExisting];

  for (const incomingItem of normalizedIncoming) {
    const lowerVal = incomingItem.toLowerCase();
    
    // Preserve original casing if it already exists, otherwise adopt new casing
    const casingToUse = casingMap.has(lowerVal) ? casingMap.get(lowerVal) : incomingItem;

    // Remove old occurrence to shift it to the end (treating it as recent)
    result = result.filter((item) => item.toLowerCase() !== lowerVal);

    // Append to end (newest)
    result.push(casingToUse);
    casingMap.set(lowerVal, casingToUse);
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
      creatorSummary: '',
      recentTopics: [],
      recentHooks: [],
      recentScriptSummaries: [],
      contentPillars: [],
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
 * Updates the creatorSummary string.
 * Whitespace-only summaries are normalized to empty string.
 */
export async function updateCreatorSummary({ userId, profileId, creatorSummary }) {
  validateObjectId(userId, 'userId');
  validateObjectId(profileId, 'profileId');

  if (typeof creatorSummary !== 'string') {
    throw new Error('creatorSummary must be a string.');
  }

  const normalizedSummary = normalizeMemoryText(creatorSummary);

  if (normalizedSummary.length > AIMEMORY_LIMITS.CREATOR_SUMMARY_MAX_LENGTH) {
    throw new Error(
      `Creator summary exceeds maximum allowed limit of ${AIMEMORY_LIMITS.CREATOR_SUMMARY_MAX_LENGTH} characters.`
    );
  }

  let attempt = 0;
  while (true) {
    try {
      const doc = await ensureAIMemory({ userId, profileId });
      doc.creatorSummary = normalizedSummary;
      return await doc.save();
    } catch (err) {
      // Retry only on version conflicts, fetching fresh document states
      if (err.name === 'VersionError' && attempt < MAX_MUTATION_ATTEMPTS - 1) {
        attempt++;
        continue;
      }
      if (err.name === 'VersionError') {
        throw new NivoMemoryConflictError(
          'Failed to update creator summary due to persistent concurrent version conflicts.',
          err
        );
      }
      throw err;
    }
  }
}

/**
 * Replaces the contentPillars array, rejecting updates that exceed the cap.
 */
export async function replaceContentPillars({ userId, profileId, contentPillars }) {
  validateObjectId(userId, 'userId');
  validateObjectId(profileId, 'profileId');

  if (!Array.isArray(contentPillars)) {
    throw new Error('contentPillars must be an array.');
  }

  const processedPillars = processContentPillars(contentPillars, AIMEMORY_LIMITS.PILLARS_MAX_COUNT);

  let attempt = 0;
  while (true) {
    try {
      const doc = await ensureAIMemory({ userId, profileId });
      doc.contentPillars = processedPillars;
      return await doc.save();
    } catch (err) {
      if (err.name === 'VersionError' && attempt < MAX_MUTATION_ATTEMPTS - 1) {
        attempt++;
        continue;
      }
      if (err.name === 'VersionError') {
        throw new NivoMemoryConflictError(
          'Failed to replace content pillars due to persistent concurrent version conflicts.',
          err
        );
      }
      throw err;
    }
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
