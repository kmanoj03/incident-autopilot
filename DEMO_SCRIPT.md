# Incident Autopilot - Hackathon Demo Script

## 🎯 The Pitch (30 seconds)

> "Every on-call engineer has wasted hours debugging the same prod incidents that someone on their team already fixed. We built an AI agent that **learns from every fix** and suggests solutions instantly using **semantic memory in Redis**. It's like having every past on-call's brain available at 3AM."

**Core Tech**: Redis vector search + VoyageAI embeddings + Composio agent actions

---

## 🚀 Live Demo Flow (3 minutes)

### Setup (Done Before Demo)

**Backend Running**:
```bash
cd server
npm run dev
# ✅ RediSearch index 'incidents' already exists
# ⚡ Server running at http://localhost:4000
```

**Extension Loaded**: Press `F5` in VS Code (extension folder) to launch

**Sample Log File** ready in workspace:
```
logs/payment-service.log
```

---

### Act 1: The Problem (30 sec)

**YOU SAY**: "It's 2AM. Production is down. You open Slack, see panic. You grab the log file."

**YOU DO**:
1. Open `logs/payment-service.log` in VS Code
2. Show the error: `TypeError: Cannot read properties of undefined (reading 'amount')`
3. Say: "Normally this is when you start Googling, checking Jira, asking teammates."

---

### Act 2: The Solution (1 min)

**YOU SAY**: "Instead, I open our Incident Autopilot sidebar."

**YOU DO**:
1. Click 🚨 icon in activity bar
2. **Panel 1: Enter log path**: `logs/payment-service.log`
3. Click **"Parse Log"**
   - ✅ Auto-extracts error, service, environment
4. Click **"🔍 Diagnose"**

**Backend happens**:
- Generates VoyageAI embedding for error
- Redis vector search (KNN) finds similar past incidents
- Returns match with **confidence: HIGH** + suggested patch

**YOU SAY**: "In 2 seconds, it found that Sarah fixed this exact pattern last month."

---

### Act 3: The Flywheel (1 min)

**Scenario A: Known Incident**

**YOU SAY**: "This is a known pattern. The system suggests:"

**Panel 2 shows**:
- Root Cause: "amount can be undefined, added null guard"
- Confidence: HIGH
- Suggested Patch: `if (!amount) throw new Error()`

**YOU DO**: Click **"✅ Confirm Fix Works & Save to Memory"**

**YOU SAY**: "By confirming, I'm teaching the system. Next engineer gets this instantly."

---

**Scenario B: New Incident**

**YOU SAY**: "But what if it's brand new? Watch this."

**Change the error in Panel 1** to:
```
RateLimitException: Redis connection pool exhausted
```

**YOU DO**: Click **"🔍 Diagnose"**

**Panel 2 shows**:
- Status: NEW INCIDENT
- Confidence: LOW
- No matches

**YOU SAY**: "It's unknown. So I:"
1. Debug manually (skip for demo)
2. Come back, fill solution
3. Click **"🧠 Attach Resolution & Close"**
4. Click **"🎫 Create GitHub Issue"**

**Shows**:
```json
{
  "title": "[PROD] payment-service: New incident detected",
  "body": "## Incident Summary\n\n**Error:** RateLimitException...",
  "labels": ["incident", "autopilot", "prod"]
}
```

**YOU SAY**: "This creates a GitHub issue via Composio. Escalates to on-call. Logs it in memory. **That's the flywheel.**"

---

### Act 4: The Power (30 sec)

**YOU SAY**: "Let's show the memory working."

**YOU DO**:
1. Go back to Panel 1
2. Enter the SAME error from Scenario B
3. Click **"🔍 Diagnose"**
4. NOW it returns: Confidence HIGH, with the solution you just saved

**YOU SAY**: "We only had to solve it once. Now it's in the team's memory forever."

---

## 🎯 Judge Questions - Prepared Answers

### "Why Redis? Why not vector DB like Pinecone?"

> "Redis gives us **sub-5ms retrieval** because it's also our cache + session store. We're not adding a new service. Plus RediSearch with HNSW is production-grade for 10K-1M incidents."

### "How does the agent 'act in the real world'?"

> "Composio integration. When we detect a new incident, the agent creates a GitHub issue, assigns on-call, logs to Slack. We're showing GitHub because it's universal. Same pattern works for PagerDuty, Jira, etc."

### "What's novel about this?"

> "Most incident tools are **search** (Jira) or **alerts** (PagerDuty). We're **memory + reasoning**. VoyageAI embeddings mean we match **semantic similarity**, not keywords. 'null pointer' and 'undefined is not an object' are the same to us."

### "Scale? Cost?"

> "Redis Cloud free tier = 30MB. At 4KB/incident (embedding + metadata), that's **7,500 incidents**. For 100-person startup, that's **years** of incidents. VoyageAI = $0.10/1M tokens. Even 1K incidents/day = **$1/month**."

---

## 📊 Architecture Diagram (Show on Laptop)

```
┌─────────────────┐
│  VS Code Ext    │  ← Developer opens log, clicks Diagnose
└────────┬────────┘
         │ HTTP POST /diagnose
         │
┌────────▼────────┐
│  Express API    │  ← Receives error + metadata
└────────┬────────┘
         │
         ├──────► VoyageAI (embed error → 1024-d vector)
         │
         └──────► Redis (FT.SEARCH KNN top 3 matches)
                      │
                      └─► Returns past incidents with similarity scores
```

**Key Callouts**:
- **Low latency**: Redis in-memory, <10ms
- **AI reasoning**: VoyageAI for semantic understanding
- **Agent actions**: Composio for GitHub/Slack/PagerDuty

---

## 🎭 Backup Demos (If Extra Time)

### "Generate Hotfix PR Payload"

**Panel 3: PR Automation**
1. Fill repo, branch, commit message
2. Click **"Generate Hotfix PR Payload"**
3. Show JSON output:
```json
{
  "repo": "acme/payment-service",
  "branchName": "hotfix/null-guard-amount",
  "pullRequest": {
    "title": "hotfix: Crash on undefined amount",
    "body": "Automated fix from Incident Autopilot"
  }
}
```

**YOU SAY**: "This payload goes to Composio → GitHub to open a PR automatically. That's the 'Cursor meets OpsGenie' moment."

---

## ✅ Success Metrics to Mention

- **MTTR**: Mean Time To Resolution drops from hours → minutes
- **Knowledge retention**: Fixes survive oncall handoffs
- **Onboarding**: New engineers get senior-level answers day 1
- **Cost**: Redis + VoyageAI = **pennies per incident**

---

## 🎬 Closing Line

> "We're not just fixing incidents. We're building **institutional memory**. Every bug teaches the system. Every fix makes the team smarter. This is how you turn on-call from hell into autopilot."

**Then show**: 
- GitHub repo
- Redis Cloud dashboard (2 incidents stored)
- VoyageAI usage (1K tokens = $0.0001)

**Ask**: "Questions?"

