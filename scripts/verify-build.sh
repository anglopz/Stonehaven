#!/bin/bash

# Build Verification Script
# Verifies that both backend and frontend build successfully

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║           🔨 Recamp Build Verification                      ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall success
BUILD_SUCCESS=true

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    BUILD_SUCCESS=false
  fi
}

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/ src/frontend/.next/ src/backend/dist/
print_status $? "Clean completed"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing root dependencies..."
  npm ci
  print_status $? "Root dependencies installed"
  echo ""
fi

# Check backend node_modules
if [ ! -d "src/backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd src/backend && npm ci && cd ../..
  print_status $? "Backend dependencies installed"
  echo ""
fi

# Check frontend node_modules
if [ ! -d "src/frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd src/frontend && npm ci && cd ../..
  print_status $? "Frontend dependencies installed"
  echo ""
fi

# Build backend
echo "🏗️  Building backend..."
echo "----------------------------------------"
npm run build:backend
BACKEND_BUILD=$?
print_status $BACKEND_BUILD "Backend build completed"

if [ $BACKEND_BUILD -eq 0 ]; then
  # Check if dist directory was created
  if [ -d "dist/backend" ]; then
    echo "   📁 Output directory: dist/backend"
    echo "   📊 Files created: $(find dist/backend -type f | wc -l) files"
    
    # Check for index.js
    if [ -f "dist/backend/index.js" ]; then
      echo "   ✅ Entry point found: dist/backend/index.js"
    else
      echo "   ⚠️  Entry point not found: dist/backend/index.js"
      BUILD_SUCCESS=false
    fi
  else
    echo "   ❌ Output directory not created!"
    BUILD_SUCCESS=false
  fi
fi
echo ""

# Build frontend
echo "🏗️  Building frontend..."
echo "----------------------------------------"
npm run build:frontend
FRONTEND_BUILD=$?
print_status $FRONTEND_BUILD "Frontend build completed"

if [ $FRONTEND_BUILD -eq 0 ]; then
  # Check if .next directory was created
  if [ -d "src/frontend/.next" ]; then
    echo "   📁 Output directory: src/frontend/.next"
    
    # Check for standalone directory
    if [ -d "src/frontend/.next/standalone" ]; then
      echo "   ✅ Standalone output found"
      echo "   📊 Files created: $(find src/frontend/.next/standalone -type f | wc -l) files"
    else
      echo "   ⚠️  Standalone output not found"
      echo "   💡 This is expected if output: 'standalone' is not in next.config.js"
    fi
    
    # Check for static directory
    if [ -d "src/frontend/.next/static" ]; then
      echo "   ✅ Static assets found"
    else
      echo "   ⚠️  Static assets not found"
      BUILD_SUCCESS=false
    fi
  else
    echo "   ❌ Output directory not created!"
    BUILD_SUCCESS=false
  fi
fi
echo ""

# Type checking
echo "🔍 Running type checks..."
echo "----------------------------------------"

# Backend type check
cd src/backend
npm run type-check 2>&1 | head -20
BACKEND_TYPES=$?
cd ../..
print_status $BACKEND_TYPES "Backend type check"

# Frontend type check
cd src/frontend
npm run type-check 2>&1 | head -20
FRONTEND_TYPES=$?
cd ../..
print_status $FRONTEND_TYPES "Frontend type check"
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║                   📊 Build Summary                           ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$BUILD_SUCCESS" = true ] && [ $BACKEND_BUILD -eq 0 ] && [ $FRONTEND_BUILD -eq 0 ]; then
  echo -e "${GREEN}✅ ALL BUILDS SUCCESSFUL${NC}"
  echo ""
  echo "✅ Backend: Built successfully"
  echo "✅ Frontend: Built successfully"
  echo "✅ Type checks: Passed"
  echo ""
  echo "🚀 Ready for deployment!"
  exit 0
else
  echo -e "${RED}❌ BUILD FAILED${NC}"
  echo ""
  echo "Please fix the errors above before deploying."
  echo ""
  echo "Common issues:"
  echo "  - TypeScript errors in code"
  echo "  - Missing dependencies"
  echo "  - Configuration errors"
  echo ""
  exit 1
fi
