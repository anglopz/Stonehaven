import { Types } from 'mongoose';

export const mockReviewData = {
  rating: 5,
  body: 'Amazing campground! Had a great time.',
  author: new Types.ObjectId(),
  campground: new Types.ObjectId(),
};

export const createMockReview = (overrides = {}) => ({
  ...mockReviewData,
  ...overrides,
  _id: new Types.ObjectId(),
});

export const createMultipleMockReviews = (count: number, campgroundId?: Types.ObjectId) =>
  Array.from({ length: count }, (_, i) =>
    createMockReview({
      rating: Math.min(5, 3 + i),
      body: `Review number ${i + 1}`,
      campground: campgroundId || new Types.ObjectId(),
    })
  );
