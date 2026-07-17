import { buildNivoPrompt } from '../prompts/shared.js';

/**
 * Builds the prompt for Gemini to generate the in-memory Reasoning JSON.
 *
 * @param {object} params
 * @param {object} params.packet - The assembled idea packet
 * @returns {string} Composed prompt text
 */
export function buildReasoningPrompt({ packet }) {
  const instruction = `
You are the primary cognitive reasoning stage of NIVO, a Creator Intelligence platform.
Your task is to analyze creator context, active audience signals, observed content, and novelty baseline, and output a structured JSON reasoning object that maps out observations, insights, strategic opportunities, and rejected directions for this content creator.

You must output JSON matching the following structure:
{
  "observations": [
    // Factual patterns directly supported by evidence, containing no interpretation or hypothesis.
    // E.g., "Posts containing multi-slide tutorials average 1.8x higher saves than talking-head posts."
  ],
  "insights": [
    // Explanations/interpretations of one or more observations. Why does this pattern occur? What audience dynamic does it reveal?
    // E.g., "The audience values structural learning resources over conversational advice."
  ],
  "strategicOpportunities": [
    // 2 to 5 actionable creative opportunities.
    {
      "opportunity": "Concise statement of the opportunity topic or direction (e.g., 'Deep-dive Git workflow comparisons').",
      "audienceTension": "The underlying friction point or question this opportunity resolves.",
      "creatorLens": "The specific angle/perspective the creator should take based on their pillars/identity.",
      "suggestedVocabulary": ["2-3 specific lexical terms from the creator's vocabulary or brand identity to use"],
      "supportedByObservationIndexes": [0, 1] // Indices matching the factual observations list
    }
  ],
  "rejectedDirections": [
    // A list of generic, low-value, or oversaturated directions that SHOULD NOT be generated, to suppress semantic autocomplete.
    {
      "topic": "The broad topic (e.g., 'Top AI Tools', 'Resume Checklist')",
      "reason": "Clear explanation of why this is generic and lacks creator specificity"
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. Ground every observation in the supplied evidence. Do not invent any metrics or patterns.
2. For each opportunity, provide 2-5 entries depending on the reasoning quality.
3. Suppress semantic autocomplete by specifying broad/generic niche topics in rejectedDirections (e.g., "Top AI Tools", "Basic SQL Tutorials", "ATS Resume Tips").
4. Keep the vocabulary suggestions strictly aligned with the creator's brand identity.
`;

  return buildNivoPrompt({
    instruction,
    context: packet,
    outputContract: {
      observations: ["string"],
      insights: ["string"],
      strategicOpportunities: [
        {
          opportunity: "string",
          audienceTension: "string",
          creatorLens: "string",
          suggestedVocabulary: ["string"],
          supportedByObservationIndexes: ["number"]
        }
      ],
      rejectedDirections: [
        {
          topic: "string",
          reason: "string"
        }
      ]
    }
  });
}
