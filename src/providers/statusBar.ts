import * as vscode from 'vscode';

export class StatusBarProvider {
    private statusBarItem: vscode.StatusBarItem;
    private updateInterval: NodeJS.Timeout | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        context.subscriptions.push(this.statusBarItem);
    }

    initialize(): void {
        this.updateStatusBar();
        this.statusBarItem.show();

        // Update status bar every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateStatusBar();
        }, 30000);

        this.context.subscriptions.push({
            dispose: () => {
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
            }
        });
    }

    private updateStatusBar(): void {
        const performanceStatus = this.getPerformanceStatus();
        
        this.statusBarItem.text = `$(pulse) ${performanceStatus.text}`;
        this.statusBarItem.tooltip = this.createTooltip(performanceStatus);
        this.statusBarItem.command = 'ultimateOptimizer.showDashboard';
        this.statusBarItem.backgroundColor = performanceStatus.backgroundColor;
    }

    private getPerformanceStatus(): {
        text: string;
        score: number;
        issues: string[];
        backgroundColor?: vscode.ThemeColor;
        } {
        const config = vscode.workspace.getConfiguration();
        const extensions = vscode.extensions.all;
        const activeExtensions = extensions.filter(ext => ext.isActive).length;
        
        let score = 0;
        const issues: string[] = [];

        // Check telemetry (25 points)
        if (config.get('telemetry.telemetryLevel') === 'off') {
            score += 25;
        } else {
            issues.push('Telemetry not disabled');
        }

        // Check memory optimizations (25 points)
        const memoryOptimizations = [
            !config.get('editor.minimap.enabled'),
            !config.get('editor.codeLens'),
            !config.get('breadcrumbs.enabled'),
            !config.get('workbench.tips.enabled')
        ];
        const memoryScore = memoryOptimizations.filter(Boolean).length;
        score += (memoryScore / 4) * 25;
        
        if (memoryScore < 3) {
            issues.push('Memory optimizations not applied');
        }

        // Check Augment optimization (25 points)
        const augmentExtension = vscode.extensions.getExtension('augment.vscode-augment');
        if (augmentExtension) {
            const tokenRefresh = config.get('augment.auth.tokenRefreshInterval');
            const networkTimeout = config.get('augment.network.timeout');
            
            if (tokenRefresh === 3600000 && networkTimeout === 60000) {
                score += 25;
            } else {
                issues.push('Augment not optimized');
            }
        } else {
            score += 25; // Not applicable if Augment not installed
        }

        // Check extension count (25 points)
        if (activeExtensions < 10) {
            score += 25;
        } else if (activeExtensions < 15) {
            score += 20;
        } else if (activeExtensions < 20) {
            score += 15;
        } else if (activeExtensions < 30) {
            score += 10;
        } else {
            score += 5;
            issues.push('Too many active extensions');
        }

        let text: string;
        let backgroundColor: vscode.ThemeColor | undefined;

        if (score >= 90) {
            text = 'Excellent';
            backgroundColor = undefined; // Default color for excellent
        } else if (score >= 75) {
            text = 'Good';
            backgroundColor = undefined;
        } else if (score >= 50) {
            text = 'Fair';
            backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            text = 'Poor';
            backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }

        return { text, score, issues, backgroundColor };
    }

    private createTooltip(status: { text: string; score: number; issues: string[] }): string {
        const config = vscode.workspace.getConfiguration();
        const extensions = vscode.extensions.all;
        const activeExtensions = extensions.filter(ext => ext.isActive).length;
        
        let tooltip = `Ultimate Optimizer - Performance: ${status.text} (${status.score}/100)\n\n`;
        
        // Current status
        tooltip += '📊 Current Status:\n';
        tooltip += `• Extensions: ${activeExtensions}/${extensions.length} active\n`;
        tooltip += `• Telemetry: ${config.get('telemetry.telemetryLevel') === 'off' ? 'Disabled ✅' : 'Enabled ❌'}\n`;
        tooltip += `• Memory optimized: ${this.getMemoryOptimizationStatus()}\n`;
        
        const augmentExtension = vscode.extensions.getExtension('augment.vscode-augment');
        if (augmentExtension) {
            tooltip += `• Augment optimized: ${this.getAugmentOptimizationStatus()}\n`;
        }
        
        // Issues
        if (status.issues.length > 0) {
            tooltip += '\n⚠️ Issues Found:\n';
            status.issues.forEach(issue => {
                tooltip += `• ${issue}\n`;
            });
        }
        
        // Quick actions
        tooltip += '\n💡 Quick Actions:\n';
        tooltip += '• Click to open Performance Dashboard\n';
        tooltip += '• Use Command Palette: "Ultimate Optimizer"';
        
        return tooltip;
    }

    private getMemoryOptimizationStatus(): string {
        const config = vscode.workspace.getConfiguration();
        const optimizations = [
            !config.get('editor.minimap.enabled'),
            !config.get('editor.codeLens'),
            !config.get('breadcrumbs.enabled'),
            !config.get('workbench.tips.enabled')
        ];
        
        const count = optimizations.filter(Boolean).length;
        return `${count}/4 ${count >= 3 ? '✅' : '❌'}`;
    }

    private getAugmentOptimizationStatus(): string {
        const config = vscode.workspace.getConfiguration();
        const tokenRefresh = config.get('augment.auth.tokenRefreshInterval');
        const networkTimeout = config.get('augment.network.timeout');
        
        return (tokenRefresh === 3600000 && networkTimeout === 60000) ? '✅' : '❌';
    }

    updateAfterOptimization(): void {
        // Force immediate update after optimization
        this.updateStatusBar();
        
        // Show temporary success indicator
        const originalText = this.statusBarItem.text;
        this.statusBarItem.text = '$(check) Optimized!';
        
        setTimeout(() => {
            this.updateStatusBar();
        }, 3000);
    }

    showOptimizationProgress(): void {
        this.statusBarItem.text = '$(sync~spin) Optimizing...';
    }
}
