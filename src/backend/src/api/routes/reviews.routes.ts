import { Router, Request, Response } from 'express';
import { reviewService } from '../../services';
import { isLoggedIn, isReviewAuthor, validateRequest } from '../../middleware';
import { reviewSchema } from '../../validation';
import { catchAsync } from '../../utils';

const router = Router({ mergeParams: true });

/**
 * POST /campgrounds/:id/reviews - Create a review
 */
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

/**
 * DELETE /campgrounds/:id/reviews/:reviewId - Delete a review (JSON API)
 */
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(async (req: Request, res: Response) => {
    const { id, reviewId } = req.params;
    await reviewService.deleteReview(id, reviewId);
    res.status(204).send();
  })
);

export default router;
