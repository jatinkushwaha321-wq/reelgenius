import {
  knowledgeCandidateSchema,
  validatedKnowledgeSchema
} from './knowledge-contracts.js';

/**
 * Computes a normalized key for deterministic statement matching.
 * Removes punctuation, normalizes spacing, and converts to lowercase.
 * @param {string} statement
 * @returns {string}
 */
export function getNormalizedKey(statement) {
  if (!statement) return '';
  return statement
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Evaluates candidate metrics and promotes to validated status if net support meets threshold.
 * @private
 */
function evaluatePromotion(match, promotionThreshold, initialStrength, supportIncrement, timestamp) {
  const primaryVerdict = match.evidenceReferences?.[0]?.verdict || 'APPROVE';
  const supportCount = match.evidenceReferences.filter(ref => ref.verdict === primaryVerdict).length;
  const contradictionCount = match.evidenceReferences.filter(ref => ref.verdict !== primaryVerdict).length;
  const netSupport = supportCount - contradictionCount;

  if (netSupport >= promotionThreshold) {
    // Promote candidate to validated
    const finalStrength = Math.min(100, initialStrength + (netSupport - promotionThreshold) * supportIncrement);
    const validatedItem = {
      userId: match.userId,
      profileId: match.profileId,
      normalizedStatement: match.normalizedStatement,
      category: match.category,
      evidenceReferences: match.evidenceReferences,
      strengthMetrics: {
        strength: finalStrength,
        supportCount,
        contradictionCount
      },
      contradictionHistory: match.evidenceReferences.filter(ref => ref.verdict !== primaryVerdict),
      lifecycleStatus: 'VALIDATED',
      createdAt: match.createdAt,
      updatedAt: timestamp,
      metadata: { ...match.metadata, promotedFromCandidate: true }
    };
    return validatedKnowledgeSchema.parse(validatedItem);
  } else {
    return knowledgeCandidateSchema.parse(match);
  }
}

/**
 * Handles supporting observations for candidates, validated, and deprecated states.
 * @private
 */
function handleSupportingObservation(match, candEvidenceRef, promotionThreshold, initialStrength, supportIncrement, recoveryThreshold) {
  const duplicate = match.evidenceReferences.some(
    ref => ref.evaluationReportId === candEvidenceRef.evaluationReportId
  );

  if (match.lifecycleStatus === 'CANDIDATE') {
    if (!duplicate) {
      match.evidenceReferences.push(candEvidenceRef);
    }
    match.updatedAt = candEvidenceRef.timestamp;
    return evaluatePromotion(match, promotionThreshold, initialStrength, supportIncrement, candEvidenceRef.timestamp);
  } else if (match.lifecycleStatus === 'VALIDATED') {
    if (!duplicate) {
      match.evidenceReferences.push(candEvidenceRef);
      match.strengthMetrics.supportCount += 1;
      match.strengthMetrics.strength = Math.min(100, match.strengthMetrics.strength + supportIncrement);
    }
    match.updatedAt = candEvidenceRef.timestamp;
    return validatedKnowledgeSchema.parse(match);
  } else if (match.lifecycleStatus === 'DEPRECATED') {
    if (!duplicate) {
      match.evidenceReferences.push(candEvidenceRef);
      match.strengthMetrics.supportCount += 1;
      match.strengthMetrics.strength = Math.min(100, match.strengthMetrics.strength + supportIncrement);
    }
    match.updatedAt = candEvidenceRef.timestamp;

    // Reactivate only if recovery threshold is achieved
    if (match.strengthMetrics.strength >= recoveryThreshold) {
      match.lifecycleStatus = 'VALIDATED';
    }
    return validatedKnowledgeSchema.parse(match);
  }
  return match;
}

/**
 * Handles contradictory observations for candidates, validated, and deprecated states.
 * @private
 */
function handleContradictoryObservation(match, candEvidenceRef, contradictionDecrement) {
  if (match.lifecycleStatus === 'CANDIDATE') {
    const duplicate = match.evidenceReferences.some(
      ref => ref.evaluationReportId === candEvidenceRef.evaluationReportId
    );
    if (!duplicate) {
      // Append contradiction to evidence references for tracing
      match.evidenceReferences.push(candEvidenceRef);
    }
    match.updatedAt = candEvidenceRef.timestamp;
    return knowledgeCandidateSchema.parse(match);
  } else if (match.lifecycleStatus === 'VALIDATED') {
    const duplicate = match.contradictionHistory.some(
      ref => ref.evaluationReportId === candEvidenceRef.evaluationReportId
    );
    if (!duplicate) {
      match.contradictionHistory.push(candEvidenceRef);
      match.strengthMetrics.contradictionCount += 1;
      match.strengthMetrics.strength = Math.max(0, match.strengthMetrics.strength - contradictionDecrement);
    }
    match.updatedAt = candEvidenceRef.timestamp;

    if (match.strengthMetrics.strength === 0) {
      match.lifecycleStatus = 'DEPRECATED';
    }
    return validatedKnowledgeSchema.parse(match);
  } else if (match.lifecycleStatus === 'DEPRECATED') {
    const duplicate = match.contradictionHistory.some(
      ref => ref.evaluationReportId === candEvidenceRef.evaluationReportId
    );
    if (!duplicate) {
      match.contradictionHistory.push(candEvidenceRef);
      match.strengthMetrics.contradictionCount += 1;
    }
    match.updatedAt = candEvidenceRef.timestamp;
    return validatedKnowledgeSchema.parse(match);
  }
  return match;
}

/**
 * Consolidates incoming candidates against existing stored knowledge items.
 * Performs deterministic merges, promotes candidates to validated, adjusts strength,
 * handles contradictions, and deprecates weak/obsolete items.
 * @param {Array<Object>} existingStore - Array of existing Candidate or Validated items
 * @param {Array<Object>} newCandidates - Array of newly extracted Candidate items
 * @param {Object} options
 * @param {number} options.promotionThreshold - Minimum distinct evidence count to promote (default 3)
 * @param {number} options.initialStrength - Starting strength of promoted knowledge (default 50)
 * @param {number} options.supportIncrement - Strength increase per supporting observation (default 10)
 * @param {number} options.contradictionDecrement - Strength decrease per contradiction (default 25)
 * @param {number} options.recoveryThreshold - Strength recovery threshold for deprecated items (default 50)
 * @returns {Array<Object>} Updated stored knowledge array (validated & candidate items)
 */
export function consolidateKnowledge(existingStore = [], newCandidates = [], options = {}) {
  const promotionThreshold = options.promotionThreshold || 3;
  const initialStrength = options.initialStrength || 50;
  // Reduce default supportIncrement to 10 points to slow progression
  const supportIncrement = options.supportIncrement !== undefined ? options.supportIncrement : 10;
  const contradictionDecrement = options.contradictionDecrement || 25;
  const recoveryThreshold = options.recoveryThreshold || 50;

  // Deep clone existing items to avoid direct mutation.
  // FUTURE MAINTENANCE: Consider replacing this with structuredClone() once runtime
  // support is confirmed across all production target environments.
  const store = existingStore.map(item => JSON.parse(JSON.stringify(item)));

  newCandidates.forEach(newCand => {
    const candKey = getNormalizedKey(newCand.normalizedStatement);
    const candVerdict = newCand.evidenceReferences[0].verdict;
    const candEvidenceRef = newCand.evidenceReferences[0];

    // Match statement ONLY by normalized statement (identity of item)
    const matchIndex = store.findIndex(item => {
      return getNormalizedKey(item.normalizedStatement) === candKey;
    });

    if (matchIndex !== -1) {
      const match = store[matchIndex];
      const primaryVerdict = match.evidenceReferences?.[0]?.verdict || 'APPROVE';

      // Record category mismatch if present in metadata for observability
      if (match.category !== newCand.category) {
        if (!match.metadata) match.metadata = {};
        const mismatches = match.metadata.mismatchedCategories || [];
        if (!mismatches.includes(newCand.category)) {
          mismatches.push(newCand.category);
          match.metadata.mismatchedCategories = mismatches;
        }
      }

      if (candVerdict === primaryVerdict) {
        store[matchIndex] = handleSupportingObservation(
          match,
          candEvidenceRef,
          promotionThreshold,
          initialStrength,
          supportIncrement,
          recoveryThreshold
        );
      } else {
        store[matchIndex] = handleContradictoryObservation(
          match,
          candEvidenceRef,
          contradictionDecrement
        );
      }
    } else {
      // New statement: insert candidate directly
      store.push(knowledgeCandidateSchema.parse(newCand));
    }
  });

  return store;
}
