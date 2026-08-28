import { useState } from 'react';
import { useVsCodeData } from './hooks/useVsCodeData';
import { CategoryGroup } from './components/CategoryGroup';
import './App.scss';

export default function App() {
  const {
    shortcutsData,
    pinnedCategories,
    showDisclaimer,
    handleDragEnd,
    togglePin,
    dismissDisclaimer,
    orderedCats
  } = useVsCodeData();

  const [searchQuery, setSearchQuery] = useState("");

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
