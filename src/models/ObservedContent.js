import mongoose from 'mongoose';

const carouselItemSchema = new mongoose.Schema(
  {
    providerContentId: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ['image', 'reel', 'video', 'carousel', 'unknown'],
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      default: null,
      trim: true,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const observedContentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorProfile',
      required: true,
    },
    providerContentId: {
      type: String,
      required: true,
      trim: true,
    },
    shortCode: {
      type: String,
      default: '',
      trim: true,
    },
    contentUrl: {
      type: String,
      default: '',
      trim: true,
    },
    format: {
      type: String,
      enum: ['image', 'reel', 'video', 'carousel', 'unknown'],
      required: true,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    mentions: [
      {
        type: String,
        trim: true,
      },
    ],
    publishedAt: {
      type: Date,
      default: null,
    },
    likesCount: {
      type: Number,
      default: null,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: null,
    },
    playCount: {
      type: Number,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: null,
    },
    thumbnailUrl: {
      type: String,
      default: '',
      trim: true,
    },
    videoUrl: {
      type: String,
      default: null,
      trim: true,
    },
    imageUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    carouselItems: [carouselItemSchema],
    carouselItemCount: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    observedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// 1. Lookup index by profileId
observedContentSchema.index({ profileId: 1 });

// 2. Index for sorting recent content by profileId + publishedAt
observedContentSchema.index({ profileId: 1, publishedAt: -1 });

// 3. Unique compound index for idempotency
observedContentSchema.index({ profileId: 1, providerContentId: 1 }, { unique: true });

export default mongoose.models.ObservedContent ||
  mongoose.model('ObservedContent', observedContentSchema);
