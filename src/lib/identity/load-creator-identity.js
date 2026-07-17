import { creatorIdentitySchema } from './creator-identity-schema.js';
import { buildCreatorIdentity } from './build-creator-identity.js';

/**
 * Deep freezes an object recursively.
 * 
 * @param {object} obj - The object to deep freeze
 * @returns {object} The frozen object
 */
function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  Object.keys(obj).forEach((key) => {
    deepFreeze(obj[key]);
  });
  return obj;
}

/**
 * Loads and validates the persistent CreatorIdentity abstraction for the reasoning pipeline.
 *
 * @param {object} params
 * @param {object} params.profile - The Mongoose CreatorProfile document
 * @param {Array<object>} [params.signals] - Array of active Mongoose Signal documents
 * @returns {object} The frozen, validated CreatorIdentity object
 */
export function loadCreatorIdentity({ profile, signals = [] }) {
  if (!profile) {
    throw new Error('Profile parameter is required for loadCreatorIdentity');
  }

  const rawIdentity = buildCreatorIdentity({ profile, signals });
  const validated = creatorIdentitySchema.parse(rawIdentity);

  return deepFreeze(validated);
}
