/**
 * Accepts the creator profile and observed content, building a compact, structured
 * evidence packet for Gemini prompt consumption, alongside a server-side refMap.
 *
 * @param {object} profile - CreatorProfile document
 * @param {Array<object>} observedContent - Array of ObservedContent documents
 * @returns {object} { packet, refMap, contentTier }
 */
export function buildEvidencePacket(profile, observedContent) {
  const contentCount = observedContent ? observedContent.length : 0;

  // 1. Determine Content Tier
  let contentTier = 'insufficient';
  if (contentCount >= 10) {
    contentTier = 'full';
  } else if (contentCount >= 5) {
    contentTier = 'sparse_signals';
  } else if (contentCount >= 1) {
    contentTier = 'limited_context';
  }

  // 2. Build Profile Context (Opaque ref: "profile")
  const profilePacket = {
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    followerCount: typeof profile.followerCount === 'number' ? profile.followerCount : 0,
    followingCount: typeof profile.followingCount === 'number' ? profile.followingCount : 0,
    postCount: typeof profile.postCount === 'number' ? profile.postCount : 0,
    isVerified: !!profile.isVerified,
    category: profile.category || '',
    externalUrl: profile.externalUrl || '',
  };

  // 3. Sort Observed Content: Pinned posts first, then publishedAt descending, null publishedAt at the end
  const sortedContent = [...(observedContent || [])].sort((a, b) => {
    // Pinned posts take absolute priority
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Sort by publishedAt descending, treating null/undefined as latest/oldest?
    // Let's place nulls at the very end
    if (a.publishedAt && b.publishedAt) {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
    if (a.publishedAt && !b.publishedAt) return -1;
    if (!a.publishedAt && b.publishedAt) return 1;
    return 0;
  });

  // Limit to at most 30 posts for V1 sample size
  const analyzedContent = sortedContent.slice(0, 30);

  const recentContentPacket = [];
  const refMap = new Map();

  // Populate map for profile
  refMap.set('profile', {
    type: 'profile',
    id: null,
  });

  // 4. Map each content item to opaque ref "post_NNN"
  analyzedContent.forEach((item, index) => {
    const pad = String(index + 1).padStart(3, '0');
    const opaqueRef = `post_${pad}`;

    refMap.set(opaqueRef, {
      type: 'content',
      id: item._id ? item._id.toString() : null,
    });

    recentContentPacket.push({
      ref: opaqueRef,
      format: item.format || 'unknown',
      caption: item.caption || '',
      hashtags: item.hashtags || [],
      mentions: item.mentions || [],
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : null,
      likesCount: typeof item.likesCount === 'number' ? item.likesCount : null,
      commentsCount: typeof item.commentsCount === 'number' ? item.commentsCount : 0,
      viewCount: typeof item.viewCount === 'number' ? item.viewCount : null,
      playCount: typeof item.playCount === 'number' ? item.playCount : null,
      durationSeconds: typeof item.durationSeconds === 'number' ? item.durationSeconds : null,
      carouselItemCount: typeof item.carouselItemCount === 'number' ? item.carouselItemCount : 0,
      isPinned: !!item.isPinned,
    });
  });

  const packet = {
    profile: profilePacket,
    recentContent: recentContentPacket,
    contentCount: analyzedContent.length,
    observedAt: new Date().toISOString(),
  };

  return {
    packet,
    refMap,
    contentTier,
  };
}
