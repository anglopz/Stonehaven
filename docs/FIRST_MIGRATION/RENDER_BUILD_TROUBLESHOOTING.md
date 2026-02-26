# Render Build Troubleshooting Guide

## Current Issue

Build completes but `dist/backend/index.js` not found at runtime.

**Error**: `Cannot find module '/opt/render/project/src/dist/backend/index.js'`

---

## Investigation Steps

### 1. Check Render Build Logs

In Render dashboard:
1. Go to your backend service
2. Click on the failed deployment
3. View "Build Logs"
4. Look for:
   - ✅ "npm ci" completing successfully
   - ✅ "npm run build:backend" completing
   - ✅ TypeScript compilation output
   - ❌ Any build errors

### 2. Verify Build Command

Current build command in render.yaml:
```yaml
buildCommand: npm ci && npm run build:backend && ls -la dist/backend/index.js
```

This should:
1. Install dependencies
2. Build TypeScript
3. List the built file (proves it exists)

### 3. Check Working Directory

On Render:
- Project root: `/opt/render/project/src/`
- After `cd src/backend`: `/opt/render/project/src/src/backend/`
- Build output: `/opt/render/project/src/dist/backend/`

### 4. Verify TypeScript Config

The `src/backend/tsconfig.json` should have:
```json
{
  "compilerOptions": {
    "outDir": "../../dist/backend",
    "rootDir": "./src"
  }
}
```

From `/opt/render/project/src/src/backend/`:
- `../../dist/backend` = `/opt/render/project/src/dist/backend/` ✅

---

## Possible Issues & Solutions

### Issue 1: Build Failing Silently

**Symptoms**: No error but file not created

**Check**: Look at build logs for TypeScript errors

**Solution**: Fix TypeScript compilation errors

### Issue 2: Wrong Output Directory

**Symptoms**: Files created but in different location

**Check**: Build logs show where files go

**Solution**: Update tsconfig.json outDir

### Issue 3: Build Command Not Running

**Symptoms**: Logs don't show "npm run build:backend"

**Solution**: Update Render build command in dashboard

### Issue 4: Workspace Configuration Issue

**Symptoms**: npm ci works but build fails

**Solution**: Ensure workspaces are configured correctly in root package.json

---

## Alternative Solution: Simplify Build Output

If relative paths keep causing issues, simplify to build within backend directory:

### Option A: Build to src/backend/dist

**1. Update `src/backend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**2. Update `package.json` start command:**
```json
"start:backend": "node src/backend/dist/index.js"
```

**3. Update `render.yaml`:**
```yaml
buildCommand: npm ci && cd src/backend && npm install && npm run build && ls -la dist/index.js
startCommand: node src/backend/dist/index.js
```

This keeps everything within the backend directory - simpler path resolution.

---

## Option B: Use Render Build Script

Instead of inline commands, use a build script:

**1. Create `scripts/render-build.sh`:**
```bash
#!/bin/bash
set -e

echo "🔨 Installing dependencies..."
npm ci

echo "🔨 Building backend..."
npm run build:backend

echo "📦 Verifying build..."
if [ ! -f "dist/backend/index.js" ]; then
  echo "❌ Build failed - index.js not found!"
  ls -R dist/
  exit 1
fi

echo "✅ Build successful!"
ls -lh dist/backend/index.js
```

**2. Update `render.yaml`:**
```yaml
buildCommand: bash scripts/render-build.sh
```

This provides better error messages and verification.

---

## Option C: Check Render Dashboard Settings

Sometimes Render dashboard settings override render.yaml:

1. Go to Service → Settings
2. Check "Build Command"
3. Check "Start Command"  
4. Ensure "Root Directory" is correct (should be empty or `/`)
5. Check "Node Version" matches (20.x)

---

## Debugging on Render

### Add Debug Output to Build

Update render.yaml:
```yaml
buildCommand: |
  npm ci && \
  pwd && \
  ls -la && \
  npm run build:backend && \
  echo "=== Build complete ===" && \
  pwd && \
  ls -la dist/ && \
  ls -la dist/backend/ && \
  cat dist/backend/index.js | head -20
```

This shows:
- Working directory
- Files before build
- Files after build
- Actual built content

### Add Debug Output to Start

Update package.json:
```json
"start:backend": "pwd && ls -la dist/backend/index.js && node dist/backend/index.js"
```

This shows:
- Where start command runs from
- Whether file exists
- Then attempts to start

---

## Recommended Fix (Simplest)

Based on the persistent issues, I recommend **Option A** above:

1. Build output stays within `src/backend/dist/`
2. Start command points to `src/backend/dist/index.js`
3. No relative path confusion
4. Simpler, more predictable

This matches how most Node projects structure themselves.

---

## Next Steps

1. Check Render build logs carefully
2. Try adding `ls -la dist/backend/index.js` to build command
3. If file not found in build, try Option A (simplify structure)
4. If still failing, use Option B (build script with better errors)
5. Check Render dashboard settings don't override yaml

---

**Status**: Investigation in progress  
**Last Updated**: February 7, 2026
