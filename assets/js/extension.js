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
            fontSize: config.get('fontSize'),
            accessibilityMode: config.get('accessibilityMode'),
            bubbleColor: config.get('bubbleColor')
        };

        // 3. Recuperiamo le liste per il menù custom delle estensioni
        const hiddenExtensions = this._globalState.get('hiddenExtensions') || [];
        const availableExtensions = this._availableExtensions;

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
                { command: "Keyboard Shortcuts", keys: "Ctrl+K Ctrl+S" },
                { command: "Cut", keys: "Ctrl+X" },
                { command: "Copy", keys: "Ctrl+C" },
                { command: "Paste", keys: "Ctrl+V" },
                { command: "Undo", keys: "Ctrl+Z" },
                { command: "Redo", keys: "Ctrl+Y" },
                { command: "Format Document", keys: "Shift+Alt+F" }
            ],
            "Navigation": [
                { command: "Find", keys: "Ctrl+F" },
                { command: "Quick Open", keys: "Ctrl+P" },
                { command: "Command Palette", keys: "Ctrl+Shift+P" }
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
                    baseShortcuts["Custom User Shortcuts"] = customBindings.map(binding => ({
                        command: binding.command,
                        keys: binding.key ? binding.key.toUpperCase() : 'SCONOSCIUTO'
                    }));
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
                                
                                baseShortcuts[`Extension: ${extensionName}`] = validShortcuts;
                                
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
