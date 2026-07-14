/**
 * INTEL-2G.5D — Focused local tests for Raw Evidence Presentation Cleaning.
 */

import { deriveEvidencePresentation, deriveObservedFact } from '../src/lib/ideas/signal-helpers.js';
import { parseIdeaOutput } from '../src/lib/ideas/parse-idea-output.js';
import {
  containsAutobiographyClaim,
  containsEpistemicViolation,
  containsPlaceholder,
} from '../src/lib/validations/ideas-generation.js';

let pass = 0;
let fail = 0;

function assert(condition, label) {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

console.log('\n=== INTEL-2G.5D RAW EVIDENCE PRESENTATION TESTS ===\n');

// 1. non-array evidence returns ""
assert(deriveEvidencePresentation(null) === '', '1: null returns ""');
assert(deriveEvidencePresentation(undefined) === '', '1: undefined returns ""');
assert(deriveEvidencePresentation('string') === '', '1: non-array returns ""');

// 2. empty evidence returns ""
assert(deriveEvidencePresentation([]) === '', '2: empty array returns ""');

// 3. null item skipped
assert(deriveEvidencePresentation([null, { fact: 'Valid fact' }]) === 'Valid fact.', '3: null item skipped');

// 4. object without fact skipped
assert(deriveEvidencePresentation([{ type: 'fact' }, { fact: 'Valid fact' }]) === 'Valid fact.', '4: object without fact skipped');

// 5. non-string fact skipped
assert(deriveEvidencePresentation([{ fact: 123 }, { fact: 'Valid fact' }]) === 'Valid fact.', '5: non-string fact skipped');

// 6. whitespace-only fact skipped
assert(deriveEvidencePresentation([{ fact: '   ' }, { fact: 'Valid fact' }]) === 'Valid fact.', '6: whitespace-only fact skipped');

// 7. first valid fact selected
assert(deriveEvidencePresentation([{ fact: 'First' }, { fact: 'Second' }]) === 'First.', '7: first valid fact selected');

// 8. later facts ignored after first valid fact
assert(deriveEvidencePresentation([{ fact: 'First' }, { fact: 'Second' }]) !== 'Second.', '8: later facts ignored');

// 9. evidence.type does not affect selection
const mixedTypes = [
  { type: 'metric', fact: 'Metric fact' },
  { type: 'fact', fact: 'Fact fact' }
];
assert(deriveEvidencePresentation(mixedTypes) === 'Metric fact.', '9: evidence.type does not affect selection');

// 10. evidence.metrics does not affect selection
const withMetrics = [
  { fact: 'Fact with metrics', metrics: { likes: 500 } }
];
assert(deriveEvidencePresentation(withMetrics) === 'Fact with metrics.', '10: metrics do not affect selection');

// 11. boundary whitespace trimmed
assert(deriveEvidencePresentation([{ fact: '  trimmed  ' }]) === 'trimmed.', '11: boundary whitespace trimmed');

// 12. repeated internal whitespace normalized
assert(deriveEvidencePresentation([{ fact: 'a   b  c' }]) === 'a b c.', '12: repeated whitespace normalized');

// 13. normal fact wording preserved
assert(deriveEvidencePresentation([{ fact: 'Caption explains SQL' }]) === 'Caption explains SQL.', '13: wording preserved');

// 14. "Caption" prefix preserved
assert(deriveEvidencePresentation([{ fact: 'Caption mentions Git' }]) === 'Caption mentions Git.', '14: Caption prefix preserved');

// 15. "Caption explains" wording preserved
assert(deriveEvidencePresentation([{ fact: 'Caption explains Git' }]) === 'Caption explains Git.', '15: Caption explains wording preserved');

// 16. no "observed" introduced
assert(!deriveEvidencePresentation([{ fact: 'Caption explains Git' }]).includes('observed'), '16: no observed introduced');

// 17. no "pattern" introduced
assert(!deriveEvidencePresentation([{ fact: 'Caption explains Git' }]).includes('pattern'), '17: no pattern introduced');

// 18. no "recurring" introduced
assert(!deriveEvidencePresentation([{ fact: 'Caption explains Git' }]).includes('recurring'), '18: no recurring introduced');

// 19. repeated terminal periods normalize to one period
assert(deriveEvidencePresentation([{ fact: 'fact...' }]) === 'fact.', '19: periods normalize');

// 20. exclamation terminal normalizes to one period
assert(deriveEvidencePresentation([{ fact: 'fact!' }]) === 'fact.', '20: exclamation normalizes');

// 21. question terminal normalizes to one period
assert(deriveEvidencePresentation([{ fact: 'fact?' }]) === 'fact.', '21: question normalizes');

// 22. <=220-char fact preserved except punctuation normalization
const exact220 = 'a'.repeat(220);
assert(deriveEvidencePresentation([{ fact: exact220 }]) === exact220 + '.', '22: 220-char fact preserved');

// 23. >220-char fact sentence-boundary truncates
const longSentence = 'a'.repeat(100) + '. And another sentence that is also quite long. ' + 'b'.repeat(150);
assert(deriveEvidencePresentation([{ fact: longSentence }]) === 'a'.repeat(100) + '. And another sentence that is also quite long.', '23: sentence-boundary truncation works');

// 24. >220-char fact whitespace-boundary truncates
const longWhitespace = 'a'.repeat(150) + ' ' + 'b'.repeat(100);
assert(deriveEvidencePresentation([{ fact: longWhitespace }]) === 'a'.repeat(150) + '.', '24: whitespace-boundary truncation works');

// 25. >220-char unbroken token hard-cuts safely
const longToken = 'a'.repeat(250);
assert(deriveEvidencePresentation([{ fact: longToken }]) === 'a'.repeat(220) + '.', '25: unbroken token hard-cut works');

// 26. no ellipsis appended
assert(!deriveEvidencePresentation([{ fact: longToken }]).includes('..'), '26: no ellipsis appended');

// --- Parser directionReasoning tests ---

const signalRefMap = new Map();
signalRefMap.set('sig_001', {
  key: 'test_signal',
  displayName: 'Test Signal',
  strength: 80,
  confidence: 90,
  trend: 'rising',
  directionImplication: 'More content in this direction',
  evidence: [{ fact: 'Caption explains SQL' }]
});

const rawInput = {
  candidates: [{
    requiresPersonalFact: false,
    primarySignalRef: 'sig_001',
    derivationBasis: 'This is a valid derivation basis for the candidate at least 10 chars',
    title: 'A Valid Idea Title For Testing',
    topic: 'testing patterns',
    concept: 'This is a complete concept description that is long enough to pass the minimum character validation threshold.',
    format: 'tutorial',
    contentPillar: 'Engineering',
    hook: 'Ever wondered why this matters?',
    supportingSignalRefs: ['sig_001'],
    noveltyReason: 'This differs from existing content by focusing on specifics.',
  }],
};

// 27. parser directionReasoning uses candidate format
const res = parseIdeaOutput(rawInput, signalRefMap, 'TestCreator')[0];
assert(res.directionReasoning.includes('tutorial'), '27: uses candidate format');

// 28. parser directionReasoning uses candidate topic
assert(res.directionReasoning.includes('testing patterns'), '28: uses candidate topic');

// 29. parser directionReasoning contains "One supporting observation:"
assert(res.directionReasoning.includes('One supporting observation:'), '29: contains supporting observation label');

// 30. parser directionReasoning does not contain "observed content pattern"
assert(!res.directionReasoning.includes('observed content pattern'), '30: does not contain pattern label');

// 31. parser fallback is exact when evidence is malformed
const signalMapMalformed = new Map([['sig_001', { key: 'test', displayName: 'Test', strength: 80, confidence: 90, trend: 'stable', evidence: [] }]]);
const resFallback = parseIdeaOutput(rawInput, signalMapMalformed, 'TestCreator')[0];
assert(
  resFallback.directionReasoning === "This direction expands on an active content signal from the analyzed content set to propose a tutorial format focused on testing patterns.",
  `31: fallback template correct: got "${resFallback.directionReasoning}"`
);

// 32. whyNow semantics remain unchanged
assert(res.whyNow === 'Derived from a high-strength content signal that shows rising momentum relative to the analyzed content set.', '32: whyNow remains unchanged');

// 33. deriveObservedFact remains unchanged
const multEv = [{ fact: 'First' }, { fact: 'Second' }];
assert(deriveObservedFact(multEv) === 'First; Second', '33: deriveObservedFact remains unchanged');

// 34. autobiography regression remains intact
assert(containsAutobiographyClaim('My Unfiltered Truth: What it costs'), '34: autobiography check works');

// 35. epistemic regression remains intact
assert(containsEpistemicViolation('This resonates deeply with the audience'), '35: epistemic check works');

// 36. placeholder regression remains intact
assert(containsPlaceholder('How to [Your Topic] in 2025'), '36: placeholder check works');

// 37. pain-point regression remains intact
assert(containsEpistemicViolation("targets the audience's pain point"), '37: pain-point check works');

console.log(`\n=== RESULTS: ${pass} pass, ${fail} fail ===\n`);
if (fail > 0) process.exit(1);
else process.exit(0);
