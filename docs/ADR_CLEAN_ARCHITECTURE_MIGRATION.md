# ADR: Clean Architecture + DDD Migration

**Status:** Implemented
**Date:** 2026-02-26
**Deciders:** Project maintainer
**Supersedes:** Layered architecture (routes → services → models)

---

## 1. Context and Motivation

Stonehaven's backend was recently migrated from JavaScript + EJS to TypeScript + Express 5. The resulting codebase followed a conventional **layered architecture**: route handlers imported services directly, services imported Mongoose models directly, and middleware queried the database through Mongoose's static methods. Every layer was tightly coupled to its neighbor, and every neighbor was tightly coupled to MongoDB.

This coupling created three concrete problems:

1. **Untestable business logic.** Services could not be unit-tested without a live MongoDB connection because they instantiated Mongoose queries internally. The only tests that existed were integration tests that spun up an in-memory database.

2. **No adapter boundary.** The planned migration to AWS Lambda (documented in `STRATEGY.md`) requires swapping Mongoose for DynamoDB, Passport sessions for JWT, and Cloudinary for S3. Without interface boundaries, each swap would require rewriting services, middleware, and route handlers simultaneously — a high-risk, all-or-nothing change.

3. **Documentation drift.** Strategic documents (`STRATEGY.md`, `AWS_ARCHITECTURE.md`, `DOCKER.md`) referenced a file called `HEXAGONAL_MIGRATION.md` that had been renamed to `ARCHITECTURE_MIGRATION.md`. The architecture migration guide itself described the migration as "optional," contradicting `STRATEGY.md` which treats it as Phase 0 — a prerequisite for all AWS work.

The decision was to migrate to **Clean Architecture with DDD tactical patterns on a Hexagonal (Ports & Adapters) foundation**, using the Strangler Fig pattern so that every intermediate state compiles, passes tests, and can be shipped.

---

## 2. Decision

Introduce four architectural layers with strict dependency rules:

```
┌─────────────────────────────────────────────────┐
│  Domain Layer (innermost)                       │
│  Pure TS interfaces — no framework imports      │
│  Entities: CampgroundEntity, ReviewEntity, ...  │
│  Repository interfaces: ICampgroundRepository   │
├─────────────────────────────────────────────────┤
│  Application Layer                              │
│  Outbound port interfaces                       │
│  IGeocoder, IImageStorage                       │
├─────────────────────────────────────────────────┤
│  Adapters Layer (outermost)                     │
│  Inbound:  HTTP route factory functions         │
│  Outbound: MongooseCampgroundRepository,        │
│            MapboxGeocoderAdapter,               │
│            CloudinaryImageAdapter               │
├─────────────────────────────────────────────────┤
│  Composition Root                               │
│  container.ts — wires adapters → services →     │
│  routes; the only file that knows all concrete  │
│  implementations                                │
└─────────────────────────────────────────────────┘
```

**Dependency rule:** Source code dependencies point inward only. Domain knows nothing about Mongoose, Express, Cloudinary, or Mapbox. Services depend on domain interfaces, never on concrete adapters. Only `container.ts` imports concrete classes.

---

## 3. What Changed — Step by Step

### Step 0: Fix Documentation Coherence

**Problem:** Five cross-reference links across four documentation files pointed to `HEXAGONAL_MIGRATION.md`, a filename that no longer existed. The architecture migration guide described the migration as optional ("Phase 3 — optional"), contradicting `STRATEGY.md` which requires it as Phase 0 before any AWS work.

**Changes:**

| File | Change |
|------|--------|
| `docs/STRATEGY.md` (line 6) | `HEXAGONAL_MIGRATION.md` → `ARCHITECTURE_MIGRATION.md` |
| `docs/STRATEGY.md` (line 144) | Same link fix in prose reference |
| `docs/STRATEGY.md` (line 688) | Same link fix in ASCII diagram |
| `docs/DOCKER.md` (line 7) | Same link fix |
| `docs/AWS_ARCHITECTURE.md` (line 7) | Same link fix |
| `docs/AWS_ARCHITECTURE.md` (line 28) | Same link fix in recommendation |
| `docs/AWS_ARCHITECTURE.md` (line 682) | Same link fix in checklist |
| `docs/ARCHITECTURE_MIGRATION.md` (line 7) | Replaced dead `ARCHITECTURE.md` link with `STRATEGY.md` cross-reference |
| `docs/ARCHITECTURE_MIGRATION.md` (Section 1) | Rewrote recommendation: "adopt now — prerequisite for Lambda" instead of "optional Phase 3" |

**Rationale:** Documentation that contradicts itself or contains dead links erodes trust. Fixing this first ensured that anyone reading the strategic documents would understand why the migration was happening.

---

### Step 1: Domain Layer — Entities and Repository Interfaces

**Problem:** The codebase had no framework-independent representation of its core concepts. `ICampground`, `IReview`, and `IUser` all extended Mongoose's `Document` type, which meant every type in the system carried 50+ Mongoose methods (`.save()`, `.populate()`, `.$assertPopulated()`, etc.) and used `Types.ObjectId` instead of plain strings for identifiers.

**Changes — 10 new files, 0 modified:**

```
src/backend/src/domain/
├── entities/
│   ├── Campground.ts    # CampgroundEntity interface
│   ├── Review.ts        # ReviewEntity interface
│   ├── User.ts          # UserEntity interface
│   ├── Image.ts         # ImageVO value object
│   ├── Geometry.ts      # GeometryVO value object
│   └── index.ts         # Barrel export
└── repositories/
    ├── ICampgroundRepository.ts
    ├── IReviewRepository.ts
    ├── IUserRepository.ts
    └── index.ts
```

**Key design decisions in this step:**

- **`id: string` instead of `_id: Types.ObjectId`.** Domain entities use plain strings for all identifiers. This eliminates the Mongoose dependency and makes entities serializable to JSON without transformation. The translation between `_id` (ObjectId) and `id` (string) happens exclusively in mapper functions.

- **`authorId: string` instead of `author: Types.ObjectId`.** Mongoose's convention of naming foreign keys after the related model (`author`, `reviews`) conflates the reference with the referenced entity. Domain entities use explicit `authorId` and `reviewIds` to make the relationship direction clear.

- **Value Objects for Image and Geometry.** `ImageVO` (url + filename) and `GeometryVO` (GeoJSON Point) are extracted as separate interfaces. They carry no identity of their own — two images with the same URL and filename are equal. This is a DDD Value Object pattern.

- **Repository interfaces define the data access contract.** `ICampgroundRepository` declares methods like `findAll()`, `findById()`, `create()`, `update()`, `addImages()`, `removeImages()`, `delete()`, `count()`, and `findMany()`. These methods accept and return domain entities, never Mongoose documents. The interface is the port; any adapter (Mongoose, DynamoDB, in-memory) can implement it.

**Why this step was safe:** Purely additive. No existing file was touched. The new files are unreferenced — dead code until Step 2 wires them in.

---

### Step 2a: Mongoose Repository Adapters and Mappers

**Problem:** The repository interfaces from Step 1 had no implementation. The existing services used Mongoose models directly. A bridge was needed: concrete classes that implement the domain interfaces using Mongoose under the hood.

**Changes — 7 new files, 0 modified:**

```
src/backend/src/adapters/outbound/persistence/
├── MongooseCampgroundRepository.ts
├── MongooseReviewRepository.ts
├── MongooseUserRepository.ts
├── mappers/
│   ├── campground.mapper.ts
│   ├── review.mapper.ts
│   └── user.mapper.ts
└── index.ts
```

**Mapper design — the `extractId` problem:**

The most subtle issue in this step was handling Mongoose's population behavior. When a Campground document is loaded with `.populate('author')`, `doc.author` is no longer an ObjectId — it's a full User document. Calling `.toString()` on a populated document returns `[object Object]`, not an ID string.

The `campground.mapper.ts` solves this with an `extractId` helper:

```typescript
function extractId(value: unknown): string {
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return (value as { _id: { toString(): string } })._id.toString();
  }
  return String(value);
}
```

This function handles both cases: if the value is a populated document, it extracts `._id`; if it's a raw ObjectId, it calls `.toString()`. The same pattern appears in `review.mapper.ts` for the `author` field.

**Repository implementation details:**

- `MongooseCampgroundRepository.create()` translates domain field names to Mongoose field names: `authorId` → `author`, `reviewIds` → `reviews`.
- `MongooseCampgroundRepository.update()` builds an update object dynamically, mapping domain fields to their Mongoose equivalents.
- `MongooseCampgroundRepository.delete()` uses `findByIdAndDelete`, which triggers Mongoose's `findOneAndDelete` middleware — preserving the cascade delete of associated reviews.
- `MongooseReviewRepository.findById()` calls `.populate('author')` so that the mapper can extract the author's ID from the populated document.

**Why this step was safe:** Still purely additive. These adapters exist but nothing references them yet.

---

### Step 2b: Service Refactoring — Constructor Injection

**Problem:** All three service classes (`CampgroundService`, `ReviewService`, `UserService`) instantiated Mongoose queries directly. They could not be tested with mock repositories, and they could not be reused with a different database adapter.

**Changes — 3 service files modified, 5 test files modified:**

**Service changes:**

Each service received a constructor that accepts repository interfaces:

```typescript
// Before
export class CampgroundService {
  async getAllCampgrounds(): Promise<ICampground[]> {
    return await Campground.find({});  // Direct Mongoose call
  }
}
export const campgroundService = new CampgroundService();

// After
export class CampgroundService {
  constructor(private readonly campgroundRepo: ICampgroundRepository) {}

  async getAllCampgrounds(): Promise<CampgroundEntity[]> {
    return this.campgroundRepo.findAll();  // Goes through interface
  }
}
export const campgroundService = new CampgroundService(new MongooseCampgroundRepository());
```

The singleton export (`export const campgroundService = ...`) was preserved for backward compatibility. Existing route files and tests that import `campgroundService` continue to work without modification. This singleton will be removed in a future cleanup once all consumers use the container.

**Return type changes:**

Services now return domain entities instead of Mongoose documents:

| Method | Before | After |
|--------|--------|-------|
| `getAllCampgrounds()` | `Promise<ICampground[]>` | `Promise<CampgroundEntity[]>` |
| `getCampgroundById()` | `Promise<ICampground \| null>` | `Promise<CampgroundEntity \| null>` |
| `createCampground()` | Accepted `Types.ObjectId` for authorId | Accepts `string` |
| `deleteCampground()` | Returned `ICampground \| null` | Returns `boolean` |
| `createReview()` | Accepted `Types.ObjectId` for authorId | Accepts `string` |

**The UserService exception:**

`UserService.registerUser()` still imports the Mongoose `User` model directly and returns `IUser` (a Mongoose document). This is because `passport-local-mongoose`'s `.register()` method is tightly coupled to Mongoose — it hashes the password and saves the document in one atomic operation. The route handler needs the raw Mongoose document to pass to `req.login()` for session serialization. This coupling will be eliminated when authentication migrates to JWT.

**Route file changes:**

Two route files (`campgrounds.routes.ts`, `reviews.routes.ts`) passed `req.user!._id` (a `Types.ObjectId`) to service methods that now expect `string`. The fix was adding `.toString()`:

```typescript
// Before
campgroundService.createCampground(data, files, geometry, req.user!._id)

// After
campgroundService.createCampground(data, files, geometry, req.user!._id.toString())
```

**Test file changes:**

Five test files required updates:

1. **Service test constructors.** `new CampgroundService()` → `new CampgroundService(new MongooseCampgroundRepository())`. Same pattern for `ReviewService` and `UserService`.

2. **Assertion field names.** Tests that checked `campground._id` now check `campground.id`. Tests that checked `review.author.username` (populated Mongoose doc) now check `review.authorId` (string).

3. **Argument types.** Tests that passed `testUser._id` (ObjectId) to service methods now pass `testUser._id.toString()`.

4. **Return type assertions.** `deleteCampground` now returns `boolean` instead of the deleted document, so `expect(deleted!._id.toString()).toBe(...)` became `expect(deleted).toBe(true)`.

---

### Step 2c: Composition Root and Route Factory Functions

**Problem:** Route files imported services as module-level singletons and referenced config modules (Cloudinary, Mapbox) directly. This made it impossible to swap implementations without modifying the route files themselves.

**Changes — 6 new files, 1 modified:**

**New: Route factory functions** (`adapters/inbound/http/`)

Each route file was converted to a factory function that receives its dependencies as a parameter:

```typescript
// Before (module-level singleton imports)
import { campgroundService } from '../../services';
import { cloudinary } from '../../config/cloudinary';
import { geocoder } from '../../config/mapbox';
const router = Router();
// ... handlers use campgroundService, cloudinary, geocoder directly

// After (dependency injection via factory)
export function createCampgroundRoutes(deps: CampgroundRouteDeps): Router {
  const { campgroundService, geocoder, imageStorage, isAuthor } = deps;
  const router = Router();
  // ... handlers use deps
  return router;
}
```

The factory function pattern means route files no longer know which geocoder or image storage implementation is being used. They depend on interfaces (`IGeocoder`, `IImageStorage`), not on Mapbox or Cloudinary specifically.

**New: `container.ts`** (Composition Root)

This is the single file where all concrete implementations are instantiated and wired together:

```typescript
export function createContainer(): AppContainer {
  // Repositories
  const campgroundRepo = new MongooseCampgroundRepository();
  const reviewRepo = new MongooseReviewRepository();
  const userRepo = new MongooseUserRepository();

  // Outbound adapters
  const geocoder = new MapboxGeocoderAdapter();
  const imageStorage = new CloudinaryImageAdapter();

  // Services
  const campgroundService = new CampgroundService(campgroundRepo);
  const reviewService = new ReviewService(reviewRepo, campgroundRepo);
  const userService = new UserService(userRepo);

  // Middleware
  const isAuthor = createIsAuthor(campgroundRepo);
  const isReviewAuthor = createIsReviewAuthor(reviewRepo);

  // Routes (wired with all dependencies)
  const campgroundRoutes = createCampgroundRoutes({ ... });
  const reviewRoutes = createReviewRoutes({ ... });
  const userRoutes = createUserRoutes({ ... });
  const homeRoutes = createHomeRoutes({ ... });

  return { campgroundRoutes, reviewRoutes, userRoutes, homeRoutes };
}
```

**Modified: `index.ts`**

The main entry point was updated to use the container instead of importing routes directly:

```typescript
// Before
import { campgroundsRoutes, reviewsRoutes, usersRoutes, homeRoutes } from './api/routes';
app.use('/campgrounds', campgroundsRoutes);

// After
import { createContainer } from './container';
const container = createContainer();
app.use('/campgrounds', container.campgroundRoutes);
```

---

### Step 3a–b: Application Ports and Outbound Adapter Implementations

**Problem:** Geocoding (Mapbox) and image deletion (Cloudinary) were called directly in route handlers via config module imports. These are external services that should be behind port interfaces, just like database access is behind repository interfaces.

**Changes — 5 new files:**

```
src/backend/src/application/ports/
├── IGeocoder.ts        # forwardGeocode(query) → GeometryVO | null
├── IImageStorage.ts    # delete(filename) → void
└── index.ts

src/backend/src/adapters/outbound/
├── geocoding/MapboxGeocoderAdapter.ts
└── image/CloudinaryImageAdapter.ts
```

**Port design:**

The `IGeocoder` port simplifies the Mapbox SDK's verbose API:

```typescript
// Mapbox SDK (complex, chained API)
geocoder.forwardGeocode({ query, limit: 1 }).send()
  → { body: { features: [{ geometry: { type, coordinates } }] } }

// IGeocoder port (simple, domain-oriented)
forwardGeocode(query: string): Promise<GeometryVO | null>
```

The adapter (`MapboxGeocoderAdapter`) encapsulates the SDK's `.forwardGeocode().send()` chain, feature extraction, and null handling. Route handlers now call `geocoder.forwardGeocode(location)` and get back a `GeometryVO` or `null` — no knowledge of Mapbox's response structure.

The `IImageStorage` port has a single method: `delete(filename: string): Promise<void>`. The Cloudinary adapter wraps `cloudinary.uploader.destroy()` with error swallowing (`.catch(() => {})`), matching the existing behavior in the route handler.

---

### Step 3c: Auth Middleware Factory Functions

**Problem:** `isAuthor` and `isReviewAuthor` middleware imported Mongoose models directly (`Campground.findById()`, `Review.findById()`) and used Mongoose's `.equals()` method for ObjectId comparison. This coupled the authorization layer to MongoDB.

**Changes — 1 file modified:**

`middleware/auth.middleware.ts` now exports both factory functions and backward-compatible static exports:

```typescript
// Factory (uses repository interface)
export function createIsAuthor(campgroundRepo: ICampgroundRepository) {
  return async (req, res, next) => {
    const campground = await campgroundRepo.findById(req.params.id);
    if (!campground) { res.status(404)...; return; }
    if (campground.authorId !== req.user._id.toString()) { res.status(403)...; return; }
    next();
  };
}

// Backward-compatible export (uses Mongoose directly)
export const isAuthor = async (req, res, next) => {
  const campground = await Campground.findById(id);
  if (!campground.author.equals(req.user._id)) { ... }
};
```

The factory version compares `campground.authorId` (string) with `req.user._id.toString()` (string) — no Mongoose `.equals()` needed. The container uses the factory; the old route files still use the static export.

---

### Step 3d: Wire Everything in the Container

The container (`container.ts`) was built incrementally across Steps 2c and 3a–c. By this final step, it wires:

- 3 repository adapters (Mongoose)
- 2 outbound adapters (Mapbox, Cloudinary)
- 3 services (Campground, Review, User)
- 2 middleware factories (isAuthor, isReviewAuthor)
- 4 route factories (campgrounds, reviews, users, home)

---

## 4. File Inventory

### New files (28):

| Layer | File | Purpose |
|-------|------|---------|
| Domain | `domain/entities/Campground.ts` | CampgroundEntity interface |
| Domain | `domain/entities/Review.ts` | ReviewEntity interface |
| Domain | `domain/entities/User.ts` | UserEntity interface |
| Domain | `domain/entities/Image.ts` | ImageVO value object |
| Domain | `domain/entities/Geometry.ts` | GeometryVO value object |
| Domain | `domain/entities/index.ts` | Barrel export |
| Domain | `domain/repositories/ICampgroundRepository.ts` | Campground data access port |
| Domain | `domain/repositories/IReviewRepository.ts` | Review data access port |
| Domain | `domain/repositories/IUserRepository.ts` | User data access port |
| Domain | `domain/repositories/index.ts` | Barrel export |
| Adapter | `adapters/outbound/persistence/MongooseCampgroundRepository.ts` | Mongoose implementation |
| Adapter | `adapters/outbound/persistence/MongooseReviewRepository.ts` | Mongoose implementation |
| Adapter | `adapters/outbound/persistence/MongooseUserRepository.ts` | Mongoose implementation |
| Adapter | `adapters/outbound/persistence/mappers/campground.mapper.ts` | Document → Entity mapper |
| Adapter | `adapters/outbound/persistence/mappers/review.mapper.ts` | Document → Entity mapper |
| Adapter | `adapters/outbound/persistence/mappers/user.mapper.ts` | Document → Entity mapper |
| Adapter | `adapters/outbound/persistence/index.ts` | Barrel export |
| Adapter | `adapters/outbound/geocoding/MapboxGeocoderAdapter.ts` | IGeocoder implementation |
| Adapter | `adapters/outbound/image/CloudinaryImageAdapter.ts` | IImageStorage implementation |
| Adapter | `adapters/inbound/http/campgrounds.routes.ts` | Route factory |
| Adapter | `adapters/inbound/http/reviews.routes.ts` | Route factory |
| Adapter | `adapters/inbound/http/users.routes.ts` | Route factory |
| Adapter | `adapters/inbound/http/home.routes.ts` | Route factory |
| Adapter | `adapters/inbound/http/index.ts` | Barrel export |
| Application | `application/ports/IGeocoder.ts` | Geocoding port |
| Application | `application/ports/IImageStorage.ts` | Image storage port |
| Application | `application/ports/index.ts` | Barrel export |
| Root | `container.ts` | Composition root |

### Modified files (12):

| File | Nature of change |
|------|------------------|
| `docs/STRATEGY.md` | Fixed 3 broken links |
| `docs/ARCHITECTURE_MIGRATION.md` | Fixed cross-reference, updated Section 1 |
| `docs/DOCKER.md` | Fixed 1 broken link |
| `docs/AWS_ARCHITECTURE.md` | Fixed 3 broken links |
| `services/campground.service.ts` | Constructor injection, domain entity returns |
| `services/review.service.ts` | Constructor injection, domain entity returns |
| `services/user.service.ts` | Constructor injection (registerUser still uses Mongoose) |
| `middleware/auth.middleware.ts` | Added factory functions, kept backward-compat exports |
| `index.ts` | Uses container instead of direct route imports |
| `api/routes/campgrounds.routes.ts` | `_id` → `_id.toString()` for service calls |
| `api/routes/reviews.routes.ts` | `_id` → `_id.toString()` for service calls |
| 5 test files | Updated constructors, field names, argument types |

---

## 5. Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean — 0 errors |
| `npx jest` (backend) | 254 tests passing, 14 suites, all green |
| `npm test` (full monorepo) | Backend + Frontend tests pass |

---

## 6. Known Compromises

1. **`UserService.registerUser()` still imports the Mongoose User model.** `passport-local-mongoose`'s `.register()` method is coupled to Mongoose. The method returns a raw `IUser` document so that `req.login()` can serialize it into the session. This will be resolved when authentication migrates to JWT.

2. **Old route files in `api/routes/` are still present.** They remain as backward-compatible modules. The singleton service exports they import still work. These files can be deleted once all consumers are confirmed to use the container exclusively.

3. **`home.routes.ts` (factory version) imports `mongoose` for the health check.** `mongoose.connection.readyState` is the simplest way to check database connectivity. This is an infrastructure concern that belongs in the adapter layer, so it's acceptable.

4. **Backward-compatible singleton exports in services and middleware.** `export const campgroundService = new CampgroundService(new MongooseCampgroundRepository())` exists alongside the class export. These singletons exist for the transition period and should be removed once all imports go through the container.

---

## 7. Next Steps

### Phase 1: Cleanup (Low Risk)

- **Remove backward-compatible singletons** from `services/campground.service.ts`, `services/review.service.ts`, `services/user.service.ts`. Update any remaining direct imports to use the container.
- **Remove old route files** in `api/routes/` (`campgrounds.routes.ts`, `reviews.routes.ts`, `users.routes.ts`, `home.routes.ts`). Update `api/routes/index.ts` to re-export from `adapters/inbound/http/` or remove entirely.
- **Remove backward-compatible static middleware** (`isAuthor`, `isReviewAuthor`) from `middleware/auth.middleware.ts`. Keep only the factory functions and `isLoggedIn`/`storeReturnTo`.

### Phase 2: Use Cases Layer (Medium Risk)

- **Extract use cases** from services. Currently, services contain both orchestration logic (coordinating multiple repositories) and business rules. Extract dedicated use case classes:
  - `CreateCampgroundUseCase` — validates input, geocodes location, creates campground.
  - `DeleteCampgroundWithReviewsUseCase` — deletes campground and cascades to reviews.
  - `CreateReviewUseCase` — creates review and updates campground's review list.
- **Move Mongoose cascade middleware to the repository adapter.** The `campgroundSchema.post('findOneAndDelete')` hook that deletes associated reviews is a business rule hidden in the schema. It should be in the use case or repository adapter.

### Phase 3: Testing Improvements (Low Risk)

- **Write unit tests with mock repositories.** The constructor injection enables testing services without MongoDB. Create in-memory repository implementations for fast, isolated tests.
- **Add repository adapter tests.** Test `MongooseCampgroundRepository` against a real (in-memory) MongoDB to verify mapper correctness, especially the populated-vs-unpopulated handling.

### Phase 4: AWS Adapter Preparation (per STRATEGY.md)

- **Implement `DynamoCampgroundRepository`** — same interface, DynamoDB adapter. Single-table design per `STRATEGY.md` Section 3.
- **Implement `JwtAuthAdapter`** — replace Passport sessions with JWT. This eliminates the `UserService.registerUser()` Mongoose coupling.
- **Implement `S3ImageAdapter`** — replace Cloudinary with S3 for image storage.
- **Implement `SqsEventPublisher`** — add an `IEventPublisher` port for domain events, backed by SQS/SNS.

### Phase 5: Domain Enrichment (Optional, per complexity growth)

- **Aggregate roots.** Make `CampgroundEntity` an aggregate root that owns its reviews. Enforce invariants (e.g., a campground must have at least one image, price must be positive) in the entity itself rather than relying on Zod validation at the HTTP boundary.
- **Domain events.** Emit events like `CampgroundCreated`, `ReviewAdded` that can be consumed by event handlers (email notifications, search index updates, analytics).
- **Value Objects with behavior.** Enrich `ImageVO` with thumbnail URL generation (currently a Mongoose virtual). Move the logic from the schema to the domain.

---

## 8. Architectural Diagram — Before and After

### Before (Layered)

```
  Route Handler
       │
       ▼
  Service (imports Mongoose model)
       │
       ▼
  Mongoose Model ──── MongoDB
```

Every arrow is a direct import. Changing MongoDB means changing services.

### After (Hexagonal / Clean)

```
  ┌──────────────────────────────────────────────┐
  │              Composition Root                 │
  │  container.ts — wires everything              │
  └───────┬──────────┬──────────┬────────────────┘
          │          │          │
    ┌─────▼────┐ ┌───▼────┐ ┌──▼──────────────┐
    │  Route   │ │Service │ │  Repository      │
    │  Factory │ │        │ │  Adapter         │
    │ (inbound │ │ depends│ │ (outbound        │
    │  adapter)│ │ on     │ │  adapter)        │
    └─────┬────┘ │ domain │ └──┬───────────────┘
          │      │ inter- │    │
          │      │ faces  │    ▼
          │      │ only   │  MongoDB / DynamoDB
          │      └───┬────┘
          │          │
          ▼          ▼
        Express   Domain Entities
                  Repository Interfaces
                  (pure TypeScript)
```

Arrows cross layer boundaries only through interfaces. Swapping MongoDB for DynamoDB means writing a new adapter and changing one line in `container.ts`.
