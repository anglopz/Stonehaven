# 🚀 Deployment Guide - Recamp to Render

**Project**: Recamp Modernization  
**Platform**: Render.com  
**Date**: February 7, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Steps](#pre-deployment-steps)
4. [Render Setup](#render-setup)
5. [Environment Variables](#environment-variables)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## Overview

This guide walks through deploying the modernized Recamp application to Render.com. The application consists of:

- **Backend**: Node.js/Express TypeScript API (Port 3000)
- **Frontend**: Next.js 14 React application (Port 3001)
- **Database**: MongoDB (managed by Render or Atlas)

### Architecture

```
┌─────────────────┐
│   Users/Clients │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Render  │
    │  CDN/LB  │
    └────┬─────┘
         │
    ┌────▼────────────────────┐
    │                         │
┌───▼────────┐    ┌──────────▼────┐
│  Frontend  │    │    Backend     │
│  Next.js   │───▶│   Express API  │
│  (3001)    │    │    (3000)      │
└────────────┘    └────────┬───────┘
                           │
                      ┌────▼────────┐
                      │   MongoDB   │
                      │   Database  │
                      └─────────────┘
```

---

## Prerequisites

### Required Accounts
- ✅ GitHub account with repository access
- ✅ Render.com account (free tier available)
- ✅ MongoDB Atlas account (or use Render's MongoDB)
- ✅ Cloudinary account for image uploads
- ✅ Mapbox account for map functionality

### Required Credentials
- [ ] MongoDB connection string
- [ ] Cloudinary: Cloud Name, API Key, API Secret
- [ ] Mapbox access token
- [ ] Session secret (generate a random string)

### Local Requirements
- ✅ Node.js 18+ installed
- ✅ npm 9+ installed
- ✅ Git installed
- ✅ Repository cloned locally

---

## Pre-Deployment Steps

### 1. Run Pre-Deployment Verification

```bash
# From project root
bash scripts/pre-deployment-check.sh
```

This script will verify:
- ✅ Dependencies installed
- ✅ All tests passing (369 tests)
- ✅ Builds successful
- ✅ Type checking passes
- ✅ Configuration files present

**Expected Output:**
```
╔════════════════════════════════════════════╗
║                                            ║
║     ✅ ALL CHECKS PASSED ✅               ║
║                                            ║
║     🚀 READY FOR DEPLOYMENT 🚀            ║
║                                            ║
╚════════════════════════════════════════════╝
```

### 2. Build Verification

```bash
# Test builds locally
bash scripts/verify-build.sh
```

This ensures both backend and frontend build successfully.

### 3. Docker Testing (Optional)

```bash
# Test Docker images
bash scripts/verify-docker.sh
```

Only necessary if using Docker for local development or debugging.

---

## Render Setup

### Option 1: Using render.yaml (Recommended)

1. **Push render.yaml to repository**
   ```bash
   git add render.yaml
   git commit -m "Add Render blueprint configuration"
   git push origin main
   ```

2. **Create New Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository: `recamp`
   - Render will automatically detect `render.yaml`
   - Review the services to be created:
     - `recamp-backend` (Web Service)
     - `recamp-frontend` (Web Service)
     - `recamp-mongodb` (Database)

3. **Configure Environment Variables**
   - Render will prompt for required secrets
   - See [Environment Variables](#environment-variables) section

### Option 2: Manual Setup

#### Step 1: Create MongoDB Database

1. Go to Render Dashboard → "New" → "PostgreSQL/MongoDB"
2. Select "MongoDB"
3. Configure:
   - **Name**: `recamp-mongodb`
   - **Database**: `re-camp`
   - **User**: `recamp-user`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free tier or Starter
4. Click "Create Database"
5. **Save the Internal Connection String** for backend configuration

#### Step 2: Create Backend Service

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `recamp-backend`
   - **Environment**: Node
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: 
     ```bash
     npm ci && npm run build:backend
     ```
   - **Start Command**: 
     ```bash
     npm run start:backend
     ```
   - **Plan**: Free tier or Starter
4. Add environment variables (see below)
5. Advanced Settings:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes

#### Step 3: Create Frontend Service

1. Go to Render Dashboard → "New" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name**: `recamp-frontend`
   - **Environment**: Node
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Build Command**: 
     ```bash
     npm ci && npm run build:frontend
     ```
   - **Start Command**: 
     ```bash
     npm run start:frontend
     ```
   - **Plan**: Free tier or Starter
4. Add environment variables (see below)
5. Advanced Settings:
   - **Health Check Path**: `/`
   - **Auto-Deploy**: Yes

---

## Environment Variables

### Backend Environment Variables

Add these to the **backend service** on Render:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `PORT` | `3000` | Default port for backend |
| `DB_URL` | _MongoDB connection string_ | From Render MongoDB or Atlas |
| `SECRET` | _random string_ | Generate with `openssl rand -base64 32` |
| `MAPBOX_TOKEN` | _your Mapbox token_ | Get from mapbox.com |
| `CLOUDINARY_CLOUD_NAME` | _your cloud name_ | From cloudinary.com |
| `CLOUDINARY_KEY` | _your API key_ | From cloudinary.com |
| `CLOUDINARY_SECRET` | _your API secret_ | From cloudinary.com |

**To add variables on Render:**
1. Go to your backend service
2. Click "Environment" tab
3. Click "Add Environment Variable"
4. Enter Key and Value
5. Save changes

### Frontend Environment Variables

Add these to the **frontend service** on Render:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Sets production mode |
| `NEXT_PUBLIC_API_URL` | `https://recamp-backend.onrender.com` | Backend service URL |

**Important**: Replace `recamp-backend` with your actual backend service name on Render.

### Generating Secure Secrets

```bash
# Generate session secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Deployment Process

### Initial Deployment

#### 1. GitHub Setup

```bash
# Ensure all changes are committed
git add .
git commit -m "chore: prepare for production deployment"
git push origin main
```

#### 2. Trigger Deployment on Render

After pushing to `main`:
- Render will automatically detect the push
- Both services will start building
- You can monitor progress in Render dashboard

#### 3. Monitor Build Logs

1. Go to Render Dashboard
2. Click on `recamp-backend` service
3. View "Logs" tab
4. Verify build completes successfully

**Expected build output:**
```
==> Building...
==> Installing dependencies...
==> Running build command: npm ci && npm run build:backend
==> Build completed successfully!
==> Starting deployment...
```

Repeat for `recamp-frontend` service.

#### 4. Wait for Deployment

- Backend typically takes 3-5 minutes
- Frontend typically takes 4-6 minutes
- First deployment may take longer

### Subsequent Deployments

Once set up, every push to `main` will trigger automatic deployment:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Render will automatically:
1. Pull latest code
2. Run tests (if configured in CI)
3. Build application
4. Deploy new version
5. Health check the service
6. Route traffic to new deployment

---

## Post-Deployment Verification

### 1. Check Service Health

**Backend Health Check:**
```bash
curl https://recamp-backend.onrender.com/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T...",
  "uptime": 123.45,
  "environment": "production",
  "database": "connected"
}
```

**Frontend Health Check:**
```bash
curl https://recamp-frontend.onrender.com/
```

Should return HTML without errors.

### 2. Verify Database Connection

Check backend logs for:
```
✅ MongoDB connected successfully
🚀 Server running on port 3000
📍 Environment: production
```

### 3. Test Application Functionality

#### User Registration
1. Go to `https://recamp-frontend.onrender.com/register`
2. Create a test account
3. Verify email/username validation
4. Submit registration

#### User Login
1. Go to `https://recamp-frontend.onrender.com/login`
2. Login with test account
3. Verify redirect to campgrounds page

#### Create Campground
1. Click "New Campground"
2. Fill out form with:
   - Title
   - Location
   - Price
   - Description
   - Images (test Cloudinary upload)
3. Submit form
4. Verify campground appears on map (Mapbox)

#### Submit Review
1. Open any campground
2. Submit a review with rating
3. Verify review appears
4. Test edit/delete (as owner)

### 4. Performance Check

Use tools like:
- **Lighthouse**: Chrome DevTools → Lighthouse
- **GTmetrix**: https://gtmetrix.com/
- **WebPageTest**: https://www.webpagetest.org/

**Target Metrics:**
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Total Load Time: < 5s

### 5. Monitor Error Logs

Check Render dashboard for any errors in the first hour:
- Backend logs: Look for 500 errors
- Frontend logs: Look for failed API calls
- Database logs: Check connection issues

---

## Troubleshooting

### Common Issues

#### 1. Build Fails - TypeScript Errors

**Symptoms:**
```
error TS2304: Cannot find name 'xyz'
```

**Solution:**
```bash
# Fix TypeScript errors locally
npm run type-check

# Fix errors, then redeploy
git add .
git commit -m "fix: resolve TypeScript errors"
git push origin main
```

#### 2. Backend Fails to Start - Database Connection

**Symptoms:**
```
MongooseError: connection refused
```

**Solutions:**
- Verify `DB_URL` environment variable is correct
- Check MongoDB service is running on Render
- Verify IP whitelist (if using Atlas)
- Check MongoDB credentials

#### 3. Frontend Can't Connect to Backend

**Symptoms:**
- API calls failing with 404/500
- CORS errors in browser console

**Solutions:**
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend service is running
- Verify backend health endpoint works
- Check CORS configuration in backend

#### 4. Images Not Uploading

**Symptoms:**
- File upload fails
- Cloudinary errors in logs

**Solutions:**
- Verify Cloudinary credentials
- Check `CLOUDINARY_*` environment variables
- Test Cloudinary API manually
- Check file size limits

#### 5. Map Not Loading

**Symptoms:**
- Map shows blank area
- Mapbox errors in console

**Solutions:**
- Verify `MAPBOX_TOKEN` is valid
- Check token permissions on Mapbox
- Test token with simple API call
- Verify token not expired

#### 6. Session Issues - Users Can't Stay Logged In

**Symptoms:**
- Users logged out randomly
- Session errors in logs

**Solutions:**
- Verify `SECRET` environment variable is set
- Check MongoDB session store is working
- Increase session timeout
- Check cookie settings (secure, sameSite)

### Accessing Logs

**Render Dashboard:**
1. Go to your service
2. Click "Logs" tab
3. Filter by time range
4. Download logs if needed

**Real-time logs:**
```bash
# Using Render CLI (install with: npm install -g render-cli)
render logs --service recamp-backend --follow
```

---

## Rollback Procedures

### Quick Rollback on Render

If a deployment causes issues:

1. **Via Dashboard:**
   - Go to service on Render
   - Click "Deploys" tab
   - Find previous successful deployment
   - Click "Rollback to this deploy"

2. **Via Git Revert:**
   ```bash
   # Revert last commit
   git revert HEAD
   git push origin main
   
   # Or revert to specific commit
   git revert <commit-hash>
   git push origin main
   ```

3. **Emergency Fix:**
   ```bash
   # Create hotfix branch
   git checkout -b hotfix/critical-issue
   
   # Fix the issue
   # ... make changes ...
   
   # Commit and deploy
   git add .
   git commit -m "hotfix: resolve critical issue"
   git checkout main
   git merge hotfix/critical-issue
   git push origin main
   ```

### Rollback Checklist

- [ ] Identify the problematic deployment
- [ ] Verify previous version was working
- [ ] Rollback via Render dashboard
- [ ] Verify services are healthy
- [ ] Test critical functionality
- [ ] Monitor logs for 30 minutes
- [ ] Document issue and resolution

---

## Advanced: CI/CD Integration

The project has GitHub Actions configured for automated testing and deployment.

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push and PR:
1. Lint check
2. Backend tests (254 tests)
3. Frontend tests (115 tests)
4. Build verification
5. Coverage reporting

### CD Pipeline (`.github/workflows/cd.yml`)

Runs on push to `main`:
1. Run all CI checks
2. Build application
3. Deploy to Render (if checks pass)

### GitHub Secrets Required

Add these to GitHub repository settings:

1. Go to repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `RENDER_SERVICE_ID` - Backend service ID from Render
   - `RENDER_API_KEY` - API key from Render account settings

**To get Render API key:**
1. Go to Render Dashboard → Account Settings
2. Click "API Keys"
3. Create new API key
4. Copy and save securely

---

## Monitoring and Maintenance

### Regular Checks

**Daily:**
- [ ] Check error rates in Render dashboard
- [ ] Verify services are running
- [ ] Monitor response times

**Weekly:**
- [ ] Review logs for warnings
- [ ] Check database size and growth
- [ ] Verify backup status
- [ ] Review user feedback

**Monthly:**
- [ ] Update dependencies
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup restoration test

### Uptime Monitoring

Consider setting up external monitoring:
- **UptimeRobot**: https://uptimerobot.com/
- **Pingdom**: https://www.pingdom.com/
- **StatusCake**: https://www.statuscake.com/

### Error Tracking

Integrate error tracking service:
- **Sentry**: https://sentry.io/
- **Rollbar**: https://rollbar.com/
- **Bugsnag**: https://www.bugsnag.com/

---

## Cost Estimates

### Render Free Tier
- ✅ Web Services: Free (sleeps after 15 min inactivity)
- ✅ Limitations: 
  - Cold start delay (~30 seconds)
  - 750 hours/month per service
  - Limited resources

### Render Starter Plan (~$14/month)
- ✅ No sleep
- ✅ Always-on
- ✅ Better resources
- ✅ Suitable for production

### Additional Services
- MongoDB Atlas Free: ✅ Free (512MB)
- Cloudinary Free: ✅ Free (25 credits/month)
- Mapbox Free: ✅ Free (50k requests/month)

**Total Estimated Cost:**
- Development/Testing: $0/month (all free tiers)
- Production (light traffic): $14-28/month
- Production (moderate traffic): $50-100/month

---

## Support and Resources

### Documentation
- **Project Docs**: `/docs` directory
- **Testing Guide**: `/docs/TESTING_GUIDE.md`
- **Migration Status**: `/docs/MIGRATION_STATUS.md`
- **Deployment Readiness**: `/docs/DEPLOYMENT_READINESS.md`

### External Documentation
- **Render Docs**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Express Docs**: https://expressjs.com/
- **MongoDB Docs**: https://www.mongodb.com/docs/

### Community
- **Render Community**: https://community.render.com/
- **Stack Overflow**: Tag questions with `render.com`

---

## Checklist: Pre-Deployment

Print this checklist and verify each item:

### Code Quality
- [ ] All 369 tests passing
- [ ] No linter errors
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] Documentation updated

### Infrastructure
- [ ] Render services created
- [ ] MongoDB provisioned
- [ ] Environment variables configured
- [ ] Health checks working
- [ ] Monitoring configured

### Security
- [ ] Secrets not in repository
- [ ] Environment variables set correctly
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting considered

### Performance
- [ ] Builds optimized
- [ ] Images compressed
- [ ] Caching configured
- [ ] Database indexed
- [ ] Load tested (basic)

### Deployment
- [ ] GitHub Actions configured
- [ ] Render blueprint ready
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Maintenance window scheduled (if needed)

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Sign Off**: _________________

---

*Last Updated: February 7, 2026*  
*DevOps Agent - Phase 5*
