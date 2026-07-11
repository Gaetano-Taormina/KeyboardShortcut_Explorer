/**
 * Search Bar Component & Keystroke Detection
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
 * Initialize all search bar event listeners (Keystroke detection + Fuzzy filtering)
 */
function initSearchBar(searchInput, noResults) {
    if (!searchInput || !noResults) return;

    /**
     * Keystroke Detection for Search Bar
     */
    searchInput.addEventListener('keydown', (event) => {
        // 1. Allow normal text editing
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
            return;
        }

        // 2. Determine if the user is trying to type a shortcut
        const isModifierOnly = ['Control', 'Alt', 'Meta', 'Shift'].includes(event.key);
        const hasModifier = event.ctrlKey || event.altKey || event.metaKey; 
        const isFunctionKey = event.key.match(/^F\d{1,2}$/);
        const isSpecialKey = ['Escape', 'Tab', 'Insert', 'PageUp', 'PageDown', 'Space'].includes(event.key);

        // If it's just normal typing (e.g. typing "copy"), let it behave normally
        if (!isModifierOnly && !hasModifier && !isFunctionKey && !isSpecialKey) {
            return;
        }

        // 3. Prevent the default typing behavior for the captured shortcut
        event.preventDefault();

        // 4. Build the shortcut string
        let keys = [];
        if (event.ctrlKey || event.key === 'Control') keys.push('ctrl');
        if (event.altKey || event.key === 'Alt') keys.push('alt');
        if (event.shiftKey || event.key === 'Shift') keys.push('shift');
        if (event.metaKey || event.key === 'Meta') keys.push('meta');
        
        // Add the specific key if it wasn't just a modifier
        if (!isModifierOnly) {
            let key = event.key.toLowerCase();
            if (key === ' ') key = 'space';
            keys.push(key);
        }
        
        // 5. Update the search bar and trigger the search
        const searchString = keys.join('+');
        searchInput.value = searchString;
        
        searchInput.dispatchEvent(new Event('input'));
    });

    /**
     * Advanced Search Bar Logic
     */
    searchInput.addEventListener('input', (event) => {
        let rawTesto = event.target.value;
        let testoPulito = normalizeText(rawTesto);
        
        // Get the original text + possible translations
        const terminiDaCercare = getSynonyms(testoPulito);

        const tuttiGliElementi = document.querySelectorAll('.shortcut-item');
        const tuttiIGruppi = document.querySelectorAll('.category-group');
        
        let elementiVisibiliTotali = 0;

        // Filter single rows (shortcuts)
        tuttiGliElementi.forEach(elemento => {
            const comando = elemento.getAttribute('data-command').toLowerCase();
            const tasti = elemento.getAttribute('data-keys').toLowerCase();
            
            let isMatch = false;
            
            for (const term of terminiDaCercare) {
                // Search by keys
                if (tasti.includes(term)) {
                    isMatch = true;
                    break;
                }
                
                // Search by command with Fuzzy Logic
                if (fuzzyMatch(term, comando)) {
                    isMatch = true;
                    break;
                }
            }
            
            if (isMatch) {
                elemento.classList.remove('hidden'); // Show it
            } else {
                elemento.classList.add('hidden'); // Hide it
            }
        });

        // Filter groups
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

        // Show "No results" message
        noResults.style.display = elementiVisibiliTotali === 0 && rawTesto.length > 0 ? 'block' : 'none';
    });
}
