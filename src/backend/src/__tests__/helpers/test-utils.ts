import { Request, Response } from 'express';
import { Types } from 'mongoose';

/**
 * Create a mock Express Request object
 */
export const createMockRequest = (overrides = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  session: {} as any,
  flash: jest.fn(),
  ...overrides,
});

/**
 * Create a mock Express Response object
 */
export const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Create a mock Next function
 */
export const createMockNext = () => jest.fn();

/**
 * Check if a value is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Wait for a specified time (for async operations)
 */
export const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock Cloudinary upload response
 */
export const mockCloudinaryUpload = {
  secure_url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
  public_id: 'test_public_id',
};

/**
 * Mock Mapbox geocoding response
 */
export const mockMapboxGeocoding = {
  geometry: {
    type: 'Point' as const,
    coordinates: [-122.4194, 37.7749],
  },
};
