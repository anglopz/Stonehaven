#!/bin/bash

# Pre-Deployment Comprehensive Check Script
# Runs all verification steps before deployment

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║           🚀 Pre-Deployment Verification                    ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall success
ALL_CHECKS_PASSED=true

# Function to run a check
run_check() {
  echo -e "${BLUE}▶ $1${NC}"
  echo "----------------------------------------"
  
  if eval "$2"; then
    echo -e "${GREEN}✅ PASSED${NC}"
  else
    echo -e "${RED}❌ FAILED${NC}"
    ALL_CHECKS_PASSED=false
  fi
  echo ""
}

# 1. Environment Check
run_check "Environment Check" "
  echo '📋 Node.js version:' && node --version &&
  echo '📋 npm version:' && npm --version &&
  echo '📋 Git status:' && git status --short | head -5
"

# 2. Dependency Check
run_check "Dependencies Check" "
  echo '📦 Checking root dependencies...' &&
  [ -d 'node_modules' ] && echo '✅ Root node_modules exists' &&
  [ -d 'src/backend/node_modules' ] && echo '✅ Backend node_modules exists' &&
  [ -d 'src/frontend/node_modules' ] && echo '✅ Frontend node_modules exists'
"

# 3. Legacy Stack Check (no EJS/legacy JS in production code)
run_check "Legacy stack exclusion (no EJS in src)" '
  echo "🔍 Backend: no res.render, view engine, or ejs-mate..."
  ! grep -rE "res\.render|view engine|ejs-mate" src/backend/src --include="*.ts" 2>/dev/null
  backend_ok=$?
  echo "🔍 Frontend: no EJS templates..."
  ! find src/frontend -name "*.ejs" 2>/dev/null | grep -q .
  frontend_ok=$?
  if [ "$backend_ok" -eq 0 ] && [ "$frontend_ok" -eq 0 ]; then echo "✅ No legacy EJS in production stack"; exit 0; else exit 1; fi
'

# 4. Linting Check
run_check "Linting & Formatting" "
  echo '🔍 Running ESLint...' &&
  npm run lint 2>&1 | tail -10 &&
  echo '🔍 Checking Prettier formatting...' &&
  npm run format:check 2>&1 | tail -10
"

# 5. Test Execution
run_check "Test Suite Execution" "
  echo '🧪 Running all tests...' &&
  npm test 2>&1 | tail -30
"

# 6. Build Verification
run_check "Build Verification" "
  echo '🏗️  Testing builds...' &&
  bash scripts/verify-build.sh
"

# 7. TypeScript Type Checking
run_check "TypeScript Type Checking" "
  echo '🔍 Type checking backend...' &&
  cd src/backend && npm run type-check 2>&1 | tail -10 && cd ../.. &&
  echo '🔍 Type checking frontend...' &&
  cd src/frontend && npm run type-check 2>&1 | tail -10 && cd ../..
"

# 8. Environment Variables Check
run_check "Environment Variables" "
  echo '🔐 Checking .env.example exists...' &&
  [ -f '.env.example' ] && echo '✅ .env.example found' &&
  echo '🔐 Checking required variables...' &&
  grep -q 'DB_URL' .env.example &&
  grep -q 'SECRET' .env.example &&
  grep -q 'MAPBOX_TOKEN' .env.example &&
  grep -q 'CLOUDINARY_CLOUD_NAME' .env.example &&
  echo '✅ All required variables documented'
"

# 9. Configuration Files Check
run_check "Configuration Files" "
  echo '📋 Checking tsconfig.json...' &&
  [ -f 'tsconfig.json' ] &&
  [ -f 'src/backend/tsconfig.json' ] &&
  [ -f 'src/frontend/tsconfig.json' ] &&
  echo '📋 Checking package.json files...' &&
  [ -f 'package.json' ] &&
  [ -f 'src/backend/package.json' ] &&
  [ -f 'src/frontend/package.json' ] &&
  echo '✅ All configuration files present'
"

# 10. Docker Configuration Check (optional)
if command -v docker &> /dev/null; then
  run_check "Docker Configuration" "
    echo '🐳 Docker is installed' &&
    echo '🐳 Validating Dockerfiles...' &&
    [ -f 'infra/docker/Dockerfile.backend' ] &&
    [ -f 'infra/docker/Dockerfile.frontend' ] &&
    echo '🐳 Validating docker-compose.yml...' &&
    docker-compose config > /dev/null 2>&1 &&
    echo '✅ Docker configuration valid'
  "
else
  echo -e "${YELLOW}⚠️  Docker not installed - skipping Docker checks${NC}"
  echo ""
fi

# 11. Git Status Check
run_check "Git Repository Status" "
  echo '📊 Checking git status...' &&
  git status &&
  echo '📊 Current branch:' && git branch --show-current &&
  echo '📊 Uncommitted changes:' && git status --short | wc -l
"

# Summary
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║              📊 Pre-Deployment Check Summary                 ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
  echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║                                            ║${NC}"
  echo -e "${GREEN}║     ✅ ALL CHECKS PASSED ✅               ║${NC}"
  echo -e "${GREEN}║                                            ║${NC}"
  echo -e "${GREEN}║     🚀 READY FOR DEPLOYMENT 🚀            ║${NC}"
  echo -e "${GREEN}║                                            ║${NC}"
  echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review the deployment checklist: docs/DEPLOYMENT_READINESS.md"
  echo "  2. Configure environment variables on Render"
  echo "  3. Push to main branch to trigger deployment"
  echo "  4. Monitor deployment logs"
  echo ""
  exit 0
else
  echo -e "${RED}╔════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║                                            ║${NC}"
  echo -e "${RED}║     ❌ SOME CHECKS FAILED ❌              ║${NC}"
  echo -e "${RED}║                                            ║${NC}"
  echo -e "${RED}║     ⚠️  NOT READY FOR DEPLOYMENT ⚠️       ║${NC}"
  echo -e "${RED}║                                            ║${NC}"
  echo -e "${RED}╚════════════════════════════════════════════╝${NC}"
  echo ""
  echo "Please fix the failed checks above before deploying."
  echo ""
  exit 1
fi
