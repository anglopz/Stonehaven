# ReCamp - Modernized Campground Application

Full-stack campground application built with TypeScript, React (Next.js), and Node.js/Express.

## 🎯 Migration Status

- ✅ **Phase 1: Foundation** - Complete
- ✅ **Phase 2: Backend Migration** - Complete (TypeScript, Service Layer, Zod Validation)
- 🔄 **Phase 3: Frontend Migration** - Pending (EJS → React/Next.js)
- ⏳ **Phase 4: Testing** - Pending
- ⏳ **Phase 5: DevOps** - Pending

See [MIGRATION_STATUS.md](docs/MIGRATION_STATUS.md) for detailed progress.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Atlas)
- Docker (optional, for containerized development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Start development servers:
   ```bash
   # Start both backend and frontend
   npm run dev

   # Or start individually
   npm run dev:backend   # Backend on port 3000
   npm run dev:frontend   # Frontend on port 3001
   ```

### Docker Development

```bash
# Start MongoDB only
docker-compose -f docker-compose.dev.yml up -d

# Start full stack
docker-compose up
```

## 📁 Project Structure

```
recamp/
├── src/
│   ├── backend/          # Express API (TypeScript)
│   ├── frontend/         # Next.js App (TypeScript)
│   └── shared/           # Shared types and utilities
├── infra/                # Infrastructure as Code
├── tests/                # Test suites
├── docs/                 # Documentation
└── scripts/              # Build and utility scripts
```

## 🛠️ Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both applications for production
- `npm run test` - Run all tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Type check TypeScript code

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md)
- [Migration Plan](./docs/project_migration_plan.md)
- [Migration Status](./docs/MIGRATION_STATUS.md)

## 🔄 Migration Status

This project is currently being migrated from a legacy JavaScript/EJS stack to a modern TypeScript/React stack. See [MIGRATION_STATUS.md](./docs/MIGRATION_STATUS.md) for current progress.

## 📝 License

ISC
