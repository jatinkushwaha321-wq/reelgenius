import { buildNivoPrompt } from '../prompts/shared.js';

/**
 * Builds the structured prompt for Evaluator V1.
 *
 * @param {object} params
 * @param {object} params.creatorIdentity - Creator identity layer object
 * @param {object} params.reasoningContext - Reasoning contract produced by Reasoning Engine V2
 * @param {object} params.candidate - The candidate idea to evaluate
 * @param {object} [params.outputContract] - Expected output format description
 * @returns {string} Fully composed prompt text
 */
export function buildEvaluatorPrompt({ creatorIdentity, reasoningContext, candidate, outputContract = null }) {
  if (!creatorIdentity) {
    throw new Error('Prompt build failed: "creatorIdentity" parameter is required.');
  }
  if (!reasoningContext) {
    throw new Error('Prompt build failed: "reasoningContext" parameter is required.');
  }
  if (!candidate) {
    throw new Error('Prompt build failed: "candidate" parameter is required.');
  }

  const instruction = `
1. SYSTEM ROLE
You are the final cognitive evaluation stage of NIVO (Evaluator V1).
Your role is to critically judge the supplied candidate idea against the creator's identity, the active reasoning contract, and strategic opportunities.
You must NOT generate replacement ideas, rewrite candidate content, or alter creator parameters.
You are a critic, not a creator.

2. CREATOR IDENTITY
The supplied context includes the creator's persistent cognitive identity under "creatorIdentity".

3. REASONING CONTRACT
The active reasoning contract is supplied under "reasoningContext".
- The positioning thesis, strategic goal, opportunity planning, and generation contract constraints are authoritative and must be strictly followed.

4. CANDIDATE IDEA
The generated candidate content is supplied under "candidate".
- Do not modify, rewrite, or attempt to fix the candidate. Judge it exactly as written.

5. EVALUATION TASK
You must sequentially evaluate the candidate across the following dimensions:
Reasoning Alignment:
- Reasoning Alignment: Does the candidate faithfully execute the approved Positioning Thesis and Strategic Direction established by the Reasoning Engine?
- Identity Alignment: Does this idea naturally belong to this creator's niche and tone?
- Opportunity Fidelity: Does the generated idea remain faithful to the selected strategic opportunity?
- Generation Contract Compliance: Does it violate any of the namespace constraints (identity, memory, reasoning)?
- Audience Alignment: Does it address a genuine audience tension and facilitate transformation?
- Novelty: Has this opportunity already been over-explored or is it sufficiently differentiated?
- Strategic Value: Will repeatedly publishing ideas like this strengthen creator positioning over time?

6. OUTPUT CONTRACT
Your response must be JSON conforming exactly to the evaluation-report-schema.js contract. Your output must map precisely to these properties:
- identityAlignment: { score: number (0-100), explanation: string }
- reasoningAlignment: { score: number (0-100), explanation: string }
- opportunityFidelity: { score: number (0-100), explanation: string }
- generationContractCompliance: { score: number (0-100), explanation: string, violatedConstraints: string[] }
- audienceAlignment: { score: number (0-100), explanation: string }
- novelty: { score: number (0-100), explanation: string }
- strategicValue: { score: number (0-100), explanation: string }
- overallVerdict: { recommendation: "APPROVE" | "REJECT", summary: string }
- validatedLearnings: string[]
- rejectionReasons: string[]

7. RULES
- Never rewrite or suggest replacements for the candidate idea.
- Never modify Creator Identity.
- Never reinterpret strategic reasoning.
- Judge only the supplied candidate idea.
- Do not infer missing information.
- If evidence is insufficient, reflect that in the evaluation rather than inventing assumptions.
`;

  const context = {
    creatorIdentity,
    reasoningContext,
    candidate,
  };

  return buildNivoPrompt({
    instruction,
    context,
    outputContract,
  });
}
