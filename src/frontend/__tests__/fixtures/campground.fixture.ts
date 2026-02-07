/**
 * Mock campground data for frontend tests
 */

export const mockCampground = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test Campground',
  price: 25,
  description: 'A beautiful test campground for testing',
  location: 'Test Location, USA',
  images: [
    {
      url: 'https://res.cloudinary.com/test/image/upload/v1/test1.jpg',
      filename: 'test1',
      thumbnail: 'https://res.cloudinary.com/test/image/upload/w_200,h_200,c_fill,q_auto:low/v1/test1.jpg',
    },
  ],
  geometry: {
    type: 'Point' as const,
    coordinates: [-122.4194, 37.7749],
  },
  author: {
    _id: '507f1f77bcf86cd799439012',
    username: 'testuser',
    email: 'test@example.com',
  },
  reviews: [],
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

export const mockCampgroundWithReviews = {
  ...mockCampground,
  reviews: [
    {
      _id: '507f1f77bcf86cd799439013',
      body: 'Amazing campground!',
      rating: 5,
      author: {
        _id: '507f1f77bcf86cd799439012',
        username: 'testuser',
      },
      createdAt: new Date('2024-01-02').toISOString(),
    },
  ],
};

export const createMockCampground = (overrides = {}) => ({
  ...mockCampground,
  ...overrides,
});

export const createMultipleMockCampgrounds = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockCampground({
      _id: `507f1f77bcf86cd79943901${i}`,
      title: `Test Campground ${i + 1}`,
      price: 20 + i * 5,
    })
  );
