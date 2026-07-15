import { intelligenceOutputSchema } from '../validations/intelligence.js';

/**
 * Prohibited phrases that reference comment text, sentiment, or audience actions
 * that require data NIVO does not possess.
 *
 * Checked case-insensitively. Patterns are designed to catch audience-action claims
 * while allowing creator-action claims (e.g., "the creator asks viewers to suggest topics").
 *
 * Each entry: { pattern: RegExp, category: string }
 */
const EPISTEMIC_VIOLATION_PATTERNS = [
  // Comment-text-dependent audience action claims
  { pattern: /\b(?:audience|followers?|viewers?|users?|commenters?|they)\b[^.]{0,40}\b(?:answered|answering)\s+(?:questions?|the\s+question)/i, category: 'comment-text-dependency' },
  { pattern: /\b(?:audience|followers?|viewers?|users?|commenters?|they)\b[^.]{0,40}\b(?:suggested|suggesting)\s+(?:topics?|new\s+topics?|content)/i, category: 'comment-text-dependency' },
  { pattern: /\b(?:audience|followers?|viewers?|users?|commenters?|they)\b[^.]{0,40}\b(?:requested|requesting)\s+(?:future|more|next|new)\s+(?:content|videos?|topics?)/i, category: 'comment-text-dependency' },
  { pattern: /\bcommenters?\s+(?:requested|suggested|asked|discussed|expressed|shared|indicated)/i, category: 'comment-text-dependency' },
  { pattern: /\bcomments\s+(?:indicate|suggest|show|reveal|demonstrate)\s+that\s+(?:users?|audience|followers?|viewers?)\s+(?:want|need|prefer|enjoy)/i, category: 'comment-text-dependency' },
  { pattern: /\b(?:audience|followers?|viewers?|users?)\s+expressed\s+appreciation/i, category: 'comment-text-dependency' },
  { pattern: /\b(?:audience|followers?|viewers?|users?)\s+shared\s+(?:opinions?|thoughts?|feedback)/i, category: 'comment-text-dependency' },
];

/**
 * Fields to scan for epistemic violations.
 * Maps field path to extraction function.
 */
const SCANNED_FIELDS = [
  {
    path: 'creatorContext.audiencePersona.behaviorProfile',
    extract: (data) => data.creatorContext?.audiencePersona?.behaviorProfile,
  },
  {
    path: 'creatorContext.aiSummary',
    extract: (data) => data.creatorContext?.aiSummary,
  },
  {
    path: 'creatorContext.strategicDirection',
    extract: (data) => data.creatorContext?.strategicDirection,
  },
];

/**
 * Signal-level fields to scan.
 */
const SIGNAL_SCANNED_FIELDS = [
  { path: 'audienceBehavior', key: 'audienceBehavior' },
  { path: 'creatorTrait', key: 'creatorTrait' },
];

/**
 * Scans a text value against all epistemic violation patterns.
 *
 * @param {string} text - Text to scan
 * @returns {object|null} First matched violation { pattern, category } or null
 */
function findEpistemicViolation(text) {
  if (!text || typeof text !== 'string') return null;
  for (const rule of EPISTEMIC_VIOLATION_PATTERNS) {
    if (rule.pattern.test(text)) {
      return { matchedPattern: rule.pattern.toString(), category: rule.category };
    }
  }
  return null;
}

/**
 * Normalizes content pillar percentages using the largest-remainder method.
 *
 * Behavior:
 * - If all percentages are finite non-negative and sum to 100, preserve as-is.
 * - If total is positive but not 100, normalize proportionally to integer percentages
 *   totaling exactly 100 using the largest-remainder allocation method.
 * - If total is 0 or all invalid, return pillars with percentage=0 (no fabricated distribution).
 *
 * @param {Array<object>} pillars - Content pillar objects with { name, description, percentage }
 * @returns {Array<object>} Pillars with normalized integer percentages totaling exactly 100
 */
export function normalizePillarPercentages(pillars) {
  if (!pillars || pillars.length === 0) return pillars;

  // Sanitize each percentage to a non-negative finite number
  const sanitized = pillars.map((p) => {
    const pct = typeof p.percentage === 'number' && Number.isFinite(p.percentage) && p.percentage >= 0
      ? p.percentage
      : 0;
    return { ...p, percentage: pct };
  });

  const total = sanitized.reduce((sum, p) => sum + p.percentage, 0);

  // If total is 0 or effectively 0, return with all zeros (no fabrication)
  if (total <= 0) {
    return sanitized.map((p) => ({ ...p, percentage: 0 }));
  }

  // Check if already totals exactly 100 with all integers
  const allIntegers = sanitized.every((p) => Number.isInteger(p.percentage));
  if (allIntegers && total === 100) {
    return sanitized;
  }

  // Largest-remainder method for proportional integer allocation
  const proportional = sanitized.map((p) => ({
    ...p,
    exact: (p.percentage / total) * 100,
  }));

  // Floor each value
  const floored = proportional.map((p) => ({
    ...p,
    floor: Math.floor(p.exact),
    remainder: p.exact - Math.floor(p.exact),
  }));

  let floorTotal = floored.reduce((sum, p) => sum + p.floor, 0);
  let deficit = 100 - floorTotal;

  // Sort by remainder descending (stable sort by original index for determinism)
  const indexed = floored.map((p, i) => ({ ...p, originalIndex: i }));
  indexed.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.originalIndex - b.originalIndex; // deterministic tie-break
  });

  // Distribute deficit
  for (let i = 0; i < deficit && i < indexed.length; i++) {
    indexed[i].floor += 1;
  }

  // Restore original order and extract final percentages
  indexed.sort((a, b) => a.originalIndex - b.originalIndex);
  return indexed.map((p) => ({
    name: p.name,
    description: p.description,
    percentage: p.floor,
  }));
}

/**
 * Validates Gemini JSON output, applies epistemic guardrails,
 * normalizes content pillar percentages, resolves opaque evidence refs to ObjectIds,
 * validates sample sizes/evidence counts, maps keys to update/create,
 * and handles key collisions.
 *
 * @param {object} rawOutput - Raw parsed JSON response from Gemini
 * @param {Map} refMap - Opaque ref -> { type, id }
 * @param {string} contentTier - Content tier ('limited_context', 'sparse_signals', 'full')
 * @param {Map} existingSignalsMap - Key -> existing signal document
 * @returns {object} { creatorContext, resolvedSignals }
 */
export function parseIntelligenceOutput(rawOutput, refMap, contentTier, existingSignalsMap) {
  // 1. Zod Validation
  const validation = intelligenceOutputSchema.safeParse(rawOutput);
  if (!validation.success) {
    throw new Error(`Zod validation of intelligence output failed: ${validation.error.message}`);
  }

  const data = validation.data;

  // 2. EPISTEMIC GUARDRAIL — Scan for unavailable-knowledge violations
  //    Check creatorContext-level fields
  for (const field of SCANNED_FIELDS) {
    const value = field.extract(data);
    const violation = findEpistemicViolation(value);
    if (violation) {
      const error = new Error(
        `Epistemic guardrail violation in ${field.path}: ${violation.category}`
      );
      error.code = 'EPISTEMIC_VIOLATION';
      error.fieldPath = field.path;
      error.violationCategory = violation.category;
      console.error(
        `[NIVO EPISTEMIC GUARD] Rejected intelligence output. Field: ${field.path}, Category: ${violation.category}`
      );
      throw error;
    }
  }

  //    Check signal-level fields
  const rawSignalsForGuard = data.signals || [];
  for (let i = 0; i < rawSignalsForGuard.length; i++) {
    const sig = rawSignalsForGuard[i];
    for (const sf of SIGNAL_SCANNED_FIELDS) {
      const value = sig[sf.key];
      const violation = findEpistemicViolation(value);
      if (violation) {
        const error = new Error(
          `Epistemic guardrail violation in signals[${i}].${sf.path}: ${violation.category}`
        );
        error.code = 'EPISTEMIC_VIOLATION';
        error.fieldPath = `signals[${i}].${sf.path}`;
        error.violationCategory = violation.category;
        console.error(
          `[NIVO EPISTEMIC GUARD] Rejected intelligence output. Signal: "${sig.displayName}", Field: ${sf.path}, Category: ${violation.category}`
        );
        throw error;
      }
    }
  }

  // 3. Normalize content pillar percentages (largest-remainder method)
  const creatorContext = {
    ...data.creatorContext,
    contentPillars: normalizePillarPercentages(data.creatorContext.contentPillars),
  };

  let rawSignals = data.signals || [];

  // 4. Enforce Content Tier Limits Server-Side
  if (contentTier === 'limited_context') {
    rawSignals = [];
  } else if (contentTier === 'sparse_signals') {
    rawSignals = rawSignals.slice(0, 5);
    rawSignals.forEach((sig) => {
      if (sig.confidence > 50) {
        sig.confidence = 50;
      }
    });
  } else {
    rawSignals = rawSignals.slice(0, 10);
  }

  const resolvedSignals = [];
  const usedKeysInRun = new Set();

  // Helper function to slugify display name
  const slugify = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80);
  };

  // 5. Process Signals
  for (const rawSig of rawSignals) {
    const validEvidence = [];
    const distinctRefKeys = new Set();
    let hasContentRef = false;

    // Resolve evidence references
    for (const ev of rawSig.evidence || []) {
      const refKey = ev.ref;
      if (!refMap.has(refKey)) {
        console.warn(`Dropped invalid evidence ref: "${refKey}"`);
        continue; // Drop invalid or fabricated refs
      }

      const refInfo = refMap.get(refKey);

      // Distinct ref key check
      distinctRefKeys.add(refKey);

      if (refInfo.type === 'content') {
        hasContentRef = true;
      }

      validEvidence.push({
        type: ev.type,
        sourceId: refInfo.type === 'content' ? refInfo.id : 'profile',
        fact: ev.fact,
        metrics: ev.metrics || {},
      });
    }

    // 6. Validate Minimum Signal Evidence
    // Exact rules:
    // - At least 2 distinct valid evidence refs (using the opaque keys to track uniqueness)
    // - At least 1 of those is a content/ObservedContent ref
    // - Profile can count, but never be the sole support (i.e. profile + post_001 is valid)
    if (distinctRefKeys.size < 2 || !hasContentRef) {
      console.warn(`Rejected signal "${rawSig.displayName}" due to insufficient distinct evidence refs. Ref keys: ${Array.from(distinctRefKeys).join(', ')}`);
      continue;
    }

    // Limit to max 5 evidence items (schema validation constraint)
    const finalEvidence = validEvidence.slice(0, 5);

    // 7. Resolve Signal Identity (Update vs Create)
    let key = '';
    let isExisting = false;

    if (rawSig.existingKey) {
      if (existingSignalsMap.has(rawSig.existingKey)) {
        key = rawSig.existingKey;
        isExisting = true;
      } else {
        console.warn(`Gemini output contains unknown existingKey "${rawSig.existingKey}". Treating as new signal.`);
      }
    }

    // If new signal or matching failed, slugify displayName
    if (!key) {
      key = slugify(rawSig.displayName);
    }

    // 8. Handle Key Collisions (Ensure key uniqueness in this run and against other existing signals)
    let finalKey = key;
    let suffix = 2;
    while (
      usedKeysInRun.has(finalKey) || 
      (existingSignalsMap.has(finalKey) && (!isExisting || finalKey !== rawSig.existingKey))
    ) {
      finalKey = `${key}_${suffix}`;
      suffix++;
    }

    usedKeysInRun.add(finalKey);

    resolvedSignals.push({
      key: finalKey,
      displayName: rawSig.displayName,
      category: rawSig.category,
      strength: rawSig.strength,
      confidence: rawSig.confidence,
      creatorTrait: rawSig.creatorTrait,
      audienceBehavior: rawSig.audienceBehavior,
      directionImplication: rawSig.directionImplication,
      evidence: finalEvidence,
      isExisting,
    });
  }

  return {
    creatorContext,
    resolvedSignals,
  };
}
