/**
 * NIVO Scripts — build-script-packet
 *
 * Assembles the precise, bounded packet for Script generation.
 * EXCLUDES factual authority, biological details, audience state, and NIVO intelligence reasoning.
 */

export function buildScriptPacket({ idea, profile, aiMemory }) {
  // 1. Idea (Creative Direction)
  const ideaPacket = {
    title: idea.title || '',
    topic: idea.topic || '',
    description: idea.description || '',
    hook: idea.hook || '',
    format: idea.format || '',
    contentPillar: idea.contentPillar || '',
    creativeDirection: idea.directionSnapshot || '',
  };

  // 2. Style (Tone and Vocabulary Guidance)
  const stylePacket = {
    niche: profile.niche || '',
    contentPillars: (profile.contentPillars || []).map(cp => ({
      name: cp.name,
      description: cp.description || '',
    })),
    tone: profile.brandIdentity?.tone || [],
  };

  // 3. Novelty (Avoidance Context)
  const noveltyPacket = {
    recentTopics: aiMemory?.recentTopics || [],
    recentHooks: aiMemory?.recentHooks || [],
    recentScriptSummaries: aiMemory?.recentScriptSummaries || [],
  };

  return {
    idea: ideaPacket,
    style: stylePacket,
    novelty: noveltyPacket,
  };
}
