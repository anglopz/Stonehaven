import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../validation.middleware';
import { createMockRequest, createMockResponse, createMockNext } from '../../__tests__/helpers/test-utils';
import { ExpressError } from '../../utils';

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('validateRequest', () => {
    it('should call next() when validation passes', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockReq.body = { name: 'John', age: 30 };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw ExpressError when validation fails', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      mockReq.body = { name: 'John' }; // Missing age

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should include error messages in thrown error', () => {
      const schema = z.object({
        name: z.string().min(3, 'Name must be at least 3 characters'),
        age: z.number().min(0, 'Age must be positive'),
      });

      mockReq.body = { name: 'Jo', age: -5 };

      const middleware = validateRequest(schema);

      try {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      } catch (error) {
        expect(error).toBeInstanceOf(ExpressError);
        expect((error as ExpressError).message).toContain('Name must be at least 3 characters');
      }
    });

    it('should set status code to 400 for validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = { email: 'invalid-email' };

      const middleware = validateRequest(schema);

      try {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      } catch (error) {
        expect((error as ExpressError).statusCode).toBe(400);
      }
    });

    it('should validate required fields', () => {
      const schema = z.object({
        title: z.string(),
        price: z.number(),
        description: z.string(),
      });

      mockReq.body = { title: 'Test' }; // Missing price and description

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should validate optional fields when present', () => {
      const schema = z.object({
        title: z.string(),
        description: z.string().optional(),
      });

      mockReq.body = { title: 'Test', description: 'Optional desc' };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow optional fields to be omitted', () => {
      const schema = z.object({
        title: z.string(),
        description: z.string().optional(),
      });

      mockReq.body = { title: 'Test' };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string().email(),
        }),
      });

      mockReq.body = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate arrays', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      mockReq.body = { tags: ['tag1', 'tag2', 'tag3'] };

      const middleware = validateRequest(schema);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid array items', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      mockReq.body = { tags: ['tag1', 123, 'tag3'] }; // Number in string array

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should validate string patterns', () => {
      const schema = z.object({
        username: z.string().regex(/^[a-zA-Z0-9]+$/),
      });

      mockReq.body = { username: 'user_123' }; // Contains underscore

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should validate number ranges', () => {
      const schema = z.object({
        age: z.number().min(0).max(150),
      });

      mockReq.body = { age: 200 };

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should validate string length', () => {
      const schema = z.object({
        password: z.string().min(8).max(100),
      });

      mockReq.body = { password: '123' }; // Too short

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should validate email format', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockReq.body = { email: 'not-an-email' };

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should handle empty request body', () => {
      const schema = z.object({
        name: z.string(),
      });

      mockReq.body = {};

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should combine multiple error messages', () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().positive(),
        email: z.string().email(),
      });

      mockReq.body = { name: 'Jo', age: -1, email: 'invalid' };

      const middleware = validateRequest(schema);

      try {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      } catch (error) {
        expect((error as ExpressError).message).toContain(',');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values', () => {
      const schema = z.object({
        value: z.string(),
      });

      mockReq.body = { value: null };

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should handle undefined values', () => {
      const schema = z.object({
        value: z.string(),
      });

      mockReq.body = { value: undefined };

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow(ExpressError);
    });

    it('should handle non-Zod errors gracefully', () => {
      // Create a schema that throws a non-Zod error
      const schema = {
        parse: () => {
          throw new Error('Non-Zod error');
        },
      } as any;

      mockReq.body = { test: 'value' };

      const middleware = validateRequest(schema);

      expect(() => {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }).toThrow('Validation failed');
    });
  });
});
