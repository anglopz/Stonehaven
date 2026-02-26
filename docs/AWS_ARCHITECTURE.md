# AWS Infrastructure & Architecture Guide

This document covers the full AWS strategy for Stonehaven: service selection, VPC design, Lambda-first deployment, event-driven architecture, MongoDB migration options, Terraform IaC structure, and a phased migration plan.

See also:
- [DOCKER.md](./DOCKER.md) — local containerisation and Redis broker
- [ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md) — Clean Architecture + DDD enabling this deployment

---

## 1. Core Question: Should I Adopt Clean Architecture Before Going to AWS?

**Yes — and the reason is direct.**

With a layered architecture, migrating to Lambda means wrapping Express in `serverless-express`. It works, but you are running the entire framework (sessions, middleware stack, CORS wiring) inside every Lambda invocation. Cold starts are large, testing is hard, and the monolith just moved into a function.

With Clean Architecture + DDD, each **use case is a pure function** that receives ports (interfaces). A Lambda handler becomes a thin **inbound adapter** that:
1. Parses the Lambda event into a DTO
2. Calls the use case
3. Returns the Lambda response

The use case doesn't know it's running inside Lambda or Express. This means:
- **Zero framework overhead** in Lambda invocations
- **Use cases are unit-testable** with no infrastructure
- **Swapping adapters** (MongoDB → DynamoDB, Redis queue → SQS) requires one file, not a rewrite
- **Domain events** map naturally to SNS/SQS messages

**Recommendation: migrate the architecture first (Steps 1–3 of ARCHITECTURE_MIGRATION.md), then deploy to Lambda.**

---

## 2. AWS Service Selection for Stonehaven

### 2.1 Full Service Map

```text
  Internet
     │
     ▼
┌────────────┐     ┌─────────────────────────────────────────────────────┐
│ CloudFront │────▶│                    VPC                               │
│  (CDN)     │     │                                                      │
└─────┬──────┘     │  ┌────────────────────────────────────────────────┐ │
      │             │  │  Public Subnet                                 │ │
      │             │  │  ┌──────────────────┐  ┌────────────────────┐ │ │
      │             │  │  │   API Gateway    │  │   ALB (optional)   │ │ │
      │             │  │  │   (HTTP API)     │  │   if using ECS     │ │ │
      │             │  │  └────────┬─────────┘  └─────────┬──────────┘ │ │
      │             │  └───────────┼──────────────────────┼────────────┘ │
      │             │              │                       │              │
      │             │  ┌───────────┼───────────────────────┼────────────┐ │
      │             │  │  Private Subnet (Lambda / ECS)    │            │ │
      │             │  │           │                       │            │ │
      │             │  │  ┌────────▼──────┐  ┌────────────▼──────────┐ │ │
      │             │  │  │  Lambda fns   │  │  ECS Fargate tasks    │ │ │
      │             │  │  │  (API + workers)  │  (alternative)       │ │ │
      │             │  │  └────────┬──────┘  └────────────┬──────────┘ │ │
      │             │  └───────────┼──────────────────────┼────────────┘ │
      │             │              │                       │              │
      │             │  ┌───────────┼───────────────────────┼────────────┐ │
      │             │  │  Private Subnet (Data)            │            │ │
      │             │  │  ┌────────▼──────┐  ┌────────────▼──────────┐ │ │
      │             │  │  │  DocumentDB   │  │  ElastiCache (Redis)  │ │ │
      │             │  │  │  (MongoDB)    │  │  sessions + cache     │ │ │
      │             │  │  └───────────────┘  └───────────────────────┘ │ │
      │             │  └────────────────────────────────────────────────┘ │
      │             └─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  S3 Buckets                                              │
│  - stonehaven-frontend (Next.js static export)          │
│  - stonehaven-uploads (campground images)               │
│  - stonehaven-tf-state (Terraform state)                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Async / Event layer                                     │
│  ┌──────────────────┐   ┌──────────────────┐           │
│  │  SNS Topics      │──▶│  SQS Queues      │──▶ Lambda │
│  │  campground-events    │  image-processing │   workers │
│  │  review-events   │   │  email           │           │
│  └──────────────────┘   └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Service Rationale

| AWS Service | Role in Stonehaven | Why |
|-------------|-------------------|-----|
| **API Gateway (HTTP API)** | Entry point for Lambda API functions | Lower cost and latency than REST API; supports JWT auth |
| **Lambda** | API handlers + async workers | Serverless, scales to zero, pay-per-request |
| **SQS** | Task queues: image processing, email sending | Durable, at-least-once delivery; triggers Lambda workers |
| **SNS** | Domain event fan-out (pub/sub) | One event → multiple SQS subscribers |
| **S3** | Frontend static files + campground image uploads | Cheap, durable, integrates with CloudFront |
| **CloudFront** | CDN for frontend + API caching | Global low-latency, HTTPS termination, WAF integration |
| **DocumentDB** | MongoDB-compatible managed DB in VPC | Zero code change from Mongoose; native AWS networking |
| **ElastiCache (Redis)** | Session store, BullMQ queues (dev), rate limiting | Replaces local Redis container |
| **VPC** | Private networking for DB + Lambda | DB is never publicly accessible |
| **ALB** | Alternative to API Gateway if using ECS containers | Sticky sessions, WebSocket, gRPC support |
| **Secrets Manager** | DB passwords, API keys (Mapbox, Cloudinary) | Rotatable secrets; Lambda fetches at startup |
| **IAM** | Roles for Lambda to access SQS, SNS, S3, Secrets | Least-privilege access |
| **CloudWatch** | Logs, metrics, alarms | Central observability |
| **X-Ray** | Distributed tracing across Lambda + downstream calls | Identify bottlenecks |
| **Route 53** | DNS for your domain | Latency-based routing, health checks |
| **ACM** | SSL/TLS certificates | Free certificates for CloudFront + API Gateway |
| **ECR** | Container registry if using ECS or Lambda containers | Stores Docker images |

### 2.3 Services to Skip (for now)

| Service | Why skip |
|---------|---------|
| **EKS** | Overkill for this scale; Lambda is simpler |
| **RDS** | Stonehaven uses MongoDB; use DocumentDB |
| **AppSync** | GraphQL not needed; REST is already in place |
| **Cognito** | Passport.js handles auth; Cognito adds complexity |
| **Step Functions** | Worth adding only if workflows become multi-step and stateful |

---

## 3. MongoDB Migration Path

### 3.1 Option A: Keep MongoDB Atlas (Recommended for Phase 1)

**No migration required.** MongoDB Atlas connects over the internet (TLS). Lambda functions connect from inside the VPC using Atlas VPC peering or a private endpoint.

**Connection reuse pattern for Lambda (critical):**

```typescript
// src/backend/src/config/database.ts
// Place connection OUTSIDE the handler so it is reused across warm invocations.
import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (cachedConnection) return cachedConnection;

  cachedConnection = await mongoose.connect(process.env.DB_URL!, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });
  return cachedConnection;
}
```

**Pros:** Zero migration, free tier, Atlas has built-in backups and monitoring.
**Cons:** Data leaves your VPC; latency slightly higher than DocumentDB.

---

### 3.2 Option B: AWS DocumentDB (MongoDB-compatible, Phase 2)

DocumentDB speaks the MongoDB 5.0 wire protocol. Your Mongoose code is **unchanged**. The DB lives in a private subnet inside your VPC — Lambda functions in the same VPC reach it without internet.

```text
Lambda (VPC private subnet) ──▶ DocumentDB cluster (VPC private subnet)
```

**Migration steps:**
1. Provision DocumentDB cluster with Terraform (see Section 6)
2. Use `mongodump` on Atlas + `mongorestore` to DocumentDB
3. Update `DB_URL` to DocumentDB endpoint
4. Test with existing Mongoose models — no code change expected
5. Decommission Atlas

**Important DocumentDB limitations vs MongoDB:**
- No `$lookup` pipeline operator in older engine versions (use engine 5.0+)
- `$text` search not supported (use OpenSearch or Atlas Search if needed)
- Transaction support is available but only on replica sets

---

### 3.3 Option C: DynamoDB (Full migration, Phase 3 — optional)

Only consider this if you want:
- True serverless (no VPC, no connection pool)
- Event sourcing or single-table design patterns
- Maximum scalability at extreme load

**Cost:** Your Mongoose/MongoDB data model must be redesigned into DynamoDB access patterns. Repository interfaces (ICampgroundRepository) make this tractable — only the adapter changes.

---

## 4. VPC Architecture

### 4.1 Subnet Design

```text
VPC: 10.0.0.0/16

  Availability Zone A (us-east-1a)     Availability Zone B (us-east-1b)
  ┌────────────────────────────────┐   ┌────────────────────────────────┐
  │  Public Subnet 10.0.1.0/24    │   │  Public Subnet 10.0.2.0/24    │
  │  - NAT Gateway                │   │  - (standby)                   │
  │  - ALB (if used)              │   │                                │
  ├────────────────────────────────┤   ├────────────────────────────────┤
  │  Private Subnet 10.0.11.0/24  │   │  Private Subnet 10.0.12.0/24  │
  │  - Lambda functions           │   │  - Lambda functions            │
  │  - ECS tasks (if used)        │   │  - ECS tasks (if used)        │
  ├────────────────────────────────┤   ├────────────────────────────────┤
  │  Data Subnet 10.0.21.0/24     │   │  Data Subnet 10.0.22.0/24     │
  │  - DocumentDB                 │   │  - DocumentDB replica          │
  │  - ElastiCache Redis          │   │  - ElastiCache replica         │
  └────────────────────────────────┘   └────────────────────────────────┘
```

### 4.2 Security Groups

| Security Group | Inbound | Outbound |
|---------------|---------|---------|
| `sg-lambda` | None (Lambda doesn't accept inbound) | HTTPS to internet (via NAT), DocumentDB port 27017, Redis port 6379 |
| `sg-documentdb` | Port 27017 from `sg-lambda` only | None |
| `sg-redis` | Port 6379 from `sg-lambda` only | None |
| `sg-alb` | HTTPS 443 from internet | HTTP to Lambda/ECS |

**Lambda in VPC note:** Lambda in a VPC requires a NAT Gateway (or VPC Endpoints) to reach internet services (Mapbox, Cloudinary, SQS, SNS). NAT Gateway has a cost; VPC Endpoints are cheaper for AWS-to-AWS traffic.

---

## 5. Lambda-First Deployment

### 5.1 API Handlers

With Clean Architecture, each Lambda handler is a thin inbound adapter:

```typescript
// adapters/inbound/lambda/campgrounds.handler.ts
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { connectDatabase } from '../../../config/database';
import { MongooseCampgroundRepository } from '../../outbound/persistence/MongooseCampgroundRepository';
import { MapboxGeocoderAdapter } from '../../outbound/geocoding/MapboxGeocoderAdapter';
import { GetCampgrounds } from '../../../application/use-cases/campgrounds/GetCampgrounds';
import { CreateCampground } from '../../../application/use-cases/campgrounds/CreateCampground';

// Connection reused across warm invocations
let getCampgrounds: GetCampgrounds;
let createCampground: CreateCampground;

async function init() {
  if (getCampgrounds) return;
  await connectDatabase();
  const campgroundRepo = new MongooseCampgroundRepository();
  const geocoder = new MapboxGeocoderAdapter(process.env.MAPBOX_TOKEN!);
  getCampgrounds = new GetCampgrounds(campgroundRepo);
  createCampground = new CreateCampground(campgroundRepo, geocoder);
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  await init();

  if (event.requestContext.http.method === 'GET') {
    const campgrounds = await getCampgrounds.execute();
    return { statusCode: 200, body: JSON.stringify(campgrounds) };
  }

  if (event.requestContext.http.method === 'POST') {
    const dto = JSON.parse(event.body ?? '{}');
    const campground = await createCampground.execute(dto);
    return { statusCode: 201, body: JSON.stringify(campground) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
```

Notice: no Express, no session middleware, no framework overhead.

### 5.2 Lambda Function Groups

Group related operations into one Lambda to reduce cold-start surface and share the DB connection:

| Lambda function | Routes handled | Trigger |
|----------------|---------------|---------|
| `campgrounds-api` | `GET /campgrounds`, `POST /campgrounds`, `GET /campgrounds/:id`, `PUT /campgrounds/:id`, `DELETE /campgrounds/:id` | API Gateway |
| `reviews-api` | `POST /campgrounds/:id/reviews`, `DELETE /campgrounds/:id/reviews/:rid` | API Gateway |
| `users-api` | `POST /register`, `POST /login`, `POST /logout` | API Gateway |
| `image-processor` | Process/resize uploaded images | SQS event source |
| `email-sender` | Send transactional emails | SQS event source |

### 5.3 Cold Start Mitigation

| Strategy | How |
|---------|-----|
| **Provisioned concurrency** | Configure on API Lambda functions via Terraform for p99 latency requirements |
| **Lambda layers** | Extract `node_modules` into a layer shared across functions |
| **Connection reuse** | DB + Redis clients initialised outside handler (see Section 3.1) |
| **Avoid VPC if possible** | Put Lambda outside VPC if using Atlas (public) and VPC Endpoints for SQS/SNS |
| **Use Lambda SnapStart** | Available for Java; for Node.js, minimise initialisation code |

### 5.4 Session Management

Lambda is stateless — `express-session` stored in MongoDB does not translate cleanly. Two options:

**Option A — JWT (recommended for Lambda):**
- On login: issue a signed JWT (stored in `HttpOnly` cookie or `Authorization` header)
- No session store needed; Lambda verifies the token on each request
- Remove `express-session` and `connect-mongo`; add `jsonwebtoken`

**Option B — Redis sessions:**
- Keep `express-session`; switch `connect-mongo` to `connect-redis` pointing at ElastiCache
- Works with Lambda but adds a Redis dependency and a VPC requirement

---

## 6. Event-Driven Architecture

### 6.1 Domain Events → SNS → SQS → Lambda

```text
  Use Case (CreateCampground)
       │
       │ emits domain event
       ▼
  SNS Topic: campground-events
       │
       ├──▶ SQS: image-processing-queue ──▶ Lambda: image-processor
       │
       └──▶ SQS: notification-queue ──▶ Lambda: email-sender
```

**Domain event definition (in domain layer):**

```typescript
// domain/events/CampgroundCreated.ts
export interface CampgroundCreated {
  type: 'CAMPGROUND_CREATED';
  campgroundId: string;
  title: string;
  authorId: string;
  imageUrls: string[];
  occurredAt: string;
}
```

**Application port for event publishing:**

```typescript
// application/ports/IEventPublisher.ts
export interface IEventPublisher {
  publish<T>(topic: string, event: T): Promise<void>;
}
```

**SNS adapter (outbound adapter, production):**

```typescript
// adapters/outbound/events/SNSEventPublisher.ts
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export class SNSEventPublisher implements IEventPublisher {
  private readonly client = new SNSClient({ region: process.env.AWS_REGION });

  async publish<T>(topicArn: string, event: T): Promise<void> {
    await this.client.send(new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify(event),
      MessageAttributes: {
        eventType: { DataType: 'String', StringValue: (event as any).type },
      },
    }));
  }
}
```

**Redis/BullMQ adapter (local dev):**

```typescript
// adapters/outbound/events/BullMQEventPublisher.ts
import { Queue } from 'bullmq';

export class BullMQEventPublisher implements IEventPublisher {
  async publish<T>(queueName: string, event: T): Promise<void> {
    const queue = new Queue(queueName, { connection: redisConnection });
    await queue.add((event as any).type, event);
  }
}
```

The use case receives `IEventPublisher` — it does not know whether it's talking to SNS or Redis. Swap adapters in the composition root based on `NODE_ENV`.

### 6.2 SQS Worker Lambda

```typescript
// adapters/inbound/lambda/image-processor.handler.ts
import { SQSHandler } from 'aws-lambda';

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);
    const domainEvent = JSON.parse(message.Message); // SNS wraps in Message field

    if (domainEvent.type === 'CAMPGROUND_CREATED') {
      // resize + optimize images in S3
      await processImages(domainEvent.imageUrls, domainEvent.campgroundId);
    }
  }
};
```

### 6.3 SNS + SQS Configuration (Event Patterns)

```text
SNS Topic: arn:aws:sns:us-east-1:ACCOUNT:stonehaven-campground-events
  │
  ├── Subscription: SQS queue — image-processing-queue
  │     Filter policy: { "eventType": ["CAMPGROUND_CREATED", "CAMPGROUND_UPDATED"] }
  │
  └── Subscription: SQS queue — notification-queue
        Filter policy: { "eventType": ["CAMPGROUND_CREATED", "REVIEW_POSTED"] }
```

SNS filter policies ensure each queue only receives relevant events — avoids unnecessary Lambda invocations.

---

## 7. Frontend on AWS

### 7.1 Option A: S3 + CloudFront (Static Export)

If the Next.js app uses only static generation (SSG/ISR with no server-side rendering per request):

```bash
# next.config.js
output: 'export'   # generates /out directory of static HTML/JS/CSS
```

```text
Deploy:
  next build → out/  →  S3 bucket (stonehaven-frontend)  →  CloudFront distribution
```

**Pros:** Zero server cost, instant global delivery, extreme simplicity.
**Cons:** No SSR (no `getServerSideProps`); API routes are unavailable.

### 7.2 Option B: Lambda@Edge or CloudFront Functions (SSR)

For SSR pages (e.g. campground detail with dynamic data):

```text
CloudFront  →  Lambda@Edge (Origin Request trigger)
                     │
                     └── runs Next.js server-side rendering
                         returns HTML to CloudFront → cached at edge
```

**Pros:** SSR at the edge; low latency; still globally cached.
**Cons:** Lambda@Edge has stricter limits (128 MB memory, 5s timeout for origin-request).

### 7.3 Option C: ECS Fargate (Full Next.js server — current Docker approach)

Use the existing `Dockerfile.frontend` (standalone output) deployed on ECS Fargate behind an ALB.

```text
CloudFront  →  ALB  →  ECS Fargate task (next start)
```

**Pros:** Full Next.js feature set; easy to reason about; matches the Docker setup exactly.
**Cons:** Containers always running → baseline cost even at zero traffic.

**Recommendation:** Start with Option C (ECS) since the Dockerfile is ready. Migrate to S3+CloudFront if you switch to static export later.

---

## 8. Terraform IaC Structure

### 8.1 Project Layout

```
infrastructure/
  terraform/
    backend.tf              # Remote state: S3 bucket + DynamoDB lock table
    providers.tf            # AWS provider configuration
    variables.tf            # Input variables (region, env, domain, etc.)
    outputs.tf              # Exported values (API URL, CloudFront domain, etc.)

    modules/
      vpc/                  # VPC, subnets, route tables, NAT Gateway, IGW
      api-gateway/          # HTTP API, stages, custom domain
      lambda/               # Lambda function, IAM role, layers, env vars
      sqs/                  # SQS queue, DLQ, redrive policy
      sns/                  # SNS topic, subscriptions, filter policies
      documentdb/           # DocumentDB cluster, subnet group, security group
      elasticache/          # Redis cluster, subnet group, security group
      s3/                   # Buckets: frontend, uploads, tf-state
      cloudfront/           # Distribution, origin configs, behaviours
      ecs/                  # ECS cluster, task definition, service, ALB
      secrets/              # Secrets Manager secrets
      iam/                  # Shared IAM policies and roles

    environments/
      dev/
        main.tf             # Instantiates modules with dev settings
        terraform.tfvars    # Dev-specific variable values
      prod/
        main.tf             # Instantiates modules with prod settings
        terraform.tfvars    # Prod-specific variable values (larger instances, multi-AZ)
```

### 8.2 Remote State Configuration

```hcl
# infrastructure/terraform/backend.tf
terraform {
  backend "s3" {
    bucket         = "stonehaven-tf-state"
    key            = "stonehaven/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "stonehaven-tf-locks"
    encrypt        = true
  }
}
```

Create the S3 bucket and DynamoDB table once manually (bootstrap), then all subsequent state is remote.

### 8.3 Key Module Snippets

**VPC module (simplified):**

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr           # "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "${var.env}-stonehaven-vpc" }
}

resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
}

resource "aws_subnet" "data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.data_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
}
```

**Lambda module (simplified):**

```hcl
# modules/lambda/main.tf
resource "aws_lambda_function" "api" {
  function_name = "${var.env}-stonehaven-${var.name}"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = var.image_uri           # ECR image or ZIP S3 key

  environment {
    variables = {
      NODE_ENV   = var.env
      DB_URL     = data.aws_secretsmanager_secret_version.db_url.secret_string
      REDIS_URL  = "redis://${var.redis_endpoint}:6379"
    }
  }

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_sg_id]
  }

  reserved_concurrent_executions = var.reserved_concurrency
}

resource "aws_lambda_event_source_mapping" "sqs" {
  count            = var.sqs_trigger ? 1 : 0
  event_source_arn = var.sqs_queue_arn
  function_name    = aws_lambda_function.api.arn
  batch_size       = 10
}
```

**SQS + SNS (simplified):**

```hcl
# modules/sqs/main.tf
resource "aws_sqs_queue" "main" {
  name                       = "${var.env}-stonehaven-${var.name}"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 86400   # 1 day

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue" "dlq" {
  name = "${var.env}-stonehaven-${var.name}-dlq"
}

# SNS subscription
resource "aws_sns_topic_subscription" "sqs" {
  topic_arn     = var.sns_topic_arn
  protocol      = "sqs"
  endpoint      = aws_sqs_queue.main.arn
  filter_policy = jsonencode(var.filter_policy)
}
```

### 8.4 Terraform Workflow

```bash
# One-time: create remote state bucket (from AWS CLI)
aws s3 mb s3://stonehaven-tf-state --region us-east-1
aws dynamodb create-table \
  --table-name stonehaven-tf-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Init and plan
cd infrastructure/terraform/environments/dev
terraform init
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Destroy (dev only)
terraform destroy
```

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - uses: aws-actions/amazon-ecr-login@v2
      - name: Build and push backend image
        run: |
          docker build -f infra/docker/Dockerfile.backend -t $ECR_REGISTRY/stonehaven-backend:$GITHUB_SHA .
          docker push $ECR_REGISTRY/stonehaven-backend:$GITHUB_SHA

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: hashicorp/setup-terraform@v3
      - run: terraform -chdir=infrastructure/terraform/environments/prod apply -auto-approve
```

---

## 10. Migration Phases

### Phase 0 — Architecture (now, before AWS)

- [ ] Migrate to Clean Architecture + DDD (Steps 1–3 in ARCHITECTURE_MIGRATION.md)
- [ ] Introduce repository interfaces for campground, review, user
- [ ] Extract use cases; move geocoding behind `IGeocoder` port
- [ ] Add `IEventPublisher` port; wire `BullMQEventPublisher` locally
- [ ] Add `/health` endpoint; add Redis to docker-compose
- [ ] Verify all tests pass with mock repositories (no DB required)

### Phase 1 — AWS Foundation

- [ ] Create AWS account + IAM users (principle of least privilege)
- [ ] Bootstrap Terraform state (S3 + DynamoDB lock table)
- [ ] Write and apply VPC module (2 AZs, public/private/data subnets)
- [ ] Provision ElastiCache Redis (replaces local Redis container)
- [ ] Provision DocumentDB or connect MongoDB Atlas via VPC peering
- [ ] Set up Secrets Manager with DB URL, session secret, Mapbox token
- [ ] Create ECR repository; push backend Docker image
- [ ] Deploy backend as Lambda (API Gateway trigger) or ECS Fargate
- [ ] Set up S3 + CloudFront for frontend (static export or ECS)
- [ ] Set up Route 53 + ACM certificate
- [ ] Test end-to-end in AWS dev environment

### Phase 2 — Async / Event-Driven

- [ ] Create SNS topics (campground-events, review-events)
- [ ] Create SQS queues (image-processing, email, notifications) with DLQs
- [ ] Add SNS filter policies per queue
- [ ] Implement `SNSEventPublisher` adapter; wire in composition root
- [ ] Deploy `image-processor` Lambda with SQS event source mapping
- [ ] Deploy `email-sender` Lambda with SQS event source mapping
- [ ] Verify domain events flow end-to-end (API → SNS → SQS → Lambda worker)
- [ ] Set CloudWatch alarms on DLQ depth (alerts on failed messages)

### Phase 3 — Hardening & Observability

- [ ] Enable X-Ray tracing on all Lambdas
- [ ] Set up CloudWatch dashboards (latency, error rate, SQS depth, Lambda throttles)
- [ ] Configure CloudFront WAF (rate limiting, geo-blocking)
- [ ] Enable DocumentDB automated backups and point-in-time recovery
- [ ] Add provisioned concurrency to API Lambdas if p99 latency is unacceptable
- [ ] Set up multi-AZ DocumentDB replica
- [ ] Configure Lambda reserved concurrency per function
- [ ] Implement JWT auth (remove session-based auth for Lambda compatibility)

---

## 11. Cost Considerations

### Estimated monthly cost (low traffic, dev/prod)

| Service | Tier | Estimated cost |
|---------|------|----------------|
| Lambda (API) | 1M requests/month | ~$0.20 |
| API Gateway (HTTP) | 1M requests/month | ~$1.00 |
| Lambda (workers) | 100K SQS-triggered | ~$0.02 |
| SQS | 1M messages | ~$0.40 |
| SNS | 1M notifications | ~$0.50 |
| S3 (frontend + uploads) | 10 GB | ~$0.25 |
| CloudFront | 10 GB transfer | ~$0.85 |
| ElastiCache t4g.micro | 1 node | ~$12 |
| DocumentDB t4g.medium | 1 instance | ~$60 |
| NAT Gateway | 30 GB data | ~$35 |
| Route 53 | 1 hosted zone | ~$0.50 |
| **Total** | | **~$110/month** |

**Biggest cost levers:**
1. NAT Gateway: ~$35/month — use VPC Endpoints for SQS/SNS/S3 to reduce data processed
2. DocumentDB: use `t4g.medium` in dev, scale up in prod; or keep Atlas free tier
3. ElastiCache: use `t4g.micro` in dev; multi-AZ only in prod

**Cost vs alternatives:**
- Render (current): ~$7–$25/month for backend + database — cheaper for low traffic
- AWS Lambda-first: break-even at ~1M requests/month; cheaper at scale; more control
