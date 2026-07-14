import mongoose from 'mongoose';

// Bounded Observation subdocument schema (M4.2 Decision 4)
const observationSchema = new mongoose.Schema({
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
  observedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, { _id: false });

// Bounded Evidence subdocument schema (M4.2 Decision 6)
const evidenceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['metric', 'attribute', 'comment', 'fact', 'comparative'],
  },
  sourceId: {
    type: String,
    default: null,
  },
  fact: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true,
  },
  metrics: {
    type: Map,
    of: Number,
    validate: {
      validator: function(v) {
        if (!v) return true;
        // Limit keys to 5
        if (v.size > 5) return false;
        // Validate each value is a finite number (rejects NaN, Infinity, -Infinity)
        for (const val of v.values()) {
          if (typeof val !== 'number' || !Number.isFinite(val)) {
            return false;
          }
        }
        return true;
      },
      message: 'Metrics map must have at most 5 keys and all values must be finite numbers.',
    },
  },
}, { _id: false });

// Core Signal schema definition (M4.2 Decision 2)
const signalSchema = new mongoose.Schema({
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
  category: {
    type: String,
    required: true,
    enum: ['audience-engagement', 'content-format', 'creator-style'],
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
  creatorTrait: {
    type: String,
    required: true,
    trim: true,
  },
  audienceBehavior: {
    type: String,
    required: true,
    trim: true,
  },
  directionImplication: {
    type: String,
    required: true,
    trim: true,
  },
  evidence: {
    type: [evidenceSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Evidence array cannot exceed 5 items.',
    },
  },
  observationHistory: {
    type: [observationSchema],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Observation history cannot exceed 10 items.',
    },
  },
}, {
  timestamps: true,
});

// Compound search index for dashboard filtering (M4.2 Decision 2)
signalSchema.index({ userId: 1, trend: 1 });

// Unique compound index preventing duplicate signal categories per creator (M4.2 Decision 2)
signalSchema.index({ profileId: 1, key: 1 }, { unique: true });

export default mongoose.models.Signal || mongoose.model('Signal', signalSchema);
