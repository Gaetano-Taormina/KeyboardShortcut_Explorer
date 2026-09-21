const vscode = require('vscode');
const { IPC_COMMANDS } = require('../constants/ipcCommands');

class ColorPickerPanel {
    static register(context) {
        let colorPickerPanel = null;
        let configListener = null;

        context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openColorPicker', () => {
            if (colorPickerPanel) {
                colorPickerPanel.reveal(vscode.ViewColumn.Active);
                return;
            }

            colorPickerPanel = vscode.window.createWebviewPanel(
                'colorPicker',
                'Color Theme Editor',
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(context.extensionUri, 'dist'),
                        vscode.Uri.joinPath(context.extensionUri, 'src', 'assets')
                    ]
                }
            );

            colorPickerPanel.iconPath = {
                light: vscode.Uri.joinPath(context.extensionUri, 'src', 'assets', 'palette-light.svg'),
                dark: vscode.Uri.joinPath(context.extensionUri, 'src', 'assets', 'palette-dark.svg')
            };

            colorPickerPanel.onDidDispose(() => {
                colorPickerPanel = null;
                if (configListener) {
                    configListener.dispose();
                }
            }, null, context.subscriptions);

            colorPickerPanel.webview.html = ColorPickerPanel.getHtml(context.extensionUri, colorPickerPanel.webview);

            const sendSettingsToPicker = () => {
                if (!colorPickerPanel) return;
                const configColors = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                const settings = {
                    appearanceMode: configColors.get('appearanceMode') || 'Native',
                    colorProfile: configColors.get('colorProfile') || 'VS Code Native',
                    customThemes: configColors.get('customThemes') || {},
                    textColor: configColors.get('textColor') || '#cccccc',
                    titleBackgroundColor: configColors.get('titleBackgroundColor') || '#323232',
                    keysBackgroundColor: configColors.get('keysBackgroundColor') || '#2b2b2b',
                    bubbleColor: configColors.get('bubbleColor') || '#252526',
                    searchbarBackgroundColor: configColors.get('searchbarBackgroundColor') || '#3c3c3c',
                    searchbarTextColor: configColors.get('searchbarTextColor') || '#cccccc',
                    alternateRowColor: configColors.get('alternateRowColor') || '#82828233'
                };
                colorPickerPanel.webview.postMessage({ command: IPC_COMMANDS.LOAD_SETTINGS, settings });
            };

            configListener = vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('keyboardshortcut-explorer.colors') || e.affectsConfiguration('keyboardshortcut-explorer.appearance')) {
                    sendSettingsToPicker();
                }
            });

            colorPickerPanel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === IPC_COMMANDS.REQUEST_SETTINGS) {
                        sendSettingsToPicker();
                    } else if (message.command === IPC_COMMANDS.UPDATE_SETTING) {
                        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        
                        if (message.key === 'appearanceMode') {
                            await config.update(message.key, message.value === 'Native' ? undefined : message.value, vscode.ConfigurationTarget.Global);
                        } else if (message.key === 'colorProfile') {
                            await config.update(message.key, message.value === 'VS Code Native' ? undefined : message.value, vscode.ConfigurationTarget.Global);
                        } else if (message.key === 'customThemes') {
                            await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                        } else {
                            await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                            if (config.get('colorProfile') !== 'Custom') {
                                await config.update('colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                            }
                        }
                    } else if (message.command === IPC_COMMANDS.SAVE_SETTINGS) {
                        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        const promises = [];
                        if (message.customThemes) {
                            promises.push(config.update('customThemes', message.customThemes, vscode.ConfigurationTarget.Global));
                        }
                        if (message.settings) {
                            for (const [k, v] of Object.entries(message.settings)) {
                                if (k === 'appearanceMode') {
                                    promises.push(config.update(k, v === 'Native' ? undefined : v, vscode.ConfigurationTarget.Global));
                                } else if (k === 'colorProfile') {
                                    promises.push(config.update(k, v === 'VS Code Native' ? undefined : v, vscode.ConfigurationTarget.Global));
                                } else {
                                    promises.push(config.update(k, v, vscode.ConfigurationTarget.Global));
                                }
                            }
                        }
                        await Promise.all(promises);
                    } else if (message.command === IPC_COMMANDS.RESET_DEFAULTS) {
                        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        await Promise.all([
                            config.update('appearanceMode', undefined, vscode.ConfigurationTarget.Global),
                            config.update('colorProfile', undefined, vscode.ConfigurationTarget.Global),
                            config.update('customThemes', undefined, vscode.ConfigurationTarget.Global)
                        ]);
                    }
                }
            );
        }));
    }

    static getHtml(extensionUri, webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', 'colorpicker.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', 'colorpicker.css'));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Color Theme Editor</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

module.exports = ColorPickerPanel;
