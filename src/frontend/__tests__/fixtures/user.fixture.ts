/**
 * Mock user data for frontend tests
 */

export const mockUser = {
  _id: '507f1f77bcf86cd799439031',
  username: 'testuser',
  email: 'test@example.com',
};

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});

export const mockAuthenticatedUser = {
  ...mockUser,
  isAuthenticated: true,
};

export const mockUnauthenticatedUser = {
  isAuthenticated: false,
};
