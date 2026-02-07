import { Types } from 'mongoose';

export const mockCampgroundData = {
  title: 'Test Campground',
  price: 25,
  description: 'A beautiful test campground',
  location: 'Test Location, USA',
  images: [
    {
      url: 'https://res.cloudinary.com/test/image/upload/v1/test1.jpg',
      filename: 'test1',
    },
  ],
  geometry: {
    type: 'Point' as const,
    coordinates: [-122.4194, 37.7749],
  },
  author: new Types.ObjectId(),
};

export const mockCampgroundWithReviews = {
  ...mockCampgroundData,
  reviews: [new Types.ObjectId(), new Types.ObjectId()],
};

export const createMockCampground = (overrides = {}) => ({
  ...mockCampgroundData,
  ...overrides,
  _id: new Types.ObjectId(),
});

export const createMultipleMockCampgrounds = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockCampground({
      title: `Test Campground ${i + 1}`,
      price: 20 + i * 5,
    })
  );
