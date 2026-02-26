# 🔄 Repository Rename Instructions: recamp → stonehaven

## ✅ Git Remote Updated

The git remote URL has been updated to point to the new repository name:
- **Old**: `https://github.com/anglopz/recamp`
- **New**: `https://github.com/anglopz/stonehaven`

## 📋 Steps to Complete the Rename

### Step 1: Rename GitHub Repository

1. Go to your GitHub repository: https://github.com/anglopz/recamp
2. Click on **Settings** (top right of the repository page)
3. Scroll down to the **Repository name** section
4. Change the name from `recamp` to `stonehaven`
5. Click **Rename**
6. GitHub will automatically redirect the old URL to the new one

**Note**: GitHub will automatically redirect the old URL, but it's best to update all references.

### Step 2: Rename Local Directory (Optional but Recommended)

Since you're currently working in the directory, you'll need to:

1. **Close your IDE/editor** (Cursor/VS Code)
2. **Navigate to the parent directory**:
   ```bash
   cd /home/angelo/proyectos/cursos
   ```
3. **Rename the directory**:
   ```bash
   mv recamp stonehaven
   ```
4. **Reopen the project**:
   ```bash
   cd stonehaven
   code .  # or cursor .
   ```

### Step 3: Verify Everything Works

After renaming:

1. **Verify git remote**:
   ```bash
   git remote -v
   ```
   Should show: `https://github.com/anglopz/stonehaven`

2. **Test connection**:
   ```bash
   git fetch origin
   ```

3. **Push to verify** (if you have changes):
   ```bash
   git push origin main
   ```

## 🔗 Updated URLs

After renaming, your repository will be accessible at:
- **GitHub**: https://github.com/anglopz/stonehaven
- **Clone URL**: `https://github.com/anglopz/stonehaven.git`

## ⚠️ Important Notes

1. **GitHub Redirects**: GitHub automatically redirects the old URL (`/recamp`) to the new one (`/stonehaven`), but it's best to update all bookmarks and references.

2. **Collaborators**: If you have collaborators, they'll need to update their remote URLs:
   ```bash
   git remote set-url origin https://github.com/anglopz/stonehaven
   ```

3. **CI/CD**: If you have any CI/CD pipelines or webhooks pointing to the old repository name, update them.

4. **Deployment**: Update any deployment configurations (Render, Vercel, etc.) that reference the old repository name.

5. **Documentation**: Update any external documentation or links that reference the old repository name.

## ✅ Current Status

- ✅ Git remote URL updated locally
- ⏳ GitHub repository rename (manual step required)
- ⏳ Local directory rename (optional, manual step required)

## 🚀 Quick Commands Reference

```bash
# Verify remote is updated
git remote -v

# Test connection to new repository
git fetch origin

# If you need to update remote manually
git remote set-url origin https://github.com/anglopz/stonehaven

# Rename local directory (when not in use)
cd /home/angelo/proyectos/cursos
mv recamp stonehaven
cd stonehaven
```

---

**Last Updated**: After renaming all project references to Stonehaven
