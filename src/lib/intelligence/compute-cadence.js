/**
 * Deterministic posting cadence analysis.
 *
 * NIVO principle: DETERMINISTIC CODE OWNS MATHEMATICS.
 * Cadence statistics are derived from persisted publishedAt timestamps,
 * not estimated by Gemini.
 *
 * @module compute-cadence
 */

/**
 * Computes deterministic posting cadence statistics from observed content.
 *
 * @param {Array<object>} observedContent - Array of ObservedContent documents
 * @returns {object} Cadence statistics object
 */
export function computeCadence(observedContent) {
  // 1. Extract and validate publishedAt timestamps
  const validDates = (observedContent || [])
    .map((item) => {
      if (!item.publishedAt) return null;
      const d = new Date(item.publishedAt);
      if (isNaN(d.getTime())) return null;
      return d;
    })
    .filter((d) => d !== null);

  // Sort ascending
  validDates.sort((a, b) => a - b);

  const datedItemCount = validDates.length;

  // Edge case: 0 dated items
  if (datedItemCount === 0) {
    return {
      datedItemCount: 0,
      observationStart: null,
      observationEnd: null,
      observationRangeDays: null,
      meanIntervalDays: null,
      medianIntervalDays: null,
      weekdayCount: 0,
      weekendCount: 0,
      weekdayPercentage: null,
      dominantUtcHour: null,
      dominantUtcHourCount: null,
      maximumGapDays: null,
    };
  }

  const observationStart = validDates[0].toISOString();
  const observationEnd = validDates[datedItemCount - 1].toISOString();

  // Weekday/weekend counts
  let weekdayCount = 0;
  let weekendCount = 0;
  const hourCounts = new Array(24).fill(0);

  for (const d of validDates) {
    const day = d.getUTCDay();
    if (day === 0 || day === 6) {
      weekendCount++;
    } else {
      weekdayCount++;
    }
    hourCounts[d.getUTCHours()]++;
  }

  const weekdayPercentage = Math.round((weekdayCount / datedItemCount) * 1000) / 10;

  // Dominant UTC hour (earliest hour wins on tie)
  let dominantUtcHour = 0;
  let dominantUtcHourCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > dominantUtcHourCount) {
      dominantUtcHour = h;
      dominantUtcHourCount = hourCounts[h];
    }
  }

  // Edge case: 1 dated item
  if (datedItemCount === 1) {
    return {
      datedItemCount: 1,
      observationStart,
      observationEnd,
      observationRangeDays: 0,
      meanIntervalDays: null,
      medianIntervalDays: null,
      weekdayCount,
      weekendCount,
      weekdayPercentage,
      dominantUtcHour,
      dominantUtcHourCount,
      maximumGapDays: null,
    };
  }

  // Observation range
  const rangeMs = validDates[datedItemCount - 1] - validDates[0];
  const observationRangeDays = Math.round((rangeMs / (1000 * 60 * 60 * 24)) * 10) / 10;

  // Intervals
  const intervals = [];
  for (let i = 1; i < datedItemCount; i++) {
    intervals.push((validDates[i] - validDates[i - 1]) / (1000 * 60 * 60 * 24));
  }

  // Mean interval
  const meanIntervalDays =
    Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 100) / 100;

  // Median interval
  const sorted = [...intervals].sort((a, b) => a - b);
  let medianIntervalDays;
  if (sorted.length % 2 === 0) {
    medianIntervalDays =
      Math.round(((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) * 100) / 100;
  } else {
    medianIntervalDays = Math.round(sorted[Math.floor(sorted.length / 2)] * 100) / 100;
  }

  // Maximum gap
  const maximumGapDays = Math.round(Math.max(...intervals) * 100) / 100;

  return {
    datedItemCount,
    observationStart,
    observationEnd,
    observationRangeDays,
    meanIntervalDays,
    medianIntervalDays,
    weekdayCount,
    weekendCount,
    weekdayPercentage,
    dominantUtcHour,
    dominantUtcHourCount,
    maximumGapDays,
  };
}

/**
 * Formats cadence statistics into a SYSTEM-CALCULATED FACT block
 * for injection into the Gemini intelligence prompt.
 *
 * @param {object} cadence - Output of computeCadence()
 * @returns {string} Formatted cadence summary block
 */
export function formatCadenceSummary(cadence) {
  if (!cadence || cadence.datedItemCount < 2) {
    return `
[SYSTEM-CALCULATED POSTING CADENCE]
Insufficient timestamp data for cadence analysis (${cadence ? cadence.datedItemCount : 0} dated items).
You may note this in the postingFrequency field but MUST NOT invent cadence statistics.
`;
  }

  const startDate = cadence.observationStart.split('T')[0];
  const endDate = cadence.observationEnd.split('T')[0];
  const hourStr = String(cadence.dominantUtcHour).padStart(2, '0');
  const weekendPct = Math.round((cadence.weekendCount / cadence.datedItemCount) * 1000) / 10;

  return `
[SYSTEM-CALCULATED POSTING CADENCE — DO NOT CONTRADICT]
The following cadence statistics were deterministically calculated by NIVO from observed publishedAt timestamps.
You may summarize these facts in postingFrequency and relevant signals, but you MUST NOT contradict them or invent different values.

- Dated content items analyzed: ${cadence.datedItemCount}
- Observation window: ${startDate} to ${endDate} (${cadence.observationRangeDays} days)
- Mean posting interval: ${cadence.meanIntervalDays} days
- Median posting interval: ${cadence.medianIntervalDays} days
- Maximum gap between posts: ${cadence.maximumGapDays} days
- Weekday posts: ${cadence.weekdayCount} (${cadence.weekdayPercentage}%)
- Weekend posts: ${cadence.weekendCount} (${weekendPct}%)
- Dominant publication hour: ${hourStr}:00 UTC (${cadence.dominantUtcHourCount} of ${cadence.datedItemCount} posts)
`;
}
