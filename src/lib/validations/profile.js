import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const contentPillarSchema = z.object({
  name: z.string().min(1, 'Pillar name is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export const creatorProfileSchema = z.object({
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format'),
  instagramUsername: z
    .string()
    .min(1, 'Instagram username is required')
    .max(30, 'Username cannot exceed 30 characters')
    .toLowerCase()
    .trim(),
  displayName: z.string().max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  followerCount: z.number().nonnegative().optional(),
  followingCount: z.number().nonnegative().optional(),
  postCount: z.number().nonnegative().optional(),
  profilePicUrl: z.string().url().or(z.string().max(0)).trim().optional(),
  isVerified: z.boolean().optional(),
  category: z.string().max(100).trim().optional(),
  externalUrl: z.string().url().or(z.string().max(0)).trim().optional(),
  niche: z.string().max(100).trim().optional(),
  subNiches: z.array(z.string().max(100).trim()).optional(),
  contentPillars: z.array(contentPillarSchema).optional(),
  audiencePersona: z.object({
    behaviorProfile: z.string().max(500).trim().optional(),
    interests: z.array(z.string().max(100).trim()).optional(),
    painPoints: z.array(z.string().max(200).trim()).optional(),
  }).optional(),
  brandIdentity: z
    .object({
      tone: z.array(z.string().max(50).trim()).optional(),
      vocabulary: z.array(z.string().max(100).trim()).optional(),
      values: z.array(z.string().max(100).trim()).optional(),
      uniqueSellingPoints: z.array(z.string().max(200).trim()).optional(),
    })
    .optional(),
  postingFrequency: z.string().max(100).trim().optional(),
  aiSummary: z.string().max(1000).trim().optional(),
});
