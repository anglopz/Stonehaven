# Stonehaven — Strategy & Decision Guide

This document consolidates every strategic decision made for Stonehaven: language choice, architecture migration order, AWS stack, cost optimisation (free tier), DynamoDB migration, CI/CD, and local development. It supersedes some early cost estimates in `AWS_ARCHITECTURE.md` and should be read as the single source of truth for direction.

See also:
- [ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md) — Clean Architecture + DDD step-by-step
- [DOCKER.md](./DOCKER.md) — containerisation and local dev setup
- [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) — deeper infrastructure reference

---

## 1. Technology Decisions

### 1.1 Keep TypeScript — do not migrate to Python/FastAPI

**Decision: keep the backend in TypeScript.**

The shipping API (FastAPI/Python) is integrated as an outbound HTTP adapter. The language of the caller does not need to match the language of the callee. Stonehaven will call the shipping API's endpoints exactly as it calls Mapbox or Cloudinary — through an interface:

```typescript
// application/ports/IShippingService.ts
export interface IShippingService {
  calculateRate(origin: Location, destination: Location, weight: number): Promise<ShippingRate>;
}

// adapters/outbound/shipping/FastAPIShippingAdapter.ts
export class FastAPIShippingAdapter implements IShippingService {
  async calculateRate(origin, destination, weight) {
    return fetch(`${this.baseUrl}/rates`, { method: 'POST', body: JSON.stringify(...) }).then(r => r.json());
  }
}
```

The shipping API stays Python. Stonehaven stays TypeScript. That is the intended state.

**Reasons not to rewrite in Python:**
- The TypeScript migration from legacy EJS is recent — that investment should be built on
- Rewriting a working typed backend adds weeks of work with zero user-visible value
- FastAPI + SQLAlchemy targets SQL databases; Stonehaven uses MongoDB → migrating language would also pressure a DB migration
- TypeScript Lambdas are first-class on AWS with comparable cold start times to Python
- All existing Dockerfiles, CI tooling, and tests are TypeScript

### 1.2 Do not migrate the shipping API architecture

**Decision: leave the FastAPI/Python shipping API as-is.**

The shipping API is deployed, functional, and follows SOLID principles with separated service/router layers. From Stonehaven's perspective it is a third-party HTTP service — its internal architecture is irrelevant to how it is integrated.

Only migrate the shipping API's architecture if and when the team working on it experiences concrete pain: hard-to-write tests, difficulty swapping the DB, business logic leaking into routers. "Consistency with Stonehaven" is not a sufficient reason.

### 1.3 GitHub Actions over GitLab CI

**Decision: GitHub Actions.**

The project lives on GitHub. Use the CI/CD platform native to where the code lives. GitHub Actions has official first-party AWS actions and OIDC federation with IAM (no static access keys). GitLab CI is the right choice only if the code is already on GitLab.

---

## 2. AWS Free Tier — Cost-Optimised Stack

### 2.1 The problem with the original AWS_ARCHITECTURE.md estimate

The earlier document estimated ~$110/month. The three biggest cost drivers were:

| Service | Monthly cost | Problem |
|---------|-------------|---------|
| DocumentDB (t4g.medium) | ~$60 | Not in free tier; expensive for small projects |
| NAT Gateway | ~$35 | Required when Lambda is inside a VPC |
| ElastiCache Redis (t4g.micro) | ~$12 | Not free after 12 months |

All three can be eliminated by switching to **DynamoDB + JWT + Lambda outside VPC**.

### 2.2 Revised free-tier stack

```text
  Browser
     │
     ▼
  CloudFront  ──────────────────────────────▶  S3 (frontend static files)
     │
     ▼
  API Gateway (HTTP API)
     │
     ▼
  Lambda functions (ZIP, outside VPC)
     │         │              │
     ▼         ▼              ▼
  DynamoDB   SQS/SNS       Cloudinary
  (DB)       (async)       (images)
```

No VPC. No NAT Gateway. No ElastiCache. No DocumentDB.

### 2.3 Free tier breakdown

| Service | Free tier | Expires |
|---------|-----------|---------|
| **Lambda** | 1M requests/month + 400K GB-sec compute | Forever |
| **API Gateway (HTTP)** | 1M calls/month | 12 months, then ~$1/million |
| **DynamoDB** | 25 GB storage, 25 WCU, 25 RCU | Forever |
| **S3** | 5 GB storage, 20K GET, 2K PUT | 12 months, then ~$0.023/GB |
| **CloudFront** | 1 TB transfer, 10M requests | 12 months, then ~$0.0085/10K req |
| **SQS** | 1M requests/month | Forever |
| **SNS** | 1M publishes/month | Forever |
| **Secrets Manager** | 30-day trial, then $0.40/secret/month | — |
| **CloudWatch** | 10 custom metrics, 5 GB logs | 12 months |

**Estimated monthly cost after free tier expires (low traffic):** ~$2–8/month

Compare to original estimate with DocumentDB + NAT + ElastiCache: ~$110/month.

### 2.4 What is not free and how to avoid it

| Paid service | Alternative | Notes |
|-------------|------------|-------|
| ElastiCache (Redis) | JWT for sessions; SQS for queues | Eliminates the need entirely |
| NAT Gateway | Lambda outside VPC | Only needed if Lambda is in a private subnet |
| DocumentDB | DynamoDB | Requires data model refactor (see Section 3) |
| Secrets Manager | SSM Parameter Store | Free for standard parameters; $0.05/10K API calls |

**Sessions:** Replace `express-session` + `connect-mongo` with JWT stored in an `HttpOnly` cookie. Stateless — Lambda has no session store dependency.

**Queues:** SQS is already free. BullMQ/Redis is the local dev equivalent; in production SQS replaces it directly (swap one adapter).

---

## 3. DynamoDB Instead of MongoDB/DocumentDB

### 3.1 Should you do this?

**Yes — but only after the Clean Architecture migration.**

Here is why the order matters:

```text
  Without Clean Architecture        With Clean Architecture (Steps 1–3 done)
  ──────────────────────────        ─────────────────────────────────────────
  Services call Campground.find()   Use cases call ICampgroundRepository.findAll()
  Change = touch services,          Change = write DynamoDBCampgroundRepository
  routes, models, tests             Everything else stays the same
  Risk: high, scope: everywhere     Risk: low, scope: one file per entity
```

Repository interfaces are the enabler. Do Steps 1–3 of ARCHITECTURE_MIGRATION.md first, then implement DynamoDB adapters.

### 3.2 What actually changes

| Layer | Changes needed | Scope |
|-------|---------------|-------|
| **Domain entities** | None — pure TypeScript classes | — |
| **Use cases** | None — they call repository interfaces | — |
| **Repository interfaces** | None — already defined | — |
| **Mongoose models** | Deleted (or kept for local dev) | `src/backend/src/models/` |
| **Repository adapters** | New: `DynamoDBCampgroundRepository`, etc. | `adapters/outbound/persistence/` |
| **Auth** | `passport-local-mongoose` → `bcrypt` + JWT | `config/`, `adapters/inbound/` |
| **Session config** | `express-session` + `connect-mongo` removed | `config/session.ts` |
| **Dependencies** | Remove: `mongoose`, `connect-mongo`, `passport-local-mongoose`; Add: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `bcryptjs`, `jsonwebtoken` | `package.json` |
| **Tests** | Mock repository implementations remain the same | — |

Cloudinary for images stays unchanged.

### 3.3 DynamoDB table design for Stonehaven

Use **multi-table design** (one table per entity). Simpler to migrate to and easier to reason about than single-table design. Matches the existing MongoDB collection structure closely.

#### Table: `stonehaven-campgrounds`

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` (PK) | String | `crypto.randomUUID()` replaces ObjectId |
| `title` | String | |
| `description` | String | |
| `price` | Number | |
| `location` | String | text address (e.g. "Yosemite, CA") |
| `geometry` | Map | `{ type: "Point", coordinates: [lng, lat] }` |
| `images` | List | `[{ url, filename }]` stored as JSON list |
| `authorId` | String | references users.id |
| `createdAt` | String | ISO 8601 |
| `updatedAt` | String | ISO 8601 |

**GSI:** `authorId-index` (PK: `authorId`) — query "campgrounds by user"

> Note: The `reviews` array is **removed**. Reviews now live in their own table with a `campgroundId` field and a GSI. Cascade delete moves to the use case (`DeleteCampground` queries reviews by campgroundId GSI and deletes them). This replaces the Mongoose `post('findOneAndDelete')` middleware.

#### Table: `stonehaven-reviews`

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` (PK) | String | UUID |
| `body` | String | |
| `rating` | Number | 1–5 |
| `authorId` | String | references users.id |
| `campgroundId` | String | references campgrounds.id |
| `createdAt` | String | |
| `updatedAt` | String | |

**GSI:** `campgroundId-index` (PK: `campgroundId`) — query "reviews for campground"

#### Table: `stonehaven-users`

| Attribute | Type | Notes |
|-----------|------|-------|
| `id` (PK) | String | UUID |
| `email` | String | lowercase, trimmed |
| `username` | String | from passport-local-mongoose |
| `passwordHash` | String | bcrypt hash |
| `createdAt` | String | |
| `updatedAt` | String | |

**GSI:** `username-index` (PK: `username`) — login lookup
**GSI:** `email-index` (PK: `email`) — email uniqueness check

### 3.4 Authentication migration (passport-local-mongoose → bcrypt + JWT)

`passport-local-mongoose` is tightly coupled to Mongoose. Without Mongoose, the plugin does nothing. Replace it with manual bcrypt hashing and JWT issuance.

```typescript
// application/use-cases/users/LoginUser.ts
export class LoginUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,   // application port
  ) {}

  async execute(dto: LoginDto): Promise<{ token: string; user: UserDto }> {
    const user = await this.userRepo.findByUsername(dto.username);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    const token = await this.tokenService.sign({ userId: user.id, username: user.username });
    return { token, user: toUserDto(user) };
  }
}
```

```typescript
// adapters/inbound/http/auth.middleware.ts
// JWT in HttpOnly cookie — replaces passport.session()
export function jwtAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new UnauthorizedError('Not authenticated'));
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
}
```

### 3.5 DynamoDB repository adapter example

```typescript
// adapters/outbound/persistence/DynamoDBCampgroundRepository.ts
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ICampgroundRepository } from '../../../domain/repositories/ICampgroundRepository';
import { Campground } from '../../../domain/entities/Campground';

const TABLE = 'stonehaven-campgrounds';

export class DynamoDBCampgroundRepository implements ICampgroundRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  async findAll(): Promise<Campground[]> {
    const result = await this.client.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? []).map(toDomainEntity);
  }

  async findById(id: string): Promise<Campground | null> {
    const result = await this.client.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    return result.Item ? toDomainEntity(result.Item) : null;
  }

  async findByAuthorId(authorId: string): Promise<Campground[]> {
    const result = await this.client.send(new QueryCommand({
      TableName: TABLE,
      IndexName: 'authorId-index',
      KeyConditionExpression: 'authorId = :authorId',
      ExpressionAttributeValues: { ':authorId': authorId },
    }));
    return (result.Items ?? []).map(toDomainEntity);
  }

  async save(campground: Campground): Promise<Campground> {
    const item = toDBItem(campground);
    await this.client.send(new PutCommand({ TableName: TABLE, Item: item }));
    return campground;
  }

  async delete(id: string): Promise<void> {
    await this.client.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  }
}
```

### 3.6 Local development with DynamoDB

For local dev, use **DynamoDB Local** (official Docker image) instead of MongoDB:

```yaml
# Add to docker-compose.dev.yml
dynamodb-local:
  image: amazon/dynamodb-local:latest
  container_name: stonehaven-dynamodb-local
  ports:
    - "8000:8000"
  command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
  networks:
    - stonehaven-network
```

```typescript
// config/dynamodb.ts
const isLocal = process.env.NODE_ENV !== 'production';

export const dynamoClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(
    isLocal
      ? { endpoint: 'http://localhost:8000', region: 'us-east-1', credentials: { accessKeyId: 'local', secretAccessKey: 'local' } }
      : { region: process.env.AWS_REGION }
  )
);
```

No code change between local and production — only the client configuration differs.

### 3.7 Images: keep Cloudinary

The Campground model already uses Cloudinary with virtual URL transforms for thumbnail, small, and medium sizes (`/upload/w_200,h_200,c_fill` etc.). These are computed from the stored URL and require no schema change.

**Keep Cloudinary** for image uploads and transformations. It has a generous free tier (25 GB storage, 25 GB bandwidth/month) and the image transform virtuals are already implemented. Migrating to S3 + Lambda image processing is a future phase-3 concern only if Cloudinary becomes a cost or control issue.

S3 is used for: frontend static files only.

---

## 4. Lambda Outside VPC

### 4.1 Why this matters for cost

Lambda inside a VPC requires a NAT Gateway to reach the internet (~$35/month). Lambda outside a VPC has direct internet access for free.

With DynamoDB (accessed via AWS SDK over HTTPS, no VPC required), Cloudinary (public API), and Mapbox (public API), there is no reason to put Lambda inside a VPC.

```text
  Lambda (outside VPC)
    │
    ├── DynamoDB ──────── AWS SDK over HTTPS (no VPC needed)
    ├── S3 ─────────────── AWS SDK over HTTPS (no VPC needed)
    ├── SQS / SNS ─────── AWS SDK over HTTPS (no VPC needed)
    ├── Secrets Manager ── AWS SDK over HTTPS (no VPC needed)
    ├── Mapbox ─────────── public HTTPS
    └── Cloudinary ─────── public HTTPS
```

No VPC. No NAT Gateway. No subnets to manage.

> If you later add DocumentDB or ElastiCache, those require a VPC and Lambda would need to join it (adding the NAT Gateway cost back). This is another reason DynamoDB + JWT is the cost-optimal choice.

### 4.2 IAM role for Lambda

Lambda functions need an IAM execution role with least-privilege permissions:

```hcl
# Terraform: modules/iam/lambda-role.tf
resource "aws_iam_role_policy" "lambda_policy" {
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:DeleteItem",
                    "dynamodb:Query","dynamodb:Scan","dynamodb:UpdateItem"]
        Resource = ["arn:aws:dynamodb:*:*:table/stonehaven-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage","sqs:ReceiveMessage","sqs:DeleteMessage","sqs:GetQueueAttributes"]
        Resource = ["arn:aws:sqs:*:*:stonehaven-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = ["arn:aws:sns:*:*:stonehaven-*"]
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = ["arn:aws:secretsmanager:*:*:secret:stonehaven/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

---

## 5. Frontend: S3 + CloudFront

### 5.1 Change next.config.js

```js
// src/frontend/next.config.js
const nextConfig = {
  output: 'export',   // was 'standalone' — generates static out/ directory
  // ...
};
```

After `next build`, the `out/` directory contains pure HTML/JS/CSS. Upload it to S3; CloudFront serves it globally.

### 5.2 Implication: no SSR

`output: 'export'` disables `getServerSideProps`. For Stonehaven this is fine — all pages fetch data from the API on the client side (React Query / SWR / `useEffect`). The API is the Express backend (later Lambda).

### 5.3 Deploy flow

```bash
# GitHub Actions
- run: cd src/frontend && npm run build        # generates out/
- run: aws s3 sync src/frontend/out/ s3://stonehaven-frontend --delete
- run: aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
```

---

## 6. Local Development Environment

### 6.1 The rule

**Docker for infrastructure. Native for application code.**

| What | How | Why |
|------|-----|-----|
| MongoDB (or DynamoDB Local) | Docker container | Consistent version, no local install |
| Redis | Docker container | For local BullMQ queues in Phase 1 |
| Backend | `npm run dev` (ts-node-dev) | Instant hot reload, native debugger |
| Frontend | `next dev` | HMR, fastest iteration |

Running the backend or frontend inside Docker during development slows hot reload, complicates the debugger, and provides no benefit since the app code is what you are actively changing.

### 6.2 docker-compose.dev.yml (final form)

```yaml
version: '3.8'

services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: stonehaven-dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
    networks:
      - stonehaven-network

  redis:
    image: redis:7-alpine
    container_name: stonehaven-redis-dev
    ports:
      - "6379:6379"
    networks:
      - stonehaven-network

volumes: {}

networks:
  stonehaven-network:
    driver: bridge
```

> **Transition period:** While MongoDB is still in use, keep `mongo:7` in the dev compose and remove it when DynamoDB Local replaces it.

### 6.3 Daily workflow

```bash
# Start infrastructure
docker compose -f docker-compose.dev.yml up -d

# Run apps locally
npm run dev          # or: npm run dev:backend & npm run dev:frontend

# Stop infrastructure
docker compose -f docker-compose.dev.yml down
```

### 6.4 Docker is not required for AWS deployment

The Dockerfiles (`infra/docker/Dockerfile.backend`, `Dockerfile.frontend`) are kept for:
- Smoke-testing the production build locally (`docker compose up --build`)
- Future ECS use if Lambda is ever abandoned

For the actual AWS deployment path (Lambda ZIP + S3 static):
- Backend: `tsc` → zip → S3 → Lambda update
- Frontend: `next build` → sync `out/` to S3
- No Docker involved

---

## 7. CI/CD with GitHub Actions

### 7.1 OIDC setup (no static AWS keys)

```hcl
# Terraform: modules/iam/github-oidc.tf
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "github-actions-stonehaven"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:YOUR_ORG/stonehaven:*"
        }
      }
    }]
  })
}
```

No `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` stored in GitHub secrets.

### 7.2 Full pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd src/backend && npm ci && npm test
      - run: cd src/frontend && npm ci && npm run build  # also validates frontend

  deploy-backend-lambda:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-stonehaven
          aws-region: us-east-1

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Build
        run: |
          cd src/backend
          npm ci --omit=dev
          npm run build

      - name: Package (ZIP)
        run: |
          cd src/backend
          zip -r ../../backend-${{ github.sha }}.zip dist/ node_modules/

      - name: Upload to S3
        run: aws s3 cp backend-${{ github.sha }}.zip s3://stonehaven-lambda-artifacts/

      - name: Update Lambda functions
        run: |
          for fn in campgrounds-api reviews-api users-api image-processor email-sender; do
            aws lambda update-function-code \
              --function-name prod-stonehaven-${fn} \
              --s3-bucket stonehaven-lambda-artifacts \
              --s3-key backend-${{ github.sha }}.zip
          done

  deploy-frontend-s3:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-stonehaven
          aws-region: us-east-1

      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      - name: Build static export
        run: cd src/frontend && npm ci && npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PROD_API_URL }}

      - name: Sync to S3
        run: aws s3 sync src/frontend/out/ s3://stonehaven-frontend --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CF_DISTRIBUTION_ID }} \
            --paths "/*"
```

---

## 8. Complete Revised Architecture

### 8.1 Final stack (corrected from AWS_ARCHITECTURE.md)

| What | Service | Deployment format | Cost |
|------|---------|------------------|------|
| Frontend | S3 + CloudFront | Static files (`next build --output=export`) | Free tier |
| API | Lambda + API Gateway (HTTP) | ZIP | Free tier |
| Workers | Lambda + SQS trigger | ZIP | Free tier |
| Database | DynamoDB | Managed (no server) | Free tier forever |
| Images | Cloudinary | External (no change) | Free tier (25 GB) |
| Async queue | SQS + SNS | Managed | Free tier forever |
| Secrets | SSM Parameter Store | Managed | Free (standard) |
| DNS + TLS | Route 53 + ACM | Managed | ~$0.50/month |
| CI/CD | GitHub Actions + OIDC | — | Free |
| IaC | Terraform | — | Free |

**No VPC. No NAT Gateway. No ElastiCache. No DocumentDB. No ECS.**

### 8.2 Architecture diagram

```text
  Browser
    │
    ├──▶ CloudFront ──▶ S3 (stonehaven-frontend)
    │         └── cache static HTML/JS/CSS at edge
    │
    └──▶ CloudFront ──▶ API Gateway (HTTP API)
              └── cache API responses (optional)
                        │
                        ▼
                  Lambda functions (outside VPC)
                  ┌─────────────────────────────────────────┐
                  │  campgrounds-api  │  reviews-api         │
                  │  users-api        │  (+ future fns)      │
                  └─────────┬─────────────────────┬──────────┘
                            │                     │
                    ┌───────┴──────┐    ┌──────────┴──────────┐
                    │  DynamoDB    │    │  SQS / SNS           │
                    │  (3 tables)  │    │  ──▶ Lambda workers  │
                    └──────────────┘    │       image-processor│
                                        │       email-sender   │
                                        └──────────────────────┘
                            │
                    ┌───────┴──────┐
                    │  Cloudinary  │  (image upload/transform)
                    │  Mapbox      │  (geocoding)
                    └──────────────┘
```

---

## 9. Recommended Order of Work

```text
  ┌──────────────────────────────────────────────────────────────────┐
  │  PHASE 0 — Architecture (no AWS, no Docker change needed)        │
  │                                                                  │
  │  1. Repository interfaces (Steps 1–2, ARCHITECTURE_MIGRATION.md) │
  │  2. Extract use cases (Step 3)                                   │
  │  3. IEventPublisher port + BullMQ adapter for local dev          │
  │  4. /health endpoint                                             │
  │  5. All tests pass with mock repositories                        │
  └──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  PHASE 1 — DynamoDB migration (still local, no AWS needed yet)   │
  │                                                                  │
  │  1. Add DynamoDB Local to docker-compose.dev.yml                 │
  │  2. Write DynamoDBCampgroundRepository (implements interface)    │
  │  3. Write DynamoDBReviewRepository                               │
  │  4. Write DynamoDBUserRepository                                 │
  │  5. Migrate auth: remove passport-local-mongoose, add bcrypt+JWT │
  │  6. Swap adapters in composition root, verify tests pass         │
  │  7. Remove mongoose, connect-mongo from dependencies             │
  └──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  PHASE 2 — AWS foundation (Terraform + deploy)                   │
  │                                                                  │
  │  1. Bootstrap Terraform state (S3 + DynamoDB lock table)         │
  │  2. Provision DynamoDB tables with GSIs                          │
  │  3. Provision Lambda functions + API Gateway                     │
  │  4. Provision S3 buckets (frontend + Lambda artifacts)           │
  │  5. Provision CloudFront distributions                           │
  │  6. Set up GitHub Actions OIDC + deploy pipeline                 │
  │  7. Change next.config.js output to 'export'                     │
  │  8. Set up SSM Parameter Store with secrets                      │
  │  9. Test end-to-end in AWS dev environment                       │
  └──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  PHASE 3 — Async / Event-driven                                  │
  │                                                                  │
  │  1. Provision SQS queues + SNS topics (Terraform)                │
  │  2. Implement SNSEventPublisher adapter                          │
  │  3. Deploy image-processor Lambda (SQS trigger)                  │
  │  4. Deploy email-sender Lambda (SQS trigger)                     │
  │  5. Wire domain events in CreateCampground, AddReview use cases  │
  └──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  PHASE 4 — Shipping API integration                              │
  │                                                                  │
  │  1. Define IShippingService port                                 │
  │  2. Implement FastAPIShippingAdapter (HTTP calls to the API)     │
  │  3. Inject in relevant use cases                                 │
  │  4. The FastAPI shipping API is untouched                        │
  └──────────────────────────────────────────────────────────────────┘
```

---

## 10. Quick Reference — Decisions Summary

| Question | Decision |
|----------|---------|
| Keep TypeScript or migrate to Python? | Keep TypeScript |
| Migrate the shipping API architecture? | No — leave it as-is until it creates pain |
| GitHub Actions or GitLab? | GitHub Actions (OIDC, no static keys) |
| Lambda deployment format? | ZIP (not container images) |
| Frontend on AWS? | S3 + CloudFront (static export, not ECS) |
| MongoDB or DynamoDB? | DynamoDB (free tier forever, no VPC needed) |
| DocumentDB? | Skip — too expensive, ~$60/month minimum |
| Sessions? | JWT in HttpOnly cookie (removes ElastiCache dependency) |
| Lambda in VPC or outside? | Outside VPC (no NAT Gateway, ~$35/month saved) |
| Docker in development? | Infrastructure only (DynamoDB Local + Redis); apps run natively |
| Docker in production? | Not needed for Lambda + S3/CloudFront stack |
| Cloudinary vs S3 for images? | Keep Cloudinary (free tier, transforms already coded) |
| Estimated monthly cost? | ~$2–8/month after free tier (vs ~$110 with DocumentDB+NAT+ElastiCache) |

---

## 11. Async Architecture Notes — SQS, SNS, and the Broker Pattern

### 11.1 SQS replaces Redis/BullMQ queues

In local development, BullMQ uses Redis as the message broker: the backend enqueues jobs, a worker process polls Redis, and processes them. In production on AWS, SQS replaces Redis as the broker. The application code never changes — only the adapter behind the `ITaskQueue` port is swapped.

```text
  Local dev                              AWS production
  ──────────────────────────────         ────────────────────────────────
  Backend                                Backend
    └──▶ BullMQTaskQueue adapter           └──▶ SQSTaskQueue adapter
               │                                      │
               ▼                                      ▼
             Redis (Docker)                        SQS Queue
               │                                      │
               ▼                                      ▼
          Worker process                       Lambda worker function
          (always running,                     (invoked by AWS on message arrival,
           polls Redis)                         no polling loop in your code)
```

### 11.2 Who connects the broker to the workers?

This is the key mental shift from Redis/BullMQ to SQS + Lambda. With BullMQ, your worker process maintains a persistent connection to Redis and polls it in a loop. With SQS + Lambda, **AWS manages the connection on your behalf** via **event source mapping**.

You configure it once (in Terraform):

```hcl
resource "aws_lambda_event_source_mapping" "sqs_worker" {
  event_source_arn = aws_sqs_queue.image_processing.arn
  function_name    = aws_lambda_function.image_processor.arn
  batch_size       = 10
}
```

After that, AWS Lambda service continuously polls SQS internally. When messages arrive, it invokes your Lambda handler with a batch. Your worker code is just a function — no polling loop, no connection management, no persistent process to keep alive.

```typescript
// adapters/inbound/lambda/image-processor.handler.ts
export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const job = JSON.parse(record.body);
    await processImage(job);          // your logic here
    // no ack needed — successful return = message deleted from queue
    // thrown error = message returns to queue (up to maxReceiveCount, then DLQ)
  }
};
```

### 11.3 SNS vs SQS — when to use each

| Pattern | Use | Example |
|---------|-----|---------|
| **SQS direct** | One producer → one worker type | Send a specific email, resize a specific image |
| **SNS → SQS** | One event → multiple worker types (fan-out) | `CampgroundCreated` → image processor + email notifier |

```text
  SQS direct (point-to-point):
  Use case  ──▶  SQS queue  ──▶  Lambda worker

  SNS → SQS (fan-out / pub-sub):
  Use case  ──▶  SNS topic
                    │
                    ├──▶  SQS: image-processing-queue  ──▶  Lambda: image-processor
                    └──▶  SQS: notification-queue      ──▶  Lambda: email-sender
```

SNS filter policies ensure each SQS queue only receives the event types it cares about — no unnecessary Lambda invocations.

### 11.4 Error handling and Dead Letter Queues

SQS retries failed messages automatically (up to `maxReceiveCount`, default 3). After exhausting retries, the message moves to a **Dead Letter Queue (DLQ)**. Set a CloudWatch alarm on DLQ depth — a non-zero DLQ means a worker is consistently failing on a message class.

```hcl
resource "aws_sqs_queue" "image_processing" {
  name                       = "stonehaven-image-processing"
  visibility_timeout_seconds = 60   # must be >= Lambda timeout
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.image_processing_dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "image_processing_dlq" {
  name = "stonehaven-image-processing-dlq"
}
```

---

## 12. AWS Networking Notes — VPC, Lambda, and Private Resources

### 12.1 NAT Gateway direction — a common misconception

NAT Gateway is **outbound only**. It routes traffic from resources *inside* a private subnet out to the internet. It cannot do the reverse — it does not allow an external Lambda (outside VPC) to reach resources inside a VPC.

```text
  WHAT NAT GATEWAY DOES:
  Private subnet resource  ──outbound──▶  NAT Gateway  ──▶  Internet
                           ✓ works

  WHAT NAT GATEWAY CANNOT DO:
  Lambda (outside VPC)  ──▶  NAT Gateway  ──▶  ElastiCache (private IP)
                         ✗ not possible — NAT is not a reverse tunnel
```

### 12.2 VPC Endpoints only work for HTTPS AWS services

VPC Interface Endpoints (AWS PrivateLink) create an ENI inside your VPC that tunnels HTTPS calls to AWS-managed services. They only work for services that expose an HTTPS/API surface.

ElastiCache speaks the **Redis wire protocol** (TCP port 6379). RDS speaks **PostgreSQL** (TCP 5432) or **MySQL** (TCP 3306). These are binary TCP protocols — AWS does not offer VPC Endpoints for them.

```text
  VPC Interface Endpoints — work for:      Do NOT work for:
  ✓ SQS        (HTTPS API)                 ✗ ElastiCache   (Redis protocol)
  ✓ SNS        (HTTPS API)                 ✗ RDS PostgreSQL (pg wire protocol)
  ✓ DynamoDB   (HTTPS API, Gateway type)   ✗ RDS MySQL      (mysql protocol)
  ✓ S3         (HTTPS API, Gateway type)
  ✓ Secrets Manager (HTTPS API)
```

Gateway Endpoints (S3 and DynamoDB) are free. Interface Endpoints cost ~$7.20/month per endpoint per Availability Zone.

### 12.3 Lambda in VPC public subnet — does not solve the internet problem

Even when placed in a public subnet, Lambda ENIs are **not assigned public IP addresses**. A public subnet means a route to an Internet Gateway (IGW) exists — but that route is only usable by resources with a public IP. Lambda ENIs have only private IPs. The result: Lambda in a public subnet has the same internet access as Lambda in a private subnet — none — without a NAT Gateway.

```text
  Lambda in public subnet:
    ENI private IP: 10.0.1.45  (no public IP assigned)
    Route: 0.0.0.0/0 → igw-xxx  ✗ IGW drops it (no public IP to route back to)
    Result: cannot reach internet

  Lambda in private subnet:
    ENI private IP: 10.0.11.45
    Route: 0.0.0.0/0 → nat-xxx  ✓ NAT Gateway translates to its own public IP
    Result: can reach internet (costs ~$35/month)
```

### 12.4 The only ways for Lambda to reach ElastiCache or RDS

| Approach | Works? | Notes |
|----------|--------|-------|
| Lambda outside VPC | ✗ | ElastiCache/RDS have no public endpoint |
| Lambda in VPC (any subnet) | ✓ | Standard solution; adds NAT cost if internet needed |
| VPC Endpoints | ✗ | No endpoint exists for Redis/PostgreSQL/MySQL protocols |
| NAT Gateway (external Lambda) | ✗ | NAT is outbound from VPC, not inbound |
| **Aurora Serverless v2 Data API** | ✓ (Aurora only) | HTTPS endpoint, Lambda can call from outside VPC; higher latency; not available for ElastiCache or standard RDS |

For ElastiCache and standard RDS: **Lambda must be inside the VPC. There is no alternative.**

### 12.5 The cost chain — why VPC-bound services are expensive for Lambda

Adding any VPC-bound service (ElastiCache, RDS, DocumentDB) triggers a cascade:

```text
  Add ElastiCache or RDS
        │
        ▼
  Lambda must join VPC
        │
        ▼
  Lambda needs internet for Cloudinary + Mapbox
        │
        ▼
  NAT Gateway required in each AZ
        │
        ▼
  +~$35/month NAT data processing
  +~$32/month NAT Gateway hours (2 AZs)
  +~$60/month DocumentDB or ~$25/month ElastiCache (t4g.micro)
        │
        ▼
  ~$100–120/month added to the bill
```

This is why the DynamoDB + JWT strategy is a deliberate architectural choice, not just a cost preference. It permanently breaks this chain:

- **DynamoDB** → no VPC required → no NAT Gateway
- **JWT** → no session store → no ElastiCache
- **Lambda outside VPC** → no subnets, no security groups, no ENI warm-up latency

The only future scenario that would force Lambda back into a VPC is adding ElastiCache (for a specific caching or pub/sub need) or RDS (if a relational model becomes necessary). At that point the trade-off is conscious and deliberate, not accidental.
