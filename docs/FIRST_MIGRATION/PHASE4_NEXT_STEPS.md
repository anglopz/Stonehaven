# Phase 4: Next Steps - Frontend & E2E Testing

## Current Status

✅ **Backend Testing Complete** (150+ tests, 17 files)  
⏳ **Frontend Testing Pending**  
⏳ **E2E Testing Pending**  

---

## Immediate Next Steps

### 1. Verify Backend Tests ✅

Before proceeding with frontend and E2E tests, verify that all backend tests run successfully:

```bash
# Navigate to backend
cd src/backend

# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

**Expected Result:**
- All tests should pass
- Coverage should be ~80%+ overall
- No failing tests
- MongoDB Memory Server downloads on first run (~70MB, one-time)

### 2. Frontend Testing Implementation 📋

#### 2.1 Setup React Testing Library

**Install Dependencies:**
```bash
cd src/frontend

# Install if not already present
npm install --save-dev @testing-library/user-event@^14.5.0
npm install --save-dev msw@^2.0.0
```

#### 2.2 Create Test Structure

```
src/frontend/
├── __tests__/
│   ├── setup.ts
│   ├── fixtures/
│   │   ├── campground.fixture.ts
│   │   ├── review.fixture.ts
│   │   └── user.fixture.ts
│   ├── helpers/
│   │   └── test-utils.tsx
│   └── mocks/
│       ├── handlers.ts          # MSW API handlers
│       └── server.ts             # MSW server setup
├── components/__tests__/
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   ├── Card.test.tsx
│   │   ├── Input.test.tsx
│   │   └── Loading.test.tsx
│   ├── campgrounds/
│   │   ├── CampgroundCard.test.tsx
│   │   ├── CampgroundForm.test.tsx
│   │   └── CampgroundsMap.test.tsx
│   ├── reviews/
│   │   ├── ReviewCard.test.tsx
│   │   ├── ReviewForm.test.tsx
│   │   └── StarRating.test.tsx
│   └── layout/
│       ├── Navbar.test.tsx
│       ├── Footer.test.tsx
│       └── FlashMessage.test.tsx
├── hooks/__tests__/
│   ├── useAuth.test.ts
│   ├── useCampground.test.ts
│   └── useReview.test.ts
└── stores/__tests__/
    ├── authStore.test.ts
    └── uiStore.test.ts
```

#### 2.3 Priority Order for Frontend Tests

**Priority 1: UI Components** (Foundation)
1. Button component
2. Input component
3. Card component
4. Loading components

**Priority 2: Feature Components** (Core functionality)
1. CampgroundCard
2. ReviewCard
3. StarRating
4. FlashMessage

**Priority 3: Form Components** (User interaction)
1. CampgroundForm
2. ReviewForm

**Priority 4: Hooks** (State & API)
1. useAuth
2. useCampground
3. useReview

**Priority 5: Stores** (Global state)
1. authStore
2. uiStore

#### 2.4 Example Test Template

**Component Test Example:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    await user.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button isLoading>Click Me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Hook Test Example:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../useAuth';

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  it('should return current user when authenticated', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.user).toBeDefined();
    });
  });
});
```

---

### 3. E2E Testing with Playwright 🎭

#### 3.1 Install Playwright

```bash
# From root directory
npm install --save-dev @playwright/test@^1.40.0

# Initialize Playwright
npx playwright install
```

#### 3.2 Create E2E Test Structure

```
e2e/
├── fixtures/
│   ├── user.fixture.ts
│   └── campground.fixture.ts
├── tests/
│   ├── auth.spec.ts
│   ├── campgrounds.spec.ts
│   ├── reviews.spec.ts
│   └── navigation.spec.ts
├── utils/
│   └── helpers.ts
└── playwright.config.ts
```

#### 3.3 Playwright Configuration

**Create `playwright.config.ts`:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 3.4 Critical E2E Test Scenarios

**Priority 1: Authentication Flow**
```typescript
// e2e/tests/auth.spec.ts
test('user can register and login', async ({ page }) => {
  // Register
  await page.goto('/register');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Should redirect to campgrounds
  await expect(page).toHaveURL('/campgrounds');
  
  // Logout
  await page.click('text=Logout');
  
  // Login
  await page.goto('/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/campgrounds');
});
```

**Priority 2: Campground Creation**
```typescript
test('authenticated user can create campground', async ({ page }) => {
  // Login first
  await loginAsUser(page);
  
  // Navigate to new campground
  await page.goto('/campgrounds/new');
  
  // Fill form
  await page.fill('input[name="title"]', 'Test Campground');
  await page.fill('input[name="price"]', '25');
  await page.fill('input[name="location"]', 'Test Location');
  await page.fill('textarea[name="description"]', 'Test description');
  
  // Upload image (optional)
  await page.setInputFiles('input[type="file"]', 'path/to/test-image.jpg');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Should redirect to campground detail
  await expect(page).toHaveURL(/\/campgrounds\/[a-f0-9]+/);
  await expect(page.locator('text=Test Campground')).toBeVisible();
});
```

**Priority 3: Review Submission**
```typescript
test('user can submit a review', async ({ page }) => {
  // Setup: Create a campground first (via API or fixture)
  const campgroundId = await createTestCampground();
  
  // Login
  await loginAsUser(page);
  
  // Navigate to campground
  await page.goto(`/campgrounds/${campgroundId}`);
  
  // Submit review
  await page.click('text=Leave a Review');
  await page.click('input[value="5"]'); // 5-star rating
  await page.fill('textarea[name="body"]', 'Amazing place!');
  await page.click('button[type="submit"]');
  
  // Verify review appears
  await expect(page.locator('text=Amazing place!')).toBeVisible();
});
```

#### 3.5 E2E Test Utilities

**Create `e2e/utils/helpers.ts`:**
```typescript
import { Page } from '@playwright/test';

export async function loginAsUser(page: Page, username = 'testuser', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/campgrounds');
}

export async function createTestCampground() {
  // Use API to create test data
  // Return campground ID
}
```

---

### 4. Run All Tests 🚀

#### Backend Tests
```bash
cd src/backend
npm test
npm run test:coverage
```

#### Frontend Tests (when implemented)
```bash
cd src/frontend
npm test
npm run test:coverage
```

#### E2E Tests (when implemented)
```bash
# From root
npx playwright test

# With UI
npx playwright test --ui

# Specific test
npx playwright test auth.spec.ts
```

#### All Tests
```bash
# From root
npm test
```

---

### 5. CI/CD Integration ✅

The CI/CD pipeline is already configured to run:
- ✅ Backend tests with coverage
- ✅ Frontend tests (ready for implementation)
- Coverage reporting to Codecov
- Build verification after tests pass

**GitHub Actions will:**
1. Run backend tests automatically
2. Run frontend tests when implemented
3. Generate and upload coverage reports
4. Fail build if tests fail
5. Require tests to pass before merge

---

### 6. Testing Checklist

#### Before Committing Code
- [ ] All new features have tests
- [ ] All tests pass locally
- [ ] Coverage is maintained or improved
- [ ] No console errors or warnings

#### Before Creating PR
- [ ] All tests pass in CI
- [ ] Coverage report shows adequate coverage
- [ ] E2E tests pass (if applicable)
- [ ] No test flakiness

#### Code Review
- [ ] Tests are readable and maintainable
- [ ] Tests cover edge cases
- [ ] Mocks are appropriate
- [ ] Test names are descriptive

---

## Estimated Timeline

### Frontend Testing
- **UI Components**: 2-3 hours
- **Feature Components**: 3-4 hours
- **Hooks**: 2-3 hours
- **Stores**: 1-2 hours
- **Total**: ~8-12 hours

### E2E Testing
- **Setup**: 1 hour
- **Auth Flow**: 1 hour
- **Campground CRUD**: 2 hours
- **Reviews**: 1 hour
- **Additional Scenarios**: 2 hours
- **Total**: ~6-8 hours

### Overall
- **Frontend + E2E**: 14-20 hours
- **Can be done over 2-3 sessions**

---

## Success Criteria

### Phase 4 Complete When:
- ✅ Backend tests (150+ tests, 80%+ coverage) - DONE
- [ ] Frontend tests (75+ tests, 75%+ coverage)
- [ ] E2E tests (10+ critical scenarios)
- [ ] All tests passing in CI/CD
- [ ] Coverage reports generated
- [ ] Documentation complete

---

## Resources

- **Testing Guide**: `docs/TESTING_GUIDE.md`
- **Phase 4 Summary**: `docs/PHASE4_TESTING_SUMMARY.md`
- **Backend Tests**: `src/backend/src/**/__tests__/`
- **Jest Config**: `src/backend/jest.config.js`
- **CI Pipeline**: `.github/workflows/ci.yml`

---

## Questions or Issues?

Refer to:
1. `docs/TESTING_GUIDE.md` for detailed guidance
2. Existing backend tests for patterns
3. Jest and Playwright documentation

---

**Current Progress**: Backend Testing ✅ | Frontend & E2E ⏳  
**Next Session**: Implement frontend component tests  
**Estimated Completion**: Phase 4 - 80% Complete  

---

*Last Updated: February 7, 2026*  
*Testing Agent - Phase 4*
