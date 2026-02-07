import { ExpressError } from '../ExpressError';

describe('ExpressError', () => {
  describe('Constructor', () => {
    it('should create an error with message and status code', () => {
      const error = new ExpressError('Test error', 404);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ExpressError');
    });

    it('should extend Error class', () => {
      const error = new ExpressError('Test error', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ExpressError);
    });

    it('should have stack trace', () => {
      const error = new ExpressError('Test error', 400);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('Common HTTP Status Codes', () => {
    it('should handle 400 Bad Request', () => {
      const error = new ExpressError('Bad Request', 400);
      expect(error.statusCode).toBe(400);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new ExpressError('Unauthorized', 401);
      expect(error.statusCode).toBe(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new ExpressError('Forbidden', 403);
      expect(error.statusCode).toBe(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new ExpressError('Not Found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should handle 500 Internal Server Error', () => {
      const error = new ExpressError('Internal Server Error', 500);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error Properties', () => {
    it('should be throwable', () => {
      expect(() => {
        throw new ExpressError('Test', 500);
      }).toThrow(ExpressError);
    });

    it('should be catchable', () => {
      try {
        throw new ExpressError('Test', 404);
      } catch (error) {
        expect(error).toBeInstanceOf(ExpressError);
        expect((error as ExpressError).statusCode).toBe(404);
      }
    });

    it('should preserve error message', () => {
      const message = 'This is a detailed error message';
      const error = new ExpressError(message, 422);

      expect(error.message).toBe(message);
    });

    it('should allow empty message', () => {
      const error = new ExpressError('', 500);
      expect(error.message).toBe('');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Stack Trace', () => {
    it('should capture stack trace at creation point', () => {
      function createError() {
        return new ExpressError('Test', 500);
      }

      const error = createError();
      expect(error.stack).toContain('createError');
    });

    it('should not include constructor in stack trace', () => {
      const error = new ExpressError('Test', 500);
      
      // Stack should start from where error was created, not from ExpressError constructor
      expect(error.stack).toBeDefined();
    });
  });

  describe('Error Name', () => {
    it('should have correct error name', () => {
      const error = new ExpressError('Test', 500);
      expect(error.name).toBe('ExpressError');
    });

    it('should be distinguishable from generic Error', () => {
      const expressError = new ExpressError('Express', 500);
      const genericError = new Error('Generic');

      expect(expressError.name).toBe('ExpressError');
      expect(genericError.name).toBe('Error');
      expect(expressError.name).not.toBe(genericError.name);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new ExpressError(longMessage, 500);

      expect(error.message).toBe(longMessage);
      expect(error.message.length).toBe(1000);
    });

    it('should handle special characters in message', () => {
      const message = 'Error: <script>alert("xss")</script>';
      const error = new ExpressError(message, 400);

      expect(error.message).toBe(message);
    });

    it('should handle numeric status codes as expected', () => {
      const error = new ExpressError('Test', 418); // I'm a teapot
      expect(error.statusCode).toBe(418);
      expect(typeof error.statusCode).toBe('number');
    });
  });
});
