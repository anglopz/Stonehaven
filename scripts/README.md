# 🔧 Deployment Scripts

This folder contains verification and deployment scripts for the Recamp application.

## Available Scripts

### `verify-build.sh`

Verifies that both backend and frontend build successfully.

**Usage:**
```bash
bash scripts/verify-build.sh
```

**What it checks:**
- ✅ Cleans previous builds
- ✅ Installs dependencies (if needed)
- ✅ Builds backend TypeScript
- ✅ Builds frontend Next.js
- ✅ Verifies output directories exist
- ✅ Checks entry points exist
- ✅ Runs type checking

**Expected output:**
```
✅ ALL BUILDS SUCCESSFUL
🚀 Ready for deployment!
```

### `verify-docker.sh`

Tests that Docker images build successfully.

**Usage:**
```bash
bash scripts/verify-docker.sh
```

**Prerequisites:**
- Docker installed and running

**What it checks:**
- ✅ Docker is installed
- ✅ Backend Docker image builds
- ✅ Frontend Docker image builds
- ✅ docker-compose configuration is valid
- ✅ Images are executable
- ✅ Shows image sizes

**Expected output:**
```
✅ ALL DOCKER BUILDS SUCCESSFUL
🚀 Docker images are production-ready!
```

### `pre-deployment-check.sh`

Comprehensive pre-deployment verification script.

**Usage:**
```bash
bash scripts/pre-deployment-check.sh
```

**What it checks:**
1. ✅ Environment (Node.js, npm, Git)
2. ✅ Dependencies installed
3. ✅ Linting and formatting
4. ✅ Test suite execution
5. ✅ Build verification
6. ✅ TypeScript type checking
7. ✅ Environment variables documented
8. ✅ Configuration files present
9. ✅ Docker configuration (if available)
10. ✅ Git repository status

**Expected output:**
```
✅ ALL CHECKS PASSED
🚀 READY FOR DEPLOYMENT
```

## Quick Reference

### Run All Checks
```bash
# Fastest way to verify everything
bash scripts/pre-deployment-check.sh
```

### Run Individual Checks
```bash
# Just test builds
bash scripts/verify-build.sh

# Just test Docker
bash scripts/verify-docker.sh

# Just run tests
npm test

# Just check linting
npm run lint
```

### Before Deployment
```bash
# Run this before deploying to ensure everything is ready
bash scripts/pre-deployment-check.sh
```

## Troubleshooting

### Build Fails
```bash
# Check detailed error
npm run build:backend
npm run build:frontend

# Clean and rebuild
rm -rf dist/ src/frontend/.next/
npm run build
```

### Tests Fail
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test suite
cd src/backend && npm test -- --testPathPattern=models
cd src/frontend && npm test -- Button.test
```

### Docker Issues
```bash
# Check Docker is running
docker --version
docker ps

# Clean Docker build cache
docker system prune -f

# Rebuild images
docker build -f infra/docker/Dockerfile.backend -t recamp-backend .
docker build -f infra/docker/Dockerfile.frontend -t recamp-frontend .
```

## Exit Codes

All scripts use standard exit codes:
- `0` - Success, all checks passed
- `1` - Failure, one or more checks failed

## Script Requirements

All scripts require:
- ✅ Bash shell
- ✅ Node.js 18+
- ✅ npm 9+
- ✅ Git installed

Docker scripts additionally require:
- ✅ Docker installed and running

## Making Scripts Executable

If you get "permission denied" errors:

```bash
chmod +x scripts/*.sh
```

Or run with bash explicitly:

```bash
bash scripts/verify-build.sh
```

## Integration with CI/CD

These scripts are designed to work both locally and in CI/CD:

```yaml
# Example GitHub Actions usage
- name: Run pre-deployment checks
  run: bash scripts/pre-deployment-check.sh
```

## Output Colors

Scripts use colored output for clarity:
- 🟢 Green: Success/Pass
- 🔴 Red: Error/Fail
- 🟡 Yellow: Warning/Info
- 🔵 Blue: Information

## Related Documentation

- `docs/DEPLOYMENT_GUIDE.md` - Full deployment instructions
- `docs/DEPLOYMENT_READINESS.md` - Pre-deployment checklist
- `docs/DEPLOYMENT_STATUS.md` - Current status
- `DEPLOYMENT_READY.md` - Quick start guide

---

**Last Updated:** February 7, 2026  
**DevOps Agent - Phase 5**
