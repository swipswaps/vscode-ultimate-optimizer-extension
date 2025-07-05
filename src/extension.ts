import * as vscode from 'vscode';
import { OptimizerManager } from './commands/optimizer';
import { BackupManager } from './commands/backup';
import { PerformanceMonitor } from './commands/monitor';
import { StatusBarProvider } from './providers/statusBar';
import { DashboardProvider } from './providers/webview';

export function activate(context: vscode.ExtensionContext) {
    console.log('Ultimate VSCode Optimizer is now active!');

    // Initialize managers
    const optimizerManager = new OptimizerManager(context);
    const backupManager = new BackupManager(context);
    const performanceMonitor = new PerformanceMonitor(context);
    const statusBarProvider = new StatusBarProvider(context);
    const dashboardProvider = new DashboardProvider(context);

    // Register commands
    const commands = [
        // Core optimization commands
        vscode.commands.registerCommand('ultimateOptimizer.optimizePerformance', () => {
            optimizerManager.optimizePerformance();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.optimizeAugment', () => {
            optimizerManager.optimizeAugment();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.eliminateTelemetry', () => {
            optimizerManager.eliminateTelemetry();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.analyzePerformance', () => {
            optimizerManager.analyzePerformance();
        }),
        
        // Backup and restore commands
        vscode.commands.registerCommand('ultimateOptimizer.backupSettings', () => {
            backupManager.createBackup();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.restoreSettings', () => {
            backupManager.restoreFromBackup();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.resetToDefaults', () => {
            backupManager.resetToDefaults();
        }),
        
        // Monitoring commands
        vscode.commands.registerCommand('ultimateOptimizer.monitorPerformance', () => {
            performanceMonitor.startMonitoring();
        }),
        
        vscode.commands.registerCommand('ultimateOptimizer.showDashboard', () => {
            dashboardProvider.showDashboard();
        })
    ];

    // Add all commands to subscriptions
    commands.forEach(command => context.subscriptions.push(command));

    // Initialize status bar
    statusBarProvider.initialize();

    // Start performance monitoring if enabled
    const config = vscode.workspace.getConfiguration('ultimateOptimizer');
    if (config.get('monitoringEnabled', true)) {
        performanceMonitor.startBackgroundMonitoring();
    }

    // Auto-optimize if enabled
    if (config.get('autoOptimize', false)) {
        vscode.window.showInformationMessage(
            'Ultimate Optimizer: Auto-optimization is enabled. Apply optimizations now?',
            'Yes', 'No'
        ).then(selection => {
            if (selection === 'Yes') {
                optimizerManager.optimizePerformance();
            }
        });
    }

    // Show welcome message for first-time users
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
        context.globalState.update('hasShownWelcome', true);
    }
}

function showWelcomeMessage(context: vscode.ExtensionContext) {
    const message = 'Welcome to Ultimate VSCode Optimizer! Transform your VSCode performance with research-based optimizations.';
    
    vscode.window.showInformationMessage(
        message,
        'Show Dashboard',
        'Optimize Now',
        'Learn More'
    ).then(selection => {
        switch (selection) {
            case 'Show Dashboard':
                vscode.commands.executeCommand('ultimateOptimizer.showDashboard');
                break;
            case 'Optimize Now':
                vscode.commands.executeCommand('ultimateOptimizer.optimizePerformance');
                break;
            case 'Learn More':
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/swipswaps/vscode-ultimate-optimizer-extension'));
                break;
        }
    });
}

export function deactivate() {
    console.log('Ultimate VSCode Optimizer is now deactivated');
}
