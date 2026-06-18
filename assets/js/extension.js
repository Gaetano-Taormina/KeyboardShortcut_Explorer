const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * ShortcutsWebviewProvider
 * Questa classe è il "cervello" della nostra vista laterale.
 * Si occupa di leggere le scorciatoie (sia predefinite che delle estensioni),
 * costruire la pagina HTML e inviare i dati all'interfaccia utente (il frontend).
 */
class ShortcutsWebviewProvider {
    constructor(extensionUri, globalState) {
        // extensionUri ci serve per trovare il percorso dei nostri file (css, html, ecc.)
        this._extensionUri = extensionUri;
        // globalState è un piccolo database dove VS Code salva le preferenze dell'utente
        this._globalState = globalState;
        this._view = null;
        this._availableExtensions = []; // Lista di tutte le estensioni che hanno delle scorciatoie
        this._builtInExtensions = []; // Lista delle estensioni di sistema integrate
    }

    /**
     * Questo metodo viene chiamato automaticamente da VS Code quando l'utente apre il pannello laterale.
     */
    resolveWebviewView(webviewView) {
        this._view = webviewView;
        
        // Diciamo a VS Code che vogliamo poter usare JavaScript nella nostra interfaccia
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Ascoltiamo i cambiamenti nelle impostazioni in tempo reale
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('keyboardshortcut-explorer')) {
                // Se l'utente cambia manualmente un colore ma il tema non è "Custom", lo passiamo a "Custom"
                if (
                    e.affectsConfiguration('keyboardshortcut-explorer.textColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.titleBackgroundColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.keysBackgroundColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.bubbleColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.scrollbarColor') ||
                    e.affectsConfiguration('keyboardshortcut-explorer.alternateRowColor')
                ) {
                    const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer');
                    if (config.get('colorProfile') !== 'Custom') {
                        config.update('colorProfile', 'Custom', vscode.ConfigurationTarget.Global);
                    }
                }
                this.updateWebview();
            }
        });

        // Generiamo e mostriamo l'HTML
        this.updateWebview();
    }

    /**
     * updateWebview: Raccoglie i dati, i file grafici e inietta tutto dentro l'HTML.
     */
    updateWebview() {
        if (!this._view) return;

        // 1. Recuperiamo tutte le scorciatoie disponibili (tutte, senza filtri)
        const shortcuts = this.getShortcuts();
        
        // 2. Leggiamo le preferenze che l'utente ha impostato nelle impostazioni (Settings)
        const config = vscode.workspace.getConfiguration('keyboardshortcut-explorer');
        const settings = {
            colorProfile: config.get('colorProfile'),
            appearanceMode: config.get('appearanceMode'),
            alternateRowColors: config.get('alternateRowColors'),
            alternateRowColor: config.get('alternateRowColor'),
            fontFamily: config.get('fontFamily'),
            fontSize: config.get('fontSize'),
            keysFontSize: config.get('keysFontSize'),
            titleFontSize: config.get('titleFontSize'),
            textColor: config.get('textColor'),
            titleBackgroundColor: config.get('titleBackgroundColor'),
            keysBackgroundColor: config.get('keysBackgroundColor'),
            bubbleColor: config.get('bubbleColor'),
            scrollbarColor: config.get('scrollbarColor'),
            accessibilityMode: config.get('accessibilityMode'),
            dyslexiaFont: config.get('dyslexiaFont'),
            dyslexiaBold: config.get('dyslexiaBold'),
            dyslexiaLetterSpacing: config.get('dyslexiaLetterSpacing')
        };

        // 3. Recuperiamo le liste per il menù custom delle estensioni e le preferenze salvate
        let hiddenExtensions = this._globalState.get('hiddenExtensions') || [];
        const knownExtensions = this._globalState.get('knownExtensions') || [];
        const hasInitializedHidden = this._globalState.get('hasInitializedHidden');
        let needsUpdate = false;

        // Tutte le estensioni e categorie scoperte (sia di sistema che dell'utente)
        // vengono nascoste di default per mantenere l'interfaccia pulita, a meno che 
        // non siano state attivate esplicitamente in precedenza.
        for (const ext of this._availableExtensions) {
            if (!knownExtensions.includes(ext)) {
                hiddenExtensions.push(ext); // Nascondiamola di default
                knownExtensions.push(ext);  // E segniamola come conosciuta
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

        // Gestione Disclaimer di aggiornamento
        let currentVersion = "1.0.2";
        try {
            const packageJsonPath = path.join(this._extensionUri.fsPath, 'package.json');
            const packageJsonData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            currentVersion = packageJsonData.version;
        } catch (e) {
            console.error(e);
        }
        const lastVersion = this._globalState.get('lastVersion');
        const showDisclaimer = lastVersion !== currentVersion;

        // 4. Prepariamo i collegamenti sicuri (URI) per i nostri file CSS e JS
        const stylePath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'css', 'style.css');
        const scriptPath = vscode.Uri.joinPath(this._extensionUri, 'assets', 'js', 'script.js');
        const styleUri = this._view.webview.asWebviewUri(stylePath);
        const scriptUri = this._view.webview.asWebviewUri(scriptPath);

        // 5. Leggiamo il file index.html che contiene lo "scheletro" dell'interfaccia
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'index.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
        
        // Inseriamo i nostri dati veri dentro l'HTML sostituendo le variabili segnaposto
        htmlContent = htmlContent.replace('const INJECTED_DATA = null;', `const INJECTED_DATA = ${JSON.stringify(shortcuts)};`);
        htmlContent = htmlContent.replace('const INJECTED_SETTINGS = null;', `const INJECTED_SETTINGS = ${JSON.stringify(settings)};`);
        htmlContent = htmlContent.replace('const INJECTED_HIDDEN_EXTENSIONS = null;', `const INJECTED_HIDDEN_EXTENSIONS = ${JSON.stringify(hiddenExtensions)};`);
        htmlContent = htmlContent.replace('const INJECTED_AVAILABLE_EXTENSIONS = null;', `const INJECTED_AVAILABLE_EXTENSIONS = ${JSON.stringify(availableExtensions)};`);
        htmlContent = htmlContent.replace('const INJECTED_BUILTIN_EXTENSIONS = null;', `const INJECTED_BUILTIN_EXTENSIONS = ${JSON.stringify(this._builtInExtensions)};`);
        htmlContent = htmlContent.replace('const INJECTED_PINNED_CATEGORIES = null;', `const INJECTED_PINNED_CATEGORIES = ${JSON.stringify(pinnedCategories)};`);
        htmlContent = htmlContent.replace('const INJECTED_CATEGORY_ORDER = null;', `const INJECTED_CATEGORY_ORDER = ${JSON.stringify(categoryOrder)};`);
        htmlContent = htmlContent.replace('const INJECTED_SHOW_DISCLAIMER = false;', `const INJECTED_SHOW_DISCLAIMER = ${showDisclaimer};`);
        htmlContent = htmlContent.replace('const INJECTED_VERSION = "1.0.2";', `const INJECTED_VERSION = "${currentVersion}";`);
        htmlContent = htmlContent.replace('{{styleUri}}', styleUri.toString());
        htmlContent = htmlContent.replace('{{scriptUri}}', scriptUri.toString());
        
        // Diciamo a VS Code di visualizzare il nostro HTML modificato
        this._view.webview.html = htmlContent;

        // Mettiamoci in ascolto dei messaggi che arrivano dal frontend
        this._view.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
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
                }
            }
        );
    }

    /**
     * Permette di inviare comandi dalla nostra estensione verso l'interfaccia HTML (il frontend)
     */
    postMessage(message) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    /**
     * getShortcuts: È il cuore della logica di raccolta dati.
     * Restituisce un oggetto con le categorie e le relative scorciatoie.
     */
    getShortcuts() {
        // Queste sono le scorciatoie di base, sempre presenti
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

        // PASSO 1: Proviamo a leggere le scorciatoie personalizzate create dall'utente
        try {
            // Cerchiamo la cartella dove VS Code salva le impostazioni utente
            // (APPDATA su Windows, Library su Mac, .config su Linux)
            const appData = process.env.APPDATA || (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config'));
            const keybindingsPath = path.join(appData, 'Code', 'User', 'keybindings.json');
            
            if (fs.existsSync(keybindingsPath)) {
                let rawData = fs.readFileSync(keybindingsPath, 'utf8');
                
                // Pulizia molto semplice per rimuovere i commenti (//) tipici del file json di vscode
                // Questo rende il file JSON "puro" e leggibile dal programma
                rawData = rawData.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                
                const customBindings = JSON.parse(rawData);
                if (customBindings && customBindings.length > 0) {
                    customBindings.forEach(binding => {
                        if (!binding.command) return;
                        
                        const cmd = binding.command;
                        const key = binding.key ? binding.key.toUpperCase() : 'SCONOSCIUTO';
                        
                        let category = "Custom User Shortcuts";
                        
                        // Creiamo cartelle specifiche in base al comando (es. "debug.start" -> "Debug (Custom)")
                        if (cmd.includes('.')) {
                            const parts = cmd.split('.');
                            const prefix = parts[0];
                            
                            // Se inizia con "workbench.action.QUALCOSA", usiamo "QUALCOSA" (es. files, debug)
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
        } catch (errore) {
            console.error("Non è stato possibile leggere le scorciatoie dell'utente", errore);
        }

        // PASSO 2: Leggiamo tutte le estensioni installate per trovare le loro scorciatoie
        this._availableExtensions = []; // Azzeriamo la lista prima di riempirla
        try {
            // La cartella dove si trovano tutte le estensioni scaricate
            const extDir = path.join(os.homedir(), '.vscode', 'extensions');
            
            if (fs.existsSync(extDir)) {
                const extensionsFolders = fs.readdirSync(extDir);
                
                // Controlliamo ogni singola cartella (ogni estensione)
                for (const folder of extensionsFolders) {
                    const packageJsonPath = path.join(extDir, folder, 'package.json');
                    
                    if (fs.existsSync(packageJsonPath)) {
                        // Leggiamo il "documento di identità" (package.json) dell'estensione
                        const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                        
                        // Controlliamo se questa estensione aggiunge delle scorciatoie (keybindings)
                        if (packageData.contributes && packageData.contributes.keybindings) {
                            
                            // A volte le scorciatoie sono una sola, a volte una lista. Le forziamo a lista.
                            let keybindingsList = packageData.contributes.keybindings;
                            if (!Array.isArray(keybindingsList)) {
                                keybindingsList = [keybindingsList];
                            }
                            
                            // Estraiamo solo le scorciatoie valide che hanno un tasto assegnato
                            const validShortcuts = keybindingsList
                                .filter(kb => kb.key || kb.win || kb.mac)
                                .map(kb => ({
                                    command: kb.command,
                                    // Scegliamo la combinazione di tasti per Windows, altrimenti quella generica
                                    keys: (kb.win || kb.key || kb.mac || '').toUpperCase()
                                }));

                            // Se abbiamo trovato delle scorciatoie, le aggiungiamo alla nostra grande lista
                            if (validShortcuts.length > 0) {
                                // Cerchiamo di usare il nome bello dell'estensione, altrimenti quello di sistema
                                const extensionName = packageData.displayName || packageData.name || folder;
                                
                                baseShortcuts[extensionName] = validShortcuts;
                                
                                // Segniamo il nome dell'estensione per poterla mostrare nel menù dei filtri
                                if (!this._availableExtensions.includes(extensionName)) {
                                    this._availableExtensions.push(extensionName);
                                }
                            }
                        }
                    }
                }
            }
        } catch (errore) {
            console.error("Errore durante la ricerca delle estensioni", errore);
        }

        // PASSO 3: Leggiamo le estensioni di sistema integrate (Built-in di VS Code)
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
                                // Rendiamo il nome pulito (es. da "vscode-git" a "Git")
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
        } catch (errore) {
            console.error("Errore durante la ricerca delle estensioni integrate", errore);
        }

        // Deduplichiamo le scorciatoie (stesso comando e stessa key non devono apparire due volte)
        for (const category in baseShortcuts) {
            const uniqueShortcuts = [];
            const seen = new Set();
            for (const shortcut of baseShortcuts[category]) {
                // Per considerare due scorciatoie "identiche", devono avere lo stesso comando.
                // Se preferisci rimuovere duplicati che hanno sia stesso comando che stessa key:
                const identifier = shortcut.command + "|" + shortcut.keys;
                if (!seen.has(identifier)) {
                    seen.add(identifier);
                    uniqueShortcuts.push(shortcut);
                }
            }
            baseShortcuts[category] = uniqueShortcuts;
        }

        // Aggiungiamo le categorie standard e personalizzate alla lista delle estensioni
        const hardcodedCategories = ["Basic Editing", "Line Operations", "Navigation", "Terminal", "File Management", "Window Management", "View", "Debug"];
        for (const category in baseShortcuts) {
            // Aggiungi a disponibili se non c'è già
            if (!this._availableExtensions.includes(category)) {
                this._availableExtensions.push(category);
            }
            // Aggiungi a built-in SOLO se è una categoria hardcoded o creata dall'utente in keybindings.json (Custom)
            if (hardcodedCategories.includes(category) || category.includes("(Custom)")) {
                if (!this._builtInExtensions.includes(category)) {
                    this._builtInExtensions.push(category);
                }
            }
        }

        return baseShortcuts;
    }
    
    // Ritorna la lista di nomi delle estensioni scoperte
    getAvailableExtensions() {
        return this._availableExtensions;
    }
}

// Variabile globale per mantenere in memoria il nostro provider
let providerInstance = null;

/**
 * Questa è la funzione principale che VS Code chiama per "accendere" la nostra estensione.
 */
function activate(context) {
    // Creiamo il cervello dell'interfaccia
    providerInstance = new ShortcutsWebviewProvider(context.extensionUri, context.globalState);

    // Diciamo a VS Code di usare il nostro provider per la vista "keyboardShortcutsView"
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('keyboardShortcutsView', providerInstance)
    );

    // Registriamo tutti i comandi che si trovano nella barra superiore (Il Carosello)

    // Comando: Il Filtro per attivare il trascinamento e l'ordinamento (Drag and Drop)
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.filter', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleReorder' });
    }));

    // Comando: Aprire la tabella delle scorciatoie da tastiera di default di VS Code
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.openKeybindings', () => {
        vscode.commands.executeCommand('workbench.action.openGlobalKeybindings');
    }));

    // Comando: Nei Tre Puntini, per nascondere la barra di ricerca
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleSearch', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleSearch' });
    }));

    // Comando: Nei Tre Puntini, per aprire il menù custom delle estensioni
    context.subscriptions.push(vscode.commands.registerCommand('keyboardshortcut-explorer.toggleExtensions', () => {
        if (providerInstance) providerInstance.postMessage({ command: 'toggleCustomMenu' });
    }));


    
    // Restiamo in ascolto: se l'utente cambia font o colore dalle Impostazioni di VS Code,
    // noi ricarichiamo automaticamente l'interfaccia per fargli vedere la nuova grafica.
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(evento => {
        if (evento.affectsConfiguration('keyboardshortcut-explorer')) {
            if (providerInstance) providerInstance.updateWebview();
        }
    }));
}

function deactivate() {}

// Esportiamo le funzioni per permettere a VS Code di usarle
module.exports = {
    activate,
    deactivate
};
