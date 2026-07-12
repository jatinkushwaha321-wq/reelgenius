import { NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import { generateJson, NivoAIError } from '@/lib/gemini';
import { buildNivoPrompt } from '@/lib/prompts/shared';
import { aiSignalInputSchema } from '@/lib/validations/signal';
import { calculateTrend } from '@/lib/utils/trend';
import AIMemoryModel from '@/models/AIMemory';
import {
  getAIMemory,
  ensureAIMemory,
  appendAIMemory,
  NivoMemoryConflictError,
} from '@/lib/ai-memory';
import { successResponse, errorResponse } from '@/lib/api-response';

// Regex constants matching validation specifications
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Strict input validation schema local to the route (M4.8 Request Body)
const testRequestSchema = z.object({
  limiterKey: z.string().min(1, 'limiterKey is required'),
  mode: z.enum(['structured', 'memory']),
  userId: z.string().regex(objectIdRegex, 'Invalid User ID format').optional(),
  profileId: z.string().regex(objectIdRegex, 'Invalid Profile ID format').optional(),
}).strict();

// Structured Zod schema for the provider diagnostic response (M4.8 Gemini Diagnostic)
const diagnosticResponseSchema = z.object({
  status: z.literal('ok'),
  system: z.literal('nivo-ai'),
  capability: z.literal('structured-output'),
}).strict();

export async function POST(req) {
  // 1. Enforce development-only route restriction (M4.8 Development-Only Boundary)
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  try {
    // 2. Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Malformed JSON in request body.', 'BAD_REQUEST', null, 400);
    }

    // 3. Validate parsed request body
    const validation = testRequestSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(
        'Request validation failed.',
        'VALIDATION_ERROR',
        validation.error.flatten().fieldErrors,
        400
      );
    }

    const { limiterKey, mode, userId, profileId } = validation.data;

    // 4. Handle STRUCTURED Mode
    if (mode === 'structured') {
      // Exercise shared prompt composition helper
      const prompt = buildNivoPrompt({
        instruction: 'Return the exact diagnostic JSON structure requested. Do not analyze a creator profile.',
        context: { type: 'diagnostic', note: 'AI pipeline health verification test.' },
        outputContract: {
          status: 'ok',
          system: 'nivo-ai',
          capability: 'structured-output',
        },
      });

      // Exercise generateJson infrastructure (Zod validated)
      const geminiResult = await generateJson(limiterKey, prompt, diagnosticResponseSchema);

      // Exercise local compatibility checks with validation fixtures (M4.8 Compatibility Check)
      const localSignalFixture = {
        key: 'transformation_content',
        displayName: 'Transformation Content',
        category: 'content-format',
        strength: 80,
        confidence: 90,
        creatorTrait: 'Uses transitions.',
        audienceBehavior: 'Saves transformation reels.',
        directionImplication: 'Use transitions.',
        evidence: [
          {
            type: 'fact',
            fact: 'Static diagnostic local validation check.',
          },
        ],
      };
      const signalValidation = aiSignalInputSchema.safeParse(localSignalFixture);
      const signalCheckPassed = signalValidation.success;

      // Exercise deterministic trend calculations (M4.8 Trend Calculation Check)
      const testObservations = [
        { strength: 20, observedAt: new Date(Date.now() - 3000) },
        { strength: 40, observedAt: new Date(Date.now() - 2000) },
        { strength: 60, observedAt: new Date(Date.now() - 1000) },
      ];
      const trendResult = calculateTrend(testObservations);
      if (trendResult !== 'rising') {
        throw new Error(`Trend validation check failed. Expected "rising" but got "${trendResult}"`);
      }

      return successResponse({
        mode: 'structured',
        gemini: {
          connected: true,
          structuredOutputValidated: geminiResult.status === 'ok',
          signalCompatibilityCheck: signalCheckPassed,
        },
        promptFoundation: {
          exercised: true,
        },
        trend: {
          exercised: true,
          expected: 'rising',
          actual: trendResult,
        },
      }, 'NIVO AI diagnostic passed');
    }

    // 5. Handle MEMORY Mode
    if (mode === 'memory') {
      if (!userId || !profileId) {
        return errorResponse(
          'userId and profileId are required in memory mode.',
          'VALIDATION_ERROR',
          null,
          400
        );
      }

      // Establish database connection
      await connectDB();

      // Check if memory document existed prior to diagnostic execution
      const existingDoc = await getAIMemory({ userId, profileId });
      const memoryExistedBefore = !!existingDoc;

      // Create development-namespaced topic marker
      const marker = `NIVO_DEV_AI_TEST_${Date.now()}`;

      // Perform memory update
      await ensureAIMemory({ userId, profileId });
      await appendAIMemory({ userId, profileId, topics: [marker] });

      // Verify diagnostic marker addition
      const verifiedDoc = await getAIMemory({ userId, profileId });
      const diagnosticMarkerAppended = !!(
        verifiedDoc && verifiedDoc.recentTopics.includes(marker)
      );

      if (!diagnosticMarkerAppended) {
        throw new Error('Diagnostic memory marker failed to write to database.');
      }

      // Cleanup: Remove diagnostic marker (M4.8 Cleanup)
      let diagnosticMarkerRemoved = false;
      try {
        await AIMemoryModel.updateOne(
          { userId, profileId },
          { $pull: { recentTopics: marker } }
        );
        diagnosticMarkerRemoved = true;
      } catch (cleanupErr) {
        console.error('Diagnostic memory cleanup failed:', cleanupErr);
      }

      // Delete document if it was created solely by this diagnostic test and remains empty at deletion time (concurrency fix)
      let deletedEmptyDoc = false;
      if (!memoryExistedBefore && diagnosticMarkerRemoved) {
        const deleteResult = await AIMemoryModel.deleteOne({
          userId,
          profileId,
          creatorSummary: '',
          recentTopics: { $size: 0 },
          recentHooks: { $size: 0 },
          recentScriptSummaries: { $size: 0 },
          contentPillars: { $size: 0 },
        });
        deletedEmptyDoc = deleteResult.deletedCount > 0;
      }

      // Block response if database cleanup tasks fail (M4.8 Cleanup Failure)
      if (!diagnosticMarkerRemoved) {
        return errorResponse(
          'Diagnostic memory execution succeeded, but database marker cleanup failed.',
          'CLEANUP_FAILED',
          null,
          500
        );
      }

      return successResponse({
        mode: 'memory',
        memoryExistedBefore,
        diagnosticMarkerAppended,
        diagnosticMarkerRemoved,
        deletedDocIfEmpty: deletedEmptyDoc,
      }, 'NIVO memory engine persistence diagnostic passed');
    }

  } catch (err) {
    // Map NIVO custom errors to correct API status codes (M4.8 Status Mapping)
    if (err instanceof NivoAIError) {
      let status = 502;
      if (err.code === 'LOCAL_RATE_LIMIT') status = 429;
      else if (err.code === 'PROVIDER_RATE_LIMIT') status = 429;
      else if (err.code === 'AUTHENTICATION_ERROR') status = 503;
      else if (err.code === 'MODEL_OVERLOADED') status = 503;
      else if (err.code === 'INVALID_STRUCTURED_OUTPUT') status = 502;
      else if (err.code === 'PROVIDER_ERROR') status = 502;

      return errorResponse(err.message, err.code, null, status);
    }

    if (err instanceof NivoMemoryConflictError) {
      return errorResponse(err.message, err.code, null, 409);
    }

    console.error('AI Diagnostic unexpected failure:', err);
    return errorResponse(
      err.message || 'AI test diagnostic failed.',
      'DIAGNOSTIC_FAILED',
      null,
      500
    );
  }
}
