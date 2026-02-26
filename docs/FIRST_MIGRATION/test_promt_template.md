🧪 Phase 4: Testing - Scope & Strategy
Testing Scope for Phase 4 ✅
Based on your requirements, here's the focused local reasoning scope:

1. Unit Testing Scope (Local Reasoning)
text
✅ Models (Mongoose)
  - Campground, Review, User model methods
  - Schema validation
  - Instance methods
  - Static methods

✅ Services (Business Logic)
  - CampgroundService: CRUD, search, validation
  - ReviewService: create, delete, aggregation
  - UserService: register, login, profile

✅ Utilities
  - ExpressError class
  - catchAsync wrapper
  - Validation helpers

✅ Frontend Components
  - Pure components (no external dependencies)
  - Component rendering with props
  - Event handlers
  - Hooks (useAuth, useCampground, etc.)

✅ Frontend Stores (Zustand)
  - Auth store actions
  - Campground store actions
  - UI store actions
2. Integration Testing Scope (Bounded Context)
text
✅ API Integration Tests
  - Route handlers with services
  - Database operations
  - Authentication flow
  - Middleware chain

✅ Component Integration Tests
  - Components with Zustand stores
  - Components with React Query
  - Form submission flows
  - Protected route behavior
3. Contract Testing Scope
text
✅ API Input Contracts
  - Zod schema validation
  - Request body/param/query validation
  - Error response formats

✅ Component Prop Contracts
  - TypeScript interface compliance
  - Required/optional props
  - Prop type validation
4. Expected Behaviors
text
✅ Success Paths
  - All CRUD operations
  - Authentication flows
  - Form submissions
  - Search/filter operations

✅ Error Paths
  - Invalid inputs
  - Unauthorized access
  - Not found resources
  - Server errors

✅ Edge Cases
  - Empty states
  - Boundary values
  - Race conditions
  - Network failures
Docker Configuration Check ✅
YES, you should include Docker testing configuration as part of Phase 4. This ensures:

Docker Build Testing - Verify all Docker images build correctly

Container Health Checks - Ensure services start properly

Docker Compose Integration - Test multi-container setup

Environment Configuration - Validate environment variable injection

Docker Testing Scope:
yaml
# In tests/docker/
docker/
├── build/                    # Docker build tests
│   ├── backend.Dockerfile.test.js
│   └── frontend.Dockerfile.test.js
│
├── compose/                  # Docker Compose tests
│   ├── dev.compose.test.js
│   └── full.compose.test.js
│
├── health/                   # Container health checks
│   ├── mongodb.health.test.js
│   ├── backend.health.test.js
│   └── frontend.health.test.js
│
└── environment/              # Environment tests
    ├── env.validation.test.js
    └── secrets.test.js
Testing Stack Configuration
Backend Testing Tools:
javascript
// package.json (backend)
{
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.12",
    "mongodb-memory-server": "^8.0.0",
    "jest-mongodb": "^4.0.0"
  }
}
Frontend Testing Tools:
javascript
// package.json (frontend)
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "@testing-library/dom": "^9.0.0",
    "msw": "^1.0.0"  // Mock Service Worker
  }
}
Test Structure by Local Reasoning
Level 1: Pure Unit Tests (No Dependencies)
javascript
// tests/unit/models/Campground.test.ts
describe('Campground Model - Unit', () => {
  test('should create instance with valid data', () => {
    // Test model instantiation
    // No database connection
  });
  
  test('should validate required fields', () => {
    // Test Mongoose schema validation
  });
});
Level 2: Service Tests (Minimal Dependencies)
javascript
// tests/unit/services/CampgroundService.test.ts
describe('CampgroundService - Unit', () => {
  let service: CampgroundService;
  let mockModel: jest.Mocked<typeof Campground>;
  
  beforeEach(() => {
    mockModel = {
      find: jest.fn(),
      findById: jest.fn(),
      // ... other mocked methods
    } as any;
    
    service = new CampgroundService(mockModel);
  });
  
  test('findAll should call model.find with filters', async () => {
    // Test service method with mocked model
  });
});
Level 3: Integration Tests (Bounded Context)
javascript
// tests/integration/api/campgrounds.test.ts
describe('Campgrounds API - Integration', () => {
  let app: Express;
  let db: typeof mongoose;
  
  beforeAll(async () => {
    db = await connectToTestDB();
    app = createTestApp();
  });
  
  test('GET /api/campgrounds returns campgrounds', async () => {
    // Real database, real services, mocked external APIs
  });
});
Mock Strategy for Local Reasoning
External Services to Mock:
javascript
// __mocks__/cloudinary.ts
export const uploadImage = jest.fn(() => 
  Promise.resolve({ secure_url: 'mock-url', public_id: 'mock-id' })
);

// __mocks__/mapbox.ts
export const geocode = jest.fn(() => 
  Promise.resolve({ geometry: { coordinates: [0, 0] } })
);

// __mocks__/axios.ts for frontend
export default {
  get: jest.fn(),
  post: jest.fn(),
  // ...
};
API Contract Testing
Zod Schema Validation Tests:
javascript
// tests/contracts/validation/campground.schema.test.ts
describe('Campground Validation Schema', () => {
  test('valid campground data passes validation', () => {
    const validData = {
      title: 'Test Campground',
      price: 25,
      description: 'Test description',
      location: 'Test Location'
    };
    
    const result = campgroundSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
  
  test('missing required fields fails validation', () => {
    const invalidData = { title: 'Test' };
    const result = campgroundSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['price']);
  });
});
Docker-Specific Testing
Docker Build Tests:
javascript
// tests/docker/build/backend.Dockerfile.test.js
const { execSync } = require('child_process');

describe('Backend Docker Build', () => {
  test('should build without errors', () => {
    const output = execSync('docker build -f Dockerfile.backend . --no-cache', {
      encoding: 'utf-8'
    });
    expect(output).not.toContain('ERROR');
  });
  
  test('should have correct Node version', () => {
    const dockerfile = fs.readFileSync('Dockerfile.backend', 'utf-8');
    expect(dockerfile).toContain('FROM node:18-alpine');
  });
});
Docker Compose Tests:
javascript
// tests/docker/compose/dev.compose.test.js
describe('Development Docker Compose', () => {
  test('all services defined', () => {
    const compose = yaml.load(fs.readFileSync('docker-compose.dev.yml', 'utf-8'));
    expect(compose.services).toHaveProperty('mongodb');
    expect(compose.services.mongodb.image).toBe('mongo:latest');
  });
});
Testing Priorities for Phase 4
Priority 1: Critical Paths 
text
1. Authentication flow (register, login, logout)
2. Campground CRUD operations
3. Review creation/deletion
4. API error handling
Priority 2: Core Features 
text
1. Search and filtering
2. Image upload functionality
3. Map integration
4. User profile management
Priority 3: Edge Cases & Security 
text
1. Authorization checks
2. Input validation edge cases
3. Rate limiting
4. XSS/SQL injection prevention
Expected Deliverables for Phase 4
text
✅ Test Configuration
  - Jest setup for backend/frontend
  - Test environment files
  - Coverage configuration
  - CI integration

✅ Test Suites
  - 80+ unit tests
  - 30+ integration tests
  - 20+ contract tests
  - 10+ Docker tests

✅ Test Utilities
  - Test factories/fixtures
  - Custom matchers
  - Mock utilities
  - Test helpers

✅ Documentation
  - Testing strategy document
  - Test coverage report
  - Docker testing guide
  - Mocking guide

✅ CI/CD Integration
  - Test automation in CI
  - Coverage reporting
  - Test results visualization
  - Quality gates