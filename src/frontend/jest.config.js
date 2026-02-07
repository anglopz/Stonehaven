const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/__tests__/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@shared/(.*)$': '<rootDir>/../../shared/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'components/ui/**/*.{js,jsx,ts,tsx}',
    'components/reviews/**/*.{js,jsx,ts,tsx}',
    'components/campgrounds/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'stores/**/*.{js,jsx,ts,tsx}',
    'lib/utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/index.ts', // Re-export files
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 55,
      statements: 55,
    },
  },
  testMatch: [
    '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
