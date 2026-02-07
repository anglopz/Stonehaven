import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ExpressError } from '../utils';

/**
 * Generic Zod validation middleware factory
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((err) => err.message).join(', ');
        throw new ExpressError(messages, 400);
      }
      throw new ExpressError('Validation failed', 400);
    }
  };
};
