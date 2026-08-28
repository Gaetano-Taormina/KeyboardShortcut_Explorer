const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * ShortcutsWebviewProvider
 * This class is the "brain" of our sidebar view.
 * It is responsible for reading the shortcuts (both default and extension-provided),
 * building the HTML page and sending data to the user interface (the frontend).
 */
class ShortcutsWebviewProvider {
    constructor(extensionUri, globalState) {
        // extensionUri is used to find the path of our files (css, html, etc.)
        this._extensionUri = extensionUri;
        // globalState is a small database where VS Code saves user preferences
        this._globalState = globalState;
        this._view = null;
        this._availableExtensions = []; // List of all extensions that have shortcuts
        this._builtInExtensions = []; // List of built-in system extensions
    }

    /**
     * This method is called automatically by VS Code when the user opens the sidebar panel.
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        
        // Tell VS Code we want to use JavaScript in our interface (restricted to webview/ and media/)
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'dist'),
                vscode.Uri.joinPath(this._extensionUri, 'assets')
            ]
        };

        // Listen for configuration changes in real time
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('keyboardshortcut-explorer')) {
                // If the user manually changes a color but the theme is not "Custom", switch it to "Custom"
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
                // Removed this.updateWebview() to prevent the interface from updating a thousand times 
                // during color selection. It will only update upon restart or reopening of the panel!
            }
        });

        // Generate and show the HTML
        this.updateWebview();

        // Listen for messages arriving from the frontend
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

    /**
     * updateWebview: Collects data, graphical files and injects everything into the HTML.
     */
    updateWebview() {
        if (!this._view) return;

        const shortcuts = this.getShortcuts();
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

        for (const ext of this._availableExtensions) {
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
        const availableExtensions = this._availableExtensions;

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

        this._lastDataPayload = {
            command: 'initData',
            shortcutsData: shortcuts,
            settings: settings,
            hiddenExtensions: hiddenExtensions,
            availableExtensions: availableExtensions,
            builtInExtensions: this._builtInExtensions,
            pinnedCategories: pinnedCategories,
            categoryOrder: categoryOrder,
            showDisclaimer: showDisclaimer,
            version: currentVersion
        };
        
        // Push the payload if UI is already loaded
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

    /**
     * getShortcuts: This is the core of the data collection logic.
     * Returns an object with categories and their respective shortcuts.
     */
    getShortcuts() {
        // These are the basic shortcuts, always present
        const baseShortcuts = {
            "Basic Editing": [
                { command: "Cut", keys: "Ctrl+X" },
                { command: "Copy", keys: "Ctrl+C" },
                { command: "Paste", keys: "Ctrl+V" },
                { command: "Undo", keys: "Ctrl+Z" },
                { command: "Redo", keys: "Ctrl+Y" },
                { command: "Format Document", keys: "Shift+Alt+F" }
            ],
            "Line Operations": [
                { command: "Copy Line Up", keys: "Shift+Alt+Up" },
                { command: "Copy Line Down", keys: "Shift+Alt+Down" },
                { command: "Move Line Up", keys: "Alt+Up" },
                { command: "Move Line Down", keys: "Alt+Down" },
                { command: "Delete Line", keys: "Ctrl+Shift+K" },
                { command: "Insert Line Below", keys: "Ctrl+Enter" },
                { command: "Insert Line Above", keys: "Ctrl+Shift+Enter" },
                { command: "Toggle Line Comment", keys: "Ctrl+/" },
                { command: "Toggle Block Comment", keys: "Shift+Alt+A" }
            ],
            "Navigation": [
                { command: "Find", keys: "Ctrl+F" },
                { command: "Quick Open", keys: "Ctrl+P" },
                { command: "Command Palette", keys: "Ctrl+Shift+P" }
            ],
            "Terminal": [
                { command: "Toggle Terminal", keys: "Ctrl+`" },
                { command: "New Terminal", keys: "Ctrl+Shift+`" }
            ],
            "File Management": [
                { command: "New File", keys: "Ctrl+N" },
                { command: "Open File", keys: "Ctrl+O" },
                { command: "Save", keys: "Ctrl+S" },
                { command: "Save As", keys: "Ctrl+Shift+S" },
                { command: "Close Editor", keys: "Ctrl+W" },
                { command: "Close All Editors", keys: "Ctrl+K Ctrl+W" }
            ],
            "Window Management": [
                { command: "Toggle Side Bar Visibility", keys: "Ctrl+B" },
                { command: "Toggle Panel", keys: "Ctrl+J" },
                { command: "Split Editor", keys: "Ctrl+\\" }
            ],
            "View": [
                { command: "Explorer", keys: "Ctrl+Shift+E" },
                { command: "Search", keys: "Ctrl+Shift+F" },
                { command: "Source Control", keys: "Ctrl+Shift+G" },
                { command: "Run and Debug", keys: "Ctrl+Shift+D" },
                { command: "Extensions", keys: "Ctrl+Shift+X" }
            ],
            "Debug": [
                { command: "Start Debugging", keys: "F5" },
                { command: "Step Over", keys: "F10" },
                { command: "Step Into", keys: "F11" },
                { command: "Step Out", keys: "Shift+F11" },
                { command: "Stop Debugging", keys: "Shift+F5" }
            ]
        };

        // STEP 1: Try to read custom shortcuts created by the user
        try {
            // Find the folder where VS Code saves user settings
            // (APPDATA on Windows, Library on Mac, .config on Linux)
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
            const keybindingsPath = path.join(appData, 'Code', 'User', 'keybindings.json');
            
            if (fs.existsSync(keybindingsPath)) {
                let rawData = fs.readFileSync(keybindingsPath, 'utf8');
                
                // Very simple cleanup to remove typical JSON comments (//) from vscode json file
                // This makes the JSON "pure" and readable by the program
                rawData = rawData.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                
                const customBindings = JSON.parse(rawData);
                if (customBindings && customBindings.length > 0) {
                    customBindings.forEach(binding => {
                        if (!binding.command) return;
                        
                        const cmd = binding.command;
                        const key = binding.key ? binding.key.toUpperCase() : 'UNKNOWN';
                        
                        let category = "Custom User Shortcuts";
                        
                        // Create specific folders based on command (e.g. "debug.start" -> "Debug (Custom)")
                        if (cmd.includes('.')) {
                            const parts = cmd.split('.');
                            const prefix = parts[0];
                            
                            // If it starts with "workbench.action.SOMETHING", we use "SOMETHING" (e.g. files, debug)
                            if ((prefix === 'workbench' || prefix === 'editor') && parts.length > 2 && parts[1] === 'action') {
                                category = parts[2].charAt(0).toUpperCase() + parts[2].slice(1) + " (Custom)";
                            } else {
                                category = prefix.charAt(0).toUpperCase() + prefix.slice(1) + " (Custom)";
                            }
                        }
                        
                        if (!baseShortcuts[category]) {
                            baseShortcuts[category] = [];
                        }
                        baseShortcuts[category].push({ command: cmd, keys: key });
                    });
                }
            }
        } catch (error) {
            console.error("Could not read user shortcuts", error);
        }

        // STEP 2: Read all installed extensions to find their shortcuts
        this._availableExtensions = []; // Reset list before filling
        try {
            // Folder where all downloaded extensions are located
            const extDir = path.join(os.homedir(), '.vscode', 'extensions');
            
            if (fs.existsSync(extDir)) {
                const extensionsFolders = fs.readdirSync(extDir);
                
                // Check every single folder (each extension)
                for (const folder of extensionsFolders) {
                    const packageJsonPath = path.join(extDir, folder, 'package.json');
                    
                    if (fs.existsSync(packageJsonPath)) {
                        // Read the "ID card" (package.json) of the extension
                        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                        
                        // Check if this extension adds any keybindings
                        if (packageData.contributes && packageData.contributes.keybindings) {
                            
                            // Sometimes keybindings are single objects, sometimes lists. Force them to a list.
                            let keybindingsList = packageData.contributes.keybindings;
                            if (!Array.isArray(keybindingsList)) {
                                keybindingsList = [keybindingsList];
                            }
                            
                            // Extract only valid shortcuts that have a key assigned
                            const validShortcuts = keybindingsList
                                .filter(kb => kb.key || kb.win || kb.mac)
                                .map(kb => ({
                                    command: kb.command,
                                    // Pick Windows combination if available, otherwise generic
                                    keys: (kb.win || kb.key || kb.mac || '').toUpperCase()
                                }));

                            // If we found any shortcuts, add them to our big list
                            if (validShortcuts.length > 0) {
                                // Try to use the extension's nice name, otherwise system name
                                const extensionName = packageData.displayName || packageData.name || folder;
                                
                                baseShortcuts[extensionName] = validShortcuts;
                                
                                // Mark the extension name to show it in the filter menu
                                if (!this._availableExtensions.includes(extensionName)) {
                                    this._availableExtensions.push(extensionName);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error during extension search", error);
        }

        // STEP 3: Read integrated system extensions (VS Code Built-ins)
        this._builtInExtensions = [];
        try {
            const builtinExtDir = path.join(vscode.env.appRoot, 'extensions');
            
            if (fs.existsSync(builtinExtDir)) {
                const extensionsFolders = fs.readdirSync(builtinExtDir);
                for (const folder of extensionsFolders) {
                    const packageJsonPath = path.join(builtinExtDir, folder, 'package.json');
                    if (fs.existsSync(packageJsonPath)) {
                        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                        if (packageData.contributes && packageData.contributes.keybindings) {
                            let keybindingsList = packageData.contributes.keybindings;
                            if (!Array.isArray(keybindingsList)) {
                                keybindingsList = [keybindingsList];
                            }
                            
                            const validShortcuts = keybindingsList
                                .filter(kb => kb.key || kb.win || kb.mac)
                                .map(kb => ({
                                    command: kb.command,
                                    keys: (kb.win || kb.key || kb.mac || '').toUpperCase()
                                }));

                            if (validShortcuts.length > 0) {
                                // Make the name clean (e.g. from "vscode-git" to "Git")
                                let extensionName = packageData.displayName || packageData.name || folder;
                                extensionName = extensionName.replace(/^vscode-/i, '').replace(/-/g, ' ');
                                extensionName = extensionName.charAt(0).toUpperCase() + extensionName.slice(1);
                                
                                baseShortcuts[extensionName] = validShortcuts;
                                
                                if (!this._availableExtensions.includes(extensionName)) {
                                    this._availableExtensions.push(extensionName);
                                }
                                if (!this._builtInExtensions.includes(extensionName)) {
                                    this._builtInExtensions.push(extensionName);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error during integrated extensions search", error);
        }

        // Deduplicate shortcuts (same command and key shouldn't appear twice)
        for (const category in baseShortcuts) {
            const uniqueShortcuts = [];
            const seen = new Set();
            for (const shortcut of baseShortcuts[category]) {
                // To consider two shortcuts "identical", they must have the same command.
                const identifier = shortcut.command + "|" + shortcut.keys;
                if (!seen.has(identifier)) {
                    seen.add(identifier);
                    uniqueShortcuts.push(shortcut);
                }
            }
            baseShortcuts[category] = uniqueShortcuts;
        }

        // Add standard and custom categories to the extensions list
        const hardcodedCategories = ["Basic Editing", "Line Operations", "Navigation", "Terminal", "File Management", "Window Management", "View", "Debug"];
        for (const category in baseShortcuts) {
            // Add to available if not already there
            if (!this._availableExtensions.includes(category)) {
                this._availableExtensions.push(category);
            }
            // Add to built-in ONLY if it's a hardcoded category or created by the user in keybindings.json (Custom)
            if (hardcodedCategories.includes(category) || category.includes("(Custom)")) {
                if (!this._builtInExtensions.includes(category)) {
                    this._builtInExtensions.push(category);
                }
            }
        }

        return baseShortcuts;
    }
    
    // Returns the list of names of discovered extensions
    getAvailableExtensions() {
        return this._availableExtensions;
    }
}

// Global variable to keep our provider in memory
let providerInstance = null;

/**
 * This is the main function that VS Code calls to "turn on" our extension.
 */
function activate(context) {
    // Migrate & recover old setting appearance.appearanceMode to colors.appearanceMode without data loss
    const oldAppearanceConfig = vscode.workspace.getConfiguration('keyboardshortcut-explorer.appearance');
    const newColorsConfig = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
    const oldVal = oldAppearanceConfig.inspect('appearanceMode').globalValue;
    if (oldVal !== undefined) {
        if (newColorsConfig.inspect('appearanceMode').globalValue === undefined) {
            newColorsConfig.update('appearanceMode', oldVal, vscode.ConfigurationTarget.Global);
        }
        oldAppearanceConfig.update('appearanceMode', undefined, vscode.ConfigurationTarget.Global);
    }

    // Create the interface brain
    providerInstance = new ShortcutsWebviewProvider(context.extensionUri, context.globalState);

    // Tell VS Code to use our provider for the "keyboardShortcutsView" view
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('keyboardShortcutsView', providerInstance)
    );

    // Register all commands located in the top bar (The Carousel)

    // Command: Open the default VS Code keyboard shortcuts table
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openKeybindings', () => {
        vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
    }));

    // Command: Open the extension settings in the native VS Code Settings Editor
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'keyboardshortcut-explorer');
    }));

    // Command: In the Three Dots, to hide the search bar
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleSearch', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleSearch' });
    }));

    // Command: In the Three Dots, to open the custom extensions menu
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleExtensions', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleCustomMenu' });
    }));

    // Command: Open the Color Theme Editor
    let colorPickerPanel = null;
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
                    vscode.Uri.joinPath(context.extensionUri, 'assets')
                ]
            }
        );

        colorPickerPanel.onDidDispose(() => {
            colorPickerPanel = null;
        }, null, context.subscriptions);

        
        colorPickerPanel.webview.html = getColorPickerHtml(context.extensionUri, colorPickerPanel.webview);

        const sendSettingsToPicker = () => {
            const configColors = vscode.workspace.getConfiguration('keyboardshortcut-explorer.colors');
            const configAppearance = vscode.workspace.getConfiguration('keyboardshortcut-explorer.appearance');
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


        // If the user changes settings via the configuration file, we update the UI picker
        const configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('keyboardshortcut-explorer.colors') || e.affectsConfiguration('keyboardshortcut-explorer.appearance')) {
                sendSettingsToPicker();
            }
        });
        
        colorPickerPanel.onDidDispose(() => {
            configListener.dispose();
        });

        // Listen for messages (the new colors chosen by the user) and save them in VS Code
        
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

    // Listen for events: if the user changes font or color from VS Code Settings,
    // we automatically reload the interface to show the new graphics.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(evento => {
        if (evento.affectsConfiguration('keyboardshortcut-explorer')) {
            if (providerInstance) providerInstance.updateWebview();
        }
    }));
}

function deactivate() {}

function getColorPickerHtml(extensionUri, webview) {
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

// Export functions to allow VS Code to use them
module.exports = {
    activate,
    deactivate
};
