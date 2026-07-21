import mongoose from 'mongoose';

const beatSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    spokenContent: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    onScreenText: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150,
    },
    visualNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

const sourceSignalSnapshotSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    strength: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    trend: {
      type: String,
      required: true,
      enum: ['unknown', 'rising', 'stable', 'falling'],
    },
    directionImplication: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const scriptSchema = new mongoose.Schema(
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
    sourceIdeaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
      unique: true,
    },
    ideaSnapshot: {
      title: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      topic: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      description: {
        type: String,
        trim: true,
      },
      hook: {
        type: String,
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
      },
      contentPillar: {
        type: String,
        trim: true,
      },
      sourceSignalKeys: [
        {
          type: String,
          trim: true,
        },
      ],
      directionSnapshot: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      whyNow: {
        type: String,
        trim: true,
        maxlength: 300,
      },
      noveltyReason: {
        type: String,
        trim: true,
        maxlength: 300,
      },
      sourceSignalSnapshots: [sourceSignalSnapshotSchema],
    },
    hook: {
      type: String,
      required: true,
      trim: true,
    },
    beats: {
      type: [beatSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1 && v.length <= 12;
        },
        message: 'A script must have between 1 and 12 beats.',
      },
    },
    cta: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    caption: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    scriptSummary: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 250,
    },
    estimatedDurationSeconds: {
      type: Number,
      default: null,
      min: 0,
    },
    totalWordCount: {
      type: Number,
      default: null,
      min: 0,
    },
    generationModel: {
      type: String,
      default: '',
      trim: true,
    },
    generatedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'final'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

scriptSchema.index({ userId: 1 });

export default mongoose.models.Script || mongoose.model('Script', scriptSchema);
