import { Router, Request, Response, NextFunction } from 'express';
import type { ReviewService } from '../../../services/review.service';
import { isLoggedIn, validateRequest } from '../../../middleware';
import { reviewSchema } from '../../../validation';
import { catchAsync } from '../../../utils';

export interface ReviewRouteDeps {
  reviewService: ReviewService;
  isReviewAuthor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export function createReviewRoutes(deps: ReviewRouteDeps): Router {
  const { reviewService, isReviewAuthor } = deps;
  const router = Router({ mergeParams: true });

  router.post(
    '/',
    isLoggedIn,
    validateRequest(reviewSchema),
    catchAsync(async (req: Request, res: Response) => {
      const review = await reviewService.createReview(
        req.params.id,
        req.body.review,
        req.user!._id.toString()
      );

      if (!review) {
        return res.status(404).json({ success: false, message: 'Campground not found' });
      }

      return res.status(201).json(review);
    })
  );

  router.delete(
    '/:reviewId',
    isLoggedIn,
    isReviewAuthor as any,
    catchAsync(async (req: Request, res: Response) => {
      const { id, reviewId } = req.params;
      await reviewService.deleteReview(id, reviewId);
      res.status(204).send();
    })
  );

  return router;
}
