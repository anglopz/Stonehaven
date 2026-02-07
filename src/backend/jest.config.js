module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/__tests__/**',
    '!src/index.ts',
    '!src/api/routes/**', // Routes are tested via integration tests
    '!src/config/**', // Config files are runtime initialization
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../../shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
};
