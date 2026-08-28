const vscode = require('vscode');
const ShortcutsWebviewProvider = require('./providers/ShortcutsWebviewProvider');
const ColorPickerPanel = require('./panels/ColorPickerPanel');

let providerInstance = null;

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

    // Initialize Webview Provider
    providerInstance = new ShortcutsWebviewProvider(context.extensionUri, context.globalState);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('keyboardShortcutsView', providerInstance)
    );

    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openKeybindings', () => {
        vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'keyboardshortcut-explorer');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleSearch', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleSearch' });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleExtensions', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleCustomMenu' });
    }));

    // Register Color Picker Panel
    ColorPickerPanel.register(context);

    // Update Webview on Settings Change
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('keyboardshortcut-explorer')) {
            if (providerInstance) providerInstance.updateWebview();
        }
    }));
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
