import { knowledgeRetrievalSchema } from './knowledge-contracts.js';

// Exported scoring constants for easy tuning
export const BASE_STRENGTH_WEIGHT = 0.4;
export const KEYWORD_MATCH_WEIGHT = 15;
export const MAX_KEYWORD_BONUS = 50;

/**
 * Calculates a deterministic relevance score for a validated knowledge item
 * based on exact keyword token matching and empirical evidence strength.
 * @param {Object} item - Validated knowledge item
 * @param {Object} context - Retrieval context
 * @param {string} context.topic - Target topic area
 * @param {Array<string>} [context.keywords] - Optional explicit search keywords
 * @returns {Object} { score: number, reasons: Array<string> }
 */
export function calculateRelevance(item, context = {}) {
  let score = 0;
  const reasons = [];

  // Base score proportional to its empirical evidence strength
  const strength = item.strengthMetrics?.strength || 0;
  const strengthContribution = strength * BASE_STRENGTH_WEIGHT;
  score += strengthContribution;
  reasons.push(`Base strength contribution: +${Math.round(strengthContribution)}`);

  // Extract and deduplicate keywords using a Set
  const keywordSet = new Set();
  if (context.topic && typeof context.topic === 'string') {
    context.topic.split(/\s+/).forEach(k => {
      const clean = k.toLowerCase().replace(/[^\w]/g, '');
      if (clean.length > 2) keywordSet.add(clean);
    });
  }
  if (Array.isArray(context.keywords)) {
    context.keywords.forEach(k => {
      if (k && typeof k === 'string') {
        const clean = k.toLowerCase().replace(/[^\w]/g, '');
        if (clean.length > 2) keywordSet.add(clean);
      }
    });
  }

  // Token-based keyword matching to avoid false positives (e.g. "ai" matching "chair")
  const statementTokens = new Set(
    item.normalizedStatement
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.replace(/[^\w]/g, ''))
      .filter(t => t.length > 0)
  );

  let keywordMatchCount = 0;
  keywordSet.forEach(kw => {
    if (statementTokens.has(kw)) {
      keywordMatchCount++;
    }
  });

  if (keywordMatchCount > 0) {
    const bonus = Math.min(MAX_KEYWORD_BONUS, keywordMatchCount * KEYWORD_MATCH_WEIGHT);
    score += bonus;
    reasons.push(`Keyword match matches (${keywordMatchCount} match(es)): +${bonus}`);
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, Math.round(score)));

  return { score, reasons };
}

/**
 * Deterministically filters, ranks, and groups validated knowledge items relevant to the request.
 * @param {Array<Object>} existingStore - Collection of all stored candidate, validated, and deprecated items
 * @param {Object} context - Reasoning request context
 * @param {Object} [options] - Retrieval ranking options
 * @param {number} [options.relevanceThreshold] - Minimum score required to retrieve (default 20)
 * @param {number} [options.maxItemsPerCategory] - Max items to return per category (default 5)
 * @returns {Object} Structured knowledge context compliant with knowledgeRetrievalSchema
 */
export function retrieveKnowledge(existingStore = [], context = {}, options = {}) {
  const relevanceThreshold = options.relevanceThreshold || 20;
  const maxItemsPerCategory = options.maxItemsPerCategory || 5;

  const groupedKnowledge = {
    Creator: [],
    Audience: [],
    Strategy: [],
    Experiment: [],
    Evolution: []
  };

  const rankingMetadata = [];
  const categoriesPresentSet = new Set();

  // Retrieve only items in VALIDATED state
  const validatedItems = existingStore.filter(
    item => item.lifecycleStatus === 'VALIDATED'
  );

  const scoredItems = validatedItems.map(item => {
    const { score, reasons } = calculateRelevance(item, context);
    return { item, score, reasons };
  });

  // Sort items deterministically: score DESC -> strength DESC -> normalizedStatement ASC
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const strengthA = a.item.strengthMetrics?.strength || 0;
    const strengthB = b.item.strengthMetrics?.strength || 0;
    if (strengthB !== strengthA) return strengthB - strengthA;
    return a.item.normalizedStatement.localeCompare(b.item.normalizedStatement);
  });

  scoredItems.forEach(({ item, score, reasons }) => {
    if (score >= relevanceThreshold) {
      const category = item.category;
      if (groupedKnowledge[category] && groupedKnowledge[category].length < maxItemsPerCategory) {
        const itemId = item._id || item.id;
        if (!itemId) {
          throw new Error('Item ID is required for retrieval mapping.');
        }

        // Map to lightweight DTO schema format
        const lightweightItem = {
          id: itemId.toString(),
          normalizedStatement: item.normalizedStatement,
          category: item.category,
          strength: item.strengthMetrics?.strength || 0,
          metadata: item.metadata || {},
        };

        groupedKnowledge[category].push(lightweightItem);
        categoriesPresentSet.add(category);

        rankingMetadata.push({
          itemId: itemId.toString(),
          score,
          reasons
        });
      }
    }
  });

  const retrievalPayload = {
    groupedKnowledge,
    rankingMetadata,
    retrievedAt: new Date(),
    summaryMetadata: {
      totalRetrieved: rankingMetadata.length,
      categoriesPresent: Array.from(categoriesPresentSet)
    }
  };

  // Validate output using Zod contract schema
  return knowledgeRetrievalSchema.parse(retrievalPayload);
}
