const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Safely strips single-line and multi-line comments from JSON content
 * without catastrophic regex backtracking.
 * @param {string} jsonStr
 * @returns {string}
 */
function stripJsonComments(jsonStr) {
    if (!jsonStr) return '';
    let insideString = false;
    let stringChar = '';
    let result = '';
    let i = 0;
    const len = jsonStr.length;

    while (i < len) {
        const char = jsonStr[i];
        const nextChar = jsonStr[i + 1];

        if (insideString) {
            result += char;
            if (char === '\\') {
                if (i + 1 < len) {
                    result += nextChar;
                    i += 2;
                    continue;
                }
            } else if (char === stringChar) {
                insideString = false;
            }
            i++;
            continue;
        }

        if (char === '"' || char === "'") {
            insideString = true;
            stringChar = char;
            result += char;
            i++;
            continue;
        }

        // Single-line comment //
        if (char === '/' && nextChar === '/') {
            i += 2;
            while (i < len && jsonStr[i] !== '\n' && jsonStr[i] !== '\r') {
                i++;
            }
            continue;
        }

        // Multi-line comment /* ... */
        if (char === '/' && nextChar === '*') {
            i += 2;
            while (i < len && !(jsonStr[i] === '*' && jsonStr[i + 1] === '/')) {
                i++;
            }
            i += 2;
            continue;
        }

        result += char;
        i++;
    }

    return result;
}

class ShortcutsDataService {
    constructor() {
        this._availableExtensions = [];
        this._builtInExtensions = [];
        this._cachedShortcuts = null;
    }

    invalidateCache() {
        this._cachedShortcuts = null;
    }

    getAvailableExtensions() {
        if (!this._cachedShortcuts) {
            this.getShortcuts();
        }
        return this._availableExtensions;
    }

    getBuiltInExtensions() {
        if (!this._cachedShortcuts) {
            this.getShortcuts();
        }
        return this._builtInExtensions;
    }

    _getUserKeybindingsPaths() {
        const home = os.homedir();
        const candidateDirs = [];

        if (process.platform === 'win32') {
            const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
            candidateDirs.push(
                path.join(appData, 'Code', 'User'),
                path.join(appData, 'Code - Insiders', 'User'),
                path.join(appData, 'VSCodium', 'User'),
                path.join(appData, 'Cursor', 'User')
            );
        } else if (process.platform === 'darwin') {
            const appSupport = path.join(home, 'Library', 'Application Support');
            candidateDirs.push(
                path.join(appSupport, 'Code', 'User'),
                path.join(appSupport, 'Code - Insiders', 'User'),
                path.join(appSupport, 'VSCodium', 'User'),
                path.join(appSupport, 'Cursor', 'User')
            );
        } else {
            const configDir = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
            candidateDirs.push(
                path.join(configDir, 'Code', 'User'),
                path.join(configDir, 'Code - Insiders', 'User'),
                path.join(configDir, 'VSCodium', 'User'),
                path.join(configDir, 'Cursor', 'User')
            );
        }

        return candidateDirs.map(d => path.join(d, 'keybindings.json'));
    }

    getShortcuts() {
        if (this._cachedShortcuts) {
            return this._cachedShortcuts;
        }

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

        // 1. Read User Custom Keybindings safely
        try {
            const candidatePaths = this._getUserKeybindingsPaths();
            for (const keybindingsPath of candidatePaths) {
                if (fs.existsSync(keybindingsPath)) {
                    const rawData = fs.readFileSync(keybindingsPath, 'utf8');
                    const cleanJson = stripJsonComments(rawData);
                    const customBindings = JSON.parse(cleanJson);
                    if (Array.isArray(customBindings) && customBindings.length > 0) {
                        customBindings.forEach(binding => {
                            if (!binding || !binding.command) return;
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
                    break;
                }
            }
        } catch (error) {
            console.error("Could not read user shortcuts", error);
        }

        // 2. High-performance In-Memory Inspection via VS Code Extension API (Zero Disk I/O)
        this._availableExtensions = [];
        this._builtInExtensions = [];

        try {
            const allExtensions = vscode.extensions.all;
            if (Array.isArray(allExtensions)) {
                for (const ext of allExtensions) {
                    const pkg = ext.packageJSON;
                    if (!pkg || !pkg.contributes || !pkg.contributes.keybindings) continue;

                    let keybindingsList = pkg.contributes.keybindings;
                    if (!Array.isArray(keybindingsList)) {
                        keybindingsList = [keybindingsList];
                    }

                    const validShortcuts = keybindingsList
                        .filter(kb => kb && (kb.key || kb.win || kb.mac || kb.linux))
                        .map(kb => ({
                            command: kb.command,
                            keys: (kb.win || kb.key || kb.mac || kb.linux || '').toUpperCase()
                        }))
                        .filter(s => s.command && s.keys);

                    if (validShortcuts.length > 0) {
                        const isBuiltin = pkg.isBuiltin || ext.id.startsWith('vscode.');
                        let extensionName = pkg.displayName || pkg.name || ext.id;

                        if (isBuiltin) {
                            extensionName = extensionName.replace(/^vscode-/i, '').replace(/-/g, ' ');
                            extensionName = extensionName.charAt(0).toUpperCase() + extensionName.slice(1);
                            if (!this._builtInExtensions.includes(extensionName)) {
                                this._builtInExtensions.push(extensionName);
                            }
                        }

                        if (!baseShortcuts[extensionName]) {
                            baseShortcuts[extensionName] = [];
                        }
                        baseShortcuts[extensionName].push(...validShortcuts);

                        if (!this._availableExtensions.includes(extensionName)) {
                            this._availableExtensions.push(extensionName);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error inspecting vscode in-memory extensions", error);
        }

        // 3. Deduplicate shortcuts per category
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

        // 4. Register base categories into available and builtIn sets
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

        this._cachedShortcuts = baseShortcuts;
        return baseShortcuts;
    }
}

module.exports = ShortcutsDataService;
