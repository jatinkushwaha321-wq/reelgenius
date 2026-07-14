/**
 * Normalizes content formats using the approved precedence:
 * - type === "Sidecar" -> "carousel"
 * - type === "Video" && productType === "clips" -> "reel"
 * - type === "Video" -> "video"
 * - type === "Image" -> "image"
 *
 * Fallback Strategy:
 * If an unknown type is encountered, fallback to "unknown" and log a warning.
 * Unknown content types must NOT crash the observation.
 *
 * @param {string} type - Raw content type from provider
 * @param {string} productType - Raw product type from provider
 * @returns {string} Normalized format
 */
export function deriveContentFormat(type, productType) {
  const t = type ? String(type).trim() : '';
  const p = productType ? String(productType).trim() : '';

  if (t === 'Sidecar') {
    return 'carousel';
  }
  if (t === 'Video') {
    if (p === 'clips') {
      return 'reel';
    }
    return 'video';
  }
  if (t === 'Image') {
    return 'image';
  }

  // Fallback warning and return "unknown"
  console.warn(`Unknown provider content type encountered: "${type}" (productType: "${productType}"). Falling back to "unknown".`);
  return 'unknown';
}

/**
 * Normalizes a list of raw provider content items into NIVO factual content items.
 *
 * @param {Array} rawItems - Raw posts/reels items from Apify
 * @returns {Array} Normalized content items
 */
export function normalizeContent(rawItems) {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => {
    // 1. Identify Format
    const format = deriveContentFormat(item.type, item.productType);

    // 2. Normalize Timestamp (Date)
    let publishedAt = null;
    if (item.timestamp) {
      const parsedDate = new Date(item.timestamp);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate;
      } else {
        console.warn(`Invalid timestamp format received: "${item.timestamp}". Falling back to null.`);
      }
    }

    // 3. Normalize Likes (handle hidden likes: -1)
    let likesCount = null;
    if (item.likesCount !== undefined && item.likesCount !== null) {
      const likesNum = Number(item.likesCount);
      if (Number.isFinite(likesNum) && likesNum >= 0) {
        likesCount = likesNum;
      }
    }

    // 4. Normalize Comments
    let commentsCount = 0;
    if (item.commentsCount !== undefined && item.commentsCount !== null) {
      const commsNum = Number(item.commentsCount);
      if (Number.isFinite(commsNum) && commsNum >= 0) {
        commentsCount = commsNum;
      }
    }

    // 5. Normalize Video/Reel Specific Metrics
    const isVideo = format === 'video' || format === 'reel';
    const viewCount = isVideo && Number.isFinite(Number(item.videoViewCount)) ? Number(item.videoViewCount) : null;
    const playCount = isVideo && Number.isFinite(Number(item.videoPlayCount)) ? Number(item.videoPlayCount) : null;
    const durationSeconds = isVideo && Number.isFinite(Number(item.videoDuration)) ? Number(item.videoDuration) : null;
    const videoUrl = isVideo && item.videoUrl ? String(item.videoUrl).trim() : null;

    // 6. Normalize Arrays
    const hashtags = Array.isArray(item.hashtags) ? item.hashtags.map(h => String(h).trim()) : [];
    const mentions = Array.isArray(item.mentions) ? item.mentions.map(m => String(m).trim()) : [];
    const imageUrls = Array.isArray(item.images) ? item.images.map(i => String(i).trim()) : [];

    // 7. Carousel Slides Normalization
    let carouselItems = [];
    let carouselItemCount = 0;
    if (format === 'carousel') {
      if (Array.isArray(item.childPosts) && item.childPosts.length > 0) {
        // Map structured childPosts
        carouselItems = item.childPosts.map((child, idx) => {
          const childFormat = deriveContentFormat(child.type, child.productType);
          return {
            providerContentId: child.id ? String(child.id).trim() : `${item.id || ''}_slide_${idx}`,
            format: childFormat,
            thumbnailUrl: child.displayUrl ? String(child.displayUrl).trim() : '',
            videoUrl: child.videoUrl ? String(child.videoUrl).trim() : null,
            width: Number.isFinite(Number(child.dimensionsWidth)) ? Number(child.dimensionsWidth) : null,
            height: Number.isFinite(Number(child.dimensionsHeight)) ? Number(child.dimensionsHeight) : null,
          };
        });
        carouselItemCount = carouselItems.length;
      } else {
        // Use a valid non-negative provider carousel count if available. Otherwise 0.
        // Do not create fake carousel children from carouselImages.
        const providerCount = Number(item.carouselImageCount);
        carouselItemCount = Number.isFinite(providerCount) && providerCount >= 0 ? Math.floor(providerCount) : 0;
      }
    }

    return {
      providerContentId: item.id ? String(item.id).trim() : '',
      shortCode: item.shortCode ? String(item.shortCode).trim() : '',
      contentUrl: item.url ? String(item.url).trim() : '',
      format,
      caption: item.caption ? String(item.caption).trim() : '',
      hashtags,
      mentions,
      publishedAt,
      likesCount,
      commentsCount,
      viewCount,
      playCount,
      durationSeconds,
      thumbnailUrl: item.displayUrl ? String(item.displayUrl).trim() : '',
      videoUrl,
      imageUrls,
      carouselItems,
      carouselItemCount,
      width: Number.isFinite(Number(item.dimensionsWidth)) ? Number(item.dimensionsWidth) : null,
      height: Number.isFinite(Number(item.dimensionsHeight)) ? Number(item.dimensionsHeight) : null,
      isPinned: !!item.isPinned,
    };
  });
}
