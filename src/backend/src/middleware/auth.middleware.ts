import { Request, Response, NextFunction } from 'express';
import { Campground } from '../models/Campground';
import { Review } from '../models/Review';

/**
 * Middleware to check if user is authenticated
 */
export const isLoggedIn = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in');
    res.redirect('/login');
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
 * Middleware to check if user is the author of a campground
 */
export const isAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    if (!campground) {
      req.flash('error', 'Cannot find that campground!');
      res.redirect('/campgrounds');
      return;
    }

    if (!req.user || !campground.author.equals(req.user._id)) {
      req.flash('error', 'You do not have permission');
      res.redirect(`/campgrounds/${id}`);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user is the author of a review
 */
export const isReviewAuthor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      req.flash('error', 'Cannot find that review!');
      res.redirect(`/campgrounds/${id}`);
      return;
    }

    if (!req.user || !review.author.equals(req.user._id)) {
      req.flash('error', 'You do not have permission');
      res.redirect(`/campgrounds/${id}`);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
