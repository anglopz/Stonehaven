import { Types } from 'mongoose';

export const mockUserData = {
  username: 'testuser',
  email: 'test@example.com',
};

export const mockUserWithPassword = {
  ...mockUserData,
  password: 'password123',
};

export const createMockUser = (overrides = {}) => ({
  ...mockUserData,
  ...overrides,
  _id: new Types.ObjectId(),
});

export const createMultipleMockUsers = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createMockUser({
      username: `testuser${i + 1}`,
      email: `test${i + 1}@example.com`,
    })
  );
