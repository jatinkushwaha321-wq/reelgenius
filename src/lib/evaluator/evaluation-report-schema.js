import { z } from 'zod';

const scoreSchema = z.number().int().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100');

export const alignmentDimensionSchema = z.object({
  score: scoreSchema,
  explanation: z.string().trim().min(1, 'Explanation is required'),
});

export const complianceDimensionSchema = z.object({
  score: scoreSchema,
  explanation: z.string().trim().min(1, 'Explanation is required'),
  violatedConstraints: z.array(z.string().trim()).default([]),
});

export const evaluationReportSchema = z.object({
  identityAlignment: alignmentDimensionSchema,
  reasoningAlignment: alignmentDimensionSchema,
  opportunityFidelity: alignmentDimensionSchema,
  generationContractCompliance: complianceDimensionSchema,
  audienceAlignment: alignmentDimensionSchema,
  novelty: alignmentDimensionSchema,
  strategicValue: alignmentDimensionSchema,
  overallVerdict: z.object({
    recommendation: z.enum(['APPROVE', 'REJECT']),
    summary: z.string().trim().min(1, 'Verdict summary is required'),
  }),
  validatedLearnings: z.array(z.string().trim()).default([]),
  rejectionReasons: z.array(z.string().trim()).default([]),
});
