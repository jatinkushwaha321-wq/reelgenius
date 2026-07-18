import { knowledgeCandidateSchema } from './knowledge-contracts.js';

export const CATEGORY_KEYWORDS = {
  Creator: ['creator', 'i prefer', 'my preferred', 'my style', 'format'],
  Audience: ['audience', 'viewer', 'subscribers', 'community'],
  Experiment: ['fail', 'unsuccessful', 'success', 'perform', 'outperform', 'underperform', 'experiment'],
  Evolution: ['evolution', 'sophistication', 'advanced', 'mature', 'sophisticated', 'niche shift', 'transitioned'],
};

/**
 * Normalizes a statement by collapsing consecutive whitespace, trimming,
 * capitalizing the first letter, and ensuring proper sentence-ending punctuation.
 * @param {string} text
 * @returns {string}
 */
export function normalizeStatement(text) {
  if (!text) return '';
  // Collapse consecutive whitespace characters (spaces, tabs, newlines) into a single space
  let str = text.replace(/\s+/g, ' ').trim();
  if (str.length === 0) return '';
  str = str.charAt(0).toUpperCase() + str.slice(1);
  if (!str.endsWith('.') && !str.endsWith('!') && !str.endsWith('?')) {
    str += '.';
  }
  return str;
}

/**
 * Deterministically categorizes statements based on keyword matching rules.
 * @param {string} statement
 * @returns {string|null}
 */
export function determineCategory(statement) {
  const lower = statement.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return category;
    }
  }
  return null;
}

/**
 * Transforms an Evaluation Report and its Candidate Idea into an array of Knowledge Candidate hypotheses.
 * @param {Object} evaluationReport
 * @param {Object} candidateIdea
 * @param {Object} contextOptions
 * @returns {Array<Object>}
 */
export function extractKnowledgeCandidates(evaluationReport, candidateIdea, contextOptions = {}) {
  if (!evaluationReport || !candidateIdea) {
    throw new Error('Evaluation report and Candidate Idea are required for extraction.');
  }

  const userId = candidateIdea.userId || contextOptions.userId;
  const profileId = candidateIdea.profileId || contextOptions.profileId;
  const ideaTitle = candidateIdea.title || 'Untitled Idea';
  const candidateIdeaId = candidateIdea._id || candidateIdea.id;
  
  // Extract evaluation report ID from the report object or options
  const evaluationReportId = evaluationReport._id || evaluationReport.id || contextOptions.evaluationReportId;
  if (!evaluationReportId) {
    throw new Error('Evaluation Report ID is required for building evidence citations.');
  }

  const verdict = evaluationReport.overallVerdict?.recommendation;
  if (!verdict) {
    throw new Error('Evaluation verdict recommendation (APPROVE/REJECT) is required.');
  }

  // Prefer evaluationReport.createdAt or evaluationReport.timestamp
  const timestamp = evaluationReport.createdAt || evaluationReport.timestamp || contextOptions.timestamp || new Date();
  
  const rawStatements = [];
  
  // Map validated learnings from approved ideas
  if (verdict === 'APPROVE' && Array.isArray(evaluationReport.validatedLearnings)) {
    evaluationReport.validatedLearnings.forEach(learning => {
      if (learning && typeof learning === 'string') {
        rawStatements.push({ text: learning, defaultCategory: 'Strategy' });
      }
    });
  }

  // Map rejection reasons from rejected ideas
  if (verdict === 'REJECT' && Array.isArray(evaluationReport.rejectionReasons)) {
    evaluationReport.rejectionReasons.forEach(reason => {
      if (reason && typeof reason === 'string') {
        rawStatements.push({ text: reason, defaultCategory: 'Experiment' });
      }
    });
  }

  // Deduplicate statements after normalization
  const uniqueStatements = new Map();
  rawStatements.forEach(({ text, defaultCategory }) => {
    const normalized = normalizeStatement(text);
    if (normalized && !uniqueStatements.has(normalized)) {
      uniqueStatements.set(normalized, defaultCategory);
    }
  });

  const candidates = [];
  for (const [normalized, defaultCategory] of uniqueStatements.entries()) {
    const category = determineCategory(normalized) || defaultCategory;

    const candidatePayload = {
      userId,
      profileId,
      normalizedStatement: normalized,
      category,
      evidenceReferences: [
        {
          evaluationReportId,
          candidateIdeaId: candidateIdeaId ? candidateIdeaId.toString() : null,
          ideaTitle,
          timestamp,
          verdict
        }
      ],
      lifecycleStatus: 'CANDIDATE',
      createdAt: timestamp,
      updatedAt: timestamp,
      metadata: contextOptions.metadata || {}
    };

    // Validate using Zod contract schema
    candidates.push(knowledgeCandidateSchema.parse(candidatePayload));
  }

  return candidates;
}
