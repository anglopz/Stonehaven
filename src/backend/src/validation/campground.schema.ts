import { z } from 'zod';

/**
 * Zod schema for campground validation
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

export const campgroundSchema = z.object({
  campground: z.object({
    title: sanitizeString('Title'),
    price: z.coerce.number().min(0, 'Price must be at least 0'),
    location: sanitizeString('Location'),
    description: sanitizeString('Description'),
  }),
  deleteImages: z.array(z.string()).optional(),
});

export type CampgroundInput = z.infer<typeof campgroundSchema>;
