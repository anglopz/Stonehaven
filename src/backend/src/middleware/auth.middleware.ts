import { Request, Response, NextFunction } from 'express';
import { Campground } from '../models/Campground';
import { Review } from '../models/Review';
import type { ICampgroundRepository } from '../domain/repositories';
import type { IReviewRepository } from '../domain/repositories';

/**
 * Middleware to check if user is authenticated (API: 401 JSON)
 */
export const isLoggedIn = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in');
    res.status(401).json({ success: false, message: 'You must be signed in' });
    return;
  }
  next();
};

/**
 * Middleware to store return URL in res.locals
 */
export const storeReturnTo = (req: Request, res: Response, next: NextFunction): void => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};

/**
 * Factory: create isAuthor middleware using a repository interface.
 */
export function createIsAuthor(campgroundRepo: ICampgroundRepository) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const campground = await campgroundRepo.findById(id);

      if (!campground) {
        res.status(404).json({ success: false, message: 'Campground not found' });
        return;
      }

      if (!req.user || campground.authorId !== req.user._id.toString()) {
        res.status(403).json({ success: false, message: 'You do not have permission' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Factory: create isReviewAuthor middleware using a repository interface.
 */
export function createIsReviewAuthor(reviewRepo: IReviewRepository) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reviewId } = req.params;
      const review = await reviewRepo.findById(reviewId);

      if (!review) {
        res.status(404).json({ success: false, message: 'Review not found' });
        return;
      }

      if (!req.user || review.authorId !== req.user._id.toString()) {
        res.status(403).json({ success: false, message: 'You do not have permission' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Backward-compatible exports — use Mongoose models directly (removed once container is used everywhere)
export const isAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      res.status(404).json({ success: false, message: 'Campground not found' });
      return;
    }

    if (!req.user || !campground.author.equals(req.user._id)) {
      res.status(403).json({ success: false, message: 'You do not have permission' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const isReviewAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    if (!req.user || !review.author.equals(req.user._id)) {
      res.status(403).json({ success: false, message: 'You do not have permission' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
