import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../catchAsync';
import { createMockRequest, createMockResponse, createMockNext } from '../../__tests__/helpers/test-utils';

describe('catchAsync', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('Successful Async Operations', () => {
    it('should execute async function successfully', async () => {
      const asyncFn = jest.fn(async (_req, res) => {
        res.status(200).json({ message: 'success' });
      });

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      // Wait for async operation
      await new Promise((resolve) => setImmediate(resolve));

      expect(asyncFn).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request, response, and next to wrapped function', async () => {
      const asyncFn = jest.fn(async (req, res, next) => {
        expect(req).toBe(mockReq);
        expect(res).toBe(mockRes);
        expect(next).toBe(mockNext);
      });

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));
    });

    it('should allow returning values from async function', async () => {
      const asyncFn = async (_req: Request, res: Response) => {
        return res.json({ data: 'test' });
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockRes.json).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('Error Handling', () => {
    it('should catch async errors and pass to next', async () => {
      const testError = new Error('Test error');
      const asyncFn = jest.fn(async () => {
        throw testError;
      });

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should catch errors thrown immediately in async function', async () => {
      const testError = new Error('Immediate error');
      const asyncFn = async () => {
        throw testError;
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should catch errors from rejected promises', async () => {
      const testError = new Error('Promise rejection');
      const asyncFn = async () => {
        return Promise.reject(testError);
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    it('should catch errors from database operations', async () => {
      const dbError = new Error('Database connection failed');
      const asyncFn = async () => {
        // Simulate database operation
        await Promise.reject(dbError);
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple async operations in sequence', async () => {
      const operations: string[] = [];

      const asyncFn = async () => {
        operations.push('first');
        await Promise.resolve();
        operations.push('second');
        await Promise.resolve();
        operations.push('third');
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(operations).toEqual(['first', 'second', 'third']);
    });

    it('should stop execution on first error', async () => {
      const operations: string[] = [];
      const testError = new Error('Middle error');

      const asyncFn = async () => {
        operations.push('first');
        await Promise.resolve();
        throw testError;
        operations.push('should not reach');
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(operations).toEqual(['first']);
      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });

  describe('Integration with Express', () => {
    it('should work as Express middleware', () => {
      const asyncFn = async (_req: Request, res: Response) => {
        res.status(200).json({ success: true });
      };

      const middleware = catchAsync(asyncFn);

      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should maintain correct context', async () => {
      const asyncFn = jest.fn(async function (this: any) {
        return this;
      });

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(asyncFn).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle functions that return undefined', async () => {
      const asyncFn = async () => {
        // Does nothing, returns undefined
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty async functions', async () => {
      const asyncFn = async () => {};

      const wrappedFn = catchAsync(asyncFn);
      
      expect(() => {
        wrappedFn(mockReq as Request, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle non-error objects thrown', async () => {
      const thrownValue = { custom: 'error' };
      const asyncFn = async () => {
        throw thrownValue;
      };

      const wrappedFn = catchAsync(asyncFn);
      wrappedFn(mockReq as Request, mockRes as Response, mockNext);

      await new Promise((resolve) => setImmediate(resolve));

      expect(mockNext).toHaveBeenCalledWith(thrownValue);
    });
  });
});
