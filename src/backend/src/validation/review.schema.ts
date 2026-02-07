import { z } from 'zod';

/**
 * Zod schema for review validation
 * Replaces the Joi schema from schemas.js
 */

// Helper to sanitize HTML (basic check)
const sanitizeString = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .refine(
      (val) => {
        // Check for dangerous HTML patterns
        const dangerousPatterns = /<script|<iframe|javascript:|onerror=|onload=/i;
        return !dangerousPatterns.test(val);
      },
      {
        message: 'Contains potentially dangerous HTML content. Please remove any HTML tags.',
      }
    );

export const reviewSchema = z.object({
  review: z.object({
    rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    body: sanitizeString('Review body'),
  }),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
