import { z } from 'zod';

export const contentPillarSchema = z.object({
  name: z.string().trim(),
  description: z.string().trim().default(''),
  percentage: z.number().default(0),
});

export const creatorIdentitySchema = z.object({
  identity: z.object({
    displayName: z.string().trim().default(''),
    niche: z.string().trim().default(''),
    subNiches: z.array(z.string().trim()).default([]),
    contentPillars: z.array(contentPillarSchema).default([]),
    aiSummary: z.string().trim().default(''),
    strategicDirection: z.string().trim().default(''),
  }),
  // Intentionally empty placeholder in Milestone 1; will be populated in future milestones from signal evidence.
  beliefs: z.array(z.string().trim()).default([]),
  audience: z.object({
    behaviorProfile: z.string().trim().default(''),
    interests: z.array(z.string().trim()).default([]),
    painPoints: z.array(z.string().trim()).default([]),
    desiredIdentity: z.string().trim().default(''),
  }),
  communicationStyle: z.object({
    tone: z.array(z.string().trim()).default([]),
    explanationStyle: z.string().trim().default(''),
    storytelling: z.string().trim().default(''),
    frameworks: z.array(z.string().trim()).default([]),
  }),
  vocabulary: z.array(z.string().trim()).default([]),
  // Intentionally empty placeholder in Milestone 1; will be populated in future milestones.
  decisionFilters: z.array(z.string().trim()).default([]),
  // Intentionally empty placeholder in Milestone 1; will be populated in future milestones.
  generationConstraints: z.array(z.string().trim()).default([]),
});
