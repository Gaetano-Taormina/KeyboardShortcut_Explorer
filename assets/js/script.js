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

        // Carichiamo dalla memoria del browser le preferenze di ordinamento
        let categoryOrder = JSON.parse(localStorage.getItem('categoryOrder')) || [];
        let pinnedCategories = JSON.parse(localStorage.getItem('pinnedCategories')) || [];
        
        // Liste estensioni ricevute dal backend
        let hiddenExtensions = [];
        let availableExtensions = [];

        /**
         * Applica le impostazioni decise dall'utente (grandezza testo, colori, accessibilità)
         */
        function applySettings(settings) {
            if (!settings) return;
            
            // Usiamo il CSS per cambiare dinamicamente font e colori
            document.documentElement.style.setProperty('--setting-font-size', settings.fontSize + 'px');
            document.documentElement.style.setProperty('--setting-bubble-color', settings.bubbleColor);
            
            // Se l'utente ha attivato la modalità accessibilità, aggiungiamo una classe CSS speciale
            if (settings.accessibilityMode) {
                document.body.classList.add('dyslexia-mode');
            } else {
                document.body.classList.remove('dyslexia-mode');
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
        function toggleCustomMenuLogic() {
            const isHidden = customMenu.classList.contains('hidden');
            
            if (isHidden) {
                // Costruiamo il menu dinamicamente
                customMenu.innerHTML = '';
                
                if (availableExtensions.length === 0) {
                    const emptyItem = document.createElement('div');
                    emptyItem.className = 'context-menu-item';
                    emptyItem.textContent = 'Nessuna estensione rilevata';
                    customMenu.appendChild(emptyItem);
                } else {
                    // --- Header: Seleziona Tutti / Deseleziona Tutti ---
                    const headerRow = document.createElement('div');
                    headerRow.style.display = 'flex';
                    headerRow.style.justifyContent = 'space-between';
                    headerRow.style.padding = '4px 8px';
                    headerRow.style.borderBottom = '1px solid var(--vscode-menu-border)';
                    headerRow.style.marginBottom = '4px';
                    
                    const selectAllBtn = document.createElement('button');
                    selectAllBtn.className = 'reorder-btn';
                    selectAllBtn.style.fontSize = '11px';
                    selectAllBtn.textContent = 'Seleziona Tutte';
                    selectAllBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        hiddenExtensions = []; // Nessuna estensione nascosta
                        vscode.postMessage({ command: 'updateHiddenExtensions', hiddenList: hiddenExtensions });
                        toggleCustomMenuLogic(); // Ridisegna il menu
                        renderShortcuts();       // Ridisegna gli shortcut
                    };

                    const deselectAllBtn = document.createElement('button');
                    deselectAllBtn.className = 'reorder-btn';
                    deselectAllBtn.style.fontSize = '11px';
                    deselectAllBtn.textContent = 'Deseleziona Tutte';
                    deselectAllBtn.onclick = (ev) => {
                        ev.stopPropagation();
                        hiddenExtensions = [...availableExtensions]; // Tutte le estensioni nascoste
                        vscode.postMessage({ command: 'updateHiddenExtensions', hiddenList: hiddenExtensions });
                        toggleCustomMenuLogic(); // Ridisegna il menu
                        renderShortcuts();       // Ridisegna gli shortcut
                    };

                    headerRow.appendChild(selectAllBtn);
                    headerRow.appendChild(deselectAllBtn);
                    customMenu.appendChild(headerRow);
                    
                    // --- Lista delle Estensioni ---
                    availableExtensions.forEach(ext => {
                        const item = document.createElement('div');
                        item.className = 'context-menu-item';
                        
                        const isVisible = !hiddenExtensions.includes(ext);
                        
                        const checkmark = document.createElement('div');
                        checkmark.className = 'context-menu-check';
                        checkmark.innerHTML = isVisible ? '✓' : '';
                        
                        const label = document.createElement('div');
                        label.className = 'context-menu-label';
                        label.textContent = ext;
                        
                        item.appendChild(checkmark);
                        item.appendChild(label);
                        
                        item.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const isCurrentlyHidden = hiddenExtensions.includes(ext);
                            
                            if (isCurrentlyHidden) {
                                // Era nascosta, ora la mostriamo (togliamola da hiddenExtensions)
                                hiddenExtensions = hiddenExtensions.filter(e => e !== ext);
                                checkmark.innerHTML = '✓';
                            } else {
                                // Era visibile, ora la nascondiamo
                                hiddenExtensions.push(ext);
                                checkmark.innerHTML = '';
                            }
                            
                            // Inviamo l'aggiornamento al backend per salvare la preferenza
                            vscode.postMessage({
                                command: 'updateHiddenExtensions',
                                hiddenList: hiddenExtensions
                            });
                            
                            // Aggiorniamo subito la vista principale
                            renderShortcuts();
                        });
                        
                        customMenu.appendChild(item);
                    });
                }
                
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
         * Logica della Barra di Ricerca
         */
        searchInput.addEventListener('input', (event) => {
            const testDaCercare = event.target.value.toLowerCase();
            const tuttiGliElementi = document.querySelectorAll('.shortcut-item');
            const tuttiIGruppi = document.querySelectorAll('.category-group');
            
            let elementiVisibiliTotali = 0;

            // Filtriamo le singole righe (shortcut)
            tuttiGliElementi.forEach(elemento => {
                const comando = elemento.getAttribute('data-command').toLowerCase();
                const tasti = elemento.getAttribute('data-keys').toLowerCase();
                
                if (comando.includes(testDaCercare) || tasti.includes(testDaCercare)) {
                    elemento.classList.remove('hidden'); // Mostralo
                } else {
                    elemento.classList.add('hidden'); // Nascondilo
                }
            });

            // Filtriamo i gruppi (se un gruppo non ha più elementi visibili, nascondiamo tutto il gruppo)
            tuttiIGruppi.forEach(gruppo => {
                const elementiAncoraVisibili = gruppo.querySelectorAll('.shortcut-item:not(.hidden)');
                if (elementiAncoraVisibili.length === 0) {
                    gruppo.classList.add('hidden');
                } else {
                    gruppo.classList.remove('hidden');
                    // Se stiamo cercando qualcosa, apriamo automaticamente la tendina del gruppo
                    if (testDaCercare.length > 0) {
                        gruppo.open = true;
                    }
                    elementiVisibiliTotali += elementiAncoraVisibili.length;
                }
            });

            // Se non c'è nulla, mostriamo la scritta "Nessun risultato"
            noResults.style.display = elementiVisibiliTotali === 0 ? 'block' : 'none';
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
         * Salvataggi in memoria locale (LocalStorage) per non perdere le impostazioni al riavvio
         */
        function saveOrder() {
            const gruppi = Array.from(document.querySelectorAll('.category-group'));
            categoryOrder = gruppi.map(g => g.getAttribute('data-category'));
            localStorage.setItem('categoryOrder', JSON.stringify(categoryOrder));
        }
        
        function savePins() {
            localStorage.setItem('pinnedCategories', JSON.stringify(pinnedCategories));
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
                if (nomeCategoria.startsWith('Extension: ')) {
                    const extName = nomeCategoria.replace('Extension: ', '');
                    if (hiddenExtensions.includes(extName)) {
                        return;
                    }
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
                    boxTesto.textContent = shortcut.command;
                    
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
            // Quando iniziamo a trascinare
            elementoHTML.addEventListener('dragstart', function(e) {
                if (this.classList.contains('pinned')) {
                    e.preventDefault(); // Le categorie Pinned non si toccano!
                    return;
                }
                elementoTrascinato = this;
                setTimeout(() => this.classList.add('dragging'), 0);
            });

            // Quando rilasciamo
            elementoHTML.addEventListener('dragend', function() {
                this.classList.remove('dragging');
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
