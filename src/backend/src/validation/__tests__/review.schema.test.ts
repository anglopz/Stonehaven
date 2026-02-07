import { reviewSchema } from '../review.schema';

describe('Review Validation Schema', () => {
  describe('Valid Data', () => {
    it('should validate correct review data', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'Amazing campground! Had a great time.',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string rating to number', () => {
      const validData = {
        review: {
          rating: '4' as any,
          body: 'Great experience!',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.review.rating).toBe('number');
        expect(result.data.review.rating).toBe(4);
      }
    });

    it('should accept all valid ratings from 1 to 5', () => {
      for (let rating = 1; rating <= 5; rating++) {
        const validData = {
          review: {
            rating,
            body: `Review with rating ${rating}`,
          },
        };

        const result = reviewSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Required Fields', () => {
    it('should fail when rating is missing', () => {
      const invalidData = {
        review: {
          body: 'Great campground!',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('rating');
      }
    });

    it('should fail when body is missing', () => {
      const invalidData = {
        review: {
          rating: 5,
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('body');
      }
    });

    it('should fail when both fields are missing', () => {
      const invalidData = {
        review: {},
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Rating Validation', () => {
    it('should reject rating below 1', () => {
      const invalidData = {
        review: {
          rating: 0,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Rating must be at least 1');
      }
    });

    it('should reject rating above 5', () => {
      const invalidData = {
        review: {
          rating: 6,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Rating must be at most 5');
      }
    });

    it('should reject negative ratings', () => {
      const invalidData = {
        review: {
          rating: -3,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric ratings', () => {
      const invalidData = {
        review: {
          rating: 'five' as any,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept decimal ratings within range', () => {
      const validData = {
        review: {
          rating: 4.5,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Body Validation and Trimming', () => {
    it('should trim whitespace from body', () => {
      const validData = {
        review: {
          rating: 5,
          body: '  Great campground!  ',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.review.body).toBe('Great campground!');
      }
    });

    it('should fail when body is empty after trimming', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '   ',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should fail when body is empty string', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept long review bodies', () => {
      const longBody = 'This is a very detailed review. '.repeat(100);
      const validData = {
        review: {
          rating: 5,
          body: longBody,
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('XSS Protection', () => {
    it('should reject script tags in review body', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '<script>alert("xss")</script>Great place!',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('dangerous HTML');
      }
    });

    it('should reject iframe tags', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '<iframe src="evil.com"></iframe>Review text',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('dangerous HTML');
      }
    });

    it('should reject javascript: protocol', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '<a href="javascript:alert(1)">Click</a>',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject onerror attribute', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '<img src=x onerror=alert("xss")>',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject onload attribute', () => {
      const invalidData = {
        review: {
          rating: 5,
          body: '<body onload=alert("xss")>Review</body>',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow safe HTML-like content', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'The campground was <amazing> and I give it <3!',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in body', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'Great place! @#$%^&*() "quotes" and \'apostrophes\'',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle newlines in body', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'Line 1\nLine 2\nLine 3',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle Unicode characters', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'Excelente! 🏕️ Très bien! 很好!',
        },
      };

      const result = reviewSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject null values', () => {
      const invalidData = {
        review: {
          rating: null,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject non-object review field', () => {
      const invalidData = {
        review: 'not an object',
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle very long body with multiple errors', () => {
      const invalidData = {
        review: {
          rating: 10, // Invalid
          body: '<script>alert("xss")</script>'.repeat(100), // Dangerous HTML
        },
      };

      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Type Safety', () => {
    it('should provide correct TypeScript types', () => {
      const validData = {
        review: {
          rating: 5,
          body: 'Test review',
        },
      };

      const result = reviewSchema.safeParse(validData);
      
      if (result.success) {
        // TypeScript should infer these types correctly
        const rating: number = result.data.review.rating;
        const body: string = result.data.review.body;
        
        expect(typeof rating).toBe('number');
        expect(typeof body).toBe('string');
      }
    });
  });
});
