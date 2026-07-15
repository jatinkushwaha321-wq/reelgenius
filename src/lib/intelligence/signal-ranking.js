/**
 * NIVO Intelligence — signal-ranking
 * 
 * Shared priority authority for active signals.
 */

export function scoreSignal(signal, referenceTime) {
  if (!signal) return 0;

  const strength = signal.strength || 0;
  const confidence = signal.confidence || 0;
  const trend = signal.trend || 'unknown';
  const updatedAt = signal.updatedAt ? new Date(signal.updatedAt).getTime() : 0;

  let trendModifier = 0;
  if (trend === 'rising') trendModifier = 10;
  else if (trend === 'falling') trendModifier = -5;

  let freshnessModifier = 0;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  
  const resolvedRefTime = referenceTime !== undefined ? referenceTime : Date.now();

  if (resolvedRefTime - updatedAt <= sevenDaysInMs) {
    freshnessModifier = 5;
  }

  return (strength * 0.4) + (confidence * 0.4) + trendModifier + freshnessModifier;
}

export function rankSignals(signals, referenceTime) {
  if (!signals || !Array.isArray(signals) || signals.length === 0) {
    return [];
  }

  const resolvedRefTime = referenceTime !== undefined ? referenceTime : Date.now();

  return [...signals].sort((a, b) => {
    const scoreA = scoreSignal(a, resolvedRefTime);
    const scoreB = scoreSignal(b, resolvedRefTime);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    const keyA = a.key || '';
    const keyB = b.key || '';
    return keyA.localeCompare(keyB);
  });
}
