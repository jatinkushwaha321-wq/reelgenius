/**
 * Normalizes one provider profile details item into a provider-independent factual profile shape.
 *
 * @param {Object} rawProfile - Raw profile details item from Apify
 * @returns {Object} Normalized factual profile
 */
export function normalizeProfile(rawProfile) {
  if (!rawProfile) {
    throw new Error('Raw profile data is missing');
  }

  // Normalization helper for strings
  const normalizeString = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).trim();
  };

  // Normalization helper for numbers (must be finite non-negative integers)
  const normalizeNumber = (val) => {
    const num = Number(val);
    return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0;
  };

  // Normalization helper for booleans
  const normalizeBoolean = (val) => {
    return !!val;
  };

  return {
    displayName: normalizeString(rawProfile.fullName),
    bio: normalizeString(rawProfile.biography),
    followerCount: normalizeNumber(rawProfile.followersCount),
    followingCount: normalizeNumber(rawProfile.followsCount),
    postCount: normalizeNumber(rawProfile.postsCount),
    profilePicUrl: normalizeString(rawProfile.profilePicUrlHD || rawProfile.profilePicUrl),
    isVerified: normalizeBoolean(rawProfile.verified),
    category: normalizeString(rawProfile.businessCategoryName),
    externalUrl: normalizeString(rawProfile.externalUrl),
  };
}
