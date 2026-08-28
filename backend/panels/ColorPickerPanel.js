const vscode = require('vscode');

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
                    textColor: configColors.get('textColor') || '#cccccc',
                    titleBackgroundColor: configColors.get('titleBackgroundColor') || '#323232',
                    keysBackgroundColor: configColors.get('keysBackgroundColor') || '#2b2b2b',
                    bubbleColor: configColors.get('bubbleColor') || '#252526',
                    searchbarBackgroundColor: configColors.get('searchbarBackgroundColor') || '#3c3c3c',
                    searchbarTextColor: configColors.get('searchbarTextColor') || '#cccccc',
                    alternateRowColor: configColors.get('alternateRowColor') || '#82828233'
                };
                colorPickerPanel.webview.postMessage({ command: 'loadSettings', settings });
            };

            configListener = vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('keyboardshortcut-explorer.colors') || e.affectsConfiguration('keyboardshortcut-explorer.appearance')) {
                    sendSettingsToPicker();
                }
            });

            colorPickerPanel.webview.onDidReceiveMessage(
                async message => {
                    if (message.command === 'requestSettings') {
                        sendSettingsToPicker();
                    } else if (message.command === 'updateSetting') {
                        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        
                        if (message.key === 'appearanceMode' && message.value === 'Native') {
                            await config.update(message.key, undefined, vscode.ConfigurationTarget.Global);
                        } else if (message.key === 'colorProfile' && message.value === 'VS Code Native') {
                            await config.update(message.key, undefined, vscode.ConfigurationTarget.Global);
                            const keysToClean = [
                                'textColor', 'titleBackgroundColor', 'keysBackgroundColor', 
                                'bubbleColor', 'searchbarBackgroundColor', 'searchbarTextColor', 
                                'alternateRowColor', 'scrollbarColor'
                            ];
                            for (const k of keysToClean) {
                                await config.update(k, undefined, vscode.ConfigurationTarget.Global);
                            }
                        } else {
                            await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                            if (message.key !== 'colorProfile' && message.key !== 'appearanceMode') {
                                if (config.get('colorProfile') !== 'Custom') {
                                    await config.update('colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                                }
                            }
                        }
                    }
                },
                undefined,
                context.subscriptions
            );
        }));
    }

    static getHtml(extensionUri, webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', 'colorPicker.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'assets', 'colorPicker.css'));

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
