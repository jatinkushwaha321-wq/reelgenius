import { getApifyClient } from '../apify-client';
import { normalizeProfile } from './normalize-profile';
import { normalizeContent } from './normalize-content';

export class ObservationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ObservationError';
    this.code = code;
  }
}

/**
 * Triggers the two approved Apify Actor runs to observe a creator's public Instagram profile
 * and normalized recent content.
 *
 * @param {string} rawUsername - Instagram username target
 * @returns {Promise<Object>} Normalized provider-independent observation package
 */
export async function observeInstagramProfile(rawUsername) {
  if (!rawUsername) {
    throw new ObservationError('Instagram username is required', 'MISSING_USERNAME');
  }

  // 1. Clean and normalize username
  let username = String(rawUsername).trim().toLowerCase();
  if (username.startsWith('@')) {
    username = username.slice(1);
  }

  if (!username) {
    throw new ObservationError('Invalid Instagram username format', 'INVALID_USERNAME');
  }

  // Construct canonical URL
  const profileUrl = `https://www.instagram.com/${username}/`;

  let client;
  try {
    client = getApifyClient();
  } catch (err) {
    throw new ObservationError(err.message, 'PROVIDER_CONFIG_ERROR');
  }

  let detailsRunId = null;
  let postsRunId = null;
  let rawProfile = null;
  let rawPosts = [];

  // ==========================================
  // RUN A — PROFILE DETAILS
  // ==========================================
  try {
    console.log(`Starting Run A (details) for profile URL: ${profileUrl}`);
    const detailsRun = await client.actor('apify/instagram-scraper').call({
      resultsType: 'details',
      directUrls: [profileUrl],
    });

    detailsRunId = detailsRun.id;

    if (!detailsRun.defaultDatasetId) {
      throw new ObservationError('Profile details run succeeded but returned no dataset', 'PROVIDER_ERROR');
    }

    const { items } = await client.dataset(detailsRun.defaultDatasetId).listItems();
    
    // Check if details is missing/not found
    if (!items || items.length === 0 || !items[0] || items[0].error || items[0].message?.includes('not found')) {
      throw new ObservationError(`Instagram profile "${username}" not found or is invalid`, 'PROFILE_NOT_FOUND');
    }

    rawProfile = items[0];
  } catch (err) {
    if (err instanceof ObservationError) throw err;
    console.error('Run A (details) failed:', err);
    throw new ObservationError(
      `Failed to retrieve profile details from provider: ${err.message}`,
      'DETAILS_RUN_FAILED'
    );
  }

  // Check if profile is private
  if (rawProfile.private) {
    throw new ObservationError(`Instagram profile "${username}" is private. Public content is unavailable.`, 'PRIVATE_PROFILE');
  }

  // ==========================================
  // RUN B — RECENT MIXED CONTENT (LIMIT 30)
  // ==========================================
  try {
    console.log(`Starting Run B (posts) for profile URL: ${profileUrl} (Limit: 30)`);
    const postsRun = await client.actor('apify/instagram-scraper').call({
      resultsType: 'posts',
      directUrls: [profileUrl],
      resultsLimit: 30,
    });

    postsRunId = postsRun.id;

    if (!postsRun.defaultDatasetId) {
      throw new ObservationError('Recent content run succeeded but returned no dataset', 'PROVIDER_ERROR');
    }

    const { items } = await client.dataset(postsRun.defaultDatasetId).listItems();
    rawPosts = items || [];
  } catch (err) {
    if (err instanceof ObservationError) throw err;
    console.error('Run B (posts) failed:', err);
    throw new ObservationError(
      `Failed to retrieve recent posts from provider: ${err.message}`,
      'POSTS_RUN_FAILED'
    );
  }

  // ==========================================
  // NORMALIZATION & ASSEMBLY
  // ==========================================
  const normalizedProfile = normalizeProfile(rawProfile);
  const normalizedContent = normalizeContent(rawPosts);

  return {
    username,
    observedAt: new Date(),
    profile: normalizedProfile,
    content: normalizedContent,
    providerRunIds: {
      details: detailsRunId,
      posts: postsRunId,
    },
  };
}
