const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ShortcutsDataService = require('../services/ShortcutsDataService');

class ShortcutsWebviewProvider {
    constructor(extensionUri, globalState) {
        this._extensionUri = extensionUri;
        this._globalState = globalState;
        this._view = null;
        this._dataService = new ShortcutsDataService();
    }

    resolveWebviewView(webviewView) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'src', 'assets')
            ]
        };

        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('keyboardshortcut-explorer')) {
                if (
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.textColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.titleBackgroundColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.keysBackgroundColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.bubbleColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.scrollbarColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.colors.alternateRowColor')
                ) {
                    const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer');
                    if (config.get('colors.colorProfile') !== 'Custom') {
                        config.update('colors.colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                    }
                }
            }
        });

        this.updateWebview();

        this._view.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'requestInitData':
                        if (this._lastDataPayload) this.postMessage(this._lastDataPayload);
                        break;
                    case 'updateHiddenExtensions':
                        await this._globalState.update('hiddenExtensions', message.hiddenList);
                        break;
                    case 'updatePinnedCategories':
                        await this._globalState.update('pinnedCategories', message.pinnedList);
                        break;
                    case 'dismissDisclaimer':
                        await this._globalState.update('lastVersion', message.version);
                        break;
                    case 'dismissGridTutorial':
                        await this._globalState.update('hasSeenGridTutorial', true);
                        break;
                    case 'updateCategoryOrder':
                        await this._globalState.update('categoryOrder', message.orderList);
                        break;
                    case 'updateSetting':
                        const configColors = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        if (message.key === 'appearanceMode' && message.value === 'Native') {
                            await configColors.update(message.key, undefined, vscode.ConfigurationTarget.Global);
                        } else if (message.key === 'colorProfile' && message.value === 'VS Code Native') {
                            await configColors.update(message.key, undefined, vscode.ConfigurationTarget.Global);
                            const keysToClean = [
                                'textColor', 'titleBackgroundColor', 'keysBackgroundColor', 
                                'bubbleColor', 'searchbarBackgroundColor', 'searchbarTextColor', 
                                'alternateRowColor', 'scrollbarColor'
                            ];
                            for (const k of keysToClean) {
                                await configColors.update(k, undefined, vscode.ConfigurationTarget.Global);
                            }
                        } else {
                            await configColors.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                            if (message.key !== 'colorProfile' && message.key !== 'appearanceMode') {
                                if (configColors.get('colorProfile') !== 'Custom') {
                                    await configColors.update('colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                                }
                            }
                        }
                        break;
                }
            }
        );
    }

    updateWebview() {
        if (!this._view) return;

        const shortcuts = this._dataService.getShortcuts();
        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer');
        const settings = {
            colorProfile: config.get('colors.colorProfile'),
            appearanceMode: config.get('colors.appearanceMode'),
            alternateRowColors: config.get('appearance.alternateRowColors'),
            alternateRowColor: config.get('colors.alternateRowColor'),
            fontFamily: config.get('typography.fontFamily'),
            fontSize: config.get('typography.fontSize'),
            keysFontSize: config.get('typography.keysFontSize'),
            titleFontSize: config.get('typography.titleFontSize'),
            textColor: config.get('colors.textColor'),
            titleBackgroundColor: config.get('colors.titleBackgroundColor'),
            keysBackgroundColor: config.get('colors.keysBackgroundColor'),
            bubbleColor: config.get('colors.bubbleColor'),
            searchbarBackgroundColor: config.get('colors.searchbarBackgroundColor'),
            searchbarTextColor: config.get('colors.searchbarTextColor'),
            accessibilityMode: config.get('accessibility.accessibilityMode'),
            dyslexiaFont: config.get('accessibility.dyslexiaFont'),
            dyslexiaBold: config.get('accessibility.dyslexiaBold'),
            dyslexiaLetterSpacing: config.get('accessibility.dyslexiaLetterSpacing')
        };

        let hiddenExtensions = this._globalState.get('hiddenExtensions') || [];
        const knownExtensions = this._globalState.get('knownExtensions') || [];
        const hasInitializedHidden = this._globalState.get('hasInitializedHidden');
        let needsUpdate = false;

        const availableExtensions = this._dataService.getAvailableExtensions();
        for (const ext of availableExtensions) {
            if (!knownExtensions.includes(ext)) {
                hiddenExtensions.push(ext);
                knownExtensions.push(ext);
                needsUpdate = true;
            }
        }

        if (needsUpdate || !hasInitializedHidden) {
            this._globalState.update('hiddenExtensions', hiddenExtensions);
            this._globalState.update('knownExtensions', knownExtensions);
            this._globalState.update('hasInitializedHidden', true);
        }

        const pinnedCategories = this._globalState.get('pinnedCategories') || [];
        const categoryOrder = this._globalState.get('categoryOrder') || [];

        let currentVersion = "1.0.7";
        try {
            const packageJsonPath = path.join(this._extensionUri.fsPath, 'package.json');
            const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            currentVersion = packageJsonData.version;
        } catch (e) {
            console.error(e);
        }
        const lastVersion = this._globalState.get('lastVersion');
        const showDisclaimer = lastVersion !== currentVersion;
        const hasSeenGridTutorial = this._globalState.get('hasSeenGridTutorial') || false;

        this._lastDataPayload = {
            command: 'initData',
            shortcutsData: shortcuts,
            settings: settings,
            hiddenExtensions: hiddenExtensions,
            availableExtensions: availableExtensions,
            builtInExtensions: this._dataService.getBuiltInExtensions(),
            pinnedCategories: pinnedCategories,
            categoryOrder: categoryOrder,
            showDisclaimer: showDisclaimer,
            showGridTutorial: !hasSeenGridTutorial,
            version: currentVersion
        };
        
        this.postMessage(this._lastDataPayload);

        const scriptUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'assets', 'main.js'));
        const styleUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'assets', 'main.css'));

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${this._view.webview.cspSource} 'unsafe-inline'; script-src ${this._view.webview.cspSource} 'unsafe-inline'; font-src ${this._view.webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyboard Shortcut Explorer</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
        
        this._view.webview.html = htmlContent;
    }

    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}

module.exports = ShortcutsWebviewProvider;
