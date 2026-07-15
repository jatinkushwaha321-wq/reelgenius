import { buildNivoPrompt } from '../prompts/shared.js';
import { formatCadenceSummary } from './compute-cadence.js';

/**
 * Builds the structured task instructions and prompt for creator intelligence analysis.
 *
 * @param {object} params
 * @param {object} params.packet - Compact evidence packet
 * @param {Array<object>} params.existingSignals - Existing signals context
 * @param {string} params.contentTier - Content tier ('limited_context', 'sparse_signals', 'full')
 * @param {object} params.outputContract - Output contract JSON schema
 * @param {object|null} params.cadence - Deterministic cadence statistics from computeCadence()
 * @returns {string} Fully formatted Gemini prompt
 */
export function buildIntelligencePrompt({ packet, existingSignals, contentTier, outputContract, cadence }) {
  // Format existing signals context for injection
  const formattedExisting = (existingSignals || []).map((s) => ({
    key: s.key,
    displayName: s.displayName,
    category: s.category,
    strength: s.strength,
    confidence: s.confidence,
  }));

  // Build task instructions based on Content Tier constraints
  let tierInstruction = '';
  if (contentTier === 'limited_context') {
    tierInstruction = `
[TIER RULE - LIMITED EVIDENCE]:
We have very sparse observation data (1 to 4 items).
- You MUST analyze and derive the 'creatorContext' object (niche, pillars, audience, brand, etc.) cautiously.
- You MUST set the top-level 'signals' array to EXACTLY an empty array: []
- In the 'creatorContext.aiSummary', you MUST explicitly acknowledge that the observation history is extremely limited (e.g., "Based on a limited sample of X posts...").
- You MUST set 'creatorContext.strategicDirection' to EXACTLY an empty string: ''
`;
  } else if (contentTier === 'sparse_signals') {
    tierInstruction = `
[TIER RULE - SPARSE EVIDENCE]:
We have moderate observation data (5 to 9 items).
- You may derive 'creatorContext' and output 'signals'.
- You MUST output a MAXIMUM of 5 signals in the 'signals' array.
- For all signals, you MUST cap the 'confidence' scores at a MAXIMUM of 50.
- In the 'creatorContext.aiSummary', you MUST explicitly acknowledge that the analysis is based on a limited sample size.
- In 'creatorContext.strategicDirection', you MUST explicitly acknowledge that the strategic direction is tentative due to the limited sample size. Keep the direction brief (2-3 sentences maximum).
`;
  } else {
    tierInstruction = `
[TIER RULE - FULL EVIDENCE]:
We have normal observation data (10+ items).
- You may derive 'creatorContext' and output 'signals'.
- You MUST output a MAXIMUM of 10 signals in the 'signals' array.
- Use the normal 0-100 range for 'strength' and 'confidence'.
- 'creatorContext.strategicDirection' may provide full strategic synthesis grounded in the identified signals.
`;
  }

  const instruction = `
You are the NIVO Creator Intelligence engine. Your task is to analyze the provided Instagram creator profile metadata and observed content list to derive canonical creator context and identify recurring content/audience signals.

${tierInstruction}

=== GROUNDING RULES & INSTRUCTIONS ===
1. Every claim, niche categorization, content pillar, and signal MUST be strictly traceable to the provided evidence packet.
2. Null metrics (e.g., likesCount: null, viewCount: null) mean the data is hidden or unavailable. Never treat null as zero or draw engagement conclusions based on absent metrics.
3. Do not assume or claim audience demographic data (such as age range, gender distribution, income level, or geographic location). You have no demographic context.
4. Do not mention or claim "saves", "shares", "reach", or "impressions" anywhere in your output. These metrics are not available in public scraping observations.
5. Do not make claims about video completion rates, watch-through rates, average watch time, or retention graphs. They are unavailable.
6. Do not claim or infer audience growth rates, velocity, or trajectories over time from this single observation snapshot.
7. Content items with format "unknown" should be acknowledged, but never reclassified or assumed to be an image, reel, or video.
8. Pinned posts (isPinned: true) represent creator selection/intent, not necessarily recent content performance.
9. Do not recommend specific posting hours or times (e.g., "Post at 5 PM local time"). You have timestamps in UTC but no creator/audience timezone or time-performance correlation context.
10. VISUAL ANALYSIS BOUNDARY:
    You have NO access to image files, video frames, audio tracks, text overlays, or visual compositions.
    Never claim or mention: opening hook visual styles, camera angles, transitions, editing pacing, color palettes, background scenery, faces/people visual presence, music choices, or aesthetic visual styles.
    Your traits, behavior summaries, and evidence facts must be grounded solely in text captions, hashtags, format types, durations, mentions, and numeric metrics.
11. If the captions are empty, do not infer content themes or tone from absent text.
12. Every Signal in the 'signals' array MUST reference at least 2 distinct evidence items (i.e. different content refs like post_001 and post_002, or profile and post_001). A signal can NEVER be based on a single post or on 'profile' alone.
13. Use only the provided opaque refs ('profile', 'post_001', 'post_002', etc.) in the 'evidence[].ref' fields. Never invent or reference an opaque key not present in the packet.
14. 'creatorTrait' means what the creator demonstrably does based only on text and metadata.
    Allowed classes of creatorTrait claims:
    - Content format preferences (e.g., predominantly posts reels)
    - Caption styles (e.g., uses question-based openings)
    - Hashtag usage strategies (e.g., broad vs. specific hashtags)
    - Posting cadence / timestamps distribution (e.g., weekday vs. weekend)
    - Duration patterns (e.g., reel lengths)
    - Mention/collaboration patterns (e.g., tags brands)
    - Pining strategies (e.g., pins workout guides)
    - Caption lengths (e.g., long-form text vs short)
    - Carousel slide count patterns
    - Content topic patterns derived from captions/hashtags
    - Bio-stated professional identity/credentials
15. SIGNAL IDENTITY & REUSE (IMPORTANT):
    You are provided with a list of "existingSignals" that have been persisted from prior runs.
    - If a pattern you detect matches the semantic concept of an existing signal, you MUST set the 'existingKey' field to that signal's key (e.g., "reels_outperform_images").
    - If the pattern is new, omit the 'existingKey' field or set it to null.
    - Never invent or output a new key in the 'existingKey' field.

16. COMMENT TEXT BOUNDARY (CRITICAL):
    You do NOT have access to comment text, comment authors, commenter identities, or comment sentiment.
    You possess ONLY commentsCount (the total number of comments) for each observed post.
    You MUST NEVER claim that audience members:
    - answered questions
    - suggested topics
    - requested future content
    - shared opinions in comments
    - expressed appreciation in comments
    - discussed specific topics in comments
    - agreed or disagreed in comments
    - asked specific questions in comments
    - expressed any particular sentiment in comments
    You MAY observe that the CREATOR asks questions or solicits topics in captions (this is a directly observed creator action).
    You MAY state that a post "received N comments" or "showed measurable comment activity."
    You MUST NOT infer what commenters said, felt, or intended from commentsCount alone.

17. AUDIENCE BEHAVIOR LANGUAGE CONSTRAINTS:
    The 'audienceBehavior' field in signals and 'behaviorProfile' in audiencePersona must describe only measurable patterns from available public metrics.
    Allowed concepts: measurable comment activity, like counts, play counts, view counts, relative metric differences, repeated count-level patterns, content format distribution.
    Do NOT use unsupported psychological or sentiment conclusions from counts alone. Avoid:
    - "appreciates", "loves", "enjoys", "is inspired by"
    - "feels connected to", "strongly identifies with"
    - "responds positively", "demonstrates strong interest"
    Instead use calibrated wording:
    - "received higher observed play counts"
    - "showed above-baseline comment activity"
    - "generated measurable public engagement"
    - "was associated with higher observed like counts"
    - "appears to attract more public interaction in the observed sample"

18. AUDIENCE INTERESTS & PAIN POINTS ARE HYPOTHESES:
    'audiencePersona.interests' represents hypothesized audience interests inferred from recurring creator content themes and public engagement patterns.
    'audiencePersona.painPoints' represents hypothesized audience pain points inferred from recurring creator topics, problems addressed, and motivational themes.
    These MUST use calibrated uncertainty language. Do NOT present them as observed demographic or survey facts.
    Allowed: "The observed content suggests an audience likely interested in..."
    Disallowed: "The audience is interested in..." or "Followers are facing..."

19. CONTENT DEPTH & PRESENTATION QUALITY BOUNDARY:
    You have caption text, hashtags, mentions, metadata, public metrics, content format, and duration.
    You do NOT have video transcripts, spoken content semantics, visual scene understanding, editing analysis, hook analysis, pacing analysis, overlay text analysis, music analysis, or delivery quality analysis.
    Do NOT claim: deep technical insight, comprehensive explanation, accessible explanation, clear teaching delivery, strong hook, fast pacing, polished editing, visual storytelling quality, effective transitions, strong on-camera presence.
    You MAY claim: the caption references a technical topic, the creator repeatedly posts about technical concepts, the content is short-form based on format/duration, captions contain humorous or motivational language, a Reel is about a named topic when the caption clearly identifies it.

20. CONTENT PILLAR PERCENTAGES:
    Content pillar percentages are your semantic estimates of the observed content mix.
    They must be directionally grounded in the evidence packet.
    All pillar percentages MUST total exactly 100.

21. DIRECTION IMPLICATION CALIBRATION (CRITICAL EVIDENCE BOUNDARY):
    The 'directionImplication' field in signals must recommend content directions (e.g. continuing, narrowing, deepening, contrasting, combining, or adapting a content pattern) without upgrading content-performance metrics into claims about the audience's psychological state, needs, or struggles.
    - Content-performance evidence (e.g. higher play counts or comment activity) ONLY authorizes claims about content performance or recommendations derived from it (e.g. "Continue or narrow technical explanation content into specific practical developer concepts").
    - Content-performance evidence does NOT authorize audience-state claims. Do NOT state: "the audience is interested in X", "the audience wants/needs/struggles with X", "X is a recognized audience challenge", or "the audience has documented interest in X".
    - Audience-state language is strictly prohibited in 'directionImplication' unless the evidence directly supports that audience fact within established intelligence evidence boundaries.
    - Keep directional opportunity explicitly separate from observed fact.

22. STRATEGIC DIRECTION BOUNDARY:
    'strategicDirection' is a creator-level directional synthesis, NOT a biography and NOT a checklist.
    - It must explicitly frame WHERE to lean next over a 2-4 week strategic horizon.
    - It must NOT summarize the creator (that is what aiSummary is for).
    - It must NOT repeat individual Signals as a concatenated list.
    - It must NOT become a content calendar or recommend posting times.
    - It must NOT predict views, reach, engagement, follower growth, or other outcomes.
    - It must NOT invent creator goals, aspirations, audience preferences, or audience needs.
    - It must NOT introduce a niche pivot unsupported by observed evidence.

=== STRICT CARDINALITY LIMITS ===
You MUST strictly adhere to the following list size constraints:
- creatorContext.subNiches: between 1 and 5 items maximum
- creatorContext.contentPillars: between 1 and 6 items maximum
- creatorContext.audiencePersona.interests: maximum 8 items
- creatorContext.audiencePersona.painPoints: maximum 5 items
- creatorContext.brandIdentity.tone: between 1 and 5 items maximum
- creatorContext.brandIdentity.vocabulary: maximum 10 items
- creatorContext.brandIdentity.values: maximum 5 items
- creatorContext.brandIdentity.uniqueSellingPoints: maximum 5 items
- signals: maximum 10 items (or maximum 5 signals if the sparse evidence tier rule applies)
- signals[].evidence: between 1 and 5 items maximum per signal
- signals[].evidence[].metrics: maximum 5 key-value pairs
`;

  // Build cadence fact block if cadence data is available
  const cadenceFacts = cadence ? formatCadenceSummary(cadence) : '';

  const context = {
    evidence: packet,
    existingSignals: formattedExisting,
  };

  // Append cadence facts to instruction if available
  const fullInstruction = cadenceFacts ? `${instruction}\n${cadenceFacts}` : instruction;

  return buildNivoPrompt({
    instruction: fullInstruction,
    context,
    outputContract,
  });
}
