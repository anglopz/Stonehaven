import { campgroundSchema } from '../campground.schema';

describe('Campground Validation Schema', () => {
  describe('Valid Data', () => {
    it('should validate correct campground data', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'A wonderful campground for testing',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with optional deleteImages', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
        deleteImages: ['image1', 'image2'],
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate without deleteImages field', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should coerce string price to number', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: '25' as any, // String that can be coerced
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.campground.price).toBe('number');
      }
    });
  });

  describe('Required Fields', () => {
    it('should fail when title is missing', () => {
      const invalidData = {
        campground: {
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('title');
      }
    });

    it('should fail when price is missing', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('price');
      }
    });

    it('should fail when location is missing', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('location');
      }
    });

    it('should fail when description is missing', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('description');
      }
    });
  });

  describe('Price Validation', () => {
    it('should reject negative prices', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: -10,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Price must be at least 0');
      }
    });

    it('should accept zero price', () => {
      const validData = {
        campground: {
          title: 'Free Campground',
          price: 0,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept decimal prices', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25.99,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('String Validation and Trimming', () => {
    it('should trim whitespace from title', () => {
      const validData = {
        campground: {
          title: '  Test Campground  ',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.campground.title).toBe('Test Campground');
      }
    });

    it('should fail when title is empty after trimming', () => {
      const invalidData = {
        campground: {
          title: '   ',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should fail when title is empty string', () => {
      const invalidData = {
        campground: {
          title: '',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('XSS Protection', () => {
    it('should reject script tags in title', () => {
      const invalidData = {
        campground: {
          title: '<script>alert("xss")</script>Test',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('dangerous HTML');
      }
    });

    it('should reject iframe tags in description', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: '<iframe src="evil.com"></iframe>Test',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('dangerous HTML');
      }
    });

    it('should reject javascript: protocol in location', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'javascript:alert("xss")',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject onerror attribute', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: '<img src=x onerror=alert("xss")>',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject onload attribute', () => {
      const invalidData = {
        campground: {
          title: '<body onload=alert("xss")>Test',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow safe HTML-like content', () => {
      const validData = {
        campground: {
          title: 'Camping <in> Nature',
          price: 25,
          location: 'Test Location',
          description: 'A great place with <3 from nature',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('DeleteImages Field', () => {
    it('should validate empty deleteImages array', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
        deleteImages: [],
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate array of strings', () => {
      const validData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
        deleteImages: ['img1', 'img2', 'img3'],
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-string items in deleteImages', () => {
      const invalidData = {
        campground: {
          title: 'Test Campground',
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
        deleteImages: ['img1', 123, 'img3'] as any,
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(1000);
      const validData = {
        campground: {
          title: longTitle,
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in fields', () => {
      const validData = {
        campground: {
          title: 'Test @#$% Campground!',
          price: 25,
          location: 'Test & Location',
          description: 'Description with "quotes" and \'apostrophes\'',
        },
      };

      const result = campgroundSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject non-object campground field', () => {
      const invalidData = {
        campground: 'not an object',
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should handle null values', () => {
      const invalidData = {
        campground: {
          title: null,
          price: 25,
          location: 'Test Location',
          description: 'Test description',
        },
      };

      const result = campgroundSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
