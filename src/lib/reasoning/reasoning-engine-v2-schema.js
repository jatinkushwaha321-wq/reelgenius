import { z } from 'zod';

export const opportunitySchema = z.object({
  title: z.string().trim().min(1, 'Opportunity title is required'),
  creatorPerspective: z.string().trim().min(1, 'Creator perspective is required'),
  audienceProblem: z.string().trim().min(1, 'Audience problem is required'),
  // TODO (Future Milestone):
  // Replace free-text supportingEvidence with structured evidence references
  // to improve explainability, evaluator traceability and memory integration.
  // This is intentionally deferred to avoid premature complexity.
  supportingEvidence: z.array(z.string().trim()).min(1, 'At least one supporting evidence is required'),
  evidenceStrength: z.number().int().min(0, 'Evidence strength must be at least 0').max(100, 'Evidence strength cannot exceed 100'),
});

export const reasoningEngineV2Schema = z.object({
  situationAssessment: z.object({
    observations: z.array(z.string().trim()).min(1, 'Observations array cannot be empty'),
    emergingPatterns: z.array(z.string().trim()).default([]),
  }),
  identityInterpretation: z.object({
    identityAlignment: z.string().trim().min(1, 'Identity alignment is required'),
    reinforcedBeliefs: z.array(z.string().trim()).default([]),
    creatorStrengths: z.array(z.string().trim()).default([]),
  }),
  audienceInterpretation: z.object({
    currentState: z.string().trim().min(1, 'Current state is required'),
    desiredState: z.string().trim().min(1, 'Desired state is required'),
    audienceTensions: z.array(z.string().trim()).min(1, 'Audience tensions array cannot be empty'),
  }),
  strategicDirection: z.object({
    positioningThesis: z.string().trim().min(1, 'Positioning thesis is required'),
    strategicGoal: z.string().trim().min(1, 'Strategic goal is required'),
  }),
  opportunityPlanning: z.array(opportunitySchema).min(1, 'Opportunity planning must contain at least one opportunity'),
  generationContract: z.object({
    identityConstraints: z.array(z.string().trim()).default([]),
    memoryConstraints: z.array(z.string().trim()).default([]),
    reasoningConstraints: z.array(z.string().trim()).default([]),
  }),
});
