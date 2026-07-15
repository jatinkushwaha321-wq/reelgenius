import { scriptOutputSchema } from '../validations/script-generation.js';
import {
  containsAutobiographyClaim,
  containsNivoIntelligenceViolation,
  containsPlaceholder,
  stripSignalRefs,
} from '../validations/ideas-generation.js';

// ---------------------------------------------------------------------------
// SCRIPT-SPECIFIC DEFINITIVE EFFICACY HYGIENE
// ---------------------------------------------------------------------------

/**
 * Narrow, script-specific patterns that detect definitive efficacy guarantees.
 * These are strictly bounded to prevent upgrading educational claims into
 * definitive guarantees.
 * 
 * @type {Array<RegExp>}
 */
const SCRIPT_EFFICACY_PATTERNS = [
  // Established families:
  /\blands?\s+interviews?\b/i,
  /\bgets?\s+you\s+hired\b/i,
  /\bgets?\s+you\s+jobs?\b/i,
  /\bguarantees?\s+(?:callbacks?|interviews?|results?)\b/i,
  /\bbeats?\s+(?:the\s+)?ATS\b/i,
  /\bpasses?\s+(?:the\s+)?ATS\b/i,
  /\b(?:doubles?|increases?|boosts?)\s+(?:engagement|views?|reach)\b/i,
  /\bmakes?\s+recruiters?\s+notice\s+you\b/i,
  // Narrow cross-niche definitive guarantees:
  /\bguarantees?\s+cinematic\s+footage\b/i,
  /\bguarantees?\s+compliments?\b/i,
  /\bguarantees?\s+you'?ll\s+avoid\s+crowds?\b/i,
  /\bguarantees?\s+a\s+\d+%?\s+score\b/i,
  // High-risk/financial/medical:
  /\beliminates?\s+(?:back\s+)?pain\b/i,
  /\bcures?\s+(?:acne|disease|cancer|diabetes|illness)\b/i,
  /\b(?:this\s+stock|your\s+portfolio|your\s+income)\s+will\s+(?:double|triple)\b/i,
  /\bguarantees?\s+(?:returns?|profits?|wealth)\b/i
];

function containsScriptEfficacyViolation(str) {
  if (typeof str !== 'string') return false;
  return SCRIPT_EFFICACY_PATTERNS.some(pattern => pattern.test(str));
}

function wordCount(str) {
  if (typeof str !== 'string') return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export class ScriptHygieneError extends Error {
  constructor(message, field, category) {
    super(message);
    this.name = 'ScriptHygieneError';
    this.code = 'SCRIPT_HYGIENE_VIOLATION';
    this.field = field;
    this.category = category;
  }
}

/**
 * Parses, validates, and runs deterministic hygiene on the Script generation output.
 * 
 * @param {string} rawJsonString - Raw JSON output from provider
 * @param {string} [displayName] - Optional creator display name for autobiography check
 * @returns {object} { script, totalWordCount, estimatedDurationSeconds }
 */
export function parseScriptOutput(rawJsonString, displayName) {
  // 1. Basic Parse
  let rawParsed;
  try {
    rawParsed = JSON.parse(rawJsonString);
  } catch (err) {
    throw new Error(`Failed to parse script output as JSON: ${err.message}`);
  }

  // 2. Schema Validation (Zod)
  const validationResult = scriptOutputSchema.safeParse(rawParsed);
  if (!validationResult.success) {
    throw new Error(`Script provider schema validation failed: ${validationResult.error.message}`);
  }
  const script = validationResult.data;

  // 3. Provider Gateway Check
  if (script.requiresPersonalFact === true) {
    throw new ScriptHygieneError(
      'Provider self-reported reliance on unverified creator-specific fact.',
      'requiresPersonalFact',
      'PERSONAL_FACT_REQUIRED'
    );
  }

  // 4. Deterministic Hygiene Scan (Full Output Rejection)
  const fieldsToCheck = [
    { name: 'hook', value: script.hook },
    { name: 'cta', value: script.cta },
    { name: 'caption', value: script.caption },
    { name: 'scriptSummary', value: script.scriptSummary }
  ];

  script.beats.forEach((beat, idx) => {
    fieldsToCheck.push({ name: `beats[${idx}].spokenContent`, value: beat.spokenContent });
    fieldsToCheck.push({ name: `beats[${idx}].onScreenText`, value: beat.onScreenText });
    fieldsToCheck.push({ name: `beats[${idx}].visualNote`, value: beat.visualNote });
  });

  for (const field of fieldsToCheck) {
    // 4.1 Strip opaque signal refs (in-place mutation of the object is safe here before final return)
    field.value = stripSignalRefs(field.value);

    // Apply back to the object if it's a root field or a beat field
    if (field.name.startsWith('beats[')) {
      const match = field.name.match(/beats\[(\d+)\]\.(.+)/);
      if (match) {
        script.beats[parseInt(match[1], 10)][match[2]] = field.value;
      }
    } else {
      script[field.name] = field.value;
    }

    // 4.2 Check violations
    if (containsPlaceholder(field.value)) {
      throw new ScriptHygieneError(`Placeholder detected in ${field.name}.`, field.name, 'PLACEHOLDER');
    }
    if (containsAutobiographyClaim(field.value, displayName)) {
      throw new ScriptHygieneError(`Autobiographical claim detected in ${field.name}.`, field.name, 'AUTOBIOGRAPHY');
    }
    if (containsNivoIntelligenceViolation(field.value)) {
      throw new ScriptHygieneError(`NIVO intelligence violation detected in ${field.name}.`, field.name, 'NIVO_INTELLIGENCE');
    }
    if (containsScriptEfficacyViolation(field.value)) {
      throw new ScriptHygieneError(`Definitive efficacy guarantee detected in ${field.name}.`, field.name, 'DEFINITIVE_EFFICACY');
    }
  }

  // 5. Metadata Calculation
  let totalWordCount = wordCount(script.hook) + wordCount(script.cta);
  script.beats.forEach(beat => {
    totalWordCount += wordCount(beat.spokenContent);
  });

  const spokenDurationSeconds = (totalWordCount / 150) * 60;
  const beatFloorSeconds = script.beats.length * 3;
  const estimatedDurationSeconds = Math.round(Math.max(spokenDurationSeconds, beatFloorSeconds));

  return {
    script,
    totalWordCount,
    estimatedDurationSeconds,
  };
}
