import KnowledgeItem from '../../models/KnowledgeItem.js';
import mongoose from 'mongoose';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

/**
 * Validates ObjectID format and throws descriptive error if invalid.
 * @param {string|mongoose.Types.ObjectId} id
 * @param {string} name
 * @returns {mongoose.Types.ObjectId}
 */
export function validateObjectId(id, name) {
  if (!id) {
    throw new Error(`Required ObjectID is missing for field: "${name}"`);
  }
  const str = id.toString();
  if (!objectIdRegex.test(str)) {
    throw new Error(`Invalid ObjectID format for field "${name}": "${str}"`);
  }
  return new mongoose.Types.ObjectId(str);
}

/**
 * Converts a memory DTO evidence reference into persistence database format.
 * @param {Object} ref
 * @returns {Object}
 */
export function toPersistenceEvidence(ref) {
  if (!ref) {
    throw new Error('Evidence reference input is required.');
  }
  return {
    evaluationReportId: validateObjectId(ref.evaluationReportId, 'evaluationReportId'),
    candidateIdeaId: ref.candidateIdeaId ? validateObjectId(ref.candidateIdeaId, 'candidateIdeaId') : null,
    ideaTitle: ref.ideaTitle,
    timestamp: ref.timestamp,
    verdict: ref.verdict
  };
}

/**
 * Converts a database evidence schema reference back to memory DTO format.
 * @param {Object} ref
 * @returns {Object}
 */
export function fromPersistenceEvidence(ref) {
  if (!ref) {
    throw new Error('Evidence database reference input is required.');
  }
  if (!ref.evaluationReportId) {
    throw new Error('evaluationReportId is missing inside evidence database reference.');
  }
  return {
    evaluationReportId: ref.evaluationReportId.toString(),
    candidateIdeaId: ref.candidateIdeaId ? ref.candidateIdeaId.toString() : null,
    ideaTitle: ref.ideaTitle,
    timestamp: ref.timestamp,
    verdict: ref.verdict
  };
}

/**
 * Loads all knowledge items associated with a CreatorProfile from the database.
 * Maps MongoDB objects back to plain javascript contract formats.
 * @param {string} profileId
 * @returns {Promise<Array<Object>>}
 */
export async function loadKnowledge(profileId) {
  if (!profileId) {
    throw new Error('profileId is required to load knowledge.');
  }
  validateObjectId(profileId, 'profileId');

  // Retrieve matching documents
  const items = await KnowledgeItem.find({ profileId }).lean();

  return items.map(item => {
    if (!item._id) {
      throw new Error('Knowledge item database record is missing its primary ObjectID (_id).');
    }
    const mapped = {
      id: item._id.toString(),
      userId: validateObjectId(item.userId, 'userId').toString(),
      profileId: validateObjectId(item.profileId, 'profileId').toString(),
      normalizedStatement: item.normalizedStatement,
      category: item.category,
      lifecycleStatus: item.lifecycleStatus,
      strengthMetrics: item.strengthMetrics,
      metadata: item.metadata || {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    if (Array.isArray(item.evidenceReferences)) {
      mapped.evidenceReferences = item.evidenceReferences.map(fromPersistenceEvidence);
    }
    if (Array.isArray(item.contradictionHistory)) {
      mapped.contradictionHistory = item.contradictionHistory.map(fromPersistenceEvidence);
    }

    return mapped;
  });
}

/**
 * Upserts a collection of knowledge items to the database in a single bulk operation.
 * 
 * CONCURRENCY CONTRACT:
 * - This function operates under a single-writer assumption per profileId.
 * - Multi-instance concurrent writes could overwrite evidence reference updates since
 *   consolidation works on loaded in-memory snapshots.
 *
 * @param {string} profileId
 * @param {Array<Object>} items
 * @returns {Promise<void>}
 */
export async function saveKnowledge(profileId, items) {
  if (!profileId) {
    throw new Error('profileId is required to save knowledge.');
  }
  validateObjectId(profileId, 'profileId');
  if (!Array.isArray(items)) {
    throw new Error('items must be an array.');
  }

  if (items.length === 0) return;

  const bulkOps = items.map(item => {
    const parsedProfileId = validateObjectId(item.profileId || profileId, 'profileId');
    
    // Identity matching based strictly on profileId and normalizedStatement
    const query = {
      profileId: parsedProfileId,
      normalizedStatement: item.normalizedStatement,
    };

    const updatePayload = {
      userId: validateObjectId(item.userId, 'userId'),
      profileId: parsedProfileId,
      normalizedStatement: item.normalizedStatement,
      category: item.category,
      lifecycleStatus: item.lifecycleStatus,
      evidenceReferences: Array.isArray(item.evidenceReferences)
        ? item.evidenceReferences.map(toPersistenceEvidence)
        : [],
      strengthMetrics: item.strengthMetrics || { strength: 0, supportCount: 0, contradictionCount: 0 },
      contradictionHistory: Array.isArray(item.contradictionHistory)
        ? item.contradictionHistory.map(toPersistenceEvidence)
        : [],
      metadata: item.metadata || {},
    };

    return {
      updateOne: {
        filter: query,
        update: { $set: updatePayload },
        upsert: true
      }
    };
  });

  await KnowledgeItem.bulkWrite(bulkOps);
}
