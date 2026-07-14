import connectDB from '@/lib/mongodb';
import CreatorProfile from '@/models/CreatorProfile';
import ObservedContent from '@/models/ObservedContent';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { observeInstagramProfile, ObservationError } from '@/lib/ingestion/instagram-observer';

// Module-level in-process duplicate run guard keyed by userId.
// This prevents rapid concurrent triggers in the same server process.
const activeObservations = new Set();

/**
 * POST /api/observe
 * Triggers Apify observation for the authenticated user's configured CreatorProfile.
 * Persists factual profile metrics and recent mixed content.
 */
export async function POST() {
  // 1. Authenticate user
  const { user, error } = await getAuthUser();
  if (error) return error;

  // 2. Process-level concurrency guard
  if (activeObservations.has(user.id)) {
    return errorResponse(
      'An observation is already in progress for your account. Please wait.',
      'OBSERVATION_IN_PROGRESS',
      null,
      409
    );
  }

  // Register in concurrency set
  activeObservations.add(user.id);

  try {
    // 3. Connect to database and retrieve CreatorProfile
    await connectDB();
    const profile = await CreatorProfile.findOne({ userId: user.id });

    if (!profile || !profile.instagramUsername) {
      return errorResponse(
        'No Instagram username configured. Please configure your profile first.',
        'PROFILE_NOT_CONFIGURED',
        null,
        400
      );
    }

    const targetUsername = profile.instagramUsername;

    // 4. Trigger Apify observation (Run A & Run B)
    console.log(`User ${user.id} triggering observation for username: ${targetUsername}`);
    const observation = await observeInstagramProfile(targetUsername);

    // 5. Database Persistence: Factual Profile update
    // Update ONLY factual ingested fields. Preserve NIVO-derived fields.
    // Do NOT overwrite instagramUsername or analyzedAt here.
    const { profile: observedProfile, content: observedContent, providerRunIds } = observation;

    profile.displayName = observedProfile.displayName || profile.displayName;
    profile.bio = observedProfile.bio || profile.bio;
    profile.followerCount = observedProfile.followerCount;
    profile.followingCount = observedProfile.followingCount;
    profile.postCount = observedProfile.postCount;
    profile.profilePicUrl = observedProfile.profilePicUrl || profile.profilePicUrl;
    profile.isVerified = observedProfile.isVerified;
    profile.category = observedProfile.category || profile.category;
    profile.externalUrl = observedProfile.externalUrl || profile.externalUrl;

    await profile.save();

    // 6. Database Persistence: Idempotent content update
    // Upsert recent content records by (profileId + providerContentId)
    // Refreshes mutable factual metrics (likes, comments, views)
    const persistencePromises = observedContent.map(async (item) => {
      return ObservedContent.findOneAndUpdate(
        {
          profileId: profile._id,
          providerContentId: item.providerContentId,
        },
        {
          $set: {
            userId: user.id,
            shortCode: item.shortCode,
            contentUrl: item.contentUrl,
            format: item.format,
            caption: item.caption,
            hashtags: item.hashtags,
            mentions: item.mentions,
            publishedAt: item.publishedAt,
            likesCount: item.likesCount,
            commentsCount: item.commentsCount,
            viewCount: item.viewCount,
            playCount: item.playCount,
            durationSeconds: item.durationSeconds,
            thumbnailUrl: item.thumbnailUrl,
            videoUrl: item.videoUrl,
            imageUrls: item.imageUrls,
            carouselItems: item.carouselItems,
            carouselItemCount: item.carouselItemCount,
            width: item.width,
            height: item.height,
            isPinned: item.isPinned,
            observedAt: new Date(),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
    });

    // Wait for all content writes to finish
    await Promise.all(persistencePromises);

    // Retrieve fresh counts of saved items for metadata response
    const storedCount = await ObservedContent.countDocuments({ profileId: profile._id });

    return successResponse(
      {
        username: targetUsername,
        postsObserved: observedContent.length,
        totalPostsStored: storedCount,
        providerRunIds,
      },
      'Observation successfully completed'
    );

  } catch (err) {
    console.error('Observation route error:', err);

    if (err instanceof ObservationError) {
      // Map semantic observation errors to appropriate status codes
      let status = 500;
      if (err.code === 'PROFILE_NOT_FOUND') status = 404;
      if (err.code === 'PRIVATE_PROFILE') status = 403;
      if (err.code === 'INVALID_USERNAME') status = 400;

      return errorResponse(err.message, err.code, null, status);
    }

    return errorResponse(
      'An unexpected error occurred during profile observation.',
      'OBSERVATION_FAILED',
      process.env.NODE_ENV === 'development' ? err.message : null,
      500
    );
  } finally {
    // 7. Cleanup concurrency guard
    activeObservations.delete(user.id);
  }
}
