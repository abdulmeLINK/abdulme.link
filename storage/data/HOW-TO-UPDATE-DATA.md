# 📝 How to Update Portfolio Data

This guide explains how to update JSON data files and sync them to Supabase Storage for persistent storage across Docker deployments.

---

## 📁 Data Files Overview

All portfolio data is stored in **`storage/data/`** (NOT `public/data/`):

| File | Purpose | Size Limit |
|------|---------|------------|
| `about.json` | Personal info, skills, experience, education | 50 KB |
| `portfolio.json` | Project showcase with categories and metadata | 30 KB |
| `desktop-apps.json` | macOS dock and launchpad applications | 10 KB |
| `terminal-commands.json` | Terminal command definitions | 15 KB |
| `filesystem.json` | Virtual file system structure | 20 KB |
| `preferences-defaults.json` | System preferences defaults | 5 KB |
| `loading-messages.json` | Boot screen loading messages | 5 KB |

**Total:** ~7 files, ~150 KB

---

## 🔄 Update Workflow

### Step 1: Edit JSON Files Locally

```bash
# Navigate to data directory
cd storage/data/

# Edit files with your preferred editor
code about.json          # VS Code
notepad portfolio.json   # Notepad
vim desktop-apps.json    # Vim
```

**Important:** Always validate JSON syntax before uploading!

```bash
# Validate JSON (PowerShell)
Get-Content about.json | ConvertFrom-Json
```

### Step 2: Test Locally

```bash
# Clear Laravel cache
php artisan cache:clear

# Test API endpoints
curl http://127.0.0.1:8000/api/about
curl http://127.0.0.1:8000/api/portfolio
curl http://127.0.0.1:8000/api/preferences
```

### Step 3: Upload to Supabase

```bash
# Dry run (preview what will be uploaded)
php artisan supabase:sync --dry-run

# Upload all files to Supabase Storage
php artisan supabase:sync

# Upload completes in ~10 seconds
```

### Step 4: Verify Upload

1. **Supabase Dashboard:** https://supabase.com/dashboard
   - Go to **Storage** → `portfolio-data` bucket
   - Verify files are present with correct timestamps

2. **Test Public URLs:**
   ```bash
   # Test direct Supabase access
   curl https://xddhvwgtsdmsviofzara.supabase.co/storage/v1/object/public/portfolio-data/about.json
   ```

3. **Test API with Supabase Enabled:**
   ```bash
   # Enable Supabase in .env
   USE_SUPABASE_STORAGE=true
   
   # Clear cache
   php artisan cache:clear
   
   # Test API - should show "_metadata.source": "supabase"
   curl http://127.0.0.1:8000/api/about | jq '._metadata'
   ```

---

## 🎯 Common Scenarios

### Adding New Project to Portfolio

1. Edit `storage/data/portfolio.json`
2. Add project object to `projects` array:

```json
{
  "id": "my-new-project",
  "title": "My Amazing Project",
  "description": "Full description here...",
  "category": "web",
  "technologies": ["Laravel", "Vue.js"],
  "images": {
    "thumbnail": "/images/projects/myproject-thumb.webp",
    "gallery": [
      "/images/projects/myproject-1.jpg",
      "/images/projects/myproject-2.jpg"
    ]
  },
  "links": {
    "demo": "https://demo.com",
    "github": "https://github.com/user/repo"
  },
  "featured": true,
  "status": "live"
}
```

3. Update metadata:
```json
"_metadata": {
  "totalProjects": 7,  // Increment
  "lastUpdated": "2025-10-23T12:00:00Z"  // Update timestamp
}
```

4. Sync to Supabase:
```bash
php artisan supabase:sync
```

### Updating Skills/Experience

1. Edit `storage/data/about.json`
2. Add/update skills in `skills` section
3. Add/update experience in `experience` array
4. Sync to Supabase

### Adding Terminal Commands

1. Edit `storage/data/terminal-commands.json`
2. Add command definition:
```json
{
  "command": "mycommand",
  "description": "Does something cool",
  "usage": "mycommand [options]",
  "handler": "custom"
}
```

3. Sync to Supabase

---

## 🚨 Important Rules

### ✅ DO:
- Always validate JSON syntax before uploading
- Update `_metadata.lastUpdated` timestamp
- Increment counters (`totalProjects`, `totalCommands`, etc.)
- Test locally before syncing to Supabase
- Keep file sizes under limits (see table above)

### ❌ DON'T:
- **Never** edit files in `public/data/` (deprecated, will be removed)
- Don't bypass Laravel API from frontend
- Don't hardcode Supabase URLs in JavaScript
- Don't upload files larger than 1 MB
- Don't forget to clear cache after changes

---

## 🔍 How to Know Data Source

### Backend Logs

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Look for:
# "Successfully read about from Supabase Storage"  ← Supabase
# "Reading from local files"                       ← Local
```

### API Response Metadata

```bash
# Check _metadata in API response
curl http://127.0.0.1:8000/api/about | jq '._metadata'

# Output:
{
  "source": "supabase",       # or "local"
  "timestamp": "2025-10-23...",
  "cached": false             # or true if from cache
}
```

### Environment Variable

```bash
# Check .env setting
USE_SUPABASE_STORAGE=true   # Uses Supabase with local fallback
USE_SUPABASE_STORAGE=false  # Uses local files only
```

---

## 🛠 Troubleshooting

### Sync Command Fails

```bash
# Check .env has correct Supabase URL
SUPABASE_URL=https://xddhvwgtsdmsviofzara.supabase.co

# Test connection
curl https://xddhvwgtsdmsviofzara.supabase.co/storage/v1/bucket
```

### Data Not Updating

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Restart server
php artisan serve --port 8000
```

### Invalid JSON Error

```bash
# Validate JSON syntax (PowerShell)
Get-Content storage/data/about.json | ConvertFrom-Json

# Or use online validator: https://jsonlint.com
```

---

## 📦 File Locations Summary

```
storage/data/              ← Source of truth (edit here)
  ├── about.json
  ├── portfolio.json
  ├── desktop-apps.json
  ├── terminal-commands.json
  ├── filesystem.json
  ├── preferences-defaults.json
  └── loading-messages.json

public/data/               ← DEPRECATED (will be removed)
  └── *.json               ← DO NOT EDIT

Supabase Storage:          ← Production data
  portfolio-data/
    ├── about.json
    ├── portfolio.json
    └── ...
```

---

## 🚀 Quick Reference

```bash
# Edit data
code storage/data/about.json

# Validate JSON
Get-Content storage/data/about.json | ConvertFrom-Json

# Preview upload
php artisan supabase:sync --dry-run

# Upload to Supabase
php artisan supabase:sync

# Clear cache
php artisan cache:clear

# Test API
curl http://127.0.0.1:8000/api/about | jq '._metadata'
```

---

**Last Updated:** October 23, 2025
