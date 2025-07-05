import * as vscode from 'vscode';

export class DashboardProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private context: vscode.ExtensionContext) {}

    showDashboard(): void {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'ultimateOptimizerDashboard',
            'Ultimate Optimizer Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                case 'optimize':
                    vscode.commands.executeCommand('ultimateOptimizer.optimizePerformance');
                    break;
                case 'optimizeAugment':
                    vscode.commands.executeCommand('ultimateOptimizer.optimizeAugment');
                    break;
                case 'eliminateTelemetry':
                    vscode.commands.executeCommand('ultimateOptimizer.eliminateTelemetry');
                    break;
                case 'backup':
                    vscode.commands.executeCommand('ultimateOptimizer.backupSettings');
                    break;
                case 'restore':
                    vscode.commands.executeCommand('ultimateOptimizer.restoreSettings');
                    break;
                case 'monitor':
                    vscode.commands.executeCommand('ultimateOptimizer.monitorPerformance');
                    break;
                case 'analyze':
                    vscode.commands.executeCommand('ultimateOptimizer.analyzePerformance');
                    break;
                case 'refresh':
                    this.refreshDashboard();
                    break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Initial data load
        this.refreshDashboard();
    }

    private refreshDashboard(): void {
        if (!this.panel) {return;}

        const data = this.gatherDashboardData();
        this.panel.webview.postMessage({
            command: 'updateData',
            data: data
        });
    }

    private gatherDashboardData(): any {
        const config = vscode.workspace.getConfiguration();
        const extensions = vscode.extensions.all;
        const activeExtensions = extensions.filter(ext => ext.isActive);

        // Performance score calculation
        let score = 0;
        const checks = {
            telemetry: config.get('telemetry.telemetryLevel') === 'off',
            minimap: !config.get('editor.minimap.enabled'),
            codeLens: !config.get('editor.codeLens'),
            breadcrumbs: !config.get('breadcrumbs.enabled'),
            tips: !config.get('workbench.tips.enabled'),
            experiments: !config.get('workbench.enableExperiments')
        };

        score += Object.values(checks).filter(Boolean).length * 15; // 90 points max for basic optimizations

        // Augment check
        const augmentExtension = vscode.extensions.getExtension('augment.vscode-augment');
        let augmentOptimized = true;
        if (augmentExtension) {
            augmentOptimized = config.get('augment.auth.tokenRefreshInterval') === 3600000 &&
                              config.get('augment.network.timeout') === 60000;
        }
        if (augmentOptimized) {score += 10;}

        return {
            timestamp: new Date().toISOString(),
            performance: {
                score: Math.min(score, 100),
                status: score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor'
            },
            extensions: {
                total: extensions.length,
                active: activeExtensions.length,
                builtin: extensions.filter(ext => ext.packageJSON.isBuiltin).length
            },
            optimizations: {
                telemetry: checks.telemetry,
                minimap: checks.minimap,
                codeLens: checks.codeLens,
                breadcrumbs: checks.breadcrumbs,
                tips: checks.tips,
                experiments: checks.experiments,
                augment: augmentOptimized
            },
            augmentInstalled: !!augmentExtension,
            recommendations: this.generateRecommendations(checks, augmentOptimized, activeExtensions.length)
        };
    }

    private generateRecommendations(checks: any, augmentOptimized: boolean, activeExtensionCount: number): string[] {
        const recommendations: string[] = [];

        if (!checks.telemetry) {
            recommendations.push('Disable telemetry for better privacy and performance');
        }
        if (!checks.minimap) {
            recommendations.push('Disable minimap to reduce memory usage');
        }
        if (!checks.codeLens) {
            recommendations.push('Disable CodeLens to improve editor performance');
        }
        if (!augmentOptimized) {
            recommendations.push('Optimize Augment extension to eliminate keyring storms');
        }
        if (activeExtensionCount > 20) {
            recommendations.push('Consider disabling unused extensions');
        }

        if (recommendations.length === 0) {
            recommendations.push('Your VSCode is well optimized! 🎉');
        }

        return recommendations;
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate Optimizer Dashboard</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header h1 {
            margin: 0;
            color: var(--vscode-textLink-foreground);
        }
        .performance-score {
            text-align: center;
            margin: 20px 0;
        }
        .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: white;
        }
        .score-excellent { background: #4CAF50; }
        .score-good { background: #2196F3; }
        .score-fair { background: #FF9800; }
        .score-poor { background: #F44336; }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
        }
        .card h3 {
            margin-top: 0;
            color: var(--vscode-textLink-foreground);
        }
        .optimization-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .optimization-item:last-child {
            border-bottom: none;
        }
        .status-icon {
            font-size: 18px;
        }
        .button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        .button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .button-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .button-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .actions {
            text-align: center;
            margin: 30px 0;
        }
        .recommendations {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 20px 0;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            text-align: center;
            margin: 20px 0;
        }
        .stat {
            flex: 1;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }
        .stat-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Ultimate VSCode Optimizer</h1>
        <p>Transform your VSCode performance with research-based optimizations</p>
    </div>

    <div class="performance-score">
        <div id="scoreCircle" class="score-circle">
            <span id="scoreValue">--</span>
        </div>
        <div id="scoreStatus">Loading...</div>
    </div>

    <div class="stats">
        <div class="stat">
            <div id="totalExtensions" class="stat-value">--</div>
            <div class="stat-label">Total Extensions</div>
        </div>
        <div class="stat">
            <div id="activeExtensions" class="stat-value">--</div>
            <div class="stat-label">Active Extensions</div>
        </div>
        <div class="stat">
            <div id="optimizationCount" class="stat-value">--</div>
            <div class="stat-label">Optimizations Applied</div>
        </div>
    </div>

    <div class="actions">
        <button class="button" onclick="sendCommand('optimize')">🚀 Optimize Performance</button>
        <button class="button" onclick="sendCommand('optimizeAugment')" id="augmentButton">⚡ Optimize Augment</button>
        <button class="button" onclick="sendCommand('eliminateTelemetry')">🛡️ Eliminate Telemetry</button>
        <button class="button button-secondary" onclick="sendCommand('backup')">📦 Backup Settings</button>
        <button class="button button-secondary" onclick="sendCommand('monitor')">📊 Monitor Performance</button>
        <button class="button button-secondary" onclick="sendCommand('analyze')">🔍 Analyze Performance</button>
    </div>

    <div class="grid">
        <div class="card">
            <h3>📊 Optimization Status</h3>
            <div id="optimizationStatus">
                <div class="optimization-item">
                    <span>Telemetry Disabled</span>
                    <span id="telemetryStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item">
                    <span>Minimap Disabled</span>
                    <span id="minimapStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item">
                    <span>CodeLens Disabled</span>
                    <span id="codeLensStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item">
                    <span>Breadcrumbs Disabled</span>
                    <span id="breadcrumbsStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item">
                    <span>Tips Disabled</span>
                    <span id="tipsStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item">
                    <span>Experiments Disabled</span>
                    <span id="experimentsStatus" class="status-icon">⏳</span>
                </div>
                <div class="optimization-item" id="augmentOptimization" style="display: none;">
                    <span>Augment Optimized</span>
                    <span id="augmentStatus" class="status-icon">⏳</span>
                </div>
            </div>
        </div>

        <div class="card">
            <h3>💡 Recommendations</h3>
            <div class="recommendations">
                <ul id="recommendationsList">
                    <li>Loading recommendations...</li>
                </ul>
            </div>
            <button class="button button-secondary" onclick="sendCommand('refresh')">🔄 Refresh</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function sendCommand(command) {
            vscode.postMessage({ command: command });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'updateData') {
                updateDashboard(message.data);
            }
        });

        function updateDashboard(data) {
            // Update performance score
            const scoreValue = document.getElementById('scoreValue');
            const scoreCircle = document.getElementById('scoreCircle');
            const scoreStatus = document.getElementById('scoreStatus');
            
            scoreValue.textContent = data.performance.score;
            scoreCircle.className = 'score-circle score-' + data.performance.status;
            scoreStatus.textContent = data.performance.status.charAt(0).toUpperCase() + data.performance.status.slice(1);

            // Update stats
            document.getElementById('totalExtensions').textContent = data.extensions.total;
            document.getElementById('activeExtensions').textContent = data.extensions.active;
            
            const optimizationCount = Object.values(data.optimizations).filter(Boolean).length;
            document.getElementById('optimizationCount').textContent = optimizationCount;

            // Update optimization status
            document.getElementById('telemetryStatus').textContent = data.optimizations.telemetry ? '✅' : '❌';
            document.getElementById('minimapStatus').textContent = data.optimizations.minimap ? '✅' : '❌';
            document.getElementById('codeLensStatus').textContent = data.optimizations.codeLens ? '✅' : '❌';
            document.getElementById('breadcrumbsStatus').textContent = data.optimizations.breadcrumbs ? '✅' : '❌';
            document.getElementById('tipsStatus').textContent = data.optimizations.tips ? '✅' : '❌';
            document.getElementById('experimentsStatus').textContent = data.optimizations.experiments ? '✅' : '❌';

            // Show/hide Augment optimization
            const augmentOptimization = document.getElementById('augmentOptimization');
            const augmentButton = document.getElementById('augmentButton');
            if (data.augmentInstalled) {
                augmentOptimization.style.display = 'flex';
                document.getElementById('augmentStatus').textContent = data.optimizations.augment ? '✅' : '❌';
                augmentButton.style.display = 'inline-block';
            } else {
                augmentOptimization.style.display = 'none';
                augmentButton.style.display = 'none';
            }

            // Update recommendations
            const recommendationsList = document.getElementById('recommendationsList');
            recommendationsList.innerHTML = '';
            data.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        }
    </script>
</body>
</html>`;
    }
}
