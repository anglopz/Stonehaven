import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper function to catch async errors in Express route handlers
 * Eliminates the need for try-catch blocks in every async route
 * 
 * @param fn - Async function to wrap
 * @returns Express RequestHandler
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
