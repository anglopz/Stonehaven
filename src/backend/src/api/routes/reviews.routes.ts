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
      req.user!._id
    );

    if (!review) {
      req.flash('error', 'Cannot find that campground!');
      return res.redirect('/campgrounds');
    }

    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${req.params.id}`);
  })
);

/**
 * DELETE /campgrounds/:id/reviews/:reviewId - Delete a review
 */
router.delete(
  '/:reviewId',
  isLoggedIn,
  isReviewAuthor,
  catchAsync(async (req: Request, res: Response) => {
    const { id, reviewId } = req.params;
    await reviewService.deleteReview(id, reviewId);

    req.flash('success', 'Successfully deleted review');
    res.redirect(`/campgrounds/${id}`);
  })
);

export default router;
