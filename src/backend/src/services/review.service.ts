import { Review } from '../models/Review';
import { Campground } from '../models/Campground';
import { IReview } from '../types';
import { Types } from 'mongoose';

/**
 * Service layer for Review business logic
 */
export class ReviewService {
  /**
   * Create a new review for a campground
   */
  async createReview(
    campgroundId: string,
    reviewData: { body: string; rating: number },
    authorId: Types.ObjectId
  ): Promise<IReview | null> {
    const campground = await Campground.findById(campgroundId);

    if (!campground) {
      return null;
    }

    const review = new Review(reviewData);
    review.author = authorId;

    campground.reviews.push(review._id);

    await review.save();
    await campground.save();

    return review;
  }

  /**
   * Delete a review
   */
  async deleteReview(campgroundId: string, reviewId: string): Promise<boolean> {
    // Remove review reference from campground
    await Campground.findByIdAndUpdate(campgroundId, {
      $pull: { reviews: reviewId },
    });

    // Delete the review
    const result = await Review.findByIdAndDelete(reviewId);

    return result !== null;
  }

  /**
   * Get a review by ID
   */
  async getReviewById(reviewId: string): Promise<IReview | null> {
    return await Review.findById(reviewId).populate('author');
  }

  /**
   * Get count of all reviews
   */
  async getReviewCount(): Promise<number> {
    return await Review.countDocuments();
  }
}

export const reviewService = new ReviewService();
