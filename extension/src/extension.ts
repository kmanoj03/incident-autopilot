import * as vscode from 'vscode';
import { SidebarProvider } from './sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Incident Autopilot extension activated');

  const sidebarProvider = new SidebarProvider(context.extensionUri);
  
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('incidentAssist', sidebarProvider)
  );

  // Register file picker command
  context.subscriptions.push(
    vscode.commands.registerCommand('incidentAutopilot.pickFile', async () => {
      const files = await vscode.workspace.findFiles('**/*.log', '**/node_modules/**', 100);
      
      const items = files.map(file => ({
        label: vscode.workspace.asRelativePath(file),
        description: file.fsPath,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a log file',
        matchOnDescription: true,
      });

      if (selected) {
        sidebarProvider.setLogFile(selected.label);
      }
    })
  );
}

export function deactivate() {}

