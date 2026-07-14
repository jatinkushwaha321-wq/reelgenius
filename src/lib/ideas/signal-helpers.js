/**
 * Deterministically derives a compact, bounded observedFact string from signal evidence.
 *
 * Constraints:
 *  - Max items considered: 3
 *  - Per-item fact character limit: 120 (hard slice)
 *  - Final output character limit: 350 (hard slice)
 *  - Safely handles null, undefined, non-array inputs by returning empty string.
 *  - Safely skips malformed items (non-objects, missing/non-string fact).
 *
 * @param {Array} evidence
 * @returns {string}
 */
export function deriveObservedFact(evidence) {
  if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
    return '';
  }

  const validFacts = [];
  for (const item of evidence) {
    if (validFacts.length >= 3) break;
    // Handle both plain objects and mongoose subdocuments (which may wrap properties)
    const rawItem = item && typeof item.toObject === 'function' ? item.toObject() : item;
    if (rawItem && typeof rawItem === 'object' && typeof rawItem.fact === 'string') {
      const cleanFact = rawItem.fact.trim();
      if (cleanFact.length > 0) {
        // Apply per-item limit of 120 characters
        const sliced = cleanFact.length > 120 ? cleanFact.slice(0, 120).trim() : cleanFact;
        validFacts.push(sliced);
      }
    }
  }

  if (validFacts.length === 0) {
    return '';
  }

  // Join items with "; "
  const joined = validFacts.join('; ');

  // Apply final output limit of 350 characters
  return joined.length > 350 ? joined.slice(0, 350).trim() : joined;
}

/**
 * Deterministically derives a polished, single-fact user-facing presentation string.
 * 
 * Constraints:
 *  - Selection: first valid non-empty fact string in the evidence array.
 *  - Whitespace: trimmed, repeated whitespace normalized to a single space.
 *  - Bounding: Max 220 characters. Deterministic truncation on sentence boundary,
 *    whitespace boundary, or hard-cut at 220.
 *  - Punctuation: trailing periods, exclamation marks, or question marks normalized to a single period.
 * 
 * @param {Array} evidence
 * @returns {string}
 */
export function deriveEvidencePresentation(evidence) {
  if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
    return '';
  }

  let rawFact = '';
  for (const item of evidence) {
    const rawItem = item && typeof item.toObject === 'function' ? item.toObject() : item;
    if (rawItem && typeof rawItem === 'object' && typeof rawItem.fact === 'string') {
      const trimmed = rawItem.fact.trim();
      if (trimmed.length > 0) {
        rawFact = trimmed;
        break;
      }
    }
  }

  if (!rawFact) {
    return '';
  }

  // Normalize internal whitespace
  let normalized = rawFact.replace(/\s+/g, ' ');

  // Truncate if > 220 characters
  const maxLen = 220;
  let truncated = normalized;
  if (normalized.length > maxLen) {
    const minRetained = Math.ceil(maxLen * 0.4); // 88 characters (40% of 220)
    
    // 1. Try to find the last complete sentence boundary within 220 characters.
    let sentenceEndIndex = -1;
    for (let i = maxLen - 1; i >= 0; i--) {
      const char = normalized[i];
      if (char === '.' || char === '!' || char === '?') {
        if (i === normalized.length - 1 || /\s/.test(normalized[i + 1])) {
          sentenceEndIndex = i;
          break;
        }
      }
    }
    
    if (sentenceEndIndex !== -1 && (sentenceEndIndex + 1) >= minRetained) {
      truncated = normalized.slice(0, sentenceEndIndex + 1);
    } else {
      // 2. Try to find the last whitespace boundary within 220 characters.
      let spaceIndex = -1;
      for (let i = maxLen - 1; i >= 0; i--) {
        if (/\s/.test(normalized[i])) {
          spaceIndex = i;
          break;
        }
      }
      
      if (spaceIndex !== -1 && spaceIndex >= minRetained) {
        truncated = normalized.slice(0, spaceIndex);
      } else {
        // 3. Hard-cut at 220 characters.
        truncated = normalized.slice(0, maxLen);
      }
    }
  }

  // Final trim and terminal punctuation normalization
  let cleaned = truncated.trim();
  cleaned = cleaned.replace(/[.!?]+$/, '');
  return cleaned ? cleaned + '.' : '';
}
