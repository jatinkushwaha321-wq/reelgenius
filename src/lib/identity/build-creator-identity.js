/**
 * NIVO Identity — build-creator-identity
 *
 * Constructs a structured CreatorIdentity object by mapping and consolidating
 * raw attributes from CreatorProfile.
 *
 * @param {object} params
 * @param {object} params.profile - The CreatorProfile document
 * @param {Array<object>} [params.signals] - Optional Signal documents (placeholder evidence)
 * @returns {object} The mapped raw identity object
 */
export function buildCreatorIdentity({ profile, signals }) {
  if (!profile) {
    throw new Error('Profile parameter is required for buildCreatorIdentity');
  }

  const pillars = (profile.contentPillars || []).map(cp => ({
    name: cp.name || '',
    description: cp.description || '',
    percentage: typeof cp.percentage === 'number' ? cp.percentage : 0,
  }));

  // Signals are intentionally unused in Milestone 1.
  // Future milestones will derive beliefs, decision filters and other inferred
  // identity components from longitudinal signal evidence.

  return {
    identity: {
      displayName: profile.displayName || '',
      niche: profile.niche || '',
      subNiches: profile.subNiches || [],
      contentPillars: pillars,
      aiSummary: profile.aiSummary || '',
      strategicDirection: profile.strategicDirection || '',
    },
    beliefs: [], // Tenant values omitted. Beliefs will be inferred dynamically in V2.
    audience: {
      behaviorProfile: profile.audiencePersona?.behaviorProfile || '',
      interests: profile.audiencePersona?.interests || [],
      painPoints: profile.audiencePersona?.painPoints || [],
      desiredIdentity: '', // placeholder for Milestone 1
    },
    communicationStyle: {
      tone: profile.brandIdentity?.tone || [],
      explanationStyle: '', // placeholder
      storytelling: '', // placeholder
      frameworks: [], // placeholder
    },
    vocabulary: profile.brandIdentity?.vocabulary || [],
    decisionFilters: [], // placeholder
    generationConstraints: [], // placeholder
  };
}
