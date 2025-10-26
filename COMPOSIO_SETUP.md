# 🔧 Composio + GitHub Integration Setup

This guide will help you set up the Composio integration for automatic GitHub issue and PR creation.

---

## 📋 Prerequisites

1. **Composio Account**: Sign up at https://app.composio.dev/
2. **GitHub Account**: Ensure you have access to the repository where you want to create issues/PRs
3. **Git Repository**: Project must be a git repository with a GitHub remote

---

## 🔑 Step 1: Get Your Composio API Key

1. Go to https://app.composio.dev/
2. Sign in or create an account
3. Navigate to **Settings** → **API Keys**
4. Copy your API key

---

## 🔗 Step 2: Connect GitHub to Composio

1. In Composio dashboard, go to **Integrations**
2. Find **GitHub** and click **Connect**
3. Authorize Composio to access your GitHub account
4. Grant permissions for:
   - Create issues
   - Create pull requests
   - Create branches

---

## ⚙️ Step 3: Configure Environment Variables

Create a `.env` file in the **root directory** of the project (if it doesn't exist):

```bash
# In /Users/kmanoj/incident-autopilot/.env

# Server Configuration
PORT=4000

# Redis Configuration
REDIS_URL=redis://localhost:6379

# VoyageAI Configuration (for embeddings)
VOYAGE_API_KEY=your_voyage_api_key_here

# Composio Configuration (NEW)
COMPOSIO_API_KEY=your_composio_api_key_here
```

**Replace `your_composio_api_key_here` with your actual Composio API key from Step 1.**

---

## 🧪 Step 4: Test the Integration

### Test 1: Auto-detect Repository Info

The system automatically detects your repository from git config:

```bash
cd /Users/kmanoj/incident-autopilot
git remote -v
# Should show: origin  git@github.com:YOUR_USERNAME/incident-autopilot.git

git config user.name
# Should show your GitHub username

git config user.email
# Should show your GitHub email
```

✅ If these commands work, the system will auto-fill `owner` and `repo` for you!

---

### Test 2: Create a GitHub Issue

```bash
curl -X POST http://localhost:4000/github/issue \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[TEST] Incident Autopilot Integration",
    "description": "Testing GitHub integration via Composio",
    "service": "test-service",
    "environment": "dev"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "issue": { ... },
  "url": "https://github.com/YOUR_USERNAME/incident-autopilot/issues/1"
}
```

✅ Check your GitHub repo - a new issue should appear!

---

### Test 3: Create a GitHub PR (Hotfix)

```bash
curl -X POST http://localhost:4000/github/pr \
  -H "Content-Type: application/json" \
  -d '{
    "title": "hotfix: Add null guard for payment amount",
    "description": "Automated fix from Incident Autopilot",
    "branchName": "hotfix/null-guard-amount",
    "baseBranch": "main",
    "filePath": "src/payment.js",
    "patch": "+ if (!amount) throw new Error(\"Amount is required\");"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "pr": { ... },
  "url": "https://github.com/YOUR_USERNAME/incident-autopilot/pull/1"
}
```

✅ Check your GitHub repo - a new PR should appear!

---

## 🎯 Integration Points in the Extension

Once configured, the extension will automatically:

1. **Create GitHub Issue** when you click **"🎫 Create GitHub Issue"** in Panel 3
2. **Create Hotfix PR** when you click **"🚀 Open Hotfix PR"** in Panel 3

The extension will:
- Auto-detect `owner` and `repo` from your git config
- Use your git username and email for attribution
- Apply the correct labels (`incident`, `autopilot`, environment tag)

---

## 🐛 Troubleshooting

### Error: "COMPOSIO_API_KEY not found in environment"

**Solution**: Ensure your `.env` file exists in the **root directory** and contains:
```bash
COMPOSIO_API_KEY=your_actual_api_key_here
```

Then **restart the server**:
```bash
cd server
npm run dev
```

---

### Error: "Could not auto-detect repository"

**Solution**: Ensure you're in a git repository with a GitHub remote:
```bash
git remote get-url origin
# Should return a GitHub URL
```

If not set up:
```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
```

Or manually provide `owner` and `repo` in API requests:
```json
{
  "title": "...",
  "owner": "YOUR_USERNAME",
  "repo": "YOUR_REPO"
}
```

---

### Error: "GitHub action failed"

**Solution**: Ensure GitHub is connected in Composio:
1. Go to https://app.composio.dev/integrations
2. Check GitHub status
3. Reconnect if needed
4. Verify permissions (issues, PRs, branches)

---

## 📚 API Reference

### POST /github/issue

**Body:**
```typescript
{
  title: string;              // Required: Issue title
  description: string;        // Required: Issue description
  service: string;            // Required: Service name
  environment: string;        // Required: Environment (prod, staging, dev)
  rootCause?: string;         // Optional: Root cause analysis
  owner?: string;             // Optional: GitHub username (auto-detected)
  repo?: string;              // Optional: Repo name (auto-detected)
}
```

**Response:**
```typescript
{
  success: boolean;
  issue: object;              // GitHub issue object
  url: string;                // Direct link to issue
}
```

---

### POST /github/pr

**Body:**
```typescript
{
  title: string;              // Required: PR title
  description?: string;       // Optional: PR description
  branchName: string;         // Required: New branch name
  baseBranch?: string;        // Optional: Base branch (default: "main")
  filePath: string;           // Required: File to modify
  patch: string;              // Required: Patch/diff content
  owner?: string;             // Optional: GitHub username (auto-detected)
  repo?: string;              // Optional: Repo name (auto-detected)
}
```

**Response:**
```typescript
{
  success: boolean;
  pr: object;                 // GitHub PR object
  url: string;                // Direct link to PR
}
```

---

## ✅ You're All Set!

Once configured, your Incident Autopilot will:
- ✅ Auto-create GitHub issues for new incidents
- ✅ Auto-create hotfix PRs with suggested patches
- ✅ Use your git identity for attribution
- ✅ Apply proper labels and formatting

**Ready to demo!** 🚀

