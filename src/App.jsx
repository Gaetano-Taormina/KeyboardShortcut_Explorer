import { useState, useEffect, useRef } from 'react';
import './App.scss';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : { postMessage: () => {} };

export default function App() {
  const [shortcutsData, setShortcutsData] = useState({});
  const [settings, setSettings] = useState({});
  const [hiddenExtensions, setHiddenExtensions] = useState([]);
  const [availableExtensions, setAvailableExtensions] = useState([]);
  const [builtInExtensions, setBuiltInExtensions] = useState([]);
  const [pinnedCategories, setPinnedCategories] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [version, setVersion] = useState("1.0.0");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  useEffect(() => {
    // We expect the VS Code extension to send a message 'init' with all data
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === 'initData') {
        if (message.shortcutsData) setShortcutsData(message.shortcutsData);
        if (message.settings) {
          setSettings(message.settings);
          applySettingsVariables(message.settings);
        }
        if (message.hiddenExtensions) setHiddenExtensions(message.hiddenExtensions);
        if (message.availableExtensions) setAvailableExtensions(message.availableExtensions);
        if (message.builtInExtensions) setBuiltInExtensions(message.builtInExtensions);
        if (message.pinnedCategories) setPinnedCategories(message.pinnedCategories);
        if (message.categoryOrder) setCategoryOrder(message.categoryOrder);
        if (message.showDisclaimer !== undefined) setShowDisclaimer(message.showDisclaimer);
        if (message.version) setVersion(message.version);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Request data
    vscode.postMessage({ command: 'requestInitData' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Utility to apply CSS Variables
  const applySettingsVariables = (s) => {
    document.documentElement.style.setProperty('--setting-font-family', s.fontFamily);
    document.documentElement.style.setProperty('--setting-font-size', s.fontSize + 'px');
    document.documentElement.style.setProperty('--setting-keys-font-size', s.keysFontSize + 'px');
    document.documentElement.style.setProperty('--setting-title-font-size', s.titleFontSize + 'px');
    
    if (s.colorProfile === "Custom") {
        document.documentElement.style.setProperty('--setting-text-color', s.textColor);
        document.documentElement.style.setProperty('--setting-title-bg', s.titleBackgroundColor);
        document.documentElement.style.setProperty('--setting-keys-bg', s.keysBackgroundColor);
        document.documentElement.style.setProperty('--vscode-textPreformat-foreground', s.textColor); 
        document.documentElement.style.setProperty('--setting-bubble-color', s.bubbleColor);
        document.documentElement.style.setProperty('--setting-searchbar-bg', s.searchbarBackgroundColor);
        document.documentElement.style.setProperty('--setting-searchbar-text', s.searchbarTextColor);
        document.documentElement.style.setProperty('--setting-alternate-row-color', s.alternateRowColor);
    } else {
        document.documentElement.style.setProperty('--setting-text-color', 'var(--vscode-foreground)');
        document.documentElement.style.setProperty('--setting-title-bg', 'var(--vscode-editor-inactiveSelectionBackground)');
        document.documentElement.style.setProperty('--setting-keys-bg', 'var(--vscode-textCodeBlock-background)');
        document.documentElement.style.setProperty('--setting-bubble-color', 'var(--vscode-sideBar-background)');
    }

    if (s.alternateRowColors) {
        document.body.classList.add('use-zebra-stripes');
    } else {
        document.body.classList.remove('use-zebra-stripes');
    }

    if (s.accessibilityMode) {
        document.body.classList.add('dyslexia-mode');
        document.documentElement.style.setProperty('--setting-dyslexia-font', s.dyslexiaFont);
        document.documentElement.style.setProperty('--setting-dyslexia-spacing', s.dyslexiaLetterSpacing);
        if (s.dyslexiaBold) document.body.classList.add('dyslexia-bold');
        else document.body.classList.remove('dyslexia-bold');
    } else {
        document.body.classList.remove('dyslexia-mode');
        document.body.classList.remove('dyslexia-bold');
    }
  };

  const handleDragEnd = (resultOrder) => {
    setCategoryOrder(resultOrder);
    vscode.postMessage({ command: 'updateCategoryOrder', orderList: resultOrder });
  };

  const togglePin = (catName) => {
    let newPins;
    if (pinnedCategories.includes(catName)) {
      newPins = pinnedCategories.filter(c => c !== catName);
    } else {
      newPins = [...pinnedCategories, catName];
    }
    setPinnedCategories(newPins);
    vscode.postMessage({ command: 'updatePinnedCategories', pinnedList: newPins });
  };
  
  const dismissDisclaimer = () => {
    setShowDisclaimer(false);
    vscode.postMessage({ command: 'dismissDisclaimer', version: version });
  };

  // Filter Categories
  const getOrderedCategories = () => {
    const allCategories = Object.keys(shortcutsData);
    const visibleCategories = allCategories.filter(cat => !hiddenExtensions.includes(cat));
    
    return visibleCategories.sort((a, b) => {
        const aPinned = pinnedCategories.includes(a);
        const bPinned = pinnedCategories.includes(b);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        let posA = categoryOrder.indexOf(a);
        let posB = categoryOrder.indexOf(b);
        if (posA === -1) posA = 999;
        if (posB === -1) posB = 999;
        return posA - posB;
    });
  };

  const orderedCats = getOrderedCategories();

  return (
    <div>
      {showDisclaimer && (
        <div className="disclaimer" style={{backgroundColor: "var(--vscode-editorWarning-background, #cca700)", color: "var(--vscode-editorWarning-foreground, #000000)", padding: "8px", textAlign: "center", position: "relative", fontSize: "12px", fontWeight: "bold", marginBottom: "8px", borderRadius: "4px"}}>
            <span>Structure updated! Please restart the window (Developer: Reload Window) to apply changes.</span>
            <button onClick={dismissDisclaimer} style={{position: "absolute", right: "4px", top: "4px", background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold", padding: "4px"}}>X</button>
        </div>
      )}

      <div className="search-container">
        <div className="search-input-wrapper">
          <input 
            type="text" 
            placeholder="Search (e.g. Save, Ctrl+S)..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div id="shortcuts-container" className="shortcuts-container">
        {orderedCats.map(cat => (
          <CategoryGroup 
            key={cat}
            category={cat}
            shortcuts={shortcutsData[cat]}
            isPinned={pinnedCategories.includes(cat)}
            onTogglePin={() => togglePin(cat)}
            searchQuery={searchQuery}
            allCategories={orderedCats}
            onDragEnd={handleDragEnd}
          />
        ))}
        {orderedCats.length === 0 && <div id="no-results">No categories to display.</div>}
      </div>
    </div>
  );
}

function CategoryGroup({ category, shortcuts, isPinned, onTogglePin, searchQuery, allCategories, onDragEnd }) {
  const [isOpen, setIsOpen] = useState(true);
  const groupRef = useRef(null);

  // Fuzzy Search Logic (simplified for React)
  const filteredShortcuts = shortcuts.filter(sc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sc.command.toLowerCase().includes(q) || sc.keys.toLowerCase().includes(q);
  });

  if (filteredShortcuts.length === 0 && searchQuery) return null;

  // Drag and drop HTML5 logic
  const handleDragStart = (e) => {
    if (isPinned) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", category);
    if (groupRef.current) groupRef.current.classList.add('dragging');
  };

  const handleDragEndEvent = (e) => {
    if (groupRef.current) groupRef.current.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isPinned) return;
    if (groupRef.current) groupRef.current.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    if (groupRef.current) groupRef.current.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (groupRef.current) groupRef.current.classList.remove('drag-over');
    if (isPinned) return;
    
    const draggedCategory = e.dataTransfer.getData("text/plain");
    if (draggedCategory && draggedCategory !== category) {
      // Reorder logic
      const newOrder = [...allCategories];
      const fromIdx = newOrder.indexOf(draggedCategory);
      const toIdx = newOrder.indexOf(category);
      if (fromIdx > -1 && toIdx > -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, draggedCategory);
        onDragEnd(newOrder);
      }
    }
  };

  return (
    <details 
      className={`category-group ${isPinned ? 'pinned' : ''}`} 
      open={searchQuery ? true : isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
      ref={groupRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <summary 
        className="category draggable" 
        draggable={!isPinned} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEndEvent}
      >
        <span className="category-title-text">{category}</span>
        <div className={`reorder-controls ${isPinned ? 'always-visible' : ''}`}>
          <button className={`reorder-btn ${isPinned ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(); }} title="Pin to top">
            {isPinned ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 6.31V7H2v-.69L4.12 4.19V1h4.76v3.19L11 6.31zM6 14.5v-6.62h1v6.62l-.5.5-.5-.5z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11.16 6.31l-.22-.3-2.61-2.6L8 3.19V1L7.5.5h-2L5 1v2.19l-.31.22-2.6 2.6-.21.31v1.64h3.62v6.62L6 15h1l.5-.5.5.5h1l.5-.5v-6.62h3.66V6.31zm-1 .69H3V6l2.12-2.12V1h2.76v2.88L10.16 6v1z"/></svg>
            )}
          </button>
        </div>
      </summary>
      
      {filteredShortcuts.map((sc, i) => (
        <div className="shortcut-item" key={i}>
          <div className="shortcut-keys">{sc.keys}</div>
          <div className="shortcut-command" title={sc.command}>
            {sc.command.split('.').pop()}
          </div>
        </div>
      ))}
    </details>
  );
}
