const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');

class ShortcutsDataService {
    constructor() {
        this._availableExtensions = [];
        this._builtInExtensions = [];
    }

    getAvailableExtensions() {
        return this._availableExtensions;
    }

    getBuiltInExtensions() {
        return this._builtInExtensions;
    }

    getShortcuts() {
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

        try {
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
            const keybindingsPath = path.join(appData, 'Code', 'User', 'keybindings.json');
            
            if (fs.existsSync(keybindingsPath)) {
                let rawData = fs.readFileSync(keybindingsPath, 'utf8');
                rawData = rawData.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                const customBindings = JSON.parse(rawData);
                if (customBindings && customBindings.length > 0) {
                    customBindings.forEach(binding => {
                        if (!binding.command) return;
                        const cmd = binding.command;
                        const key = binding.key ? binding.key.toUpperCase() : 'UNKNOWN';
                        let category = "Custom User Shortcuts";
                        if (cmd.includes('.')) {
                            const parts = cmd.split('.');
                            const prefix = parts[0];
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

        this._availableExtensions = [];
        try {
            const extDir = path.join(os.homedir(), '.vscode', 'extensions');
            if (fs.existsSync(extDir)) {
                const extensionsFolders = fs.readdirSync(extDir);
                for (const folder of extensionsFolders) {
                    const packageJsonPath = path.join(extDir, folder, 'package.json');
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
                                const extensionName = packageData.displayName || packageData.name || folder;
                                baseShortcuts[extensionName] = validShortcuts;
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

        for (const category in baseShortcuts) {
            const uniqueShortcuts = [];
            const seen = new Set();
            for (const shortcut of baseShortcuts[category]) {
                const identifier = shortcut.command + "|" + shortcut.keys;
                if (!seen.has(identifier)) {
                    seen.add(identifier);
                    uniqueShortcuts.push(shortcut);
                }
            }
            baseShortcuts[category] = uniqueShortcuts;
        }

        const hardcodedCategories = ["Basic Editing", "Line Operations", "Navigation", "Terminal", "File Management", "Window Management", "View", "Debug"];
        for (const category in baseShortcuts) {
            if (!this._availableExtensions.includes(category)) {
                this._availableExtensions.push(category);
            }
            if (hardcodedCategories.includes(category) || category.includes("(Custom)")) {
                if (!this._builtInExtensions.includes(category)) {
                    this._builtInExtensions.push(category);
                }
            }
        }

        return baseShortcuts;
    }
}

module.exports = ShortcutsDataService;
