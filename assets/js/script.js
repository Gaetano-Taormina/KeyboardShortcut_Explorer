        // acquisiamo l'API di VS Code necessaria per comunicare tra HTML e backend
        const vscode = acquireVsCodeApi();
        
        // Elementi dell'interfaccia HTML
        const container = document.getElementById('shortcuts-container');
        const searchInput = document.getElementById('searchInput');
        const searchContainer = document.querySelector('.search-container');
        const noResults = document.getElementById('no-results');

        // Variabili per mantenere lo stato della nostra interfaccia
        let shortcutsData = {}; // Qui salveremo tutti gli shortcut in arrivo dal backend
        let reorderMode = false; // Indica se il bottone "Filtro/Riordina" è stato premuto
        let pinMode = false;     // Indica se il bottone "Puntina" è stato premuto
        
        // Riferimenti al Custom Menu
        const customMenu = document.getElementById('custom-context-menu');

        // Carichiamo le preferenze di ordinamento inviate dal backend
        let categoryOrder = [];
        if (typeof INJECTED_CATEGORY_ORDER !== 'undefined' && INJECTED_CATEGORY_ORDER) {
            categoryOrder = INJECTED_CATEGORY_ORDER;
        }
        
        let pinnedCategories = [];
        if (typeof INJECTED_PINNED_CATEGORIES !== 'undefined' && INJECTED_PINNED_CATEGORIES) {
            pinnedCategories = INJECTED_PINNED_CATEGORIES;
        }
        
        // Liste estensioni ricevute dal backend
        let hiddenExtensions = [];
        let availableExtensions = [];

        /**
         * Applica le impostazioni decise dall'utente (grandezza testo, colori, accessibilità)
         */
        function applySettings(settings) {
            if (!settings) return;
            
            // Variabili CSS per le personalizzazioni utente
            document.documentElement.style.setProperty('--setting-font-family', settings.fontFamily);
            document.documentElement.style.setProperty('--setting-font-size', settings.fontSize + 'px');
            document.documentElement.style.setProperty('--setting-keys-font-size', settings.keysFontSize + 'px');
            document.documentElement.style.setProperty('--setting-title-font-size', settings.titleFontSize + 'px');
            // Appearance Mode handling
            // We can add a class to body to enforce basic dark/light if the user wants an override
            // VS Code typically handles this, but if we need to force it, we could apply filters
            if (settings.appearanceMode === "Dark") {
                document.body.style.colorScheme = "dark";
                document.body.classList.add("force-dark");
                document.body.classList.remove("force-light", "force-hc");
            } else if (settings.appearanceMode === "Light") {
                document.body.style.colorScheme = "light";
                document.body.classList.add("force-light");
                document.body.classList.remove("force-dark", "force-hc");
            } else if (settings.appearanceMode === "High Contrast") {
                document.body.classList.add("force-hc");
                document.body.classList.remove("force-dark", "force-light");
            } else {
                document.body.style.colorScheme = "auto";
                document.body.classList.remove("force-dark", "force-light", "force-hc");
            }

            // Color Profile handling
            if (settings.colorProfile === "Alternative 1") {
                // Esempio: Accents / Vibrant
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-button-background)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-textPreformat-foreground)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-sideBar-background)');
                document.documentElement.style.setProperty('--setting-scrollbar-color', 'var(--vscode-scrollbarSlider-background)');
            } else if (settings.colorProfile === "Alternative 2") {
                // Esempio: Minimal / Terminal
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-terminal-foreground)');
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-terminal-background)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-terminal-border)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-terminal-background)');
                document.documentElement.style.setProperty('--setting-scrollbar-color', 'var(--vscode-scrollbarSlider-background)');
            } else if (settings.colorProfile === "Custom") {
                document.documentElement.style.setProperty('--setting-text-color', settings.textColor);
                document.documentElement.style.setProperty('--setting-title-bg', settings.titleBackgroundColor);
                document.documentElement.style.setProperty('--setting-keys-bg', settings.keysBackgroundColor);
                document.documentElement.style.setProperty('--setting-bubble-color', settings.bubbleColor);
                document.documentElement.style.setProperty('--setting-scrollbar-color', settings.scrollbarColor);
            } else { // "VS Code Native"
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-editor-inactiveSelectionBackground)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-textCodeBlock-background)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-sideBar-background)');
                document.documentElement.style.setProperty('--setting-scrollbar-color', 'var(--vscode-scrollbarSlider-background, rgba(121, 121, 121, 0.4))');
            }

            // Zebra striping handling
            if (settings.alternateRowColors) {
                document.body.classList.add('use-zebra-stripes');
                document.documentElement.style.setProperty('--setting-alternate-row-color', settings.alternateRowColor);
            } else {
                document.body.classList.remove('use-zebra-stripes');
            }
            
            // Impostazioni Dislessia
            document.documentElement.style.setProperty('--setting-dyslexia-font', settings.dyslexiaFont);
            document.documentElement.style.setProperty('--setting-dyslexia-spacing', settings.dyslexiaLetterSpacing);
            
            // Se l'utente ha attivato la modalità accessibilità, aggiungiamo una classe CSS speciale
            if (settings.accessibilityMode) {
                document.body.classList.add('dyslexia-mode');
                if (settings.dyslexiaBold) {
                    document.body.classList.add('dyslexia-bold');
                } else {
                    document.body.classList.remove('dyslexia-bold');
                }
            } else {
                document.body.classList.remove('dyslexia-mode');
                document.body.classList.remove('dyslexia-bold');
            }
        }

        // Se il backend ci ha inviato le impostazioni, applichiamole subito
        if (typeof INJECTED_SETTINGS !== 'undefined' && INJECTED_SETTINGS) {
            applySettings(INJECTED_SETTINGS);
        }

        // Se il backend ci ha inviato gli shortcut, salviamoli e disegnamoli
        if (typeof INJECTED_DATA !== 'undefined' && INJECTED_DATA) {
            shortcutsData = INJECTED_DATA;
        }
        
        if (typeof INJECTED_HIDDEN_EXTENSIONS !== 'undefined' && INJECTED_HIDDEN_EXTENSIONS) {
            hiddenExtensions = INJECTED_HIDDEN_EXTENSIONS;
        }

        if (typeof INJECTED_AVAILABLE_EXTENSIONS !== 'undefined' && INJECTED_AVAILABLE_EXTENSIONS) {
            availableExtensions = INJECTED_AVAILABLE_EXTENSIONS;
        }
        
        if (typeof INJECTED_BUILTIN_EXTENSIONS !== 'undefined' && INJECTED_BUILTIN_EXTENSIONS) {
            builtInExtensions = INJECTED_BUILTIN_EXTENSIONS;
        }

        // Gestione disclaimer di aggiornamento
        if (typeof INJECTED_SHOW_DISCLAIMER !== 'undefined' && INJECTED_SHOW_DISCLAIMER) {
            const disclaimer = document.getElementById('restart-disclaimer');
            if (disclaimer) {
                disclaimer.classList.remove('hidden');
                const closeBtn = document.getElementById('close-disclaimer');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        disclaimer.classList.add('hidden');
                        vscode.postMessage({ command: 'dismissDisclaimer', version: INJECTED_VERSION });
                    });
                }
            }
        }
        
        // Prima renderizzazione
        renderShortcuts();

        /**
         * In ascolto dei comandi provenienti dal carosello (i bottoni nella barra in alto)
         */
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'toggleSearch':
                    searchContainer.classList.toggle('hidden');
                    break;
                case 'toggleReorder':
                    reorderMode = !reorderMode;
                    renderShortcuts(); // Ridisegnamo per mostrare i controlli di riordino
                    break;
                case 'togglePinMode':
                    pinMode = !pinMode;
                    renderShortcuts(); // Ridisegnamo per mostrare i bottoni Pin
                    break;
                case 'toggleCustomMenu':
                    toggleCustomMenuLogic();
                    break;
            }
        });
        
        /**
         * Logica del Custom Context Menu (Filtro Estensioni)
         */
        function renderCustomMenu() {
            // Costruiamo il menu dinamicamente
            customMenu.innerHTML = '';
            
            if (availableExtensions.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'context-menu-item';
                emptyItem.textContent = 'Nessuna estensione rilevata';
                customMenu.appendChild(emptyItem);
            } else {
                // Dividiamo le estensioni in Sistema e Utente
                const sysExts = availableExtensions.filter(e => builtInExtensions.includes(e));
                const usrExts = availableExtensions.filter(e => !builtInExtensions.includes(e));
                
                // Funzione per creare l'header della categoria con Bulk Toggle
                function createCategoryHeader(labelStr, extensionsList, parentItem) {
                    const header = document.createElement('div');
                    header.className = 'context-menu-header';
                    
                    const checkmark = document.createElement('div');
                    checkmark.className = 'context-menu-check bulk-toggle';
                    // Determiniamo se tutte le estensioni in questa lista sono visibili
                    const allVisible = extensionsList.length > 0 && extensionsList.every(ext => !hiddenExtensions.includes(ext));
                    const someVisible = extensionsList.some(ext => !hiddenExtensions.includes(ext));
                    
                    if (allVisible) {
                        checkmark.innerHTML = '✓';
                    } else if (someVisible) {
                        checkmark.innerHTML = '■';
                    } else {
                        checkmark.innerHTML = '';
                    }
                    
                    const label = document.createElement('div');
                    label.className = 'context-menu-label';
                    label.textContent = labelStr;
                    label.title = labelStr; // tooltip per testi lunghi
                    
                    const arrow = document.createElement('div');
                    arrow.className = 'submenu-arrow';
                    arrow.innerHTML = '▶';
                    
                    // Cliccando sul checkmark o sul testo, selezioniamo/deselezioniamo tutte le estensioni
                    function toggleBulk(ev) {
                        ev.stopPropagation(); // Evitiamo di aprire/chiudere l'accordion
                        if (allVisible) {
                            // Nascondiamo tutte
                            extensionsList.forEach(ext => {
                                if (!hiddenExtensions.includes(ext)) hiddenExtensions.push(ext);
                            });
                        } else {
                            // Mostriamo tutte (rimuoviamo da hiddenExtensions)
                            hiddenExtensions = hiddenExtensions.filter(ext => !extensionsList.includes(ext));
                        }
                        vscode.postMessage({ command: 'updateHiddenExtensions', hiddenList: hiddenExtensions });
                        // Lasciamo il menu com'era (aperto o chiuso)
                        const wasOpen = parentItem.classList.contains('open');
                        renderCustomMenu(); // Solo ri-render, NON toggle (che lo chiuderebbe)
                        renderShortcuts();
                        // Ripristiniamo lo stato aperto/chiuso
                        const newParent = Array.from(document.querySelectorAll('.context-menu-label')).find(l => l.textContent === labelStr)?.closest('.context-menu-item');
                        if (wasOpen && newParent) newParent.classList.add('open');
                    }

                    checkmark.addEventListener('click', toggleBulk);
                    label.addEventListener('click', toggleBulk);
                    
                    // Cliccando la freccina si apre l'accordion
                    arrow.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        parentItem.classList.toggle('open');
                    });
                    
                    // Cliccando nell'area vuota della riga facciamo aprire
                    header.addEventListener('click', (ev) => {
                        if (ev.target === header) {
                            ev.stopPropagation();
                            parentItem.classList.toggle('open');
                        }
                    });
                    
                    header.appendChild(checkmark);
                    header.appendChild(label);
                    header.appendChild(arrow);
                    return header;
                }

                    // Funzione per creare gli elementi figli nel sottomenu
                    function createSubmenuItems(extensionsList, parentItem) {
                        const submenu = document.createElement('div');
                        submenu.className = 'context-menu-submenu';
                        
                        if (extensionsList.length === 0) {
                            parentItem.classList.add('empty-submenu');
                            return submenu;
                        }

                        extensionsList.forEach(ext => {
                            const item = document.createElement('div');
                            item.className = 'context-menu-item';
                            
                            const isVisible = !hiddenExtensions.includes(ext);
                            
                            const checkmark = document.createElement('div');
                            checkmark.className = 'context-menu-check';
                            checkmark.innerHTML = isVisible ? '✓' : '';
                            
                            const label = document.createElement('div');
                            label.className = 'context-menu-label';
                            label.textContent = ext;
                            label.title = ext; // tooltip al passaggio del mouse
                            
                            item.appendChild(checkmark);
                            item.appendChild(label);
                            
                            item.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                const isCurrentlyHidden = hiddenExtensions.includes(ext);
                                
                                if (isCurrentlyHidden) {
                                    hiddenExtensions = hiddenExtensions.filter(e => e !== ext);
                                    checkmark.innerHTML = '✓';
                                } else {
                                    hiddenExtensions.push(ext);
                                    checkmark.innerHTML = '';
                                }
                                
                                vscode.postMessage({
                                    command: 'updateHiddenExtensions',
                                    hiddenList: hiddenExtensions
                                });
                                
                                const wasSystemOpen = systemItem.classList.contains('open');
                                const wasUserOpen = userItem.classList.contains('open');
                                
                                renderCustomMenu();
                                renderShortcuts();
                                
                                // Restore states
                                const allLabels = Array.from(document.querySelectorAll('.context-menu-label'));
                                const newSys = allLabels.find(l => l.textContent === 'System')?.closest('.context-menu-item');
                                const newUsr = allLabels.find(l => l.textContent === 'Extensions')?.closest('.context-menu-item');
                                if (wasSystemOpen && newSys) newSys.classList.add('open');
                                if (wasUserOpen && newUsr) newUsr.classList.add('open');
                            });
                            submenu.appendChild(item);
                        });
                        
                        return submenu;
                    }

                    // --- Voce: System ---
                    var systemItem = document.createElement('div');
                    systemItem.className = 'context-menu-item has-submenu';
                    const systemHeader = createCategoryHeader('System', sysExts, systemItem);
                    const systemSubmenu = createSubmenuItems(sysExts, systemItem);
                    systemItem.appendChild(systemHeader);
                    systemItem.appendChild(systemSubmenu);
                    customMenu.appendChild(systemItem);
                    
                    // --- Voce: Extensions ---
                    var userItem = document.createElement('div');
                    userItem.className = 'context-menu-item has-submenu';
                    const userHeader = createCategoryHeader('Extensions', usrExts, userItem);
                    const userSubmenu = createSubmenuItems(usrExts, userItem);
                    userItem.appendChild(userHeader);
                    userItem.appendChild(userSubmenu);
                    customMenu.appendChild(userItem);
                }
        }

        function toggleCustomMenuLogic() {
            if (customMenu.classList.contains('hidden')) {
                renderCustomMenu();
                customMenu.classList.remove('hidden');
            } else {
                customMenu.classList.add('hidden');
            }
        }

        // Chiudi il menu se l'utente clicca fuori
        document.addEventListener('click', () => {
            if (!customMenu.classList.contains('hidden')) {
                customMenu.classList.add('hidden');
            }
        });
        
        /**
         * Logica Espandi/Comprimi Tutte le Categorie
         */
        const toggleAllBtn = document.getElementById('toggle-all-btn');
        let allFoldersOpen = true; // Di default le tendine sono aperte
        
        toggleAllBtn.addEventListener('click', () => {
            allFoldersOpen = !allFoldersOpen;
            const tuttiIGruppi = document.querySelectorAll('details.category-group');
            tuttiIGruppi.forEach(gruppo => {
                gruppo.open = allFoldersOpen;
            });
            
            // Cambiamo leggermente l'opacità per dare feedback visivo
            if (allFoldersOpen) {
                toggleAllBtn.style.opacity = '1';
            } else {
                toggleAllBtn.style.opacity = '0.5';
            }
        });

        /**
         * Funzioni di supporto per la Ricerca Avanzata
         */
        function normalizeText(text) {
            return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }

        const synonymMap = {
            'copi': 'copy', 'copia': 'copy', 'copiar': 'copy', 'copier': 'copy', 'kopieren': 'copy', 'копи': 'copy',
            'incoll': 'paste', 'incolla': 'paste', 'pegar': 'paste', 'coller': 'paste', 'einfugen': 'paste',
            'tagli': 'cut', 'taglia': 'cut', 'cortar': 'cut', 'couper': 'cut', 'schneiden': 'cut',
            'salv': 'save', 'salva': 'save', 'guardar': 'save', 'sauvegarder': 'save', 'speichern': 'save',
            'trov': 'find', 'trova': 'find', 'cerc': 'find', 'cerca': 'find', 'buscar': 'find', 'trouver': 'find', 'suchen': 'find',
            'sostituisci': 'replace', 'reemplazar': 'replace', 'remplacer': 'replace', 'ersetzen': 'replace',
            'apri': 'open', 'aprire': 'open', 'abrir': 'open', 'ouvrir': 'open', 'offnen': 'open',
            'chiudi': 'close', 'chiudere': 'close', 'cerrar': 'close', 'fermer': 'close', 'schliessen': 'close',
            'seleziona': 'select', 'seleccionar': 'select', 'selectionner': 'select', 'auswahlen': 'select',
            'terminale': 'terminal', 'terminal': 'terminal'
        };

        function getSynonyms(text) {
            let results = [text];
            for (const [key, value] of Object.entries(synonymMap)) {
                if (text.includes(key) && !results.includes(value)) {
                    results.push(value);
                }
            }
            return results;
        }

        function levenshtein(a, b) {
            if (a.length === 0) return b.length;
            if (b.length === 0) return a.length;
            const matrix = [];
            for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
            for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
            for (let i = 1; i <= b.length; i++) {
                for (let j = 1; j <= a.length; j++) {
                    if (b.charAt(i - 1) === a.charAt(j - 1)) {
                        matrix[i][j] = matrix[i - 1][j - 1];
                    } else {
                        matrix[i][j] = Math.min(
                            matrix[i - 1][j - 1] + 1,
                            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                        );
                    }
                }
            }
            return matrix[b.length][a.length];
        }

        function fuzzyMatch(searchTerm, targetString) {
            if (targetString.includes(searchTerm)) return true;
            if (searchTerm.length < 3) return false;
            
            const words = targetString.split(/[\.\-\s_]/);
            for (const word of words) {
                if (word.length < 3) continue;
                const maxErrors = word.length <= 5 ? 1 : 2;
                if (levenshtein(searchTerm, word) <= maxErrors) {
                    return true;
                }
            }
            return false;
        }

        /**
         * Logica della Barra di Ricerca Avanzata
         */
        searchInput.addEventListener('input', (event) => {
            let rawTesto = event.target.value;
            let testoPulito = normalizeText(rawTesto);
            
            // Otteniamo il testo originale + eventuali traduzioni
            const terminiDaCercare = getSynonyms(testoPulito);

            const tuttiGliElementi = document.querySelectorAll('.shortcut-item');
            const tuttiIGruppi = document.querySelectorAll('.category-group');
            
            let elementiVisibiliTotali = 0;

            // Filtriamo le singole righe (shortcut)
            tuttiGliElementi.forEach(elemento => {
                const comando = elemento.getAttribute('data-command').toLowerCase();
                const tasti = elemento.getAttribute('data-keys').toLowerCase();
                
                let isMatch = false;
                
                for (const term of terminiDaCercare) {
                    // Cerca per keys
                    if (tasti.includes(term)) {
                        isMatch = true;
                        break;
                    }
                    
                    // Cerca per comando con Fuzzy Logic
                    if (fuzzyMatch(term, comando)) {
                        isMatch = true;
                        break;
                    }
                }
                
                if (isMatch) {
                    elemento.classList.remove('hidden'); // Mostralo
                } else {
                    elemento.classList.add('hidden'); // Nascondilo
                }
            });

            // Filtriamo i gruppi
            tuttiIGruppi.forEach(gruppo => {
                const elementiAncoraVisibili = gruppo.querySelectorAll('.shortcut-item:not(.hidden)');
                if (elementiAncoraVisibili.length === 0) {
                    gruppo.classList.add('hidden');
                } else {
                    gruppo.classList.remove('hidden');
                    if (rawTesto.length > 0) {
                        gruppo.open = true;
                    }
                    elementiVisibiliTotali += elementiAncoraVisibili.length;
                }
            });

            // Mostriamo la scritta "Nessun risultato"
            noResults.style.display = elementiVisibiliTotali === 0 && rawTesto.length > 0 ? 'block' : 'none';
        });

        /**
         * Ordina le categorie seguendo prima quelle pinnate (fissate) e poi l'ordine personalizzato
         */
        function getOrderedCategories() {
            const tutteLeCategorie = Object.keys(shortcutsData);

            return tutteLeCategorie.sort((categoriaA, categoriaB) => {
                const aE_Fissata = pinnedCategories.includes(categoriaA);
                const bE_Fissata = pinnedCategories.includes(categoriaB);
                
                // Le categorie fissate (Pinnate) vincono sempre e vanno in alto
                if (aE_Fissata && !bE_Fissata) return -1;
                if (!aE_Fissata && bE_Fissata) return 1;

                // Altrimenti, ordiniamo in base all'ordine salvato dal drag and drop
                let posizioneA = categoryOrder.indexOf(categoriaA);
                let posizioneB = categoryOrder.indexOf(categoriaB);
                
                // Se non hanno mai avuto un ordine, mettiamole in fondo (999)
                if (posizioneA === -1) posizioneA = 999;
                if (posizioneB === -1) posizioneB = 999;
                
                return posizioneA - posizioneB;
            });
        }

        /**
         * Salvataggio persistente inviando i dati al backend di VS Code (globalState)
         */
        function saveOrder() {
            const gruppi = Array.from(document.querySelectorAll('.category-group'));
            categoryOrder = gruppi.map(g => g.getAttribute('data-category'));
            vscode.postMessage({ command: 'updateCategoryOrder', orderList: categoryOrder });
        }
        
        function savePins() {
            vscode.postMessage({ command: 'updatePinnedCategories', pinnedList: pinnedCategories });
        }

        /**
         * renderShortcuts: Ricrea tutto l'HTML dinamico ogni volta che serve.
         */
        function renderShortcuts() {
            // Svuotiamo il contenitore principale
            container.innerHTML = '';
            
            // Prendiamo le categorie nell'ordine corretto
            const categorieOrdinate = getOrderedCategories();
            
            categorieOrdinate.forEach(nomeCategoria => {
                // Filtro locale: se è un'estensione ed è nascosta, la saltiamo
                if (hiddenExtensions.includes(nomeCategoria)) {
                    return;
                }
                
                // Creiamo il contenitore del gruppo (il tag HTML <details> crea una tendina apribile)
                const divGruppo = document.createElement('details');
                divGruppo.className = 'category-group';
                divGruppo.setAttribute('data-category', nomeCategoria);
                divGruppo.open = true; // Di default la tendina è aperta
                
                // Controlliamo se questa categoria è Fissata (Pinned)
                const isFissata = pinnedCategories.includes(nomeCategoria);
                if (isFissata) {
                    divGruppo.classList.add('pinned');
                }
                
                // Se abbiamo premuto il bottone Filtro, rendiamo tutto trascinabile
                if (reorderMode) {
                    divGruppo.draggable = true;
                    divGruppo.classList.add('draggable');
                    setupDragAndDrop(divGruppo);
                }
                
                // --- Creazione dell'intestazione (Il Titolo della Categoria) ---
                const titoloGruppo = document.createElement('summary');
                titoloGruppo.className = 'category';
                
                const testoDelTitolo = document.createElement('span');
                testoDelTitolo.className = 'category-title-text';
                testoDelTitolo.textContent = nomeCategoria;
                
                // --- Creazione dei controlli (Frecce su/giù e Bottone Pin) ---
                const divControlli = document.createElement('div');
                divControlli.className = 'reorder-controls';
                
                // Se siamo in modalità Riordina o se la categoria è Fissata, mostriamo sempre i controlli
                if (reorderMode || isFissata) {
                    divControlli.classList.add('always-visible');
                }
                
                // Creazione Bottone Pin 📌 (Ora usando SVG eleganti al posto degli sticker)
                const bottonePin = document.createElement('button');
                bottonePin.className = 'reorder-btn';
                
                const svgPinVuoto = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.16 6.31l-.22-.3-2.61-2.6L8 3.19V1L7.5.5h-2L5 1v2.19l-.31.22-2.6 2.6-.21.31v1.64h3.62v6.62L6 15h1l.5-.5.5.5h1l.5-.5v-6.62h3.66V6.31zm-1 .69H3V6l2.12-2.12V1h2.76v2.88L10.16 6v1z"/></svg>';
                const svgPinPieno = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 6.31V7H2v-.69L4.12 4.19V1h4.76v3.19L11 6.31zM6 14.5v-6.62h1v6.62l-.5.5-.5-.5z"/></svg>';
                
                if (isFissata) {
                    bottonePin.classList.add('active');
                    bottonePin.innerHTML = svgPinPieno;
                } else {
                    bottonePin.innerHTML = svgPinVuoto;
                }
                
                bottonePin.title = "Fissa in cima";
                bottonePin.onclick = (e) => {
                    e.preventDefault(); // Impedisce di chiudere la tendina
                    e.stopPropagation(); // Evita conflitti
                    if (isFissata) {
                        pinnedCategories = pinnedCategories.filter(c => c !== nomeCategoria);
                    } else {
                        pinnedCategories.push(nomeCategoria);
                    }
                    savePins();
                    renderShortcuts();
                };
                divControlli.appendChild(bottonePin);
                
                // Creazione Frecce Su/Giù (Solo se non è fissata e siamo in reorderMode, così è più pulito)
                if (!isFissata && reorderMode) {
                    const bottoneSu = document.createElement('button');
                    bottoneSu.className = 'reorder-btn';
                    bottoneSu.innerHTML = '▲';
                    bottoneSu.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const elementoPrecedente = divGruppo.previousElementSibling;
                        if (elementoPrecedente && !elementoPrecedente.classList.contains('pinned')) {
                            container.insertBefore(divGruppo, elementoPrecedente);
                            saveOrder();
                        }
                    };
                    
                    const bottoneGiu = document.createElement('button');
                    bottoneGiu.className = 'reorder-btn';
                    bottoneGiu.innerHTML = '▼';
                    bottoneGiu.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const elementoSuccessivo = divGruppo.nextElementSibling;
                        if (elementoSuccessivo) {
                            container.insertBefore(elementoSuccessivo, divGruppo);
                            saveOrder();
                        }
                    };
                    
                    divControlli.appendChild(bottoneSu);
                    divControlli.appendChild(bottoneGiu);
                }
                
                titoloGruppo.appendChild(testoDelTitolo);
                titoloGruppo.appendChild(divControlli);
                
                // Blocca il toggle del details se abbiamo appena trascinato
                titoloGruppo.addEventListener('click', (e) => {
                    if (justDragged) {
                        e.preventDefault();
                    }
                });
                
                divGruppo.appendChild(titoloGruppo);
                
                // --- Creazione delle singole righe degli Shortcut ---
                const listaScorciatoie = shortcutsData[nomeCategoria];
                listaScorciatoie.forEach(shortcut => {
                    const rigaShortcut = document.createElement('div');
                    rigaShortcut.className = 'shortcut-item';
                    
                    // Salviamo i dati reali come attributi per agevolare la Ricerca
                    rigaShortcut.setAttribute('data-command', shortcut.command);
                    rigaShortcut.setAttribute('data-keys', shortcut.keys);
                    
                    const boxTasti = document.createElement('div');
                    boxTasti.className = 'shortcut-keys';
                    boxTasti.textContent = shortcut.keys;
                    
                    const boxTesto = document.createElement('div');
                    boxTesto.className = 'shortcut-command';
                    
                    // Taglia i punti e prende solo la parola finale della funzione
                    const commandParts = shortcut.command.split('.');
                    boxTesto.textContent = commandParts[commandParts.length - 1];
                    
                    // Aggiunge la versione completa come tooltip (titolo) al passaggio del mouse
                    boxTesto.title = shortcut.command;
                    
                    rigaShortcut.appendChild(boxTasti);
                    rigaShortcut.appendChild(boxTesto);
                    divGruppo.appendChild(rigaShortcut);
                });
                
                // Infine, aggiungiamo l'intero gruppo alla schermata
                container.appendChild(divGruppo);
            });
            
            // Riapplichiamo la ricerca nel caso ce ne fosse una attiva
            searchInput.dispatchEvent(new Event('input'));
        }

        /**
         * Logica del Drag and Drop (Trascinamento)
         * Gestisce la magia di spostare gli elementi con il mouse
         */
        let elementoTrascinato = null;
        let justDragged = false;

        function setupDragAndDrop(elementoHTML) {
            elementoHTML.addEventListener('dragstart', function(e) {
                if (this.classList.contains('pinned')) {
                    e.preventDefault(); // Le categorie Pinned non si toccano!
                    return;
                }
                
                // Salviamo lo stato e chiudiamo la tendina per rendere il blocco "leggero" e facile da trascinare
                this.dataset.wasOpen = this.open;
                this.open = false;
                
                elementoTrascinato = this;
                setTimeout(() => this.classList.add('dragging'), 0);
            });

            // Quando rilasciamo
            elementoHTML.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                
                // Ripristiniamo la tendina se era aperta
                if (this.dataset.wasOpen === 'true') {
                    this.open = true;
                }
                
                if (elementoTrascinato) {
                    justDragged = true;
                    setTimeout(() => justDragged = false, 100);
                }
                elementoTrascinato = null;
                saveOrder(); // Salviamo il nuovo ordine
            });

            // Quando ci passiamo sopra trascinando
            elementoHTML.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (this.classList.contains('pinned')) return;
                this.classList.add('drag-over'); // Mostriamo la linea blu di dove stiamo per droppare
            });

            // Quando usciamo dall'elemento
            elementoHTML.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });

            // L'atto finale del Rilascio (Drop)
            elementoHTML.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                if (this.classList.contains('pinned')) return;
                
                // Se stiamo droppando su un elemento diverso da quello che stiamo trascinando
                if (this !== elementoTrascinato && elementoTrascinato) {
                    // Troviamo tutti i gruppi non pinnati
                    const tuttiIGruppiLiberi = Array.from(container.querySelectorAll('.category-group:not(.pinned)'));
                    const posizioneIniziale = tuttiIGruppiLiberi.indexOf(elementoTrascinato);
                    const posizioneTarget = tuttiIGruppiLiberi.indexOf(this);
                    
                    // Capiamo se stiamo scendendo o salendo per scambiarli correttamente
                    if (posizioneIniziale < posizioneTarget) {
                        this.after(elementoTrascinato);
                    } else {
                        this.before(elementoTrascinato);
                    }
                }
            });
        }
