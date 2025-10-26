# Incident Autopilot VS Code Extension

AI-powered incident diagnosis with semantic memory using Redis and VoyageAI embeddings.

## Features

- 📋 **Smart Log Parsing**: Automatically extract errors, service names, and environments from log files
- 🔍 **Vector-based Diagnosis**: Find similar past incidents using VoyageAI embeddings and Redis vector search
- 🧠 **Learning Memory**: Save fixes to a shared memory so teams never solve the same problem twice
- 🚀 **Hotfix Automation**: Generate PR payloads for Composio GitHub integration
- 🎫 **GitHub Issue Creation**: Automatically escalate new incidents with detailed context

## Usage

1. Open a workspace with log files
2. Click the Incident Autopilot icon in the activity bar
3. Enter a log file path or paste an error
4. Click "Diagnose" to find similar past incidents
5. Either:
   - **Known incident**: "Confirm Fix Works & Save to Memory"
   - **New incident**: "Attach Resolution & Close" + "Create GitHub Issue"

## Requirements

- Backend server running at `http://localhost:4000`
- Redis with RediSearch (vector search enabled)
- VoyageAI API key for embeddings

## Demo Flow

Perfect for hackathon judges:

1. Show a prod error log
2. Extension auto-parses service/env/error
3. Backend searches Redis for similar incidents (vector KNN)
4. Returns suggested fix with confidence
5. Save to memory → next engineer gets instant solution

**The flywheel**: Fix once, share forever.

