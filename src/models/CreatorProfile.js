import mongoose from 'mongoose';

const contentPillarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const creatorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instagramUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    displayName: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    followerCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    profilePicUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    externalUrl: {
      type: String,
      default: '',
      trim: true,
    },
    niche: {
      type: String,
      default: '',
      trim: true,
    },
    subNiches: [
      {
        type: String,
        trim: true,
      },
    ],
    contentPillars: [contentPillarSchema],
    audiencePersona: {
      behaviorProfile: { type: String, default: '', trim: true },
      interests: [{ type: String, trim: true }],
      painPoints: [{ type: String, trim: true }],
    },
    brandIdentity: {
      tone: [{ type: String, trim: true }],
      vocabulary: [{ type: String, trim: true }],
      values: [{ type: String, trim: true }],
      uniqueSellingPoints: [{ type: String, trim: true }],
    },
    postingFrequency: {
      type: String,
      default: '',
      trim: true,
    },
    aiSummary: {
      type: String,
      default: '',
      trim: true,
    },
    strategicDirection: {
      type: String,
      default: '',
      trim: true,
    },
    analyzedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
creatorProfileSchema.index({ userId: 1 });
creatorProfileSchema.index({ userId: 1, instagramUsername: 1 }, { unique: true });

export default mongoose.models.CreatorProfile ||
  mongoose.model('CreatorProfile', creatorProfileSchema);
