import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public setLogFile(filePath: string) {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'setLogFile',
        filePath,
      });
    }
  }

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'pickFile': {
          vscode.commands.executeCommand('incidentAutopilot.pickFile');
          break;
        }
        case 'parseLog': {
          await this.handleParseLog(data.filePath);
          break;
        }
        case 'diagnose': {
          await this.handleDiagnose(data.payload);
          break;
        }
        case 'saveToMemory': {
          console.log('🔵 Extension received saveToMemory message');
          await this.handleSaveToMemory(data.payload);
          break;
        }
        case 'applyPatch': {
          await this.handleApplyPatch(data.payload);
          break;
        }
        case 'createGitHubIssue': {
          await this.handleCreateGitHubIssue(data.payload);
          break;
        }
        case 'createGitHubPR': {
          await this.handleCreateGitHubPR(data.payload);
          break;
        }
      }
    });
  }

  private async handleParseLog(filePath: string) {
    try {
      // Get workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        this._view?.webview.postMessage({
          type: 'parseLogResult',
          error: 'No workspace folder open',
        });
        return;
      }

      // Read the file
      const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Parse last 200 lines
      const lines = content.split('\n');
      const recentLines = lines.slice(-200).join('\n');

      // Extract error (look for common error patterns)
      const errorMatch = recentLines.match(/(TypeError|ReferenceError|RuntimeException|Error|Exception|panic)[^\n]*/i);
      const errorSnippet = errorMatch ? errorMatch[0] : recentLines.slice(0, 300);

      // Extract service from path (e.g., logs/payment-service.log or services/payment-service/)
      // Try multiple patterns:
      // 1. Match filename with -service in it (e.g., payment-service.log)
      // 2. Match directory structure services/payment/
      // 3. Extract service=X from log content
      let service = 'unknown-service';
      
      // Try to extract from filename first (e.g., payment-service.log)
      const filenameMatch = filePath.match(/\/?([\w-]+-service)(?:\.log)?/i);
      if (filenameMatch) {
        service = filenameMatch[1];
      } else {
        // Try services/payment/ pattern
        const pathMatch = filePath.match(/services?\/([\\w-]+)/i);
        if (pathMatch) {
          service = pathMatch[1];
        } else {
          // Try to extract from log content (e.g., service=payment-service)
          const contentMatch = recentLines.match(/service[=:]\s*([\w-]+)/i);
          if (contentMatch) {
            service = contentMatch[1];
          }
        }
      }

      // Extract environment (look for env=prod, [prod], ENV=production, etc.)
      const envMatch = recentLines.match(/(?:env|ENV|environment)\s*[=:]\s*([\w]+)|\[([\w]+)\]/i);
      const environment = envMatch ? (envMatch[1] || envMatch[2]).toLowerCase() : 'prod';

      this._view?.webview.postMessage({
        type: 'parseLogResult',
        data: {
          description: errorSnippet,
          service,
          environment,
        },
      });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'parseLogResult',
        error: err.message,
      });
    }
  }

  private async handleDiagnose(payload: { description: string; service: string; environment: string }) {
    try {
      const response = await fetch('http://localhost:4000/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      this._view?.webview.postMessage({
        type: 'diagnoseResult',
        data,
      });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'diagnoseResult',
        error: err.message,
      });
    }
  }

  private async handleSaveToMemory(payload: {
    description: string;
    service: string;
    environment: string;
    rootCauseSummary: string;
    patchDiff: string;
  }) {
    console.log('🔵 Extension: handleSaveToMemory called');
    console.log('   Description:', payload.description?.substring(0, 50) + '...');
    console.log('   Service:', payload.service);
    console.log('   Environment:', payload.environment);
    console.log('   Root Cause:', payload.rootCauseSummary?.substring(0, 50) + '...');
    console.log('   Patch length:', payload.patchDiff?.length);

    try {
      console.log('🔵 Sending POST to http://localhost:4000/incidents');
      
      const response = await fetch('http://localhost:4000/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('✓ Response status:', response.status);

      const data = await response.json();
      console.log('✓ Response data:', data);
      
      this._view?.webview.postMessage({
        type: 'saveToMemoryResult',
        data,
      });

      vscode.window.showInformationMessage('✅ Incident saved to memory!');
    } catch (err: any) {
      console.error('❌ Error saving to memory:', err);
      
      this._view?.webview.postMessage({
        type: 'saveToMemoryResult',
        error: err.message,
      });
      
      vscode.window.showErrorMessage('❌ Failed to save: ' + err.message);
    }
  }

  private async handleApplyPatch(payload: {
    repo: string;
    filePath: string;
    branchName: string;
    commitMessage: string;
    finalPatchDiff: string;
    incidentSummary: string;
  }) {
    try {
      const response = await fetch('http://localhost:4000/patch/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      this._view?.webview.postMessage({
        type: 'applyPatchResult',
        data,
      });
    } catch (err: any) {
      this._view?.webview.postMessage({
        type: 'applyPatchResult',
        error: err.message,
      });
    }
  }

  private async handleCreateGitHubIssue(payload: {
    title: string;
    description: string;
    service: string;
    environment: string;
    rootCause?: string;
  }) {
    try {
      const response = await fetch('http://localhost:4000/github/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;
      
      if (data.success) {
        vscode.window.showInformationMessage(`✅ GitHub issue created: ${data.url}`);
        this._view?.webview.postMessage({
          type: 'createGitHubIssueResult',
          data,
        });
      } else {
        throw new Error(data.error || 'Failed to create issue');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`❌ Failed to create GitHub issue: ${err.message}`);
      this._view?.webview.postMessage({
        type: 'createGitHubIssueResult',
        error: err.message,
      });
    }
  }

  private async handleCreateGitHubPR(payload: {
    title: string;
    description: string;
    branchName: string;
    filePath: string;
    patch: string;
  }) {
    try {
      const response = await fetch('http://localhost:4000/github/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;
      
      if (data.success) {
        vscode.window.showInformationMessage(`✅ GitHub PR created: ${data.url}`);
        this._view?.webview.postMessage({
          type: 'createGitHubPRResult',
          data,
        });
      } else {
        throw new Error(data.error || 'Failed to create PR');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`❌ Failed to create GitHub PR: ${err.message}`);
      this._view?.webview.postMessage({
        type: 'createGitHubPRResult',
        error: err.message,
      });
    }
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Incident Assist</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background);
      padding: 16px;
    }

    .panel {
      margin-bottom: 24px;
      padding: 16px;
      background-color: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
    }

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--vscode-editor-foreground);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 10px;
      background-color: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .field {
      margin-bottom: 12px;
    }

    label {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
      color: var(--vscode-descriptionForeground);
    }

    input[type="text"],
    textarea {
      width: 100%;
      padding: 6px 8px;
      background-color: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }

    button {
      width: 100%;
      padding: 8px 12px;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      margin-top: 8px;
    }

    button:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    button.secondary {
      background-color: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background-color: var(--vscode-button-secondaryHoverBackground);
    }

    .readonly {
      background-color: var(--vscode-input-background);
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      border-radius: 3px;
      font-family: monospace;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      max-height: 120px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .confidence {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 8px;
    }

    .confidence-high {
      background-color: rgba(0, 255, 0, 0.2);
      color: #00ff00;
    }

    .confidence-medium {
      background-color: rgba(255, 165, 0, 0.2);
      color: #ffa500;
    }

    .confidence-low {
      background-color: rgba(255, 0, 0, 0.2);
      color: #ff6b6b;
    }

    .status-new {
      background-color: rgba(255, 165, 0, 0.2);
      color: #ffa500;
    }

    .status-known {
      background-color: rgba(0, 150, 255, 0.2);
      color: #0096ff;
    }

    .hidden {
      display: none;
    }

    .result-box {
      background-color: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-family: monospace;
      font-size: 11px;
      max-height: 300px;
      overflow-y: auto;
    }

    .spinner {
      border: 2px solid var(--vscode-panel-border);
      border-top: 2px solid var(--vscode-button-background);
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
      display: inline-block;
      margin-left: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .divider {
      height: 1px;
      background-color: var(--vscode-panel-border);
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <h2 style="margin-bottom: 20px; font-size: 16px;">🚨 Incident Autopilot</h2>

  <!-- Panel 1: Incident Source -->
  <div class="panel">
    <div class="panel-title">
      <span>📋 Incident Source</span>
    </div>

    <div class="field">
      <label>Log File Path</label>
      <div style="display: flex; gap: 8px;">
        <input type="text" id="logFilePath" placeholder="e.g., logs/payment-service.log" style="flex: 1;" />
        <button id="pickFileBtn" style="width: auto; padding: 8px 12px; background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);">@ Pick File</button>
      </div>
    </div>

    <button id="parseLogBtn">Parse Log</button>

    <div class="divider"></div>

    <div class="field">
      <label>Error/Stack Trace</label>
      <textarea id="description" placeholder="Auto-filled from log parsing..."></textarea>
    </div>

    <div class="field">
      <label>Service</label>
      <input type="text" id="service" placeholder="e.g., payment-service" />
    </div>

    <div class="field">
      <label>Environment</label>
      <input type="text" id="environment" placeholder="e.g., prod, staging" />
    </div>

    <button id="diagnoseBtn">🔍 Diagnose</button>
  </div>

  <!-- Panel 2: Diagnosis & Patch -->
  <div class="panel" id="diagnosisPanel">
    <div class="panel-title">
      <span>🧠 Diagnosis & Patch</span>
      <span class="badge" id="statusBadge">UNKNOWN</span>
    </div>

    <div class="field">
      <label>Root Cause</label>
      <div class="readonly" id="rootCause">Waiting for diagnosis...</div>
    </div>

    <div class="field">
      <label>Confidence</label>
      <div id="confidenceDisplay"></div>
    </div>

    <div class="field">
      <label>Suggested Patch (Editable)</label>
      <textarea id="patchDraft" placeholder="Patch will appear here..."></textarea>
    </div>

    <div class="field">
      <label>Root Cause Summary (for memory)</label>
      <input type="text" id="rootCauseSummaryInput" placeholder="e.g., JWT token validation missing" />
    </div>

    <button id="saveToMemoryBtn" style="background-color: var(--vscode-button-background); color: var(--vscode-button-foreground); padding: 12px; width: 100%; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; margin-top: 8px;">💾 Save Resolution to Memory</button>

    <button id="confirmFixBtn" class="hidden">✅ Confirm Fix Works & Save to Memory</button>
    <button id="attachResolutionBtn">🧠 Attach Resolution & Close</button>
    <button id="createIssueBtn" class="secondary hidden">🎫 Create GitHub Issue</button>
  </div>

  <!-- Panel 3: PR Automation -->
  <div class="panel hidden" id="prPanel">
    <div class="panel-title">
      <span>🚀 Hotfix PR Automation</span>
    </div>

    <div class="field">
      <label>Repository</label>
      <input type="text" id="repo" placeholder="e.g., acme/payment-service" />
    </div>

    <div class="field">
      <label>File Path</label>
      <input type="text" id="filePath" placeholder="e.g., src/payments/charge.ts" />
    </div>

    <div class="field">
      <label>Branch Name</label>
      <input type="text" id="branchName" placeholder="e.g., hotfix/null-guard-amount" />
    </div>

    <div class="field">
      <label>Commit Message</label>
      <input type="text" id="commitMessage" placeholder="e.g., fix: add null guard for amount" />
    </div>

    <button id="generatePRBtn">Generate Hotfix PR Payload</button>
    <button id="createGitHubIssueBtn" style="background-color: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); margin-top: 8px;">🎫 Create GitHub Issue</button>
    <button id="createGitHubPRBtn" style="background-color: var(--vscode-statusBarItem-warningBackground); color: var(--vscode-statusBarItem-warningForeground); margin-top: 8px;">🚀 Open Hotfix PR</button>

    <div id="prResult" class="result-box hidden"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    let currentState = {
      description: '',
      service: '',
      environment: '',
      diagnosisData: null,
    };

    // Panel 1 handlers
    document.getElementById('pickFileBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'pickFile' });
    });

    // Handle @ symbol in input field - trigger file picker
    document.getElementById('logFilePath').addEventListener('input', (e) => {
      const input = e.target as HTMLInputElement;
      const value = input.value;
      
      // If user types @, trigger file picker
      if (value.endsWith('@')) {
        // Clear the @ symbol
        input.value = value.slice(0, -1);
        vscode.postMessage({ type: 'pickFile' });
      }
    });

    document.getElementById('parseLogBtn').addEventListener('click', () => {
      const filePath = document.getElementById('logFilePath').value;
      if (!filePath) {
        alert('Please enter a log file path');
        return;
      }
      vscode.postMessage({ type: 'parseLog', filePath });
    });

    document.getElementById('diagnoseBtn').addEventListener('click', () => {
      const description = document.getElementById('description').value;
      const service = document.getElementById('service').value;
      const environment = document.getElementById('environment').value;

      if (!description || !service || !environment) {
        alert('Please fill all fields');
        return;
      }

      currentState = { description, service, environment, diagnosisData: null };
      
      vscode.postMessage({
        type: 'diagnose',
        payload: { description, service, environment }
      });

      document.getElementById('diagnoseBtn').innerHTML = '🔍 Diagnosing...<span class="spinner"></span>';
      document.getElementById('diagnoseBtn').disabled = true;
    });

    // Panel 2 handlers
    document.getElementById('confirmFixBtn').addEventListener('click', () => {
      const rootCauseSummary = document.getElementById('rootCause').textContent;
      const patchDiff = document.getElementById('patchDraft').value;

      vscode.postMessage({
        type: 'saveToMemory',
        payload: {
          description: currentState.description,
          service: currentState.service,
          environment: currentState.environment,
          rootCauseSummary,
          patchDiff
        }
      });
    });

    document.getElementById('attachResolutionBtn').addEventListener('click', () => {
      // SIMPLE: Just get the patch and save it
      const patchDiff = document.getElementById('patchDraft').value;
      
      if (!patchDiff || patchDiff.trim().length === 0) {
        alert('⚠️ Please write a suggested patch first');
        return;
      }

      if (!currentState || !currentState.description) {
        alert('⚠️ Please diagnose an incident first');
        return;
      }

      // Get root cause from diagnosis or use patch as summary
      let rootCauseSummary = document.getElementById('rootCause').textContent;
      if (!rootCauseSummary || rootCauseSummary.includes('No prior fix') || rootCauseSummary.includes('Waiting')) {
        rootCauseSummary = patchDiff.substring(0, 100);
      }

      // Send to backend
      vscode.postMessage({
        type: 'saveToMemory',
        payload: {
          description: currentState.description,
          service: currentState.service,
          environment: currentState.environment,
          rootCauseSummary,
          patchDiff
        }
      });

      // Show saving state
      const btn = document.getElementById('attachResolutionBtn');
      btn.innerHTML = '💾 Saving...<span class="spinner"></span>';
      btn.disabled = true;
    });

    // NEW SIMPLE BUTTON - Save to Memory
    document.getElementById('saveToMemoryBtn').addEventListener('click', () => {
      // Get values from form
      const patchDiff = document.getElementById('patchDraft').value;
      const rootCauseSummary = document.getElementById('rootCauseSummaryInput').value;

      // Validate
      if (!patchDiff || patchDiff.trim().length === 0) {
        alert('⚠️ Please write a suggested patch first');
        return;
      }

      if (!rootCauseSummary || rootCauseSummary.trim().length === 0) {
        alert('⚠️ Please enter a root cause summary');
        return;
      }

      if (!currentState || !currentState.description) {
        alert('⚠️ Please diagnose an incident first (Panel 1)');
        return;
      }

      // Send to backend
      vscode.postMessage({
        type: 'saveToMemory',
        payload: {
          description: currentState.description,
          service: currentState.service,
          environment: currentState.environment,
          rootCauseSummary,
          patchDiff
        }
      });

      // Show saving state
      const btn = document.getElementById('saveToMemoryBtn');
      btn.innerHTML = '💾 Saving...<span class="spinner"></span>';
      btn.disabled = true;
    });

    document.getElementById('createIssueBtn').addEventListener('click', () => {
      const rootCause = document.getElementById('rootCause').textContent;
      
      if (!currentState.description || !currentState.service || !currentState.environment) {
        alert('Please diagnose an incident first (Panel 1)');
        return;
      }
      
      vscode.postMessage({
        type: 'createGitHubIssue',
        payload: {
          title: '[' + currentState.environment.toUpperCase() + '] ' + currentState.service + ': Incident detected',
          description: currentState.description,
          service: currentState.service,
          environment: currentState.environment,
          rootCause: rootCause !== 'Waiting for diagnosis...' ? rootCause : undefined
        }
      });
      
      document.getElementById('createIssueBtn').innerHTML = '🎫 Creating Issue...<span class="spinner"></span>';
      document.getElementById('createIssueBtn').disabled = true;
    });

    // Panel 3 handlers
    document.getElementById('generatePRBtn').addEventListener('click', () => {
      const repo = document.getElementById('repo').value;
      const filePath = document.getElementById('filePath').value;
      const branchName = document.getElementById('branchName').value;
      const commitMessage = document.getElementById('commitMessage').value;
      const finalPatchDiff = document.getElementById('patchDraft').value;
      const incidentSummary = document.getElementById('rootCause').textContent;

      if (!repo || !filePath || !branchName || !commitMessage) {
        alert('Please fill all PR fields');
        return;
      }

      vscode.postMessage({
        type: 'applyPatch',
        payload: {
          repo,
          filePath,
          branchName,
          commitMessage,
          finalPatchDiff,
          incidentSummary
        }
      });
    });

    // GitHub Issue creation
    document.getElementById('createGitHubIssueBtn').addEventListener('click', () => {
      const description = currentState.description;
      const service = currentState.service;
      const environment = currentState.environment;
      const rootCause = document.getElementById('rootCause').textContent;

      if (!description || !service || !environment) {
        alert('Please diagnose an incident first (Panel 1)');
        return;
      }

      vscode.postMessage({
        type: 'createGitHubIssue',
        payload: {
          title: '[' + environment.toUpperCase() + '] ' + service + ': Incident detected',
          description,
          service,
          environment,
          rootCause: rootCause !== 'Waiting for diagnosis...' ? rootCause : undefined
        }
      });

      document.getElementById('createGitHubIssueBtn').innerHTML = '🎫 Creating Issue...<span class="spinner"></span>';
      document.getElementById('createGitHubIssueBtn').disabled = true;
    });

    // GitHub PR creation
    document.getElementById('createGitHubPRBtn').addEventListener('click', () => {
      const branchName = document.getElementById('branchName').value;
      const filePath = document.getElementById('filePath').value;
      const patchDiff = document.getElementById('patchDraft').value;
      const rootCause = document.getElementById('rootCause').textContent;

      if (!branchName || !filePath || !patchDiff) {
        alert('Please fill Branch Name, File Path, and ensure Patch Draft is ready');
        return;
      }

      vscode.postMessage({
        type: 'createGitHubPR',
        payload: {
          title: 'hotfix: ' + rootCause.slice(0, 50),
          description: 'Automated fix from Incident Autopilot\\n\\n**Root Cause:** ' + rootCause,
          branchName,
          filePath,
          patch: patchDiff
        }
      });

      document.getElementById('createGitHubPRBtn').innerHTML = '🚀 Creating PR...<span class="spinner"></span>';
      document.getElementById('createGitHubPRBtn').disabled = true;
    });

    // Handle messages from extension
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'setLogFile':
          document.getElementById('logFilePath').value = message.filePath;
          break;

        case 'parseLogResult':
          if (message.error) {
            alert('Error parsing log: ' + message.error);
          } else {
            document.getElementById('description').value = message.data.description;
            document.getElementById('service').value = message.data.service;
            document.getElementById('environment').value = message.data.environment;
          }
          break;

        case 'diagnoseResult':
          document.getElementById('diagnoseBtn').innerHTML = '🔍 Diagnose';
          document.getElementById('diagnoseBtn').disabled = false;

          if (message.error) {
            alert('Error diagnosing: ' + message.error);
          } else {
            currentState.diagnosisData = message.data;
            displayDiagnosisResults(message.data);
          }
          break;

        case 'saveToMemoryResult':
          // Reset both button states
          const attachBtn = document.getElementById('attachResolutionBtn');
          if (attachBtn) {
            attachBtn.innerHTML = '🧠 Attach Resolution & Close';
            attachBtn.disabled = false;
          }

          const saveBtn = document.getElementById('saveToMemoryBtn');
          if (saveBtn) {
            saveBtn.innerHTML = '💾 Save Resolution to Memory';
            saveBtn.disabled = false;
          }

          if (message.error) {
            alert('❌ Error saving: ' + message.error);
          } else {
            alert('✅ Incident saved to memory!\n\nThis resolution will help diagnose similar incidents in the future.');
            
            // Clear the form
            document.getElementById('patchDraft').value = '';
            document.getElementById('rootCauseSummaryInput').value = '';
            document.getElementById('description').value = '';
            
            // Hide panels
            document.getElementById('diagnosisPanel').classList.add('hidden');
            document.getElementById('prPanel').classList.add('hidden');
          }
          break;

        case 'applyPatchResult':
          if (message.error) {
            alert('Error generating PR: ' + message.error);
          } else {
            document.getElementById('prResult').textContent = JSON.stringify(message.data, null, 2);
            document.getElementById('prResult').classList.remove('hidden');
          }
          break;

        case 'createGitHubIssueResult':
          // Reset both GitHub Issue buttons (Panel 2 and Panel 3)
          document.getElementById('createGitHubIssueBtn').innerHTML = '🎫 Create GitHub Issue';
          document.getElementById('createGitHubIssueBtn').disabled = false;
          document.getElementById('createIssueBtn').innerHTML = '🎫 Create GitHub Issue';
          document.getElementById('createIssueBtn').disabled = false;
          
          if (message.error) {
            alert('Error creating issue: ' + message.error);
          } else {
            // Success message is shown by VS Code notification
            document.getElementById('prResult').innerHTML = '<strong>✅ GitHub Issue Created!</strong><br><a href="' + message.data.url + '" target="_blank">' + message.data.url + '</a>';
            document.getElementById('prResult').classList.remove('hidden');
          }
          break;

        case 'createGitHubPRResult':
          document.getElementById('createGitHubPRBtn').innerHTML = '🚀 Open Hotfix PR';
          document.getElementById('createGitHubPRBtn').disabled = false;
          
          if (message.error) {
            alert('Error creating PR: ' + message.error);
          } else {
            // Success message is shown by VS Code notification
            document.getElementById('prResult').innerHTML = '<strong>✅ GitHub PR Created!</strong><br><a href="' + message.data.url + '" target="_blank">' + message.data.url + '</a>';
            document.getElementById('prResult').classList.remove('hidden');
          }
          break;
      }
    });

    function displayDiagnosisResults(data) {
      const panel = document.getElementById('diagnosisPanel');
      panel.classList.remove('hidden');

      const matches = data.matches || [];
      const suggestedFix = data.suggestedFix || {};
      const topMatch = matches[0];
      const similarity = topMatch ? topMatch.similarity : 0;

      // Update root cause
      document.getElementById('rootCause').textContent = suggestedFix.summary || 'No root cause found';

      // Update confidence
      const confidence = suggestedFix.confidence || 'low';
      const confDisplay = document.getElementById('confidenceDisplay');
      confDisplay.innerHTML = \`<span class="confidence confidence-\${confidence}">\${confidence.toUpperCase()}</span>\`;

      // Update patch draft
      document.getElementById('patchDraft').value = suggestedFix.patchDiffDraft || '';

      // Update status badge and buttons
      const statusBadge = document.getElementById('statusBadge');
      const confirmBtn = document.getElementById('confirmFixBtn');
      const attachBtn = document.getElementById('attachResolutionBtn');
      const createIssueBtn = document.getElementById('createIssueBtn');

      if (similarity >= 0.7) {
        // Known incident
        statusBadge.textContent = 'KNOWN PATTERN';
        statusBadge.className = 'badge status-known';
        confirmBtn.classList.remove('hidden');
        attachBtn.classList.add('hidden');
        createIssueBtn.classList.add('hidden');
      } else {
        // New incident
        statusBadge.textContent = 'NEW INCIDENT';
        statusBadge.className = 'badge status-new';
        confirmBtn.classList.add('hidden');
        attachBtn.classList.remove('hidden');
        createIssueBtn.classList.remove('hidden');
      }

      // Show PR panel
      document.getElementById('prPanel').classList.remove('hidden');
    }
  </script>
</body>
</html>`;
  }
}

