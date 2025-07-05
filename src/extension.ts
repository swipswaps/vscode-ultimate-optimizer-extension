/**
 * Ultimate VSCode Optimizer Extension
 *
 * This extension provides comprehensive performance optimization for VSCode,
 * including specialized fixes for the Augment extension, backup/restore
 * functionality, and real-time performance monitoring.
 *
 * @version 0.1.0-beta
 * @author swipswaps
 * @license MIT
 */

import * as vscode from 'vscode';
import { OptimizerManager } from './commands/optimizer';
import { BackupManager } from './commands/backup';
import { PerformanceMonitor } from './commands/monitor';
import { StatusBarProvider } from './providers/statusBar';
import { DashboardProvider } from './providers/webview';

/**
 * Extension activation function
 *
 * Called when the extension is activated. Initializes all managers,
 * registers commands, sets up status bar, and starts background monitoring.
 *
 * @param context - VSCode extension context for managing subscriptions and state
 */
export function activate(context: vscode.ExtensionContext): void {
    // Log activation for debugging purposes
    console.log('Ultimate VSCode Optimizer v0.1.0-beta is now active!');

    // Initialize all manager classes with the extension context
    // These managers handle different aspects of the optimization functionality
    const optimizerManager = new OptimizerManager(context);
    const backupManager = new BackupManager(context);
    const performanceMonitor = new PerformanceMonitor(context);
    const statusBarProvider = new StatusBarProvider(context);
    const dashboardProvider = new DashboardProvider(context);

    /**
     * Register all extension commands
     *
     * Commands are organized into categories:
     * - Core optimization commands (performance, Augment, telemetry)
     * - Backup and restore commands (backup, restore, reset)
     * - Monitoring commands (monitor, dashboard)
     */
    const commands = [
        // === CORE OPTIMIZATION COMMANDS ===

        /**
         * Main performance optimization command
         * Applies comprehensive optimizations based on selected profile
         */
        vscode.commands.registerCommand('ultimateOptimizer.optimizePerformance', () => {
            optimizerManager.optimizePerformance();
        }),

        /**
         * Augment-specific optimization command
         * Fixes keyring storms, network timeouts, and token refresh issues
         */
        vscode.commands.registerCommand('ultimateOptimizer.optimizeAugment', () => {
            optimizerManager.optimizeAugment();
        }),

        /**
         * Telemetry elimination command
         * Disables all telemetry and tracking for privacy and performance
         */
        vscode.commands.registerCommand('ultimateOptimizer.eliminateTelemetry', () => {
            optimizerManager.eliminateTelemetry();
        }),

        /**
         * Performance analysis command
         * Generates detailed report of current optimization status
         */
        vscode.commands.registerCommand('ultimateOptimizer.analyzePerformance', () => {
            optimizerManager.analyzePerformance();
        }),

        // === BACKUP AND RESTORE COMMANDS ===

        /**
         * Settings backup command
         * Creates timestamped backup of current settings and extensions
         */
        vscode.commands.registerCommand('ultimateOptimizer.backupSettings', () => {
            backupManager.createBackup();
        }),

        /**
         * Settings restore command
         * Restores settings from a selected backup with user confirmation
         */
        vscode.commands.registerCommand('ultimateOptimizer.restoreSettings', () => {
            backupManager.restoreFromBackup();
        }),

        /**
         * Reset to defaults command
         * Resets all settings to VSCode defaults (with safety backup)
         */
        vscode.commands.registerCommand('ultimateOptimizer.resetToDefaults', () => {
            backupManager.resetToDefaults();
        }),

        // === MONITORING COMMANDS ===

        /**
         * Performance monitoring command
         * Starts real-time performance monitoring with output to console
         */
        vscode.commands.registerCommand('ultimateOptimizer.monitorPerformance', () => {
            performanceMonitor.startMonitoring();
        }),

        /**
         * Dashboard command
         * Opens the visual performance dashboard webview
         */
        vscode.commands.registerCommand('ultimateOptimizer.showDashboard', () => {
            dashboardProvider.showDashboard();
        })
    ];

    /**
     * Register all commands with the extension context
     * This ensures proper cleanup when the extension is deactivated
     */
    commands.forEach(command => context.subscriptions.push(command));

    /**
     * Initialize the status bar provider
     * This creates the performance indicator in the status bar
     */
    statusBarProvider.initialize();

    /**
     * Start background performance monitoring if enabled in settings
     * This provides automatic performance alerts and recommendations
     */
    const config = vscode.workspace.getConfiguration('ultimateOptimizer');
    if (config.get('monitoringEnabled', true)) {
        performanceMonitor.startBackgroundMonitoring();
    }

    /**
     * Handle auto-optimization setting
     * If enabled, prompt user to apply optimizations on startup
     */
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

    /**
     * Show welcome message for first-time users
     * This helps new users discover the extension's features
     */
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
        context.globalState.update('hasShownWelcome', true);
    }
}

/**
 * Show welcome message for first-time users
 *
 * Provides quick access to key features and documentation.
 * Only shown once per installation to avoid being intrusive.
 *
 * @param context - Extension context for accessing global state
 */
function showWelcomeMessage(context: vscode.ExtensionContext): void {
    const message = 'Welcome to Ultimate VSCode Optimizer! Transform your VSCode performance with research-based optimizations.';

    vscode.window.showInformationMessage(
        message,
        'Show Dashboard',
        'Optimize Now',
        'Learn More'
    ).then(selection => {
        switch (selection) {
        case 'Show Dashboard':
            // Open the visual performance dashboard
            vscode.commands.executeCommand('ultimateOptimizer.showDashboard');
            break;
        case 'Optimize Now':
            // Start immediate optimization with default profile
            vscode.commands.executeCommand('ultimateOptimizer.optimizePerformance');
            break;
        case 'Learn More':
            // Open GitHub repository for documentation
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/swipswaps/vscode-ultimate-optimizer-extension'));
            break;
        }
    });
}

/**
 * Extension deactivation function
 *
 * Called when the extension is deactivated. Performs cleanup
 * and logs deactivation for debugging purposes.
 */
export function deactivate(): void {
    console.log('Ultimate VSCode Optimizer v0.1.0-beta is now deactivated');
    // Note: VSCode automatically handles disposal of subscriptions
    // registered with context.subscriptions.push()
}
