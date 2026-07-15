import Script from '../../models/Script.js';

export class ScriptFinalizedError extends Error {
  constructor(message = 'Cannot replace a finalized Script.') {
    super(message);
    this.name = 'ScriptFinalizedError';
    this.code = 'SCRIPT_ALREADY_FINALIZED';
  }
}

export class ScriptConflictError extends Error {
  constructor(message = 'Failed to persist Script due to a concurrent modification.') {
    super(message);
    this.name = 'ScriptConflictError';
    this.code = 'SCRIPT_CONFLICT';
  }
}

/**
 * Persists a newly generated Script draft.
 * Enforces safe replacement of existing drafts and strict immutability of final Scripts.
 * 
 * @param {object} scriptData - Complete data for the Script document. Must include userId, profileId, sourceIdeaId.
 * @returns {Promise<object>} The persisted Script document.
 */
export async function persistScript(scriptData) {
  // Force draft status for generation persistence to be absolutely safe
  const dataToPersist = { ...scriptData, status: 'draft' };

  // 1. Check for existing Script
  const existing = await Script.findOne({
    userId: scriptData.userId,
    sourceIdeaId: scriptData.sourceIdeaId,
  });

  if (existing) {
    if (existing.status === 'final') {
      throw new ScriptFinalizedError();
    }

    // Existing is draft. Perform a conditional replacement protecting the draft status.
    const replaced = await Script.findOneAndReplace(
      { _id: existing._id, status: 'draft' },
      dataToPersist,
      { new: true, runValidators: true }
    );

    if (!replaced) {
      // Replacement failed. Detect the reason.
      const current = await Script.findById(existing._id);
      if (current && current.status === 'final') {
        throw new ScriptFinalizedError('Script was finalized concurrently. Cannot replace.');
      }
      throw new ScriptConflictError('Failed to replace draft Script due to concurrent state change.');
    }
    return replaced;
  }

  // 2. No existing Script. Attempt first creation.
  try {
    const created = await Script.create(dataToPersist);
    return created;
  } catch (err) {
    // 11000 is MongoDB duplicate key error code
    if (err.code === 11000 && err.keyPattern && err.keyPattern.sourceIdeaId) {
      throw new ScriptConflictError('Concurrent script creation detected. sourceIdeaId must be unique.');
    }
    throw err;
  }
}
