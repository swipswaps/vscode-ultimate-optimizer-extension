import * as vscode from 'vscode';

interface PerformanceMetrics {
    timestamp: number;
    memoryUsage: number;
    extensionCount: number;
    activeExtensions: number;
    settingsOptimized: boolean;
    augmentOptimized: boolean;
}

export class PerformanceMonitor {
    private isMonitoring: boolean = false;
    private monitoringInterval: NodeJS.Timeout | undefined;
    private metrics: PerformanceMetrics[] = [];
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('Ultimate Optimizer Monitor');
        context.subscriptions.push(this.outputChannel);
    }

    startMonitoring(): void {
        if (this.isMonitoring) {
            vscode.window.showInformationMessage('Performance monitoring is already active.');
            return;
        }

        const config = vscode.workspace.getConfiguration('ultimateOptimizer');
        const interval = config.get('monitoringInterval', 30) * 1000; // Convert to milliseconds

        this.isMonitoring = true;
        this.outputChannel.show();
        this.outputChannel.appendLine('🔍 Performance monitoring started...');
        this.outputChannel.appendLine(`📊 Monitoring interval: ${interval / 1000} seconds`);
        this.outputChannel.appendLine('');

        // Initial measurement
        this.collectMetrics();

        // Start periodic monitoring
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, interval);

        // Show stop monitoring option
        vscode.window.showInformationMessage(
            '📊 Performance monitoring started. Check the Output panel for real-time metrics.',
            'Stop Monitoring',
            'Show Output'
        ).then(action => {
            if (action === 'Stop Monitoring') {
                this.stopMonitoring();
            } else if (action === 'Show Output') {
                this.outputChannel.show();
            }
        });
    }

    stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }

        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('⏹️ Performance monitoring stopped.');
        this.generateSummaryReport();

        vscode.window.showInformationMessage('📊 Performance monitoring stopped. Summary generated in Output panel.');
    }

    startBackgroundMonitoring(): void {
        // Start lightweight background monitoring
        const config = vscode.workspace.getConfiguration('ultimateOptimizer');
        const interval = Math.max(config.get('monitoringInterval', 30), 60) * 1000; // Minimum 1 minute for background

        setInterval(() => {
            this.collectMetricsQuietly();
            this.checkForPerformanceIssues();
        }, interval);
    }

    private collectMetrics(): void {
        const metrics = this.gatherCurrentMetrics();
        this.metrics.push(metrics);

        // Keep only last 100 measurements
        if (this.metrics.length > 100) {
            this.metrics = this.metrics.slice(-100);
        }

        this.displayMetrics(metrics);
    }

    private collectMetricsQuietly(): void {
        const metrics = this.gatherCurrentMetrics();
        this.metrics.push(metrics);

        // Keep only last 50 measurements for background monitoring
        if (this.metrics.length > 50) {
            this.metrics = this.metrics.slice(-50);
        }
    }

    private gatherCurrentMetrics(): PerformanceMetrics {
        const extensions = vscode.extensions.all;
        const config = vscode.workspace.getConfiguration();

        return {
            timestamp: Date.now(),
            memoryUsage: this.estimateMemoryUsage(),
            extensionCount: extensions.length,
            activeExtensions: extensions.filter(ext => ext.isActive).length,
            settingsOptimized: this.checkSettingsOptimization(),
            augmentOptimized: this.checkAugmentOptimization()
        };
    }

    private estimateMemoryUsage(): number {
        // Estimate memory usage based on extension count and settings
        const extensions = vscode.extensions.all;
        const activeExtensions = extensions.filter(ext => ext.isActive).length;
        
        // Base VSCode memory usage estimate
        let estimatedMemory = 150; // MB base

        // Add memory for active extensions (rough estimate)
        estimatedMemory += activeExtensions * 10; // 10MB per active extension

        // Adjust based on optimization status
        const config = vscode.workspace.getConfiguration();
        if (config.get('editor.minimap.enabled')) {
            estimatedMemory += 20; // Minimap overhead
        }
        if (config.get('editor.codeLens')) {
            estimatedMemory += 15; // CodeLens overhead
        }

        return estimatedMemory;
    }

    private checkSettingsOptimization(): boolean {
        const config = vscode.workspace.getConfiguration();
        
        const optimizations = [
            config.get('telemetry.telemetryLevel') === 'off',
            !config.get('workbench.enableExperiments'),
            !config.get('editor.minimap.enabled'),
            !config.get('editor.codeLens')
        ];

        return optimizations.filter(Boolean).length >= 3; // At least 3 out of 4 optimizations
    }

    private checkAugmentOptimization(): boolean {
        const config = vscode.workspace.getConfiguration();
        const augmentExtension = vscode.extensions.getExtension('augment.vscode-augment');
        
        if (!augmentExtension) {
            return true; // Not applicable if Augment not installed
        }

        return config.get('augment.auth.tokenRefreshInterval') === 3600000 &&
               config.get('augment.network.timeout') === 60000;
    }

    private displayMetrics(metrics: PerformanceMetrics): void {
        const time = new Date(metrics.timestamp).toLocaleTimeString();
        
        this.outputChannel.appendLine(`[${time}] Performance Metrics:`);
        this.outputChannel.appendLine(`  📊 Estimated Memory: ${metrics.memoryUsage} MB`);
        this.outputChannel.appendLine(`  🧩 Extensions: ${metrics.activeExtensions}/${metrics.extensionCount} active`);
        this.outputChannel.appendLine(`  ⚙️  Settings Optimized: ${metrics.settingsOptimized ? '✅' : '❌'}`);
        this.outputChannel.appendLine(`  🚀 Augment Optimized: ${metrics.augmentOptimized ? '✅' : '❌'}`);
        
        // Performance assessment
        const assessment = this.assessPerformance(metrics);
        this.outputChannel.appendLine(`  🎯 Performance: ${assessment}`);
        this.outputChannel.appendLine('');
    }

    private assessPerformance(metrics: PerformanceMetrics): string {
        let score = 0;
        
        // Memory score (0-25)
        if (metrics.memoryUsage < 200) {score += 25;}
        else if (metrics.memoryUsage < 300) {score += 20;}
        else if (metrics.memoryUsage < 400) {score += 15;}
        else if (metrics.memoryUsage < 500) {score += 10;}
        else {score += 5;}

        // Extension score (0-25)
        if (metrics.activeExtensions < 10) {score += 25;}
        else if (metrics.activeExtensions < 15) {score += 20;}
        else if (metrics.activeExtensions < 20) {score += 15;}
        else if (metrics.activeExtensions < 30) {score += 10;}
        else {score += 5;}

        // Optimization score (0-50)
        if (metrics.settingsOptimized) {score += 25;}
        if (metrics.augmentOptimized) {score += 25;}

        if (score >= 80) {return '🟢 Excellent';}
        if (score >= 60) {return '🟡 Good';}
        if (score >= 40) {return '🟠 Fair';}
        return '🔴 Poor';
    }

    private checkForPerformanceIssues(): void {
        if (this.metrics.length < 3) {return;}

        const recent = this.metrics.slice(-3);
        const avgMemory = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
        const avgActiveExtensions = recent.reduce((sum, m) => sum + m.activeExtensions, 0) / recent.length;

        // Check for high memory usage
        if (avgMemory > 400) {
            this.showPerformanceWarning(
                'High memory usage detected',
                `Average memory usage: ${avgMemory.toFixed(0)} MB. Consider optimizing settings.`,
                'Optimize Now'
            );
        }

        // Check for too many active extensions
        if (avgActiveExtensions > 25) {
            this.showPerformanceWarning(
                'Many active extensions detected',
                `${avgActiveExtensions.toFixed(0)} extensions are active. Consider disabling unused extensions.`,
                'Show Extensions'
            );
        }

        // Check if optimizations are not applied
        const unoptimized = recent.filter(m => !m.settingsOptimized || !m.augmentOptimized);
        if (unoptimized.length === recent.length) {
            this.showPerformanceWarning(
                'Performance optimizations not applied',
                'Your VSCode could be running faster with optimizations.',
                'Optimize Now'
            );
        }
    }

    private showPerformanceWarning(title: string, message: string, action: string): void {
        // Only show warnings every 10 minutes to avoid spam
        const lastWarning = this.context.globalState.get('lastPerformanceWarning', 0);
        const now = Date.now();
        
        if (now - lastWarning < 10 * 60 * 1000) { // 10 minutes
            return;
        }

        this.context.globalState.update('lastPerformanceWarning', now);

        vscode.window.showWarningMessage(
            `${title}: ${message}`,
            action,
            'Dismiss'
        ).then(selection => {
            if (selection === action) {
                if (action === 'Optimize Now') {
                    vscode.commands.executeCommand('ultimateOptimizer.optimizePerformance');
                } else if (action === 'Show Extensions') {
                    vscode.commands.executeCommand('workbench.extensions.action.showInstalledExtensions');
                }
            }
        });
    }

    private generateSummaryReport(): void {
        if (this.metrics.length === 0) {
            this.outputChannel.appendLine('No metrics collected during this session.');
            return;
        }

        const avgMemory = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / this.metrics.length;
        const avgActiveExtensions = this.metrics.reduce((sum, m) => sum + m.activeExtensions, 0) / this.metrics.length;
        const maxMemory = Math.max(...this.metrics.map(m => m.memoryUsage));
        const minMemory = Math.min(...this.metrics.map(m => m.memoryUsage));

        this.outputChannel.appendLine('📊 MONITORING SUMMARY REPORT');
        this.outputChannel.appendLine('================================');
        this.outputChannel.appendLine(`📈 Measurements taken: ${this.metrics.length}`);
        this.outputChannel.appendLine(`⏱️  Duration: ${((this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp) / 1000 / 60).toFixed(1)} minutes`);
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('💾 Memory Usage:');
        this.outputChannel.appendLine(`   Average: ${avgMemory.toFixed(1)} MB`);
        this.outputChannel.appendLine(`   Peak: ${maxMemory} MB`);
        this.outputChannel.appendLine(`   Minimum: ${minMemory} MB`);
        this.outputChannel.appendLine('');
        this.outputChannel.appendLine('🧩 Extensions:');
        this.outputChannel.appendLine(`   Average active: ${avgActiveExtensions.toFixed(1)}`);
        this.outputChannel.appendLine('');
        
        const lastMetrics = this.metrics[this.metrics.length - 1];
        this.outputChannel.appendLine('⚙️  Current Optimization Status:');
        this.outputChannel.appendLine(`   Settings optimized: ${lastMetrics.settingsOptimized ? '✅' : '❌'}`);
        this.outputChannel.appendLine(`   Augment optimized: ${lastMetrics.augmentOptimized ? '✅' : '❌'}`);
        this.outputChannel.appendLine('');

        // Recommendations
        this.outputChannel.appendLine('💡 Recommendations:');
        if (avgMemory > 300) {
            this.outputChannel.appendLine('   • Consider running performance optimization to reduce memory usage');
        }
        if (avgActiveExtensions > 20) {
            this.outputChannel.appendLine('   • Consider disabling unused extensions');
        }
        if (!lastMetrics.settingsOptimized) {
            this.outputChannel.appendLine('   • Run "Ultimate Optimizer: Optimize Performance" for better performance');
        }
        if (!lastMetrics.augmentOptimized) {
            this.outputChannel.appendLine('   • Run "Ultimate Optimizer: Optimize Augment Extension" to eliminate keyring storms');
        }
    }
}
