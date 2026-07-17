import connectDB from '@/lib/mongodb';
import CreatorProfile from '@/models/CreatorProfile';
import ObservedContent from '@/models/ObservedContent';
import { getAuthUser } from '@/lib/api-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';

/**
 * Creator-facing profile input schema.
 *
 * DASH-2A ownership correction:
 * The creator provides ONLY the source identity for NIVO to observe.
 * All other CreatorProfile fields are either:
 *   - INGESTED PUBLIC FACTS (populated by future ingestion pipeline)
 *   - NIVO-DERIVED CONTEXT (populated by future AI analysis)
 *   - SYSTEM METADATA (controlled by persistence lifecycle)
 *
 * Those fields remain in the Mongoose schema for future server-side writes
 * but are explicitly excluded from the creator-facing input contract.
 */
const profileInputSchema = z.object({
  instagramUsername: z
    .string()
    .min(1, 'Instagram username is required')
    .max(30, 'Username cannot exceed 30 characters')
    .trim(),
}).strict();

/**
 * Serializes a Mongoose CreatorProfile document into a safe client payload.
 * Excludes internal Mongoose fields and maps _id to id.
 */
function serializeProfile(doc) {
  const obj = doc.toObject({ versionKey: false });
  obj.id = obj._id.toString();
  obj.userId = obj.userId.toString();
  delete obj._id;
  obj.contentFormats = [];
  return obj;
}

/**
 * GET /api/profile
 * Returns the authenticated user's CreatorProfile, or a deliberate no-profile state.
 */
export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    await connectDB();

    const profile = await CreatorProfile.findOne({ userId: user.id });

    if (!profile) {
      return successResponse(
        { profile: null },
        'No creator profile configured'
      );
    }

    const serialized = serializeProfile(profile);

    // Query ObservedContent format statistics
    const contentItems = await ObservedContent.find({ profileId: profile._id }).select('format');
    if (contentItems.length > 0) {
      const counts = { reel: 0, carousel: 0, image: 0, video: 0 };
      contentItems.forEach(item => {
        if (counts[item.format] !== undefined) {
          counts[item.format]++;
        }
      });
      const total = contentItems.length;
      const rawFormats = [
        { key: 'reel', label: 'Reels' },
        { key: 'carousel', label: 'Carousels' },
        { key: 'image', label: 'Static Posts' },
        { key: 'video', label: 'Videos' }
      ];
      
      serialized.contentFormats = rawFormats
        .map(f => {
          const count = counts[f.key];
          const percentage = Math.round((count / total) * 100);
          return { label: f.label, percentage, count };
        })
        .filter(f => f.count > 0)
        .sort((a, b) => b.percentage - a.percentage);
    }

    return successResponse(
      { profile: serialized },
      'Profile retrieved'
    );
  } catch (err) {
    console.error('Profile GET error:', err);
    return errorResponse(
      'Failed to retrieve profile',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : null,
      500
    );
  }
}

/**
 * PUT /api/profile
 * Creates or updates the authenticated user's CreatorProfile source identity.
 *
 * Creator-facing writes are limited to instagramUsername.
 * All other fields are reserved for server-side ingestion/analysis pipelines.
 *
 * Uses findOneAndUpdate with upsert for atomic create-or-update behavior.
 */
export async function PUT(request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  try {
    // 1. Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 'BAD_REQUEST', null, 400);
    }

    // 2. Validate — strict schema rejects any field beyond instagramUsername
    const validation = profileInputSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        validation.error.format(),
        400
      );
    }

    const { instagramUsername } = validation.data;
    const normalizedUsername = instagramUsername.toLowerCase();

    // 3. Connect and upsert
    await connectDB();

    const profile = await CreatorProfile.findOneAndUpdate(
      { userId: user.id },
      {
        $set: {
          instagramUsername: normalizedUsername,
          userId: user.id,
        },
        $setOnInsert: {
          analyzedAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return successResponse(
      { profile: serializeProfile(profile) },
      profile.createdAt.getTime() === profile.updatedAt.getTime()
        ? 'Profile created'
        : 'Profile updated'
    );
  } catch (err) {
    // Handle Mongoose duplicate key on the compound index
    if (err.code === 11000) {
      return errorResponse(
        'A profile with this Instagram username already exists for your account',
        'DUPLICATE_PROFILE',
        null,
        409
      );
    }

    console.error('Profile PUT error:', err);
    return errorResponse(
      'Failed to save profile',
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? err.message : null,
      500
    );
  }
}
