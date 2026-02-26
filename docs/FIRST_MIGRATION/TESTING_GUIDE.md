# Testing Guide - Recamp Project

## Overview

This document provides comprehensive guidance for testing the Recamp application, covering backend unit tests, integration tests, frontend component tests, and end-to-end tests.

## Table of Contents

1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [Integration Testing](#integration-testing)
4. [E2E Testing](#e2e-testing)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Best Practices](#best-practices)

---

## Backend Testing

### Test Structure

```
src/backend/src/
├── __tests__/
│   ├── setup.ts              # Global test setup with MongoDB Memory Server
│   ├── fixtures/             # Test data fixtures
│   │   ├── campground.fixture.ts
│   │   ├── review.fixture.ts
│   │   └── user.fixture.ts
│   ├── helpers/              # Test utility functions
│   │   └── test-utils.ts
│   └── __mocks__/            # Mock implementations
│       ├── cloudinary.ts
│       └── @mapbox/
├── models/__tests__/
│   ├── Campground.test.ts
│   ├── Review.test.ts
│   └── User.test.ts
├── services/__tests__/
│   ├── campground.service.test.ts
│   ├── review.service.test.ts
│   └── user.service.test.ts
├── utils/__tests__/
│   ├── ExpressError.test.ts
│   └── catchAsync.test.ts
├── middleware/__tests__/
│   ├── auth.middleware.test.ts
│   └── validation.middleware.test.ts
└── validation/__tests__/
    ├── campground.schema.test.ts
    └── review.schema.test.ts
```

### Technologies Used

- **Jest**: Testing framework
- **ts-jest**: TypeScript support for Jest
- **MongoDB Memory Server**: In-memory MongoDB for isolated tests
- **Supertest**: HTTP assertions for API testing

### Test Categories

#### 1. Model Tests
Tests for Mongoose models including:
- Schema validation
- Virtual properties
- Instance methods
- Static methods
- Middleware hooks (cascading deletes, etc.)
- Relationships and population

**Example:**
```typescript
describe('Campground Model', () => {
  it('should create a valid campground', async () => {
    const campground = await Campground.create(mockData);
    expect(campground.title).toBe(mockData.title);
  });
});
```

#### 2. Service Tests
Tests for business logic layer:
- CRUD operations
- Data transformation
- Error handling
- Edge cases

**Example:**
```typescript
describe('CampgroundService', () => {
  it('should get all campgrounds', async () => {
    const campgrounds = await service.getAllCampgrounds();
    expect(Array.isArray(campgrounds)).toBe(true);
  });
});
```

#### 3. Utility Tests
Tests for helper functions:
- Error classes
- Async wrappers
- Utility functions

#### 4. Middleware Tests
Tests for Express middleware:
- Authentication checks
- Authorization validation
- Request validation
- Error handling

#### 5. Contract Tests (Zod Schemas)
Tests for request validation schemas:
- Required field validation
- Type validation
- Range validation
- XSS protection
- Edge cases

### Running Backend Tests

```bash
# Run all backend tests
cd src/backend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Campground.test

# Run tests matching pattern
npm test -- --testPathPattern=services
```

### Test Setup

The `setup.ts` file configures:
- MongoDB Memory Server initialization
- Database cleanup between tests
- Mock implementations for external services
- Console log suppression during tests

---

## Frontend Testing

### Test Structure

```
src/frontend/
├── __tests__/
│   ├── setup.ts
│   ├── fixtures/
│   └── helpers/
├── components/__tests__/
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   ├── Card.test.tsx
│   │   └── Input.test.tsx
│   ├── campgrounds/
│   │   ├── CampgroundCard.test.tsx
│   │   └── CampgroundForm.test.tsx
│   └── reviews/
│       ├── ReviewCard.test.tsx
│       └── StarRating.test.tsx
├── hooks/__tests__/
│   ├── useAuth.test.ts
│   ├── useCampground.test.ts
│   └── useReview.test.ts
└── stores/__tests__/
    ├── authStore.test.ts
    └── uiStore.test.ts
```

### Technologies Used

- **Jest**: Testing framework
- **React Testing Library**: React component testing
- **@testing-library/jest-dom**: DOM matchers
- **@testing-library/user-event**: User interaction simulation

### Test Categories

#### 1. Component Tests
- Rendering with different props
- User interactions
- Conditional rendering
- Event handlers
- Accessibility

#### 2. Hook Tests
- State management
- Side effects
- API calls (mocked)
- Error handling

#### 3. Store Tests (Zustand)
- State updates
- Actions
- Computed values
- Persistence

### Running Frontend Tests

```bash
# Run all frontend tests
cd src/frontend
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## Integration Testing

### API Integration Tests

Test complete request/response cycles including:
- Route handlers
- Middleware chain
- Database operations
- Authentication flow

**Example Structure:**
```typescript
describe('Campgrounds API', () => {
  it('GET /api/campgrounds should return all campgrounds', async () => {
    const response = await request(app)
      .get('/api/campgrounds')
      .expect(200);
    
    expect(response.body).toHaveProperty('campgrounds');
  });
});
```

---

## E2E Testing

### Playwright Setup

End-to-end tests cover critical user flows:
- User registration and login
- Creating campgrounds
- Uploading images
- Submitting reviews
- Authorization checks

### Running E2E Tests

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# Run in UI mode
npx playwright test --ui

# Run specific test
npx playwright test auth.spec.ts
```

---

## Test Coverage

### Coverage Goals

- **Overall**: 80%+
- **Backend Services**: 90%+
- **Models**: 85%+
- **Utilities**: 95%+
- **Middleware**: 85%+
- **Frontend Components**: 75%+

### Generating Coverage Reports

```bash
# Backend coverage
cd src/backend
npm run test:coverage

# Frontend coverage
cd src/frontend
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

**Backend (jest.config.js):**
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

---

## Best Practices

### 1. Test Naming

Use descriptive test names that explain behavior:

```typescript
✅ Good
it('should redirect to login when user is not authenticated', () => {...});

❌ Bad
it('test auth', () => {...});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should create a campground', async () => {
  // Arrange
  const campgroundData = { ... };
  
  // Act
  const result = await service.createCampground(campgroundData);
  
  // Assert
  expect(result).toBeDefined();
  expect(result.title).toBe(campgroundData.title);
});
```

### 3. Test Isolation

- Each test should be independent
- Clean up after tests
- Don't rely on test execution order

### 4. Use Fixtures

```typescript
import { mockCampgroundData } from '../../__tests__/fixtures/campground.fixture';

it('should validate campground data', () => {
  const campground = new Campground(mockCampgroundData);
  expect(campground).toBeDefined();
});
```

### 5. Mock External Dependencies

```typescript
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn().mockResolvedValue({ secure_url: 'test.jpg' }),
    },
  },
}));
```

### 6. Test Edge Cases

- Empty states
- Boundary values
- Error conditions
- Invalid inputs
- Null/undefined values

### 7. Avoid Testing Implementation Details

Test behavior, not implementation:

```typescript
✅ Good
expect(button).toHaveTextContent('Submit');
expect(onSubmit).toHaveBeenCalled();

❌ Bad
expect(component.state.isLoading).toBe(false);
```

---

## Continuous Integration

Tests run automatically on:
- Every push to GitHub
- Pull request creation
- Merge to main branch

### CI Configuration (.github/workflows/ci.yml)

```yaml
- name: Run Backend Tests
  run: cd src/backend && npm test

- name: Run Frontend Tests
  run: cd src/frontend && npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### Running Specific Tests

```bash
# Run single test file
npm test -- Campground.test

# Run tests matching description
npm test -- -t "should create a campground"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

1. **MongoDB Memory Server Download**
   - First run may take time to download
   - Check internet connection
   - Clear cache: `rm -rf ~/.cache/mongodb-memory-server`

2. **Timeout Errors**
   - Increase timeout: `jest.setTimeout(30000)`
   - Check for unresolved promises
   - Ensure proper cleanup

3. **Module Resolution**
   - Verify tsconfig paths
   - Check jest.config.js moduleNameMapper
   - Clear jest cache: `npx jest --clearCache`

---

## Writing New Tests

### Checklist

- [ ] Test file created in `__tests__` directory
- [ ] Test follows naming convention (`*.test.ts` or `*.spec.ts`)
- [ ] Imports required from fixtures/helpers
- [ ] Test setup with `beforeEach`/`afterEach` if needed
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases covered
- [ ] Proper assertions used
- [ ] No hardcoded values (use fixtures)
- [ ] Tests are independent and isolated

### Template

```typescript
import { /* imports */ } from '...';

describe('Feature/Component Name', () => {
  let testData: any;

  beforeEach(() => {
    // Setup
    testData = createMockData();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Main Functionality', () => {
    it('should handle the primary use case', () => {
      // Test implementation
    });

    it('should handle error case', () => {
      // Error test
    });
  });

  describe('Edge Cases', () => {
    it('should handle edge case', () => {
      // Edge case test
    });
  });
});
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated**: February 7, 2026  
**Test Coverage**: In Progress - Target 80%+  
**Status**: Phase 4 - Testing Implementation Active
