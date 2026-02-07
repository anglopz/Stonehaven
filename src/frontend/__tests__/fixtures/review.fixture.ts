/**
 * Mock review data for frontend tests
 */

export const mockReview = {
  _id: '507f1f77bcf86cd799439021',
  body: 'Amazing campground! Had a great time.',
  rating: 5,
  author: {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com',
  },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

export const createMockReview = (overrides = {}) => ({
  ...mockReview,
  ...overrides,
});

export const createMultipleMockReviews = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockReview({
      _id: `507f1f77bcf86cd79943902${i}`,
      body: `Review number ${i + 1}`,
      rating: Math.min(5, 3 + (i % 3)),
    })
  );
