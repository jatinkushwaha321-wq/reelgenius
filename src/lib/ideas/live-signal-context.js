import Signal from '../../models/Signal.js';
import { deriveSignalContextWording } from './signal-helpers.js';

/**
 * Enriches a list of serialized Idea objects (or Mongoose Idea documents)
 * with live Signal data (sourceSignalSnapshots and dynamically computed whyNow)
 * without mutating the underlying database records.
 *
 * @param {Array<object>} ideas - Array of Idea objects or documents
 * @returns {Promise<Array<object>>} Enriched Idea objects
 */
export async function enrichIdeasWithLiveSignals(ideas) {
  if (!ideas || !Array.isArray(ideas) || ideas.length === 0) {
    return [];
  }

  // 1. Collect all unique profileId and signal key combinations across all ideas
  const profileIds = new Set();
  const allSignalKeys = new Set();

  for (const idea of ideas) {
    const pId = idea.profileId ? idea.profileId.toString() : null;
    if (pId) profileIds.add(pId);

    const keys = idea.sourceSignalKeys || [];
    for (const key of keys) {
      if (key) allSignalKeys.add(key);
    }
  }

  // If no profiles or keys, return ideas as-is (with serialized fallback or derived wording from existing snapshot)
  if (profileIds.size === 0 || allSignalKeys.size === 0) {
    return ideas.map(enrichIdeaFallback);
  }

  // 2. Fetch all relevant live Signal documents in one query
  let liveSignals = [];
  try {
    liveSignals = await Signal.find({
      profileId: { $in: Array.from(profileIds) },
      key: { $in: Array.from(allSignalKeys) },
    }).lean();
  } catch (err) {
    console.error('[NIVO] Failed to fetch live Signal documents for idea enrichment:', err);
    return ideas.map(enrichIdeaFallback);
  }

  // 3. Build lookup map: `${profileId}:${key}` -> Signal
  const signalMap = new Map();
  for (const sig of liveSignals) {
    const keyStr = `${sig.profileId.toString()}:${sig.key}`;
    signalMap.set(keyStr, sig);
  }

  // 4. Enrich each idea
  return ideas.map(idea => {
    const doc = typeof idea.toObject === 'function' ? idea.toObject() : { ...idea };
    const pIdStr = doc.profileId ? doc.profileId.toString() : '';
    const keys = doc.sourceSignalKeys || [];
    const historicalSnapshots = doc.sourceSignalSnapshots || [];

    const historicalMap = new Map();
    for (const snap of historicalSnapshots) {
      if (snap && snap.key) {
        historicalMap.set(snap.key, snap);
      }
    }

    const liveSnapshots = [];
    const keysToResolve = keys.length > 0 ? keys : Array.from(historicalMap.keys());

    for (const key of keysToResolve) {
      const liveSig = signalMap.get(`${pIdStr}:${key}`);
      if (liveSig) {
        liveSnapshots.push({
          key: liveSig.key,
          displayName: liveSig.displayName || key,
          strength: liveSig.strength ?? 0,
          confidence: liveSig.confidence ?? 0,
          trend: liveSig.trend || 'unknown',
          directionImplication: liveSig.directionImplication || '',
        });
      } else if (historicalMap.has(key)) {
        // Graceful fallback if signal no longer exists in live DB
        const hist = historicalMap.get(key);
        liveSnapshots.push({
          key: hist.key,
          displayName: hist.displayName || key,
          strength: hist.strength ?? 0,
          confidence: hist.confidence ?? 0,
          trend: hist.trend || 'unknown',
          directionImplication: hist.directionImplication || '',
        });
      }
    }

    // Determine primary signal for deriving live Signal Context (whyNow)
    const primarySignal = liveSnapshots[0] || (historicalSnapshots[0] || null);
    const liveWhyNow = deriveSignalContextWording(primarySignal, doc.whyNow);

    return {
      ...doc,
      sourceSignalSnapshots: liveSnapshots,
      whyNow: liveWhyNow,
    };
  });
}

/**
 * Fallback enrichment when live DB query fails or no keys exist.
 */
function enrichIdeaFallback(idea) {
  const doc = typeof idea.toObject === 'function' ? idea.toObject() : { ...idea };
  const snapshots = doc.sourceSignalSnapshots || [];
  const primarySignal = snapshots[0] || null;
  return {
    ...doc,
    whyNow: deriveSignalContextWording(primarySignal, doc.whyNow),
  };
}
