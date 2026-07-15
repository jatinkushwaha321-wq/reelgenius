import { Type } from '@google/genai';

/**
 * Provider-native structured output schema for Creator Intelligence generation.
 * This instructs the Gemini model to output valid JSON matching this coarse structural shape,
 * providing generation-time enforcement of critical field presence (like evidence).
 * 
 * Zod remains the detailed post-generation authority for length, bounds, enums, etc.
 * We avoid detailed constraints here to prevent Gemini 400 INVALID_ARGUMENT (too many states).
 */
export const intelligenceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    creatorContext: {
      type: Type.OBJECT,
      properties: {
        niche: { type: Type.STRING },
        subNiches: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        contentPillars: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              percentage: { type: Type.INTEGER },
            },
            required: ['name', 'description', 'percentage'],
          },
        },
        audiencePersona: {
          type: Type.OBJECT,
          properties: {
            behaviorProfile: { type: Type.STRING },
            interests: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            painPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['behaviorProfile'],
        },
        brandIdentity: {
          type: Type.OBJECT,
          properties: {
            tone: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            vocabulary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            values: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            uniqueSellingPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['tone'],
        },
        postingFrequency: { type: Type.STRING },
        aiSummary: { type: Type.STRING },
        strategicDirection: { type: Type.STRING },
      },
      required: [
        'niche',
        'subNiches',
        'contentPillars',
        'audiencePersona',
        'brandIdentity',
        'postingFrequency',
        'aiSummary',
      ],
    },
    signals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          existingKey: {
            type: Type.STRING,
            nullable: true,
          },
          displayName: { type: Type.STRING },
          category: { type: Type.STRING },
          strength: { type: Type.INTEGER },
          confidence: { type: Type.INTEGER },
          creatorTrait: { type: Type.STRING },
          audienceBehavior: { type: Type.STRING },
          directionImplication: { type: Type.STRING },
          evidence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                ref: { type: Type.STRING },
                fact: { type: Type.STRING },
                metrics: {
                  type: Type.OBJECT,
                  nullable: true,
                },
              },
              required: ['type', 'ref', 'fact'],
            },
          },
        },
        required: [
          'displayName',
          'category',
          'strength',
          'confidence',
          'creatorTrait',
          'audienceBehavior',
          'directionImplication',
          'evidence',
        ],
      },
    },
  },
  required: ['creatorContext', 'signals'],
};
