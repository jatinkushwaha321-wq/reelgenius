import mongoose from 'mongoose';
import { AIMEMORY_LIMITS } from '../lib/constants/ai-memory.js';

// Helper validator to ensure individual array elements are not empty after trimming (M4.6 Issue 2)
const nonWhitespaceValidator = {
  validator: function(val) {
    return typeof val === 'string' && val.trim().length > 0;
  },
  message: 'Array text entries cannot be empty or whitespace-only.',
};

// Core AIMemory Schema definition (M4.6 AIMemory Architecture)
const aiMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreatorProfile',
    required: true,
    unique: true, // Guarantees a single AIMemory document per CreatorProfile
  },
  creatorSummary: {
    type: String,
    maxlength: AIMEMORY_LIMITS.CREATOR_SUMMARY_MAX_LENGTH,
    trim: true,
    default: '',
    validate: {
      validator: function(val) {
        // Allow empty string, but reject whitespace-only strings
        return typeof val === 'string' && (val.trim().length > 0 || val === '');
      },
      message: 'Creator summary cannot be whitespace-only.',
    },
  },
  recentTopics: {
    type: [{
      type: String,
      maxlength: AIMEMORY_LIMITS.TOPIC_MAX_LENGTH,
      trim: true,
      validate: nonWhitespaceValidator, // Enforce individual element trimming & non-empty
    }],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= AIMEMORY_LIMITS.TOPICS_MAX_COUNT;
      },
      message: `recentTopics array cannot exceed ${AIMEMORY_LIMITS.TOPICS_MAX_COUNT} entries.`,
    },
  },
  recentHooks: {
    type: [{
      type: String,
      maxlength: AIMEMORY_LIMITS.HOOK_MAX_LENGTH,
      trim: true,
      validate: nonWhitespaceValidator, // Enforce individual element trimming & non-empty
    }],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= AIMEMORY_LIMITS.HOOKS_MAX_COUNT;
      },
      message: `recentHooks array cannot exceed ${AIMEMORY_LIMITS.HOOKS_MAX_COUNT} entries.`,
    },
  },
  recentScriptSummaries: {
    type: [{
      type: String,
      maxlength: AIMEMORY_LIMITS.SCRIPT_SUMMARY_MAX_LENGTH,
      trim: true,
      validate: nonWhitespaceValidator, // Enforce individual element trimming & non-empty
    }],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= AIMEMORY_LIMITS.SCRIPT_SUMMARIES_MAX_COUNT;
      },
      message: `recentScriptSummaries array cannot exceed ${AIMEMORY_LIMITS.SCRIPT_SUMMARIES_MAX_COUNT} entries.`,
    },
  },
  contentPillars: {
    type: [{
      type: String,
      maxlength: AIMEMORY_LIMITS.PILLAR_MAX_LENGTH,
      trim: true,
      validate: nonWhitespaceValidator, // Enforce individual element trimming & non-empty
    }],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= AIMEMORY_LIMITS.PILLARS_MAX_COUNT;
      },
      message: `contentPillars array cannot exceed ${AIMEMORY_LIMITS.PILLARS_MAX_COUNT} entries.`,
    },
  },
}, {
  timestamps: true,
  optimisticConcurrency: true,
});

// Single-field index supporting lookup optimization for user-owned memories
aiMemorySchema.index({ userId: 1 });

export default mongoose.models.AIMemory || mongoose.model('AIMemory', aiMemorySchema);
