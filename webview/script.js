        // acquire the VS Code API needed to communicate between HTML and backend
        const vscode = acquireVsCodeApi();
        
        // HTML interface elements
        const container = document.getElementById('shortcuts-container');
        const searchInput = document.getElementById('searchInput');
        const searchContainer = document.querySelector('.search-container');
        const noResults = document.getElementById('no-results');
        const toggleSettingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        const settingAppearanceMode = document.getElementById('setting-appearance-mode');
        const settingColorProfile = document.getElementById('setting-color-profile');
        const settingTextColor = document.getElementById('setting-text-color');
        const settingTitleBgColor = document.getElementById('setting-title-bg-color');
        const settingKeysBgColor = document.getElementById('setting-keys-bg-color');
        const settingBubbleColor = document.getElementById('setting-bubble-color');

        // Variables to keep the state of our interface
        let shortcutsData = {}; // Here we will save all shortcuts arriving from the backend
        let reorderMode = false; // Indicates if the "Filter/Reorder" button was pressed
        let pinMode = false;     // Indicates if the "Pin" button was pressed
        
        // References to the Custom Menu
        const customMenu = document.getElementById('custom-context-menu');

        // Load ordering preferences sent by the backend
        let categoryOrder = [];
        if (typeof INJECTED_CATEGORY_ORDER !== 'undefined' && INJECTED_CATEGORY_ORDER) {
            categoryOrder = INJECTED_CATEGORY_ORDER;
        }
        
        let pinnedCategories = [];
        if (typeof INJECTED_PINNED_CATEGORIES !== 'undefined' && INJECTED_PINNED_CATEGORIES) {
            pinnedCategories = INJECTED_PINNED_CATEGORIES;
        }
        
        // Extension lists received from the backend
        let hiddenExtensions = [];
        let availableExtensions = [];
        let builtInExtensions = [];

        /**
         * Applies the settings chosen by the user (text size, colors, accessibility)
         */
        function applySettings(settings) {
            if (!settings) return;
            
            // CSS Variables for user customizations
            document.documentElement.style.setProperty('--setting-font-family', settings.fontFamily);
            document.documentElement.style.setProperty('--setting-font-size', settings.fontSize + 'px');
            document.documentElement.style.setProperty('--setting-keys-font-size', settings.keysFontSize + 'px');
            document.documentElement.style.setProperty('--setting-title-font-size', settings.titleFontSize + 'px');
            // Appearance Mode handling
            // We can add a class to body to enforce basic dark/light if the user wants an override
            // VS Code typically handles this, but if we need to force it, we could apply filters
            // Appearance Mode: absolute override
            // 1. BASE: Apply VS Code variables based on Appearance Mode
            // (This sets the general background and fixes hover/focus contrasts)
            if (settings.appearanceMode === "Dark") {
                document.documentElement.style.setProperty('--vscode-sideBar-background', '#1e1e1e');
                document.documentElement.style.setProperty('--vscode-sideBar-foreground', '#cccccc');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-background', '#252526');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-foreground', '#cccccc');
                document.documentElement.style.setProperty('--vscode-foreground', '#cccccc');
                document.documentElement.style.setProperty('--vscode-icon-foreground', '#cccccc'); // <-- FIX Symbols
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', '#cccccc'); 
                document.documentElement.style.setProperty('--vscode-input-background', '#3c3c3c');
                document.documentElement.style.setProperty('--vscode-input-foreground', '#cccccc');
                document.documentElement.style.setProperty('--vscode-input-border', '#3c3c3c');
                document.documentElement.style.setProperty('--vscode-list-hoverBackground', '#2a2d2e');
                document.documentElement.style.setProperty('--vscode-list-hoverForeground', '#cccccc');
                
                // Force extra variables useful for Alternative profiles
                document.documentElement.style.setProperty('--vscode-button-background', '#0e639c');
                document.documentElement.style.setProperty('--vscode-button-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-editor-background', '#1e1e1e');
            } else if (settings.appearanceMode === "Light") {
                document.documentElement.style.setProperty('--vscode-sideBar-background', '#f3f3f3');
                document.documentElement.style.setProperty('--vscode-sideBar-foreground', '#333333');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-background', '#e8e8e8');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-foreground', '#333333');
                document.documentElement.style.setProperty('--vscode-foreground', '#333333');
                document.documentElement.style.setProperty('--vscode-icon-foreground', '#424242'); // <-- FIX Symbols
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', '#333333'); 
                document.documentElement.style.setProperty('--vscode-input-background', '#ffffff');
                document.documentElement.style.setProperty('--vscode-input-foreground', '#333333');
                document.documentElement.style.setProperty('--vscode-input-border', '#cecece');
                document.documentElement.style.setProperty('--vscode-list-hoverBackground', '#e8e8e8');
                document.documentElement.style.setProperty('--vscode-list-hoverForeground', '#333333');
                
                // Force extra variables useful for Alternative profiles
                document.documentElement.style.setProperty('--vscode-button-background', '#007acc');
                document.documentElement.style.setProperty('--vscode-button-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-editor-background', '#ffffff');
            } else if (settings.appearanceMode === "High Contrast") {
                document.documentElement.style.setProperty('--vscode-sideBar-background', '#000000');
                document.documentElement.style.setProperty('--vscode-sideBar-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-background', '#000000');
                document.documentElement.style.setProperty('--vscode-sideBarSectionHeader-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-icon-foreground', '#ffffff'); // <-- FIX Symbols
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', '#ffffff'); 
                document.documentElement.style.setProperty('--vscode-input-background', '#000000');
                document.documentElement.style.setProperty('--vscode-input-foreground', '#ffffff');
                document.documentElement.style.setProperty('--vscode-input-border', '#f38518');
                document.documentElement.style.setProperty('--vscode-widget-border', '#f38518');
                document.documentElement.style.setProperty('--vscode-list-hoverBackground', '#000000');
                document.documentElement.style.setProperty('--vscode-list-hoverForeground', '#ffffff');
            }

            // 2. DEFAULT FALLBACK: Set hardcoded values for internal details if the user does not have an active profile.
            if (settings.appearanceMode === "Light") {
                document.documentElement.style.setProperty('--setting-bubble-color', '#ffffff');
                document.documentElement.style.setProperty('--setting-keys-bg', '#e0e0e0');
                document.documentElement.style.setProperty('--setting-title-bg', '#eaeaea');
                document.documentElement.style.setProperty('--setting-text-color', '#333333');
            } else if (settings.appearanceMode === "Dark") {
                document.documentElement.style.setProperty('--setting-bubble-color', '#252526');
                document.documentElement.style.setProperty('--setting-keys-bg', '#333333');
                document.documentElement.style.setProperty('--setting-title-bg', '#2d2d2d');
                document.documentElement.style.setProperty('--setting-text-color', '#cccccc');
            } else if (settings.appearanceMode === "High Contrast") {
                document.documentElement.style.setProperty('--setting-bubble-color', '#000000');
                document.documentElement.style.setProperty('--setting-keys-bg', '#000000');
                document.documentElement.style.setProperty('--setting-title-bg', '#000000');
                document.documentElement.style.setProperty('--setting-text-color', '#ffffff');
            } else {
                // Native Appearance 
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-editor-inactiveSelectionBackground)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-textCodeBlock-background)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-sideBar-background)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-sideBar-background)');
            }

            // 3. COLOR PROFILE OVERRIDES: If using Custom or Alternative, these MUST override everything else!
            if (settings.colorProfile === "Alternative 1") {
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-button-background)');
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-editor-background)');
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', 'var(--vscode-editor-foreground)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'transparent'); // Blends with background
            } else if (settings.colorProfile === "Alternative 2") {
                document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-terminal-background)');
                document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
                document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-button-secondaryBackground)');
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', 'var(--vscode-button-secondaryForeground)');
                document.documentElement.style.setProperty('--setting-bubble-color', 'transparent'); // Blends with background
            } else if (settings.colorProfile === "Custom") {
                document.documentElement.style.setProperty('--setting-text-color', settings.textColor);
                document.documentElement.style.setProperty('--setting-title-bg', settings.titleBackgroundColor);
                document.documentElement.style.setProperty('--setting-keys-bg', settings.keysBackgroundColor);
                document.documentElement.style.setProperty('--vscode-textPreformat-foreground', settings.textColor); // Use Custom text color for keys!
                document.documentElement.style.setProperty('--setting-bubble-color', settings.bubbleColor);
                document.documentElement.style.setProperty('--setting-searchbar-bg', settings.searchbarBackgroundColor);
                document.documentElement.style.setProperty('--setting-searchbar-text', settings.searchbarTextColor);
            }

            // Zebra striping handling
            if (settings.alternateRowColors) {
                document.body.classList.add('use-zebra-stripes');
                // Increased opacity/contrast logic applied via variable definition
                let rowColor = '#82828233'; // Semi-transparent neutral color that adapts to light and dark backgrounds
                if (settings.colorProfile === "Custom") {
                    rowColor = settings.alternateRowColor;
                }
                document.documentElement.style.setProperty('--setting-alternate-row-color', rowColor);
            } else {
                document.body.classList.remove('use-zebra-stripes');
            }

            // Sync Webview Settings Panel (if exists)
            if (settingAppearanceMode) settingAppearanceMode.value = settings.appearanceMode || "Auto";
            if (settingColorProfile) settingColorProfile.value = settings.colorProfile || "VS Code Native";

            const hexRegex = /^#[0-9A-Fa-f]{6}$/;
            if (settings.textColor && hexRegex.test(settings.textColor) && settingTextColor) settingTextColor.value = settings.textColor;
            if (settings.titleBackgroundColor && hexRegex.test(settings.titleBackgroundColor) && settingTitleBgColor) settingTitleBgColor.value = settings.titleBackgroundColor;
            if (settings.keysBackgroundColor && hexRegex.test(settings.keysBackgroundColor) && settingKeysBgColor) settingKeysBgColor.value = settings.keysBackgroundColor;
            if (settings.bubbleColor && hexRegex.test(settings.bubbleColor) && settingBubbleColor) settingBubbleColor.value = settings.bubbleColor;
            
            // Dyslexia Settings
            document.documentElement.style.setProperty('--setting-dyslexia-font', settings.dyslexiaFont);
            document.documentElement.style.setProperty('--setting-dyslexia-spacing', settings.dyslexiaLetterSpacing);
            
            // If the user has activated accessibility mode, add a special CSS class
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
            
            // Injection of CSS variables for font sizes
            document.documentElement.style.setProperty('--setting-font-size', (settings.fontSize || 13) + 'px');
            document.documentElement.style.setProperty('--setting-title-font-size', (settings.titleFontSize || 15) + 'px');
            document.documentElement.style.setProperty('--setting-keys-font-size', (settings.keysFontSize || 11) + 'px');
        }

        // If the backend sent us settings, apply them immediately
        if (typeof INJECTED_SETTINGS !== 'undefined' && INJECTED_SETTINGS) {
            applySettings(INJECTED_SETTINGS);
        }

        // If the backend sent us shortcuts, save them and draw them
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

        // Update disclaimer management
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
        
        // Initial render
        renderShortcuts();

        /**
         * Listening to commands from the carousel (buttons in the top bar)
         */
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'toggleSearch':
                    searchContainer.classList.toggle('hidden');
                    break;
                case 'openSettings':
                    if (settingsModal) settingsModal.classList.toggle('hidden');
                    break;
                case 'togglePinMode':
                    pinMode = !pinMode;
                    renderShortcuts(); // Re-render to show Pin buttons
                    break;
                case 'toggleCustomMenu':
                    toggleCustomMenuLogic();
                    break;
            }
        });
        
        /**
         * Custom Context Menu Logic (Extensions Filter)
         */
        function renderCustomMenu() {
            // Build the menu dynamically
            customMenu.innerHTML = '';
            
            if (availableExtensions.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'context-menu-item';
                emptyItem.textContent = 'No extension detected';
                customMenu.appendChild(emptyItem);
            } else {
                // Split extensions into System and User
                const sysExts = availableExtensions.filter(e => builtInExtensions.includes(e));
                const usrExts = availableExtensions.filter(e => !builtInExtensions.includes(e));
                
                // Function to create category header with Bulk Toggle
                function createCategoryHeader(labelStr, extensionsList, parentItem) {
                    const header = document.createElement('div');
                    header.className = 'context-menu-header';
                    
                    const checkmark = document.createElement('div');
                    checkmark.className = 'context-menu-check bulk-toggle';
                    // Determine if all extensions in this list are visible
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
                    label.title = labelStr; // tooltip for long texts
                    
                    const arrow = document.createElement('div');
                    arrow.className = 'submenu-arrow';
                    arrow.innerHTML = '▶';
                    
                    // Clicking on the checkmark or text selects/deselects all extensions
                    function toggleBulk(ev) {
                        ev.stopPropagation(); // Prevent opening/closing the accordion
                        if (allVisible) {
                            // Hide all
                            extensionsList.forEach(ext => {
                                if (!hiddenExtensions.includes(ext)) hiddenExtensions.push(ext);
                            });
                        } else {
                            // Show all (remove from hiddenExtensions)
                            hiddenExtensions = hiddenExtensions.filter(ext => !extensionsList.includes(ext));
                        }
                        vscode.postMessage({ command: 'updateHiddenExtensions', hiddenList: hiddenExtensions });
                        // Leave the menu as it was (open or closed)
                        const wasOpen = parentItem.classList.contains('open');
                        renderCustomMenu(); // Only re-render, NOT toggle (which would close it)
                        renderShortcuts();
                        // Restore open/closed state
                        const newParent = Array.from(document.querySelectorAll('.context-menu-label')).find(l => l.textContent === labelStr)?.closest('.context-menu-item');
                        if (wasOpen && newParent) newParent.classList.add('open');
                    }

                    checkmark.addEventListener('click', toggleBulk);
                    label.addEventListener('click', toggleBulk);
                    
                    // Clicking the arrow opens the accordion
                    arrow.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        parentItem.classList.toggle('open');
                    });
                    
                    // Clicking the empty area of the row opens it
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

                    // Function to create child items in the submenu
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
                            label.title = ext; // tooltip on hover
                            
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

                    // --- Item: System ---
                    var systemItem = document.createElement('div');
                    systemItem.className = 'context-menu-item has-submenu';
                    const systemHeader = createCategoryHeader('System', sysExts, systemItem);
                    const systemSubmenu = createSubmenuItems(sysExts, systemItem);
                    systemItem.appendChild(systemHeader);
                    systemItem.appendChild(systemSubmenu);
                    customMenu.appendChild(systemItem);
                    
                    // --- Item: Extensions ---
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

        // Close the menu if the user clicks outside
        document.addEventListener('click', () => {
            if (!customMenu.classList.contains('hidden')) {
                customMenu.classList.add('hidden');
            }
        });
        
        /**
         * Expand/Collapse All Categories Logic
         */
        const toggleAllBtn = document.getElementById('toggle-all-btn');
        
        toggleAllBtn.addEventListener('click', () => {
            const allDetails = document.querySelectorAll('.category-group:not(.hidden)');
            const anyClosed = Array.from(allDetails).some(d => !d.open);
            allDetails.forEach(d => d.open = anyClosed);
        });

        // Initialize Search Bar Component
        initSearchBar(searchInput, noResults);


        /**
         * Orders categories, putting pinned ones first, then custom order
         */
        function getOrderedCategories() {
            const tutteLeCategorie = Object.keys(shortcutsData);

            return tutteLeCategorie.sort((categoriaA, categoriaB) => {
                const aE_Fissata = pinnedCategories.includes(categoriaA);
                const bE_Fissata = pinnedCategories.includes(categoriaB);
                
                // Pinned categories always win and go to the top
                if (aE_Fissata && !bE_Fissata) return -1;
                if (!aE_Fissata && bE_Fissata) return 1;

                // Otherwise, sort based on the saved drag and drop order
                let posizioneA = categoryOrder.indexOf(categoriaA);
                let posizioneB = categoryOrder.indexOf(categoriaB);
                
                // If they never had an order, put them at the bottom (999)
                if (posizioneA === -1) posizioneA = 999;
                if (posizioneB === -1) posizioneB = 999;
                
                return posizioneA - posizioneB;
            });
        }

        /**
         * Persistent save by sending data to VS Code backend (globalState)
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
         * renderShortcuts: Recreates all dynamic HTML whenever needed.
         */
        function renderShortcuts() {
            // Empty the main container
            container.innerHTML = '';
            
            // Get categories in the correct order
            const categorieOrdinate = getOrderedCategories();
            
            categorieOrdinate.forEach(nomeCategoria => {
                // Local filter: if it's an extension and it's hidden, skip it
                if (hiddenExtensions.includes(nomeCategoria)) {
                    return;
                }
                
                // Create group container (HTML <details> tag creates an expandable accordion)
                const divGruppo = document.createElement('details');
                divGruppo.className = 'category-group';
                divGruppo.setAttribute('data-category', nomeCategoria);
                divGruppo.open = true; // Accordion is open by default
                
                // Check if this category is Pinned
                const isFissata = pinnedCategories.includes(nomeCategoria);
                if (isFissata) {
                    divGruppo.classList.add('pinned');
                }
                
                // The accordion divGruppo acts as a drop zone, but is not entirely draggable (to avoid giant block effect)
                divGruppo.classList.add('droppable-area');
                
                // --- Header Creation (Category Title) ---
                const titoloGruppo = document.createElement('summary');
                titoloGruppo.className = 'category';
                titoloGruppo.draggable = true; // Only the title is draggable! Does not create giant ghosts
                titoloGruppo.classList.add('draggable');
                setupDragAndDrop(titoloGruppo, divGruppo);
                
                const testoDelTitolo = document.createElement('span');
                testoDelTitolo.className = 'category-title-text';
                testoDelTitolo.textContent = nomeCategoria;
                
                // --- Controls Creation (Up/Down Arrows and Pin Button) ---
                const divControlli = document.createElement('div');
                divControlli.className = 'reorder-controls';
                
                // Controls always visible on hover or if pinned
                if (isFissata) {
                    divControlli.classList.add('always-visible');
                }
                
                // Pin Button Creation 📌 (Now using elegant SVGs instead of emojis)
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
                
                bottonePin.title = "Pin to top";
                bottonePin.onclick = (e) => {
                    e.preventDefault(); // Prevents closing the accordion
                    e.stopPropagation(); // Prevents conflicts
                    if (isFissata) {
                        pinnedCategories = pinnedCategories.filter(c => c !== nomeCategoria);
                    } else {
                        pinnedCategories.push(nomeCategoria);
                    }
                    savePins();
                    renderShortcuts();
                };
                divControlli.appendChild(bottonePin);
                
                // Up/Down Arrows Creation (Only if not pinned and we are in reorderMode, keeps it clean)
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
                
                // Block details toggle if we just dragged
                titoloGruppo.addEventListener('click', (e) => {
                    if (justDragged) {
                        e.preventDefault();
                    }
                });
                
                divGruppo.appendChild(titoloGruppo);
                
                // --- Creation of single Shortcut rows ---
                const listaScorciatoie = shortcutsData[nomeCategoria];
                listaScorciatoie.forEach(shortcut => {
                    const rigaShortcut = document.createElement('div');
                    rigaShortcut.className = 'shortcut-item';
                    
                    // Save real data as attributes to facilitate Search
                    rigaShortcut.setAttribute('data-command', shortcut.command);
                    rigaShortcut.setAttribute('data-keys', shortcut.keys);
                    
                    const boxTasti = document.createElement('div');
                    boxTasti.className = 'shortcut-keys';
                    boxTasti.textContent = shortcut.keys;
                    
                    const boxTesto = document.createElement('div');
                    boxTesto.className = 'shortcut-command';
                    
                    // Cuts dots and takes only the final word of the function
                    const commandParts = shortcut.command.split('.');
                    boxTesto.textContent = commandParts[commandParts.length - 1];
                    
                    // Adds the full version as tooltip on hover
                    boxTesto.title = shortcut.command;
                    
                    rigaShortcut.appendChild(boxTasti);
                    rigaShortcut.appendChild(boxTesto);
                    divGruppo.appendChild(rigaShortcut);
                });
                
                // Finally, we add the entire group to the screen
                container.appendChild(divGruppo);
            });
            
            // Re-apply search in case one was active
            searchInput.dispatchEvent(new Event('input'));
        }

        /**
         * Drag and Drop Logic
         * Handles the magic of moving elements with the mouse
         */
        let elementoTrascinato = null;
        let justDragged = false;

        function setupDragAndDrop(titoloGruppo, divGruppo) {
            // Events for the element being DRAGGED (The title)
            titoloGruppo.addEventListener('dragstart', function(e) {
                if (divGruppo.classList.contains('pinned')) {
                    e.preventDefault(); // Pinned categories cannot be moved!
                    return;
                }
                
                elementoTrascinato = divGruppo;
                // Do not close the accordion: the browser will automatically clone only the <summary> (titoloGruppo)
                // This solves the giant shadow problem!
                setTimeout(() => divGruppo.classList.add('dragging'), 0);
            });

            titoloGruppo.addEventListener('dragend', function() {
                if (elementoTrascinato) {
                    elementoTrascinato.classList.remove('dragging');
                    justDragged = true;
                    setTimeout(() => justDragged = false, 100);
                }
                elementoTrascinato = null;
                saveOrder(); // Save the new order
            });

            // Events for the DROP area (The entire group)
            divGruppo.addEventListener('dragover', function(e) {
                e.preventDefault();
                if (this.classList.contains('pinned')) return;
                this.classList.add('drag-over'); // Show the blue line where we are about to drop
            });

            divGruppo.addEventListener('dragleave', function() {
                this.classList.remove('drag-over');
            });

            divGruppo.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                
                if (this.classList.contains('pinned')) return;
                
                // If we are dropping on a different element than the one we are dragging
                if (this !== elementoTrascinato && elementoTrascinato) {
                    // Find all non-pinned groups
                    const tuttiIGruppiLiberi = Array.from(container.querySelectorAll('.category-group:not(.pinned)'));
                    const posizioneIniziale = tuttiIGruppiLiberi.indexOf(elementoTrascinato);
                    const posizioneTarget = tuttiIGruppiLiberi.indexOf(this);
                    
                    // Figure out if we are moving up or down to swap them correctly
                    if (posizioneIniziale < posizioneTarget) {
                        this.after(elementoTrascinato);
                    } else {
                        this.before(elementoTrascinato);
                    }
                    
                    // Update the order in the backend immediately
                    saveOrder();
                }
            });
        }

        // Settings Modal Toggle
        if (toggleSettingsBtn) {
            toggleSettingsBtn.addEventListener('click', () => {
                if (settingsModal) settingsModal.classList.toggle('hidden');
            });
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                if (settingsModal) settingsModal.classList.add('hidden');
            });
        }

        // Event Listeners for Settings changes
        function updateSetting(key, value) {
            vscode.postMessage({
                command: 'updateSetting',
                key: key,
                value: value
            });
        }

        if (settingAppearanceMode) settingAppearanceMode.addEventListener('change', (e) => updateSetting('appearanceMode', e.target.value));
        if (settingColorProfile) settingColorProfile.addEventListener('change', (e) => updateSetting('colorProfile', e.target.value));
        if (settingTextColor) settingTextColor.addEventListener('input', (e) => updateSetting('textColor', e.target.value));
        if (settingTitleBgColor) settingTitleBgColor.addEventListener('input', (e) => updateSetting('titleBackgroundColor', e.target.value));
        if (settingKeysBgColor) settingKeysBgColor.addEventListener('input', (e) => updateSetting('keysBackgroundColor', e.target.value));
        if (settingBubbleColor) settingBubbleColor.addEventListener('input', (e) => updateSetting('bubbleColor', e.target.value));
