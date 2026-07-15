import { z } from 'zod';
import { truncateBoundedString } from './ideas-generation.js';

/**
 * Local wrapper for bounded string preprocessing.
 * `boundedProviderString` was not exported from `ideas-generation.js`, 
 * but `truncateBoundedString` is. To avoid modifying `ideas-generation.js` 
 * just to export the wrapper, we implement the local equivalent here.
 */
function boundedProviderString(maxLen) {
  return z.preprocess(
    (val) => truncateBoundedString(val, maxLen),
    z.string()
  );
}

export const scriptBeatSchema = z
  .object({
    order: z
      .number()
      .int('order must be an integer')
      .min(1, 'order must be at least 1')
      .max(12, 'order cannot exceed 12'),
    spokenContent: boundedProviderString(500)
      .pipe(
        z.string()
          .max(500, 'spokenContent cannot exceed 500 characters')
          .trim()
      )
      .optional()
      .default(''),
    onScreenText: boundedProviderString(150)
      .pipe(
        z.string()
          .max(150, 'onScreenText cannot exceed 150 characters')
          .trim()
      )
      .optional()
      .default(''),
    visualNote: boundedProviderString(200)
      .pipe(
        z.string()
          .max(200, 'visualNote cannot exceed 200 characters')
          .trim()
      )
      .optional()
      .default(''),
  })
  .refine(
    (data) => {
      // Reject if semantically empty: all three text fields are empty after preprocessing/trimming
      return (
        data.spokenContent.length > 0 ||
        data.onScreenText.length > 0 ||
        data.visualNote.length > 0
      );
    },
    {
      message: 'Beat is semantically empty. At least one of spokenContent, onScreenText, or visualNote must be provided.',
    }
  );

export const scriptOutputSchema = z.object({
  requiresPersonalFact: z.boolean({
    required_error: 'requiresPersonalFact is required',
    invalid_type_error: 'requiresPersonalFact must be a boolean',
  }),
  hook: boundedProviderString(300)
    .pipe(
      z.string()
        .min(5, 'hook must be at least 5 characters')
        .max(300, 'hook cannot exceed 300 characters')
        .trim()
    ),
  beats: z
    .array(scriptBeatSchema)
    .min(1, 'At least one beat is required')
    .max(12, 'No more than 12 beats are allowed'),
  cta: boundedProviderString(200)
    .pipe(
      z.string()
        .max(200, 'cta cannot exceed 200 characters')
        .trim()
    )
    .optional()
    .default(''),
  caption: boundedProviderString(500)
    .pipe(
      z.string()
        .max(500, 'caption cannot exceed 500 characters')
        .trim()
    )
    .optional()
    .default(''),
  scriptSummary: boundedProviderString(250)
    .pipe(
      z.string()
        .min(10, 'scriptSummary must be at least 10 characters')
        .max(250, 'scriptSummary cannot exceed 250 characters')
        .trim()
    ),
});
