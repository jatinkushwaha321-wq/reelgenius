/**
 * Trend Calculation Constants
 */
export const TREND_WINDOW_SIZE = 5;
export const SLOPE_THRESHOLD = 1.0; // Strength points change per observation index step

/**
 * Deterministically calculates a signal's trend direction.
 * Uses a least-squares linear regression slope over the strength values
 * of the most recent observations.
 * 
 * @param {Array<{strength: number, observedAt: Date|string}>} observations - Bounded history array
 * @returns {'rising'|'stable'|'falling'} Recalculated trend string key
 */
export function calculateTrend(observations) {
  if (!observations || observations.length < 2) {
    return 'unknown';
  }

  // Copy and sort array chronologically by observedAt (avoids input mutation)
  const sorted = [...observations].sort((a, b) => {
    return new Date(a.observedAt) - new Date(b.observedAt);
  });

  // Take the slice representing the most recent 5 elements
  const recent = sorted.slice(-TREND_WINDOW_SIZE);
  const n = recent.length;

  if (n < 2) {
    return 'unknown';
  }

  // Map to x (1, 2, ..., n) and y (strength) values
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const y = recent.map((obs) => obs.strength);

  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXX += x[i] * x[i];
    sumXY += x[i] * y[i];
  }

  // Least-squares slope formula: m = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - sum(x)^2)
  const numerator = n * sumXY - sumX * sumY;
  const denominator = n * sumXX - sumX * sumX;

  // Safeguard against horizontal divide-by-zero occurrences
  if (denominator === 0) {
    return 'stable';
  }

  const slope = numerator / denominator;

  // Interpret calculated slope against threshold
  if (slope > SLOPE_THRESHOLD) {
    return 'rising';
  } else if (slope < -SLOPE_THRESHOLD) {
    return 'falling';
  }

  return 'stable';
}
