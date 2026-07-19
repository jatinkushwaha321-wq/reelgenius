import {
  ideaGenerationOutputSchema,
  containsPlaceholder,
  containsEpistemicViolation,
  containsNivoIntelligenceViolation,
  containsReasoningEpistemicViolation,
  containsAutobiographyClaim,
  stripSignalRefs,
} from '../validations/ideas-generation.js';
import { deriveObservedFact, deriveEvidencePresentation } from './signal-helpers.js';

/**
 * Calculates Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a, b) {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 1; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Normalizes title for comparison.
 */
export function normalizeTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// INTEL-2F.1 — Minimum post-cleanup string length thresholds
// ---------------------------------------------------------------------------

const MIN_LENGTHS = {
  title: 5,
  topic: 3,
  concept: 20,
  whyNow: 10,
  hook: 5,
  directionReasoning: 10,
};

/**
 * Parses and validates Gemini structured JSON output for Idea candidates.
 * Performs provenance validation, derive-first contract verification,
 * placeholder detection, epistemic guard, and signal ref cleanup.
 *
 * INTEL-2F.1: Structured derivation contract enforcement.
 * 
 * @param {object|string} rawJson - Raw JSON from Gemini or already parsed object
 * @param {Map<string, object>} signalRefMap - Map of sig_001 -> Signal document
 * @param {string} [creatorDisplayName] - Creator display name for autobiography detection
 * @returns {Array<object>} Validated and resolved idea candidates
 */
export function parseIdeaOutput(rawJson, signalRefMap, creatorDisplayName) {
  let parsed;
  if (typeof rawJson === 'string') {
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      const error = new Error('Provider JSON output failed structural parsing rules.');
      error.code = 'NO_VALID_CANDIDATES';
      throw error;
    }
  } else {
    parsed = rawJson;
  }

  // 1. Zod structural validation (includes INTEL-2E.1 bounded-string preprocessing)
  const validation = ideaGenerationOutputSchema.safeParse(parsed);
  if (!validation.success) {
    console.error('[NIVO] Zod validation failure for ideas output:', validation.error.issues);
    const error = new Error('Provider JSON output failed Zod schema validation rules.');
    error.code = 'NO_VALID_CANDIDATES';
    error.details = validation.error.issues;
    throw error;
  }

  const { candidates } = validation.data;
  const validCandidates = [];

  // 2. Per-candidate validation (derive-first + provenance + content quality)
  for (const cand of candidates) {
    try {
      // --- PHASE A: Signal ref cleanup on prose fields ---
      const cleanTitle = stripSignalRefs(cand.title || '');
      const cleanTopic = stripSignalRefs(cand.topic || '');
      const cleanConcept = stripSignalRefs(cand.concept || '');
      const cleanHook = stripSignalRefs(cand.hook || '');
      const cleanNoveltyReason = stripSignalRefs(cand.noveltyReason || '');

      // --- PHASE B: Post-cleanup minimum length validation ---
      if (cleanTitle.length < MIN_LENGTHS.title) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: title too short after ref cleanup (${cleanTitle.length} < ${MIN_LENGTHS.title}).`);
        continue;
      }
      if (cleanTopic.length < MIN_LENGTHS.topic) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: topic too short after ref cleanup.`);
        continue;
      }
      if (cleanConcept.length < MIN_LENGTHS.concept) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: concept too short after ref cleanup.`);
        continue;
      }
      if (cleanHook.length < MIN_LENGTHS.hook) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: hook too short after ref cleanup.`);
        continue;
      }

      // --- PHASE C: Placeholder detection on creator-facing fields ---
      const placeholderFields = [
        { name: 'title', val: cleanTitle },
        { name: 'topic', val: cleanTopic },
        { name: 'concept', val: cleanConcept },
        { name: 'hook', val: cleanHook },
      ];

      let hasPlaceholder = false;
      for (const field of placeholderFields) {
        if (containsPlaceholder(field.val)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: ${field.name} contains placeholder content.`);
          hasPlaceholder = true;
          break;
        }
      }
      if (hasPlaceholder) continue;

      // --- PHASE C.3: requiresPersonalFact check ---
      if (cand.requiresPersonalFact === true) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: requires unsupported personal fact.`);
        continue;
      }

      // --- PHASE C.5: Autobiography claim detection on creator-facing fields ---
      const autobiographyFields = [
        { name: 'title', val: cleanTitle },
        { name: 'hook', val: cleanHook },
        { name: 'concept', val: cleanConcept },
      ];

      let hasAutobiographyClaim = false;
      for (const field of autobiographyFields) {
        if (containsAutobiographyClaim(field.val, creatorDisplayName)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: ${field.name} contains unsupported autobiography claim.`);
          hasAutobiographyClaim = true;
          break;
        }
      }
      if (hasAutobiographyClaim) continue;

      // --- PHASE D.1: NIVO intelligence violation detection (GLOBAL — all provider fields) ---
      const globalEpistemicFields = [
        { name: 'title', val: cleanTitle },
        { name: 'hook', val: cleanHook },
        { name: 'concept', val: cleanConcept },
        { name: 'topic', val: cleanTopic },
        { name: 'noveltyReason', val: cleanNoveltyReason },
        { name: 'contentPillar', val: cand.contentPillar || '' },
        { name: 'derivationBasis', val: cand.derivationBasis || '' },
      ];

      let hasEpistemicViolation = false;
      for (const field of globalEpistemicFields) {
        if (containsNivoIntelligenceViolation(field.val)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: ${field.name} contains unsupported NIVO intelligence claim.`);
          hasEpistemicViolation = true;
          break;
        }
      }
      if (hasEpistemicViolation) continue;

      // --- PHASE D.2: Reasoning-only epistemic violation detection (noveltyReason + derivationBasis) ---
      const reasoningFields = [
        { name: 'noveltyReason', val: cleanNoveltyReason },
        { name: 'derivationBasis', val: cand.derivationBasis || '' },
      ];

      let hasReasoningViolation = false;
      for (const field of reasoningFields) {
        if (containsReasoningEpistemicViolation(field.val)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: ${field.name} contains unsupported epistemic claim.`);
          hasReasoningViolation = true;
          break;
        }
      }
      if (hasReasoningViolation) continue;

      // --- PHASE E: Derive-first contract validation (primarySignalRef) ---
      const primaryRef = (cand.primarySignalRef || '').trim();
      if (!primaryRef) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: missing primarySignalRef.`);
        continue;
      }

      if (!signalRefMap.has(primaryRef)) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: primarySignalRef "${primaryRef}" does not resolve in signalRefMap.`);
        continue;
      }

      const primarySignalDoc = signalRefMap.get(primaryRef);
      if (primarySignalDoc.confidence < 60) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: primary signal "${primaryRef}" has confidence ${primarySignalDoc.confidence} < 60.`);
        continue;
      }

      // Ensure primarySignalRef is included in supportingSignalRefs
      const rawRefs = cand.supportingSignalRefs || [];
      const uniqueRefs = [...new Set(rawRefs)];
      if (!uniqueRefs.includes(primaryRef)) {
        uniqueRefs.unshift(primaryRef);
      }

      // --- PHASE F: Supporting signal provenance validation (existing) ---
      if (uniqueRefs.length === 0) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: zero supporting signals.`);
        continue;
      }

      let hasHighConfidence = false;
      const resolvedKeys = [];
      const snapshots = [];
      let allRefsValid = true;

      for (const ref of uniqueRefs) {
        const signalDoc = signalRefMap.get(ref);
        if (!signalDoc) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: signal ref ${ref} is invalid.`);
          allRefsValid = false;
          break;
        }

        if (signalDoc.confidence >= 60) {
          hasHighConfidence = true;
        }

        resolvedKeys.push(signalDoc.key);
        snapshots.push({
          key: signalDoc.key,
          displayName: signalDoc.displayName,
          strength: signalDoc.strength,
          confidence: signalDoc.confidence,
          trend: signalDoc.trend,
          directionImplication: signalDoc.directionImplication,
        });
      }

      if (!allRefsValid) continue;

      // Rule: at least one supporting signal must have confidence >= 60
      if (!hasHighConfidence) {
        console.warn(`[NIVO] Candidate "${cand.title}" dropped: no cited signal has confidence >= 60.`);
        continue;
      }

      // --- Precedence: LLM Reasoning -> Template Fallback (Roadmap Phase 4) ---
      let cleanDirectionReasoning = cand.directionReasoning ? stripSignalRefs(cand.directionReasoning) : '';
      if (cleanDirectionReasoning) {
        if (cleanDirectionReasoning.length < MIN_LENGTHS.directionReasoning) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: directionReasoning too short after cleanup (${cleanDirectionReasoning.length} < ${MIN_LENGTHS.directionReasoning}).`);
          continue;
        }
        if (containsPlaceholder(cleanDirectionReasoning)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: directionReasoning contains placeholder content.`);
          continue;
        }
        if (containsAutobiographyClaim(cleanDirectionReasoning, creatorDisplayName)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: directionReasoning contains autobiography claim.`);
          continue;
        }
        if (containsNivoIntelligenceViolation(cleanDirectionReasoning)) {
          console.warn(`[NIVO] Candidate "${cand.title}" dropped: directionReasoning contains NIVO intelligence claim.`);
          continue;
        }
      } else {
        const format = (cand.format || 'other').trim();
        const topic = (cand.topic || '').trim().replace(/[.!?]+$/, '');
        const cleanedFact = deriveEvidencePresentation(primarySignalDoc.evidence);
        if (cleanedFact) {
          cleanDirectionReasoning = `This direction expands on an active content signal to propose a ${format} format focused on ${topic}. One supporting observation: ${cleanedFact}`;
        } else {
          cleanDirectionReasoning = `This direction expands on an active content signal from the analyzed content set to propose a ${format} format focused on ${topic}.`;
        }
      }

      const strength = primarySignalDoc.strength ?? 0;
      const strengthText = strength >= 80 ? 'high-strength' : (strength >= 60 ? 'moderate-strength' : 'developing');
      
      let cleanWhyNow = (cand.derivationBasis || '').trim();
      if (!cleanWhyNow) {
        if (primarySignalDoc.trend === 'unknown') {
          cleanWhyNow = `Derived from a ${strengthText} content signal that does not yet have a resolved momentum trend in the analyzed content set.`;
        } else {
          let trendText = '';
          switch (primarySignalDoc.trend) {
            case 'rising':
              trendText = 'shows rising momentum';
              break;
            case 'stable':
              trendText = 'shows stable, consistent performance';
              break;
            case 'falling':
              trendText = 'is showing declining momentum';
              break;
          }
          cleanWhyNow = `Derived from a ${strengthText} content signal that ${trendText} relative to the analyzed content set.`;
        }
      }

      // --- Candidate is valid: build output (primarySignalRef/derivationBasis are validation-only) ---
      validCandidates.push({
        title: cleanTitle,
        topic: cleanTopic,
        concept: cleanConcept,
        whyNow: cleanWhyNow,
        format: cand.format,
        contentPillar: (cand.contentPillar || '').trim(),
        hook: cleanHook,
        directionReasoning: cleanDirectionReasoning,
        noveltyReason: cleanNoveltyReason,
        sourceSignalKeys: resolvedKeys,
        sourceSignalSnapshots: snapshots,
      });

    } catch (err) {
      console.error(`[NIVO] Error validating candidate "${cand.title}":`, err);
    }
  }

  if (validCandidates.length === 0) {
    const error = new Error('No generated candidates passed NIVO provenance validation rules.');
    error.code = 'NO_VALID_CANDIDATES';
    throw error;
  }

  return validCandidates;
}

/**
 * Filters out duplicate and near-duplicate candidates (Levenshtein distance <= 3)
 * against existing Idea titles and within the batch.
 * 
 * @param {Array<object>} candidates - Validated candidates
 * @param {Array<string>} existingTitles - Existing idea titles
 * @returns {Array<object>} Filtered candidates
 */
export function filterDuplicateCandidates(candidates, existingTitles) {
  const filtered = [];
  const normalizedExisting = (existingTitles || []).map(normalizeTitle).filter(Boolean);
  const normalizedBatch = [];

  for (const cand of candidates) {
    const normTitle = normalizeTitle(cand.title);
    if (!normTitle) continue;

    // Check against existing database titles (exact or near-duplicate)
    const isDbDuplicate = normalizedExisting.some((exTitle) => {
      if (exTitle === normTitle) return true;
      return getLevenshteinDistance(normTitle, exTitle) <= 3;
    });

    if (isDbDuplicate) {
      console.warn(`[NIVO] Dropping candidate "${cand.title}" as it duplicates an existing Idea title.`);
      continue;
    }

    // Check against already accepted candidates in this batch (exact or near-duplicate)
    const isBatchDuplicate = normalizedBatch.some((bTitle) => {
      if (bTitle === normTitle) return true;
      return getLevenshteinDistance(normTitle, bTitle) <= 3;
    });

    if (isBatchDuplicate) {
      console.warn(`[NIVO] Dropping candidate "${cand.title}" as it duplicates another candidate in the same batch.`);
      continue;
    }

    filtered.push(cand);
    normalizedBatch.push(normTitle);
  }

  return filtered;
}
