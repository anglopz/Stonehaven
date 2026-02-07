#!/bin/bash

# Docker Build Verification Script
# Tests that Docker images build successfully

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║           🐳 Docker Build Verification                      ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall success
DOCKER_SUCCESS=true

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
    DOCKER_SUCCESS=false
  fi
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed!${NC}"
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

echo "✅ Docker is installed: $(docker --version)"
echo ""

# Build backend Docker image
echo "🏗️  Building backend Docker image..."
echo "----------------------------------------"
docker build -f infra/docker/Dockerfile.backend -t recamp-backend:test . 2>&1 | tail -20
BACKEND_BUILD=$?
print_status $BACKEND_BUILD "Backend Docker build"

if [ $BACKEND_BUILD -eq 0 ]; then
  # Get image size
  SIZE=$(docker images recamp-backend:test --format "{{.Size}}")
  echo "   📦 Image size: $SIZE"
  
  # Test image
  echo "   🧪 Testing backend image..."
  docker run --rm recamp-backend:test node --version
  print_status $? "Backend image executable"
fi
echo ""

# Build frontend Docker image
echo "🏗️  Building frontend Docker image..."
echo "----------------------------------------"
docker build -f infra/docker/Dockerfile.frontend -t recamp-frontend:test . 2>&1 | tail -20
FRONTEND_BUILD=$?
print_status $FRONTEND_BUILD "Frontend Docker build"

if [ $FRONTEND_BUILD -eq 0 ]; then
  # Get image size
  SIZE=$(docker images recamp-frontend:test --format "{{.Size}}")
  echo "   📦 Image size: $SIZE"
  
  # Test image
  echo "   🧪 Testing frontend image..."
  docker run --rm recamp-frontend:test node --version
  print_status $? "Frontend image executable"
fi
echo ""

# Test docker-compose configuration
echo "🔍 Validating docker-compose configuration..."
echo "----------------------------------------"
docker-compose config > /dev/null 2>&1
COMPOSE_VALID=$?
print_status $COMPOSE_VALID "Docker Compose configuration"
echo ""

# Show images
echo "📋 Docker Images Created:"
echo "----------------------------------------"
docker images | grep recamp
echo ""

# Cleanup
echo "🧹 Cleaning up test images..."
docker rmi recamp-backend:test recamp-frontend:test 2>/dev/null || true
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║                   📊 Docker Build Summary                    ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$DOCKER_SUCCESS" = true ] && [ $BACKEND_BUILD -eq 0 ] && [ $FRONTEND_BUILD -eq 0 ]; then
  echo -e "${GREEN}✅ ALL DOCKER BUILDS SUCCESSFUL${NC}"
  echo ""
  echo "✅ Backend image: Built successfully"
  echo "✅ Frontend image: Built successfully"
  echo "✅ Docker Compose: Configuration valid"
  echo ""
  echo "🚀 Docker images are production-ready!"
  exit 0
else
  echo -e "${RED}❌ DOCKER BUILD FAILED${NC}"
  echo ""
  echo "Please fix the errors above before deploying."
  echo ""
  echo "Common issues:"
  echo "  - Dockerfile syntax errors"
  echo "  - Missing files referenced in Dockerfile"
  echo "  - Build command failures"
  echo "  - Insufficient disk space"
  echo ""
  exit 1
fi
