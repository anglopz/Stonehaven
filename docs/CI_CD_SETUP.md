# CI/CD Setup Guide

## Current Status

✅ **CI Pipeline**: Configured and working (with warnings)  
⚠️ **CD Pipeline**: Requires manual configuration on Render

---

## CI Pipeline (GitHub Actions)

The CI pipeline runs on every push and pull request to `main` or `develop` branches.

### What It Does

1. **Lint Check** ⚠️ (non-blocking)
   - Runs ESLint
   - Checks Prettier formatting
   - Currently set to continue on error (warnings won't block)

2. **Backend Tests** ✅
   - Runs all 254 backend tests
   - Generates coverage reports
   - Uses MongoDB Memory Server (no external DB needed)

3. **Frontend Tests** ✅
   - Runs all 115 frontend tests
   - Generates coverage reports

4. **Build Verification** ✅
   - Builds backend TypeScript
   - Builds frontend Next.js
   - Uploads artifacts

### Known Issues & Solutions

#### ESLint Warnings

**Status**: Non-blocking  
**Impact**: Pipeline continues even with warnings

**To fix permanently:**
1. See warnings in CI logs
2. Fix issues locally:
   ```bash
   npm run lint
   ```
3. Commit fixes
4. Re-enable strict checking in `.github/workflows/ci.yml`

#### Codecov Upload

**Status**: Disabled (requires token)  
**Impact**: Coverage not uploaded to Codecov.io

**To enable:**
1. Create account at https://codecov.io
2. Add repository
3. Get upload token
4. Add `CODECOV_TOKEN` to GitHub Secrets
5. Enable in `.github/workflows/ci.yml`:
   ```yaml
   - name: Upload backend coverage to Codecov
     if: true  # Change from false
   ```

---

## CD Pipeline (Render Deployment)

### Current Setup: Auto-Deploy

**Recommended**: Use Render's built-in GitHub auto-deploy

**Steps:**
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your service (backend or frontend)
3. Go to "Settings" → "Build & Deploy"
4. Enable "Auto-Deploy" for branch `main`
5. Every push to `main` will auto-deploy

**No GitHub Actions needed!** ✅

### Alternative: Webhook Deploy

If you prefer webhook-based deployment:

**Steps:**
1. Get deploy hook from Render:
   - Go to service → Settings → Deploy Hook
   - Copy the webhook URL
2. Add to GitHub Secrets as `RENDER_DEPLOY_HOOK_URL`
3. Enable in `.github/workflows/cd.yml`:
   ```yaml
   - name: Deploy to Render via Webhook
     run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
   ```

### Alternative: Render API Deploy

Using Render's API:

**Steps:**
1. Get API key from Render:
   - Account Settings → API Keys
   - Create new key
2. Get service IDs:
   ```bash
   curl -H "Authorization: Bearer $RENDER_API_KEY" \
     https://api.render.com/v1/services
   ```
3. Add secrets to GitHub:
   - `RENDER_API_KEY`
   - `RENDER_SERVICE_ID_BACKEND`
   - `RENDER_SERVICE_ID_FRONTEND`
4. Update `.github/workflows/cd.yml`:
   ```yaml
   - name: Trigger Render Deploy
     run: |
       curl -X POST \
         -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
         -H "Content-Type: application/json" \
         https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID_BACKEND }}/deploys
   ```

---

## GitHub Secrets Required

### For CI (Optional)
- `CODECOV_TOKEN` - For coverage upload (optional)

### For CD (Choose one method)

**Method 1: Auto-Deploy (Recommended)**
- No secrets needed! ✅
- Configure on Render dashboard

**Method 2: Webhook Deploy**
- `RENDER_DEPLOY_HOOK_URL` - Deploy webhook URL

**Method 3: API Deploy**
- `RENDER_API_KEY` - Render API key
- `RENDER_SERVICE_ID_BACKEND` - Backend service ID
- `RENDER_SERVICE_ID_FRONTEND` - Frontend service ID

### How to Add Secrets

1. Go to repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add name and value
5. Save

---

## Manual Deploy (If Pipelines Disabled)

If both pipelines fail, you can still deploy:

### Deploy via Git Push

Render watches your `main` branch. Just push:

```bash
git push origin main
```

Render auto-deploys if configured in dashboard.

### Deploy via Render Dashboard

1. Go to https://dashboard.render.com
2. Select service
3. Click "Manual Deploy" → "Deploy latest commit"

### Deploy via Render CLI

```bash
# Install Render CLI
npm install -g @render/cli

# Login
render login

# Deploy
render deploy
```

---

## Monitoring Deployments

### GitHub Actions

View pipeline runs:
- Repository → Actions tab
- Click on workflow run
- View logs for each job

### Render Dashboard

View deployment status:
- Dashboard → Select service
- "Events" tab shows deployment history
- "Logs" tab shows real-time logs

### Health Check

After deployment, verify:

```bash
# Backend health
curl https://recamp-backend.onrender.com/health

# Frontend
curl https://recamp-frontend.onrender.com/
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T...",
  "uptime": 123.45,
  "environment": "production",
  "database": "connected"
}
```

---

## Troubleshooting

### CI Pipeline Fails

**Problem**: Lint errors
```bash
# Fix locally
npm run lint:fix
git add .
git commit -m "fix: resolve linting issues"
git push
```

**Problem**: Tests fail
```bash
# Run tests locally
npm test

# Fix failing tests
# Commit and push
```

**Problem**: Build fails
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Fix and push
```

### CD Pipeline Fails

**Problem**: Render deploy action not found

**Solution**: Use auto-deploy from Render dashboard (recommended)

**Problem**: No RENDER_API_KEY secret

**Solution**: Either:
1. Use auto-deploy (no secret needed)
2. Add the secret (see above)

### Deployment Fails on Render

**Problem**: Build errors

**Solution**: Check Render logs, likely:
- Missing environment variables
- Build command incorrect
- Dependencies issue

**Problem**: Application errors

**Solution**:
- Check health endpoint
- Review application logs on Render
- Verify database connection
- Check environment variables

---

## Best Practices

### Before Pushing

1. Run tests locally:
   ```bash
   npm test
   ```

2. Check builds:
   ```bash
   npm run build
   ```

3. Fix linting:
   ```bash
   npm run lint:fix
   ```

### After Pushing

1. Monitor CI pipeline
2. Wait for all tests to pass
3. Check build artifacts
4. Monitor Render deployment (if auto-deploy enabled)
5. Verify health endpoint

### On Failure

1. Check GitHub Actions logs
2. Reproduce issue locally
3. Fix and push
4. Monitor next run

---

## Quick Reference

### Run CI Checks Locally

```bash
# Lint
npm run lint

# Format check
npm run format:check

# Tests
npm test

# Builds
npm run build
```

### View Pipeline Status

```bash
# Open GitHub Actions
gh workflow view

# View latest run
gh run list --limit 1

# View logs
gh run view --log
```

### Trigger Manual Deploy

```bash
# Via Render webhook (if configured)
curl -X POST $RENDER_DEPLOY_HOOK_URL

# Via push
git push origin main
```

---

## Current Configuration Summary

| Feature | Status | Notes |
|---------|--------|-------|
| CI: Lint | ⚠️ Non-blocking | Continues on error |
| CI: Backend Tests | ✅ Working | 254 tests |
| CI: Frontend Tests | ✅ Working | 115 tests |
| CI: Build | ✅ Working | Both builds |
| CI: Codecov | ⏸️ Disabled | Needs token |
| CD: Auto-Deploy | ✅ Recommended | Configure on Render |
| CD: Webhook | ⏸️ Disabled | Needs webhook URL |
| CD: API Deploy | ⏸️ Disabled | Needs API key |

---

**Recommendation**: Use Render's auto-deploy from GitHub for simplest setup! ✅

---

*Last Updated: February 7, 2026*  
*DevOps Agent - Phase 5*
