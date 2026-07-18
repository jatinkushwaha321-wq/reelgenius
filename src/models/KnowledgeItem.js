import mongoose from 'mongoose';

// NOTE: evaluationReportId is a transient correlation identifier to map evidence back
// to in-memory evaluation records. It is not a persisted foreign key to an actual
// evaluation report collection.
const evidenceReferenceSchema = new mongoose.Schema({
  evaluationReportId: { type: mongoose.Schema.Types.ObjectId, required: true },
  candidateIdeaId: { type: mongoose.Schema.Types.ObjectId, default: null },
  ideaTitle: { type: String, required: true },
  timestamp: { type: Date, required: true },
  verdict: { type: String, enum: ['APPROVE', 'REJECT'], required: true },
}, { _id: false });

const knowledgeItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', required: true },
  normalizedStatement: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Creator', 'Audience', 'Strategy', 'Experiment', 'Evolution'],
    required: true,
  },
  lifecycleStatus: {
    type: String,
    enum: ['CANDIDATE', 'VALIDATED', 'DEPRECATED'],
    default: 'CANDIDATE',
    required: true,
  },
  evidenceReferences: [evidenceReferenceSchema],
  strengthMetrics: {
    strength: { type: Number, default: 0 },
    supportCount: { type: Number, default: 0 },
    contradictionCount: { type: Number, default: 0 },
  },
  contradictionHistory: [evidenceReferenceSchema],
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

// Indexes for query performance and domain uniqueness enforcement
knowledgeItemSchema.index({ profileId: 1 });
knowledgeItemSchema.index({ profileId: 1, category: 1 });
knowledgeItemSchema.index(
  { profileId: 1, normalizedStatement: 1 },
  { unique: true }
);

export default mongoose.models.KnowledgeItem || mongoose.model('KnowledgeItem', knowledgeItemSchema);
