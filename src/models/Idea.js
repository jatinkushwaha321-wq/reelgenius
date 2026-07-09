import mongoose from 'mongoose';

const coverConceptSchema = new mongoose.Schema(
  {
    concept: {
      type: String,
      default: '',
      trim: true,
    },
    headline: {
      type: String,
      default: '',
      trim: true,
    },
    layout: {
      type: String,
      default: '',
      trim: true,
    },
    colorPalette: [
      {
        type: String,
        trim: true,
      },
    ],
    composition: {
      type: String,
      default: '',
      trim: true,
    },
    expressionSuggestion: {
      type: String,
      default: '',
      trim: true,
    },
    aiImagePrompt: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    format: {
      type: String,
      enum: [
        'talking-head',
        'tutorial',
        'pov',
        'broll',
        'storytime',
        'listicle',
        'challenge',
        'behind-the-scenes',
        'other',
      ],
      default: 'other',
    },
    contentPillar: {
      type: String,
      default: '',
      trim: true,
    },
    hook: {
      type: String,
      default: '',
      trim: true,
    },
    estimatedReach: {
      type: String,
      enum: ['viral', 'growth', 'niche'],
      default: 'growth',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    estimatedDuration: {
      type: String,
      default: '30s',
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'idea',
        'scripted',
        'shooting',
        'editing',
        'scheduled',
        'published',
        'performance',
      ],
      default: 'idea',
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFavorited: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    coverConcepts: [coverConceptSchema],
  },
  {
    timestamps: true,
  }
);

// Performance indexes for list filtering and pipeline tracking updates
ideaSchema.index({ userId: 1 });
ideaSchema.index({ profileId: 1 });
ideaSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Idea || mongoose.model('Idea', ideaSchema);
