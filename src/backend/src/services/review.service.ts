import type { IReviewRepository } from '../domain/repositories';
import type { ICampgroundRepository } from '../domain/repositories';
import type { ReviewEntity } from '../domain/entities';
import { MongooseReviewRepository } from '../adapters/outbound/persistence';
import { MongooseCampgroundRepository } from '../adapters/outbound/persistence';

/**
 * Service layer for Review business logic
 */
export class ReviewService {
  constructor(
    private readonly reviewRepo: IReviewRepository,
    private readonly campgroundRepo: ICampgroundRepository
  ) {}

  async createReview(
    campgroundId: string,
    reviewData: { body: string; rating: number },
    authorId: string
  ): Promise<ReviewEntity | null> {
    const campground = await this.campgroundRepo.findById(campgroundId);
    if (!campground) return null;

    const review = await this.reviewRepo.create({
      body: reviewData.body,
      rating: reviewData.rating,
      authorId,
    });

    await this.campgroundRepo.update(campgroundId, {
      reviewIds: [...campground.reviewIds, review.id],
    });

    return review;
  }

  async deleteReview(campgroundId: string, reviewId: string): Promise<boolean> {
    const campground = await this.campgroundRepo.findById(campgroundId);
    if (campground) {
      await this.campgroundRepo.update(campgroundId, {
        reviewIds: campground.reviewIds.filter((id) => id !== reviewId),
      });
    }

    return this.reviewRepo.delete(reviewId);
  }

  async getReviewById(reviewId: string): Promise<ReviewEntity | null> {
    return this.reviewRepo.findById(reviewId);
  }

  async getReviewCount(): Promise<number> {
    return this.reviewRepo.count();
  }
}

// Backward-compatible default instance
export const reviewService = new ReviewService(
  new MongooseReviewRepository(),
  new MongooseCampgroundRepository()
);
