# Extension Setup Instructions

## 1. Install Dependencies

```bash
cd extension
npm install @types/vscode @types/node typescript
```

## 2. Compile TypeScript

```bash
npm run compile
```

This will create the `out/` directory with compiled JavaScript.

## 3. Run the Extension

### Option A: Debug Mode (Development)
1. Open the `extension` folder in VS Code
2. Press `F5` to launch Extension Development Host
3. The extension will be loaded in a new VS Code window

### Option B: Install Locally
```bash
# Package the extension
npm install -g vsce
vsce package

# This creates incident-autopilot-0.0.1.vsix
# Install it:
code --install-extension incident-autopilot-0.0.1.vsix
```

## 4. Test the Extension

1. Make sure your backend is running:
   ```bash
   cd ../server
   npm run dev
   ```

2. Open VS Code workspace with a log file

3. Click the Incident Autopilot icon (🚨) in the activity bar

4. Test the flow:
   - Enter a log file path
   - Click "Parse Log"
   - Click "Diagnose"
   - Interact with results

## Demo Setup

For the hackathon demo:

1. Create a sample log file in your workspace:
   ```bash
   mkdir -p logs
   cat > logs/payment-service.log << 'EOF'
   [2024-01-15 10:23:45] INFO Starting payment processing
   [2024-01-15 10:23:46] INFO Processing order #12345
   [2024-01-15 10:23:47] ERROR TypeError: Cannot read properties of undefined (reading 'amount')
       at CheckoutService.processPayment (/app/services/payment/checkout.ts:145:32)
       at PaymentController.handleCheckout (/app/controllers/payment.ts:67:18)
   [2024-01-15 10:23:47] ERROR service=payment-service env=prod
   EOF
   ```

2. Have the backend running with some sample incidents already in Redis

3. Walk through the full flow live on stage

## Architecture

```
Extension (VS Code)
    ↓ (HTTP fetch)
Backend (Express + TypeScript)
    ↓ (vector search)
Redis Cloud (RediSearch + HNSW)
    ↓ (embeddings)
VoyageAI API
```

Perfect for showing:
- Low-latency retrieval (Redis)
- AI reasoning (VoyageAI embeddings)
- Agent actions (Composio GitHub)

