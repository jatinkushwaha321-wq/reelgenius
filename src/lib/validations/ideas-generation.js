import { z } from 'zod';

/**
 * Deterministic bounded-string normalization for provider-generated text.
 *
 * Semantics:
 *  - Non-string values pass through unchanged (Zod .string() catches them).
 *  - Strings within maxLen are returned trimmed (boundary whitespace only).
 *  - Strings exceeding maxLen are trimmed, then truncated:
 *      1. Prefer the last complete sentence boundary (. ! ?) that fits.
 *      2. Fall back to the last whitespace boundary that fits.
 *      3. Fall back to hard truncation at maxLen.
 *  - Result never exceeds maxLen.
 *  - No ellipsis is appended.
 *  - Deterministic: identical input always produces identical output.
 */
export function truncateBoundedString(value, maxLen) {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const slice = trimmed.slice(0, maxLen);

  // 1. Sentence boundary: find last '. ', '! ', '? ' or sentence-ending punctuation at end
  //    We look for the last occurrence of .!? followed by a space or at the very end of the slice.
  let sentenceEnd = -1;
  for (let i = slice.length - 1; i >= 0; i--) {
    const ch = slice[i];
    if (ch === '.' || ch === '!' || ch === '?') {
      // Accept if this is the last char, or is followed by a space
      if (i === slice.length - 1 || slice[i + 1] === ' ') {
        sentenceEnd = i;
        break;
      }
    }
  }

  // Only use sentence boundary if the resulting text is reasonably long (at least 40% of max)
  if (sentenceEnd >= 0 && sentenceEnd + 1 >= maxLen * 0.4) {
    return slice.slice(0, sentenceEnd + 1).trimEnd();
  }

  // 2. Whitespace boundary: find last space
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace >= maxLen * 0.4) {
    return slice.slice(0, lastSpace).trimEnd();
  }

  // 3. Hard truncation
  return slice;
}

/**
 * Creates a Zod preprocess wrapper that applies truncateBoundedString
 * before the inner schema validates.
 */
function boundedProviderString(maxLen) {
  return z.preprocess(
    (val) => truncateBoundedString(val, maxLen),
    z.string()
  );
}

// ---------------------------------------------------------------------------
// INTEL-2F.1 — Deterministic content quality helpers
// ---------------------------------------------------------------------------

/**
 * Placeholder/template content patterns.
 * These detect fill-in-the-blank content that makes a candidate incomplete.
 *
 * @type {Array<RegExp>}
 */
const PLACEHOLDER_PATTERNS = [
  /\[[A-Z][^\]]{2,}\]/,                                   // [Current Milestone], [Your Topic]
  /\{[a-zA-Z][^}]*\}/,                                    // {topic}, {name}
  /<[a-zA-Z][a-zA-Z0-9]+>/,                               // <milestone>, <topic> (2+ chars tag name)
  /\bX\s+(?:followers|views|subscribers|downloads|users)\b/i, // X followers
  /\b(?:INSERT\s+HERE|PLACEHOLDER)\b/i,                    // INSERT HERE, PLACEHOLDER
  /\bTBD\b/i,                                              // TBD
];

/**
 * Detects unresolved placeholder/template content in a string.
 *
 * @param {string} str
 * @returns {boolean} true if placeholder content is detected
 */
export function containsPlaceholder(str) {
  if (typeof str !== 'string') return false;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * NIVO intelligence integrity patterns (GLOBAL — all provider fields).
 * These detect the system misrepresenting its own intelligence, audience
 * evidence, or performance-prediction authority.
 *
 * @type {Array<RegExp>}
 */
const NIVO_INTELLIGENCE_PATTERNS = [
  /\bviral\s+potential\b/i,
  /\b(?:will|could|can|may)\s+go\s+viral\b/i,
  /\bguaranteed\s+(?:performance|success|reach|growth|engagement)\b/i,
  /\baudience\s+(?:loves?|enjoys?|feels?|wants?|needs?|craves?|demands?)\b/i,
  /\baudience\s+is\s+interested\s+in\b/i,
  /\bstrong\s+connect(?:ions?)\s+with\s+(?:the\s+)?audience\b/i,
  /\bresonates?\s+deeply\b/i,
  /\bcommunity\s+building\b/i,
  /\bpredicted\s+reach\b/i,
  /\baudience'?s?\s+pain\s+point\b/i,
  // Fabricated source attribution / statistics (global)
  /\b(?:according\s+to|research\s+(?:shows?|proves?|confirms?)|studies?\s+(?:shows?|proves?|confirms?))\s+.{0,20}\d+\s*%/i,
  /\b\d+\s*%\s+of\s+(?:resumes?|developers?|programmers?|engineers?|companies|recruiters?|candidates?)\b/i,
];

/**
 * Reasoning-only epistemic patterns (noveltyReason + derivationBasis ONLY).
 * These detect creative-copy conventions that are unacceptable as provider
 * derivation reasoning but normal in proposed creator titles/hooks.
 *
 * @type {Array<RegExp>}
 */
const REASONING_EPISTEMIC_PATTERNS = [
  // Universal / collective audience claims
  /\bwe(?:'ve)?\s+all\b/i,
  /\beveryone\s+(?:knows|feels|experiences|struggles)\b/i,
  /\bevery\s+(?:developer|coder|programmer)\s+(?:struggles|experiences|knows|feels)\b/i,
  /\ball\s+(?:developers|coders|programmers)\s+(?:experience|struggle|know|feel)\b/i,
  /\b(?:developers|coders|programmers)\s+always\b/i,
  // Definitive outcome / efficacy claims
  /\blands?\s+interviews?\b/i,
  /\bgets?\s+(?:you\s+)?(?:hired|jobs?)\b/i,
  /\bguarantees?\s+(?:callbacks|interviews|results)\b/i,
  /\b(?:beats|passes?)\s+ATS\b/i,
  /\b(?:doubles?|increases?|boosts?)\s+(?:engagement|views|reach)\b/i,
  /\bmakes?\s+recruiters\s+notice\s+you\b/i,
];

/**
 * Detects NIVO intelligence integrity violations (global — all fields).
 *
 * @param {string} str
 * @returns {boolean} true if a NIVO intelligence violation is detected
 */
export function containsNivoIntelligenceViolation(str) {
  if (typeof str !== 'string') return false;
  return NIVO_INTELLIGENCE_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Detects reasoning-only epistemic violations (noveltyReason/derivationBasis only).
 *
 * @param {string} str
 * @returns {boolean} true if a reasoning epistemic violation is detected
 */
export function containsReasoningEpistemicViolation(str) {
  if (typeof str !== 'string') return false;
  return REASONING_EPISTEMIC_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Detects unsupported epistemic claims in reasoning prose (union of all patterns).
 * Preserved for backward compatibility with existing callers and tests.
 *
 * @param {string} str
 * @returns {boolean} true if an epistemic violation is detected
 */
export function containsEpistemicViolation(str) {
  if (typeof str !== 'string') return false;
  return containsNivoIntelligenceViolation(str) || containsReasoningEpistemicViolation(str);
}

// ---------------------------------------------------------------------------
// INTEL-2F.4 — Narrow autobiography claim detection
// ---------------------------------------------------------------------------

/**
 * Narrow high-confidence patterns that detect specific creator factual claims:
 * ownership of systems/frameworks, personal transformations, temporal history,
 * and struggle/overcoming claims.
 *
 * These patterns target STRUCTURAL shapes with low false-positive rates.
 * They do NOT ban all first-person language.
 *
 * @type {Array<RegExp>}
 */
const AUTOBIOGRAPHY_PATTERNS = [
  // Pattern 1a: Quantified system/method ownership ("my 1-rule system", "my 3-step framework")
  /\bmy\s+\d+[-\s]?\w+\s+(?:system|framework|rule|method|technique|formula|strategy|playbook)\b/i,
  // Pattern 11a: Mundane Ownership ("My content workflow", "My weekly routine")
  // Excludes prepositions to avoid "my take on system design"
  new RegExp(
    `\\bmy\\s+(?:(?!(?:on|in|to|for|of|with|about|from|into|at|by)\\b)[\\w-]+\\s+){0,3}(?:workflow|process|system|framework|method|routine|tracker|setup|strategy|practice|checklist|schedule)\\b`,
    'i'
  ),
  // Pattern 11b: Creator Use ("The workflow I use", "The tracker I follow")
  /\b(?:the|a|an)\s+(?:[\w-]+\s+){0,3}(?:workflow|process|system|framework|method|routine|tracker|setup|strategy|practice|checklist|schedule)\s+I\s+(?:use|follow|utilize|apply|rely\s+on)\b/i,
  // Pattern 11c: Creator-Specific Process/Organization ("How I organize my...", "What I do before...")
  /\b(?:how\s+I\s+(?:organize|plan|structure|manage|build|create|design)|what\s+I\s+do\s+(?:before|after|when|while))\b/i,
  // Pattern 1b: Named framework/system ownership ("My Public Goal-Setting Framework", "My Accountability Framework")
  // Uses preposition-negative lookahead to avoid "my take on system design" and
  // compound-noun negative lookahead to avoid "my perspective on system architecture"
  new RegExp(
    `\\bmy\\s+(?:(?!(?:on|in|to|for|of|with|about|from|into|at|by)\\b)\\w[\\w-]*\\s+){1,3}(?:system|framework|rule|method|technique|formula|strategy|playbook)\\b(?!\\s+(?:design|architecture|engineering|analysis|thinking|interview))`,
    'i'
  ),
  // Pattern 2: Personal transformation claims ("changed my", "changed how I")
  /\b(?:changed|transformed|revolutionized)\s+(?:my\b|how\s+I\b)/i,
  // Pattern 3: Temporal personal history ("I used to", "I spent six months")
  /\bI\s+(?:used\s+to\b|spent\s+(?:\w+\s+)?(?:months?|years?|weeks?|days?)\b)/i,
  // Pattern 4: Personal struggle/overcoming ("I struggled with", "I overcame")
  /\bI\s+(?:struggled\s+with|overcame|conquered|battled)\b/i,
  // Pattern 5: Direct personal declarations / truth ("My Unfiltered Truth", "My Truth")
  /\bmy\s+(?:unfiltered\s+)?truth\b/i,
  // Pattern 6: Direct personal reality / building in public reality
  /\bmy\s+(?:['"\w\s-]+?\s+)?reality\b/i,
  // Pattern 7: Shifts that helped me / guided me
  /\bshifts?\s+that\s+(?:helped|assisted|guided|enabled)\s+me\b/i,
  // Pattern 8: Why I keep going
  /\bwhy\s+I\s+(?:personally\s+)?keep\s+going\b/i,
  // Pattern 9: I almost quit / gave up
  /\bI\s+(?:almost\s+)?(?:gave\s+up|quit)\b/i,
  // Pattern 10: The side I never talk about
  /\bthe\s+side\s+(?:of\s+[\w\s'-]+?\s+)?I\s+never\s+talk\s+about\b/i,
  // Pattern 12: Creator-specific use-to-achievement history ("I Used This Method to Get Hired at Google")
  /\b(?:how\s+I|I\s+(?:used|followed|applied|utilized|relied\s+on))\s+(?:[\w-]+\s+){0,6}(?:(?:got|get)\s+hired|(?:land(?:ed)?|get)\s+(?:a|an|the|my)\s+(?:first\s+)?(?:job|internship|offer|role|position|client))\b/i,
];

/**
 * Escapes special regex characters in a string for safe interpolation.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detects specific creator factual claims in prose: ownership of
 * systems/frameworks, personal transformations, temporal history,
 * struggle/overcoming, and creator-name attributed ownership.
 *
 * Parser-independent: does NOT rely on any provider self-declaration.
 *
 * @param {string} str - Prose string to check
 * @param {string} [displayName] - Creator display name for Pattern 5
 * @returns {boolean} true if an autobiography claim is detected
 */
export function containsAutobiographyClaim(str, displayName) {
  if (typeof str !== 'string') return false;

  // Check static patterns (1a, 1b, 2, 3, 4)
  if (AUTOBIOGRAPHY_PATTERNS.some(pattern => pattern.test(str))) return true;

  // Pattern 5: Creator-name attributed ownership/behavior (dynamic)
  // Split into possessive (allows 0-2 intervening words) and direct (no intervening words)
  // to prevent false positives like "Name explains system design"
  if (displayName && typeof displayName === 'string' && displayName.trim().length > 1) {
    const escaped = escapeRegex(displayName.trim());
    // 5a: Possessive form — "Name's [adj?] system" (allows 0-2 words between possessive and noun)
    const namePossessiveOwnership = new RegExp(
      `\\b${escaped}'s\\s+(?:\\w+\\s+){0,2}(?:system|framework|rule|method|technique|routine|habit|process)\\b`, 'i'
    );
    // 5b: Direct form — "Name system" (system noun must immediately follow name)
    const nameDirectOwnership = new RegExp(
      `\\b${escaped}\\s+(?:system|framework|rule|method|technique|routine|habit|process)\\b`, 'i'
    );
    // 5c: Attribution — "Name [personally] uses/developed/created"
    const nameAttribution = new RegExp(
      `\\b${escaped}\\s+(?:personally\\s+)?(?:uses?|employs?|developed|created|built)\\b`, 'i'
    );
    if (namePossessiveOwnership.test(str) || nameDirectOwnership.test(str) || nameAttribution.test(str)) return true;
  }

  return false;
}

/**
 * Strips leaked opaque signal refs from creator-facing prose.
 * Handles parenthesized groups, backtick-wrapped, and bare refs.
 * Normalizes whitespace and punctuation artifacts after removal.
 *
 * @param {string} str
 * @returns {string} Cleaned string
 */
export function stripSignalRefs(str) {
  if (typeof str !== 'string') return str;

  let cleaned = str;

  // Remove parenthesized signal ref groups: (sig_001), (sig_001; sig_002), (sig_001, sig_002)
  cleaned = cleaned.replace(/\s*\((?:sig_\d{3})(?:\s*[;,]\s*sig_\d{3})*\)/g, '');

  // Remove backtick-wrapped signal refs: `sig_001`
  cleaned = cleaned.replace(/`sig_\d{3}`/g, '');

  // Remove bare signal refs as standalone tokens
  cleaned = cleaned.replace(/\bsig_\d{3}\b/g, '');

  // Normalize whitespace and punctuation artifacts from removal
  cleaned = cleaned.replace(/\s{2,}/g, ' ');             // collapse multiple spaces
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1');      // remove space before punctuation
  cleaned = cleaned.replace(/([.,;:])\s*\1+/g, '$1');     // collapse repeated punctuation
  cleaned = cleaned.trim();

  return cleaned;
}

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const ideaCandidateSchema = z.object({
  requiresPersonalFact: z.boolean(),
  // INTEL-2F.1 Structured Derivation Contract
  primarySignalRef: z.string().trim(),
  derivationBasis: boundedProviderString(300)
    .pipe(
      z.string()
        .min(10, 'derivationBasis must be at least 10 characters')
        .max(300, 'derivationBasis cannot exceed 300 characters')
        .trim()
    ),

  // Existing fields (INTEL-2E.1 bounded-string preprocessing preserved)
  title: boundedProviderString(150)
    .pipe(
      z.string()
        .min(5, 'Title must be at least 5 characters')
        .max(150, 'Title cannot exceed 150 characters')
        .trim()
    ),
  topic: boundedProviderString(100)
    .pipe(
      z.string()
        .min(3, 'Topic must be at least 3 characters')
        .max(100, 'Topic cannot exceed 100 characters')
        .trim()
    ),
  concept: boundedProviderString(500)
    .pipe(
      z.string()
        .min(20, 'Concept must be at least 20 characters')
        .max(500, 'Concept cannot exceed 500 characters')
        .trim()
    ),

  format: z.enum([
    'talking-head',
    'tutorial',
    'pov',
    'broll',
    'storytime',
    'listicle',
    'challenge',
    'behind-the-scenes',
    'other',
  ]),
  contentPillar: boundedProviderString(100)
    .pipe(
      z.string()
        .max(100, 'contentPillar cannot exceed 100 characters')
        .trim()
    ),
  hook: boundedProviderString(200)
    .pipe(
      z.string()
        .min(5, 'Hook must be at least 5 characters')
        .max(200, 'Hook cannot exceed 200 characters')
        .trim()
    ),
  supportingSignalRefs: z
    .array(z.string().trim())
    .min(1, 'At least one supporting signal reference is required')
    .max(4, 'No more than 4 supporting signal references are allowed'),

  noveltyReason: boundedProviderString(300)
    .pipe(
      z.string()
        .max(300, 'noveltyReason cannot exceed 300 characters')
        .trim()
    ),
});

export const ideaGenerationOutputSchema = z.object({
  candidates: z
    .array(ideaCandidateSchema)
    .min(1, 'At least one candidate is required')
    .max(5, 'No more than 5 candidates are allowed'),
});
