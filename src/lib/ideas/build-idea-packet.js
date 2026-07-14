/**
 * NIVO Ideas — build-idea-packet
 *
 * Assembles the CreatorProfile context, selected active Signals,
 * recent observed content, top-performance content, and novelty context (existing ideas/memory).
 */

import { deriveObservedFact } from './signal-helpers.js';

/**
 * Computes deterministic normalized performance score for each content item
 * across likesCount, commentsCount, and playCount.
 * 
 * @param {Array<object>} observedContent 
 * @returns {Array<object>} sorted content items with a calculated performanceScore
 */
export function computeNormalizedPerformance(observedContent) {
  if (!observedContent || observedContent.length === 0) return [];

  // Helper to extract valid numeric values for a key
  const extractValidValues = (key) => {
    return observedContent
      .map(item => item[key])
      .filter(val => typeof val === 'number' && Number.isFinite(val));
  };

  const likesVals = extractValidValues('likesCount');
  const commentsVals = extractValidValues('commentsCount');
  const playVals = extractValidValues('playCount');

  const getMinMax = (vals) => {
    if (vals.length === 0) return null;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  };

  const likesBounds = getMinMax(likesVals);
  const commentsBounds = getMinMax(commentsVals);
  const playBounds = getMinMax(playVals);

  const getNormValue = (val, bounds) => {
    if (typeof val !== 'number' || !Number.isFinite(val) || !bounds) return null;
    if (bounds.max === bounds.min) return 0.5; // neutral equal score
    return (val - bounds.min) / (bounds.max - bounds.min);
  };

  const scoredContent = observedContent.map((item) => {
    const scores = [];
    const likesScore = getNormValue(item.likesCount, likesBounds);
    const commentsScore = getNormValue(item.commentsCount, commentsBounds);
    const playScore = getNormValue(item.playCount, playBounds);

    if (likesScore !== null) scores.push(likesScore);
    if (commentsScore !== null) scores.push(commentsScore);
    if (playScore !== null) scores.push(playScore);

    const finalScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : null;

    return {
      item,
      finalScore,
    };
  });

  // Sort: highest finalScore first. If finalScore is null, place at the bottom.
  // Tie-breakers: publishedAt descending, then providerContentId alphabetically.
  scoredContent.sort((a, b) => {
    if (a.finalScore !== null && b.finalScore !== null) {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
    } else if (a.finalScore !== null && b.finalScore === null) {
      return -1;
    } else if (a.finalScore === null && b.finalScore !== null) {
      return 1;
    }

    // Tie-breaker 1: publishedAt descending
    const aDate = a.item.publishedAt ? new Date(a.item.publishedAt).getTime() : 0;
    const bDate = b.item.publishedAt ? new Date(b.item.publishedAt).getTime() : 0;
    if (bDate !== aDate) {
      return bDate - aDate;
    }

    // Tie-breaker 2: providerContentId alphabetically
    const aId = a.item.providerContentId || '';
    const bId = b.item.providerContentId || '';
    return aId.localeCompare(bId);
  });

  return scoredContent.map(sc => ({
    ...sc.item.toObject ? sc.item.toObject() : sc.item,
    _performanceScore: sc.finalScore
  }));
}



/**
 * Deterministically ranks and selects active signals.
 * Excludes weakened signals (which have confidence < 40).
 * 
 * @param {Array<object>} signals 
 * @returns {object} { selectedSignals, refMap }
 */
export function selectActiveSignals(signals) {
  if (!signals || signals.length === 0) {
    return { selectedSignals: [], refMap: new Map() };
  }

  // 1. Filter: confidence >= 40 (excludes weakened signals where confidence is set to 0)
  const eligibleSignals = signals.filter(sig => sig.confidence >= 40);

  // 2. Score each signal
  const scoredSignals = eligibleSignals.map((sig) => {
    const strength = sig.strength || 0;
    const confidence = sig.confidence || 0;
    const trend = sig.trend || 'unknown';
    const updatedAt = sig.updatedAt ? new Date(sig.updatedAt).getTime() : 0;

    let trendModifier = 0;
    if (trend === 'rising') trendModifier = 10;
    else if (trend === 'falling') trendModifier = -5;

    let freshnessModifier = 0;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - updatedAt <= sevenDaysInMs) {
      freshnessModifier = 5;
    }

    const score = (strength * 0.4) + (confidence * 0.4) + trendModifier + freshnessModifier;

    return {
      signal: sig,
      score,
    };
  });

  // Sort descending by score, tie-break alphabetically by key
  scoredSignals.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.signal.key.localeCompare(b.signal.key);
  });

  // Get active signal keys initially ranked in top 8
  let topRanked = scoredSignals.slice(0, 8);
  const remaining = scoredSignals.slice(8);

  // 3. Category Balancing
  const categories = ['audience-engagement', 'content-format', 'creator-style'];
  
  // Find which categories are represented in the entire eligible pool
  const eligibleCategories = new Set(eligibleSignals.map(sig => sig.category));
  const missingCategories = categories.filter(cat => 
    eligibleCategories.has(cat) && !topRanked.some(tr => tr.signal.category === cat)
  );

  // Sort missing categories alphabetically for determinism
  missingCategories.sort();

  for (const missingCat of missingCategories) {
    // Find the highest-scoring signal of this missing category from remaining pool
    const candidateIdx = remaining.findIndex(tr => tr.signal.category === missingCat);
    if (candidateIdx !== -1) {
      const candidate = remaining[candidateIdx];

      // Find a swappable signal in topRanked: must belong to a category that is over-represented (count >= 2)
      // We want to replace the one with the lowest score (then alphabetical key)
      const catCounts = {};
      topRanked.forEach(tr => {
        catCounts[tr.signal.category] = (catCounts[tr.signal.category] || 0) + 1;
      });

      // Find indices of swappable signals
      const swappableIndices = [];
      topRanked.forEach((tr, idx) => {
        if (catCounts[tr.signal.category] >= 2) {
          swappableIndices.push(idx);
        }
      });

      if (swappableIndices.length > 0) {
        // Sort swappable candidates: lowest score first, then key
        swappableIndices.sort((aIdx, bIdx) => {
          const aSig = topRanked[aIdx];
          const bSig = topRanked[bIdx];
          if (aSig.score !== bSig.score) {
            return aSig.score - bSig.score;
          }
          return bSig.signal.key.localeCompare(aSig.signal.key); // alphabetical tie-break
        });

        const replaceIdx = swappableIndices[0];
        
        // Swap candidate into topRanked, push replaced signal back to remaining
        const replaced = topRanked[replaceIdx];
        topRanked[replaceIdx] = candidate;
        remaining[candidateIdx] = replaced;

        // Re-sort remaining just in case we need it for subsequent categories
        remaining.sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return a.signal.key.localeCompare(b.signal.key);
        });
      }
    }
  }

  // Keep final selected signals (max 8)
  const finalSelected = topRanked.map(tr => tr.signal);

  // Build refMap (sig_001, sig_002, ...)
  const refMap = new Map();
  const selectedSignalsPacket = finalSelected.map((sig, idx) => {
    const pad = String(idx + 1).padStart(3, '0');
    const opaqueRef = `sig_${pad}`;
    refMap.set(opaqueRef, sig);

    return {
      ref: opaqueRef,
      key: sig.key,
      displayName: sig.displayName,
      category: sig.category,
      strength: sig.strength,
      confidence: sig.confidence,
      trend: sig.trend,
      creatorTrait: sig.creatorTrait,
      audienceBehavior: sig.audienceBehavior,
      directionImplication: sig.directionImplication,
      observedFact: deriveObservedFact(sig.evidence),
    };
  });

  return {
    selectedSignals: selectedSignalsPacket,
    refMap,
  };
}

/**
 * Builds the complete idea generation packet.
 */
export function buildIdeaPacket({
  profile,
  signals,
  observedContent,
  existingIdeaTitles,
  aiMemory,
}) {
  // 1. Build Creator Context
  const creatorContext = {
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    category: profile.category || '',
    niche: profile.niche || '',
    subNiches: profile.subNiches || [],
    contentPillars: (profile.contentPillars || []).map(cp => ({
      name: cp.name,
      description: cp.description || '',
      percentage: cp.percentage,
    })),
    audiencePersona: {
      behaviorProfile: profile.audiencePersona?.behaviorProfile || '',
      interests: profile.audiencePersona?.interests || [],
      painPoints: profile.audiencePersona?.painPoints || [],
    },
    brandIdentity: {
      tone: profile.brandIdentity?.tone || [],
      values: profile.brandIdentity?.values || [],
      uniqueSellingPoints: profile.brandIdentity?.uniqueSellingPoints || [],
    },
    aiSummary: profile.aiSummary || '',
    analyzedAt: profile.analyzedAt ? new Date(profile.analyzedAt).toISOString() : null,
  };

  // 2. Select Active Signals
  const { selectedSignals, refMap } = selectActiveSignals(signals);

  // 3. Build Recent Content (max 10)
  const sortedRecent = [...(observedContent || [])].sort((a, b) => {
    if (a.publishedAt && b.publishedAt) {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
    if (a.publishedAt && !b.publishedAt) return -1;
    if (!a.publishedAt && b.publishedAt) return 1;
    return 0;
  });

  const recentContentSlice = sortedRecent.slice(0, 10);
  const recentContentMap = new Set(recentContentSlice.map(item => item._id ? item._id.toString() : null).filter(Boolean));

  const formatContentItem = (item) => ({
    id: item._id ? item._id.toString() : null,
    caption: item.caption ? item.caption.substring(0, 300) : '',
    format: item.format || 'unknown',
    hashtags: item.hashtags || [],
    publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
    likesCount: typeof item.likesCount === 'number' ? item.likesCount : null,
    commentsCount: typeof item.commentsCount === 'number' ? item.commentsCount : 0,
    playCount: typeof item.playCount === 'number' ? item.playCount : null,
  });

  const recentContentPacket = recentContentSlice.map(formatContentItem);

  // 4. Build Top Performance Content (max 3, deduplicated against recent 10)
  const normalizedPerformanceContent = computeNormalizedPerformance(observedContent || []);
  const topPerformancePacket = normalizedPerformanceContent
    .filter(item => {
      const itemId = item._id ? item._id.toString() : null;
      return itemId && !recentContentMap.has(itemId);
    })
    .slice(0, 3)
    .map(formatContentItem);

  // 5. Build Novelty Context
  const noveltyContext = {
    recentTopics: aiMemory?.recentTopics || [],
    existingIdeaTitles: existingIdeaTitles || [],
  };

  return {
    creatorContext,
    selectedSignals,
    signalRefMap: refMap,
    recentContent: recentContentPacket,
    topPerformanceContent: topPerformancePacket,
    noveltyContext,
  };
}
