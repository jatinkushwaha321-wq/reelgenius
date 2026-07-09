import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_registered',
        'user_logged_in',
        'user_logged_out',
        'profile_analyzed',
        'profile_updated',
        'strategy_generated',
        'idea_created',
        'idea_updated',
        'idea_deleted',
        'script_generated',
        'script_updated',
        'script_deleted',
        'cover_generated',
        'pipeline_status_changed',
      ],
    },
    entityType: {
      type: String,
      enum: ['user', 'profile', 'idea', 'script', 'calendar', 'cover'],
      default: null,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Activity logs are write-once, immutable audit trails. We manage createdAt manually.
    timestamps: false,
  }
);

// Compound index for sorted, paginated user activity feeds
activityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
