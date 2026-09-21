const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const ShortcutsDataService = require('../services/ShortcutsDataService');
const { IPC_COMMANDS } = require('../constants/ipcCommands');

class ShortcutsWebviewProvider {
    constructor(extensionUri, globalState) {
        this._extensionUri = extensionUri;
        this._globalState = globalState;
        this._view = null;
        this._dataService = new ShortcutsDataService();
        this._version = "1.0.0";
        try {
            const packageJsonPath = path.join(this._extensionUri.fsPath, 'package.json');
            const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            this._version = packageJsonData.version || "1.0.0";
        } catch (e) {
            console.error("Could not load package.json version", e);
        }
    }

    get dataService() {
        return this._dataService;
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

        // Render HTML once on initialization
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        this.updateWebview();

        this._view.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case IPC_COMMANDS.REQUEST_INIT_DATA:
                        if (this._lastDataPayload) this.postMessage(this._lastDataPayload);
                        else this.updateWebview();
                        break;
                    case IPC_COMMANDS.UPDATE_HIDDEN_EXTENSIONS:
                        await this._globalState.update('hiddenExtensions', message.hiddenList);
                        break;
                    case IPC_COMMANDS.UPDATE_PINNED_CATEGORIES:
                        await this._globalState.update('pinnedCategories', message.pinnedList);
                        break;
                    case IPC_COMMANDS.DISMISS_DISCLAIMER:
                        await this._globalState.update('lastVersion', message.version);
                        break;
                    case IPC_COMMANDS.DISMISS_GRID_TUTORIAL:
                        await this._globalState.update('hasSeenGridTutorial', true);
                        break;
                    case IPC_COMMANDS.UPDATE_CATEGORY_ORDER:
                        await this._globalState.update('categoryOrder', message.orderList);
                        break;
                    case IPC_COMMANDS.UPDATE_SETTING: {
                        const configColors = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
                        if (message.key === 'appearanceMode') {
                            await configColors.update(message.key, message.value === 'Native' ? undefined : message.value, vscode.ConfigurationTarget.Global);
                        } else if (message.key === 'colorProfile') {
                            await configColors.update(message.key, message.value === 'VS Code Native' ? undefined : message.value, vscode.ConfigurationTarget.Global);
                        } else {
                            await configColors.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                            if (configColors.get('colorProfile') !== 'Custom') {
                                await configColors.update('colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                            }
                        }
                        break;
                    }
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
            customThemes: config.get('colors.customThemes'),
            alternateRowColors: config.get('appearance.alternateRowColors'),
            alternateRowColor: config.get('colors.alternateRowColor'),
            scrollbarColor: config.get('colors.scrollbarColor'),
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

        const lastVersion = this._globalState.get('lastVersion');
        const showDisclaimer = lastVersion !== this._version;
        const hasSeenGridTutorial = this._globalState.get('hasSeenGridTutorial') || false;

        this._lastDataPayload = {
            command: IPC_COMMANDS.INIT_DATA,
            shortcutsData: shortcuts,
            settings: settings,
            hiddenExtensions: hiddenExtensions,
            availableExtensions: availableExtensions,
            builtInExtensions: this._dataService.getBuiltInExtensions(),
            pinnedCategories: pinnedCategories,
            categoryOrder: categoryOrder,
            showDisclaimer: showDisclaimer,
            showGridTutorial: !hasSeenGridTutorial,
            version: this._version
        };
        
        // Post IPC message directly without destroying webview DOM
        this.postMessage(this._lastDataPayload);
    }

    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'assets', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'assets', 'main.css'));

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Keyboard Shortcut Explorer</title>
    <link rel="stylesheet" href="${styleUri}">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
    }

    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }
}

module.exports = ShortcutsWebviewProvider;
