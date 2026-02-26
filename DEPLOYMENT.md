# 🚀 Deployment Guide

This guide covers deploying the Stonehaven application to production.

## Quick Deploy to Render

The easiest way to deploy is using the `render.yaml` blueprint:

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect `render.yaml` and create the services
4. Configure environment variables (see below)

## Environment Variables

### Backend Service

Required environment variables:

```bash
DB_URL=mongodb+srv://user:password@cluster.mongodb.net/stonehaven
SECRET=your-secure-random-secret-key
MAPBOX_TOKEN=pk.your-mapbox-token
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret
NODE_ENV=production
PORT=3000
```

### Frontend Service

Required environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NODE_ENV=production
PORT=3001
```

## Build Commands

### Backend
- **Build Command**: `npm run build:backend`
- **Start Command**: `npm run start:backend`
- **Root Directory**: `/` (root)

### Frontend
- **Build Command**: `npm run build:frontend`
- **Start Command**: `npm run start:frontend`
- **Root Directory**: `/` (root)

## Manual Deployment Steps

### 1. Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] API keys and secrets secured

### 2. Build Verification

```bash
# Install dependencies
npm install

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend

# Verify builds
ls -la dist/backend/
ls -la src/frontend/.next/
```

### 3. Deploy Backend

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `stonehaven-backend`
   - **Environment**: Node
   - **Build Command**: `npm run build:backend`
   - **Start Command**: `npm run start:backend`
   - **Root Directory**: `/`
4. Add all backend environment variables
5. Deploy

### 4. Deploy Frontend

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `stonehaven-frontend`
   - **Environment**: Node
   - **Build Command**: `npm run build:frontend`
   - **Start Command**: `npm run start:frontend`
   - **Root Directory**: `/`
4. Add frontend environment variables (including backend URL)
5. Deploy

## Docker Deployment

If deploying with Docker:

```bash
# Build images
docker build -f infra/docker/Dockerfile.backend -t stonehaven-backend .
docker build -f infra/docker/Dockerfile.frontend -t stonehaven-frontend .

# Run containers
docker run -p 3000:3000 --env-file .env stonehaven-backend
docker run -p 3001:3001 --env-file .env stonehaven-frontend
```

## Health Checks

The backend includes a health check endpoint:

- **URL**: `GET /health`
- **Response**: `{ "status": "ok", "timestamp": "..." }`

Configure this in Render for automatic health monitoring.

## Troubleshooting

### Build Failures

1. Check Node.js version (requires >= 18.0.0)
2. Verify all dependencies are in `package.json`
3. Check build logs for TypeScript errors
4. Ensure environment variables are set

### Runtime Errors

1. Check application logs
2. Verify database connection
3. Confirm environment variables are correct
4. Check API key validity (Mapbox, Cloudinary)

### Frontend Not Connecting to Backend

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check CORS settings in backend
3. Ensure backend is running and accessible
4. Check network tab in browser dev tools

## Post-Deployment

After successful deployment:

1. Test all critical user flows
2. Monitor error logs
3. Verify database connections
4. Check API response times
5. Test file uploads (Cloudinary)
6. Verify map functionality (Mapbox)

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Backend API Documentation](./docs/BACKEND_API.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
