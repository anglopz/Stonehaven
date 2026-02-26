# Stonehaven - Modernized Campground Application

Full-stack campground application built with TypeScript, React (Next.js), and Node.js/Express.

## ✨ Features

- 🏕️ Campground listings with search and filtering
- 📍 Interactive maps powered by Mapbox
- 📸 Image uploads via Cloudinary
- 👤 User authentication and authorization
- ⭐ Review system with ratings
- 📱 Responsive design with Tailwind CSS
- 🔒 Secure API with Zod validation
- 🧪 Comprehensive test coverage (369 tests)

## 🚀 Deployment

Ready for production deployment! See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

**Quick Deploy to Render:**
1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect `render.yaml` and create services
4. Configure environment variables
5. Deploy!

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
stonehaven/
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

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Setup Guide](./docs/SETUP.md) - Local development setup
- [Backend API](./docs/BACKEND_API.md) - API documentation
- [Testing Guide](./docs/TESTING_GUIDE.md) - Testing documentation
- [Migration Status](./docs/migration/MIGRATION_STATUS.md) - Migration progress

## 🏗️ Architecture

- **Backend**: Express.js API with TypeScript, Mongoose, Passport.js
- **Frontend**: Next.js 14 with React, TypeScript, Tailwind CSS
- **Database**: MongoDB (Mongoose ODM)
- **Storage**: Cloudinary for images
- **Maps**: Mapbox GL JS
- **State Management**: Zustand
- **Validation**: Zod schemas

## 📝 License

ISC
