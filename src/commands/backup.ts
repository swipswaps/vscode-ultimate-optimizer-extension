import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class BackupManager {
    private backupDir: string;

    constructor(private context: vscode.ExtensionContext) {
        this.backupDir = path.join(os.homedir(), '.vscode-ultimate-optimizer-backups');
        this.ensureBackupDirectory();
    }

    async createBackup(): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
            
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Creating Backup",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Preparing backup..." });

                // Create backup directory
                fs.mkdirSync(backupPath, { recursive: true });

                progress.report({ increment: 25, message: "Backing up settings..." });
                await this.backupSettings(backupPath);

                progress.report({ increment: 50, message: "Backing up extensions..." });
                await this.backupExtensions(backupPath);

                progress.report({ increment: 75, message: "Creating manifest..." });
                await this.createBackupManifest(backupPath);

                progress.report({ increment: 100, message: "Backup complete!" });
            });

            // Store latest backup path
            this.context.globalState.update('latestBackupPath', backupPath);

            vscode.window.showInformationMessage(
                `✅ Backup created successfully at: ${backupPath}`,
                'Open Folder'
            ).then(action => {
                if (action === 'Open Folder') {
                    vscode.env.openExternal(vscode.Uri.file(backupPath));
                }
            });

            return backupPath;

        } catch (error) {
            vscode.window.showErrorMessage(`Backup failed: ${error}`);
            throw error;
        }
    }

    async restoreFromBackup(): Promise<void> {
        try {
            // Get available backups
            const backups = this.getAvailableBackups();
            
            if (backups.length === 0) {
                vscode.window.showWarningMessage('No backups found to restore from.');
                return;
            }

            // Let user select backup
            const selectedBackup = await vscode.window.showQuickPick(
                backups.map(backup => ({
                    label: backup.name,
                    description: backup.date,
                    detail: backup.path
                })),
                {
                    placeHolder: 'Select a backup to restore from',
                    ignoreFocusOut: true
                }
            );

            if (!selectedBackup) {
                return;
            }

            // Confirm restoration
            const confirm = await vscode.window.showWarningMessage(
                'This will restore your settings from the selected backup. Current settings will be overwritten. Continue?',
                'Yes, Restore',
                'Cancel'
            );

            if (confirm !== 'Yes, Restore') {
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Restoring Backup",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Preparing restoration..." });

                const backupPath = selectedBackup.detail!;

                progress.report({ increment: 30, message: "Restoring settings..." });
                await this.restoreSettings(backupPath);

                progress.report({ increment: 70, message: "Restoring extensions..." });
                await this.restoreExtensions(backupPath);

                progress.report({ increment: 100, message: "Restoration complete!" });
            });

            const action = await vscode.window.showInformationMessage(
                '✅ Settings restored successfully! Restart VSCode to apply all changes.',
                'Restart Now',
                'Later'
            );

            if (action === 'Restart Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Restoration failed: ${error}`);
        }
    }

    async resetToDefaults(): Promise<void> {
        const confirm = await vscode.window.showWarningMessage(
            'This will reset VSCode settings to defaults. This action cannot be undone. Continue?',
            'Yes, Reset',
            'Cancel'
        );

        if (confirm !== 'Yes, Reset') {
            return;
        }

        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Resetting to Defaults",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Creating safety backup..." });
                
                // Create a safety backup first
                await this.createBackup();

                progress.report({ increment: 50, message: "Resetting settings..." });
                await this.resetAllSettings();

                progress.report({ increment: 100, message: "Reset complete!" });
            });

            const action = await vscode.window.showInformationMessage(
                '✅ Settings reset to defaults! Restart VSCode to apply all changes.',
                'Restart Now',
                'Later'
            );

            if (action === 'Restart Now') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Reset failed: ${error}`);
        }
    }

    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    private async backupSettings(backupPath: string): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        const settings = {};

        // Get all configuration keys that have been modified
        const inspect = config.inspect('');
        if (inspect?.globalValue) {
            Object.assign(settings, inspect.globalValue);
        }

        // Save settings to file
        const settingsPath = path.join(backupPath, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    }

    private async backupExtensions(backupPath: string): Promise<void> {
        const extensions = vscode.extensions.all
            .filter(ext => !ext.packageJSON.isBuiltin)
            .map(ext => ({
                id: ext.id,
                version: ext.packageJSON.version,
                enabled: ext.isActive
            }));

        const extensionsPath = path.join(backupPath, 'extensions.json');
        fs.writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
    }

    private async createBackupManifest(backupPath: string): Promise<void> {
        const manifest = {
            timestamp: new Date().toISOString(),
            vscodeVersion: vscode.version,
            platform: process.platform,
            extensionVersion: this.context.extension?.packageJSON.version,
            backupType: 'full'
        };

        const manifestPath = path.join(backupPath, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    private getAvailableBackups(): Array<{name: string, date: string, path: string}> {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }

        return fs.readdirSync(this.backupDir)
            .filter(name => name.startsWith('backup-'))
            .map(name => {
                const backupPath = path.join(this.backupDir, name);
                const manifestPath = path.join(backupPath, 'manifest.json');
                
                let date = 'Unknown date';
                if (fs.existsSync(manifestPath)) {
                    try {
                        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                        date = new Date(manifest.timestamp).toLocaleString();
                    } catch (error) {
                        // Ignore manifest read errors
                    }
                }

                return {
                    name: name.replace('backup-', '').replace(/[-T]/g, ' '),
                    date,
                    path: backupPath
                };
            })
            .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date descending
    }

    private async restoreSettings(backupPath: string): Promise<void> {
        const settingsPath = path.join(backupPath, 'settings.json');
        
        if (!fs.existsSync(settingsPath)) {
            throw new Error('Settings backup file not found');
        }

        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const config = vscode.workspace.getConfiguration();

        // Apply each setting
        for (const [key, value] of Object.entries(settings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
    }

    private async restoreExtensions(backupPath: string): Promise<void> {
        const extensionsPath = path.join(backupPath, 'extensions.json');
        
        if (!fs.existsSync(extensionsPath)) {
            return; // Extensions backup is optional
        }

        const extensions = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
        const currentExtensions = vscode.extensions.all.map(ext => ext.id);

        // Show information about extensions that would need to be installed
        const missingExtensions = extensions
            .filter((ext: any) => !currentExtensions.includes(ext.id))
            .map((ext: any) => ext.id);

        if (missingExtensions.length > 0) {
            vscode.window.showInformationMessage(
                `Note: ${missingExtensions.length} extensions from the backup are not currently installed. You may need to install them manually.`,
                'Show List'
            ).then(action => {
                if (action === 'Show List') {
                    vscode.window.showInformationMessage(
                        `Missing extensions: ${missingExtensions.join(', ')}`
                    );
                }
            });
        }
    }

    private async resetAllSettings(): Promise<void> {
        const config = vscode.workspace.getConfiguration();
        
        // Get all configuration sections
        const allSettings = config.inspect('');
        
        if (allSettings?.globalValue) {
            // Reset each setting to undefined (which removes the custom value)
            for (const key of Object.keys(allSettings.globalValue)) {
                await config.update(key, undefined, vscode.ConfigurationTarget.Global);
            }
        }
    }
}
