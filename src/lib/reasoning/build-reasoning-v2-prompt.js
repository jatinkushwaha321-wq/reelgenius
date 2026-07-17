import { buildNivoPrompt } from '../prompts/shared.js';

/**
 * Builds the structured prompt for Reasoning Engine V2.
 *
 * @param {object} params
 * @param {object} params.packet - The assembled idea packet containing creator context, signals, and content.
 * @param {object} [params.memoryContext] - Optional memory context containing previous ideas or evaluation history.
 * @returns {string} The fully composed prompt string.
 */
export function buildReasoningV2Prompt({ packet, memoryContext = null }) {
  if (!packet) {
    throw new Error('Prompt build failed: "packet" parameter is required.');
  }

  const instruction = `
1. SYSTEM ROLE
You are the primary cognitive reasoning stage of NIVO (Reasoning Engine V2).
Your objective is to perform high-level strategic reasoning to define creative direction.
You must NOT generate finished ideas, hooks, or content titles.
Instead, you interpret observations to plan strategic opportunity directions.

2. CREATOR IDENTITY
Analyze the persistent creator identity details under "creatorContext":
- Core Identity (displayName, bio, niche, subNiches)
- Content Pillars (name, description, target percentage)
- Audience Persona (behaviorProfile, interests, painPoints)
- Brand Identity (tone, vocabulary, beliefs)
- Strategic Direction (positioningThesis, strategicGoal)

3. SIGNALS
Active signals are provided under "selectedSignals".
- Treat signals as factual evidence of recurring behavior.
- Never treat signals directly as strategic conclusions. Use them to justify interpretations.

4. OBSERVED CONTENT
Review the captions, formats, and performance metrics under "recentContent" and "topPerformanceContent".
- Factual observations must be grounded only in these observed content facts.

5. MEMORY CONTEXT
Memory context is provided under "memoryContext" (if present).
- If "memoryContext" is null, empty, or missing, proceed to reason strictly based on creator identity and signals. Do not invent any historical memories.

6. REASONING TASK
You must execute the approved strategic reasoning flow. Ensure you reason through each section sequentially:
- Situation Assessment: Analyze factual observations and emerging patterns.
- Identity Interpretation: Assess how the creator's beliefs and identity shape their perspective on the observations.
- Audience Interpretation: Synthesize current audience tensions and desired transformations.
- Strategic Direction: Outline a single positioning thesis and long-term strategic direction.
- Opportunity Planning: Map 2 to 5 strategic opportunities with evidence and strength bounds.
- Generation Contract: Define constraints (identity, memory, reasoning) for downstream idea generation.

7. OUTPUT CONTRACT
You must produce JSON conforming exactly to the Reasoning Engine V2 schema (conforming to reasoning-engine-v2-schema.js).
Your response must provide fields for situationAssessment, identityInterpretation, audienceInterpretation, strategicDirection, opportunityPlanning, and generationContract.

8. RULES
- Do not generate publishable content. Opportunity titles are internal reasoning labels used only to organize strategic opportunities. They are not user-facing content ideas. Focus strictly on strategic directions.
- Never invent unsupported evidence. Observations must be strictly grounded.
- Every opportunity must be evidence-backed (each opportunity planning item requires at least one supportingEvidence string).
- Creator Identity takes absolute priority over audience trends.
- Respect all generation constraints and categorize them properly by namespace.
- Multiple signals may jointly support a strategic conclusion. A single signal should not determine strategy in isolation.
- If evidence is weak or conflicting, prefer conservative reasoning over speculative conclusions.
`;

  // Build untrusted context injection, preserving memory if provided
  const context = {
    ...packet,
    memoryContext: memoryContext || packet.memoryContext || null,
  };

  const outputContract = {
    situationAssessment: {
      observations: ['string'],
      emergingPatterns: ['string'],
    },
    identityInterpretation: {
      identityAlignment: 'string',
      reinforcedBeliefs: ['string'],
      creatorStrengths: ['string'],
    },
    audienceInterpretation: {
      currentState: 'string',
      desiredState: 'string',
      audienceTensions: ['string'],
    },
    strategicDirection: {
      positioningThesis: 'string',
      strategicGoal: 'string',
    },
    opportunityPlanning: [
      {
        title: 'string',
        creatorPerspective: 'string',
        audienceProblem: 'string',
        supportingEvidence: ['string'],
        evidenceStrength: 'number (integer 0-100)',
      },
    ],
    generationContract: {
      identityConstraints: ['string'],
      memoryConstraints: ['string'],
      reasoningConstraints: ['string'],
    },
  };

  return buildNivoPrompt({
    instruction,
    context,
    outputContract,
  });
}
