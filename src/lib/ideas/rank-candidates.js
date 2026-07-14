/**
 * NIVO Ideas — rank-candidates
 *
 * INTEL-2F.4: Deterministic banded lexicographic candidate ranking.
 *
 * Ranking is a property of the generation batch. It uses snapshot data
 * frozen at generation time and is NOT recalculated at read time.
 *
 * Comparison levels (lexicographic priority):
 *   1. Primary signal confidence band (10-point bands)
 *   2. Primary signal momentum (trend ordinal)
 *   3. Mean corroborating signal confidence (raw value)
 *   4. Title alphabetical ascending (stable tie-break)
 *
 * rankKey encoding:
 *   (confidenceBand × 10000) + (trendOrdinal × 1000) + round(meanConfidence)
 *
 * Title tie-break is applied by the sort comparator but NOT encoded
 * in rankKey (two candidates with identical rankKey are disambiguated
 * by title at sort time).
 */

/**
 * Maps a primary signal confidence value to a 10-point band.
 *
 * @param {number} confidence - Primary signal confidence (0-100)
 * @returns {number} Band index: 4=[90-100], 3=[80-89], 2=[70-79], 1=[60-69]
 */
export function getConfidenceBand(confidence) {
  if (confidence >= 90) return 4;
  if (confidence >= 80) return 3;
  if (confidence >= 70) return 2;
  return 1;
}

/**
 * Maps a signal trend string to a sort ordinal.
 *
 * @param {string} trend
 * @returns {number} 3=rising, 2=stable, 1=unknown, 0=falling
 */
export function getTrendOrdinal(trend) {
  switch (trend) {
    case 'rising': return 3;
    case 'stable': return 2;
    case 'unknown': return 1;
    case 'falling': return 0;
    default: return 1;
  }
}

/**
 * Computes the deterministic rankKey for a single candidate.
 *
 * @param {object} candidate - Validated candidate with sourceSignalSnapshots
 * @returns {number} Composite lexicographic ordering key
 */
export function computeRankKey(candidate) {
  const snapshots = candidate.sourceSignalSnapshots || [];
  const primary = snapshots[0];

  const primaryConf = primary?.confidence ?? 0;
  const primaryTrend = primary?.trend ?? 'unknown';

  const confidenceBand = getConfidenceBand(primaryConf);
  const trendOrdinal = getTrendOrdinal(primaryTrend);

  // Mean confidence across ALL cited signals (including primary)
  const allConfs = snapshots.map(s => s.confidence ?? 0);
  const meanConf = allConfs.length > 0
    ? Math.round(allConfs.reduce((sum, c) => sum + c, 0) / allConfs.length)
    : 0;

  return (confidenceBand * 10000) + (trendOrdinal * 1000) + meanConf;
}

/**
 * Ranks candidates in-place using a banded lexicographic comparator.
 * Assigns rankKey to each candidate.
 *
 * @param {Array<object>} candidates - Validated, filtered candidates
 * @returns {Array<object>} Same array, sorted and annotated with rankKey
 */
export function rankCandidates(candidates) {
  if (!candidates || candidates.length === 0) return candidates;

  // 1. Compute rankKey for each candidate
  for (const cand of candidates) {
    cand.rankKey = computeRankKey(cand);
  }

  // 2. Sort: rankKey descending, title alphabetical ascending for tie-break
  candidates.sort((a, b) => {
    if (b.rankKey !== a.rankKey) return b.rankKey - a.rankKey;
    return (a.title || '').localeCompare(b.title || '');
  });

  return candidates;
}
