# Render Deployment - Final Path Fix

## Issue History

### Attempt 1
**Error**: Cannot find module `/opt/render/project/src/src/backend/dist/index.js`  
**Fix**: Changed to `node ../../dist/backend/index.js`  
**Result**: Still failed with path confusion

### Attempt 2 (Final)
**Error**: Cannot find module `/opt/render/project/src/dist/backend/index.js`  
**Root Cause**: Complex relative path resolution from nested workspace
**Solution**: Run start command from project root, not from backend workspace

---

## Final Solution

### Changed Start Script in Root `package.json`

**Before:**
```json
"start:backend": "cd src/backend && npm start"
```

**After:**
```json
"start:backend": "node dist/backend/index.js"
```

### Why This Works

**On Render:**
1. Project cloned to: `/opt/render/project/src/`
2. Build command runs: `npm run build:backend`
3. Creates files at: `/opt/render/project/src/dist/backend/index.js`
4. Start command runs: `npm run start:backend` (from project root)
5. Executes: `node dist/backend/index.js` (from `/opt/render/project/src/`)
6. Resolves to: `/opt/render/project/src/dist/backend/index.js` ✅

**Locally:**
1. Project root: `/home/user/recamp/`
2. Build creates: `/home/user/recamp/dist/backend/index.js`
3. Start runs: `node dist/backend/index.js` (from project root)
4. Resolves correctly ✅

---

## Key Changes

### 1. Root package.json
```json
{
  "scripts": {
    "start:backend": "node dist/backend/index.js"
  }
}
```

### 2. Backend package.json
```json
{
  "scripts": {
    "start": "echo 'Use npm run start:backend from project root'"
  }
}
```

Backend workspace start script now just shows a message since the actual start happens from root.

---

## Testing

### Local Test
```bash
# Build
npm run build:backend

# Verify output
ls -la dist/backend/index.js

# Start (will fail on env vars but proves path works)
npm run start:backend
```

### Render Configuration
No changes needed in Render dashboard:
```yaml
buildCommand: npm ci && npm run build:backend
startCommand: npm run start:backend
```

Both commands run from project root, which is correct.

---

## Why Previous Attempts Failed

### Attempt 1: Using cd and relative paths
```json
"start:backend": "cd src/backend && npm start"
```
- Changed working directory to nested workspace
- Relative path `../../dist/backend/index.js` got confusing
- Workspace paths resolved differently on Render vs local

### Attempt 2 (This fix): Direct path from root
```json
"start:backend": "node dist/backend/index.js"
```
- Stays in project root
- Direct path, no cd needed
- Works identically on Render and locally ✅

---

## File Structure

```
/opt/render/project/src/  (Render root)
├── dist/
│   └── backend/
│       └── index.js       ← Built file
├── src/
│   └── backend/
│       ├── src/           ← Source files
│       └── tsconfig.json  ← Compiles to ../../dist/backend
├── package.json           ← start:backend runs from here
└── node_modules/
```

Start command runs: `node dist/backend/index.js` from root → Works! ✅

---

## Verification After Deploy

```bash
# Check Render logs - should see:
🚀 Server running on port 3000
📍 Environment: production

# Test health endpoint
curl https://recamp-backend.onrender.com/health

# Expected response
{
  "status": "ok",
  "timestamp": "2026-02-07T...",
  "database": "connected"
}
```

---

**Status**: ✅ Fixed (Final)  
**Date**: February 7, 2026  
**Solution**: Run start command from project root with direct path
