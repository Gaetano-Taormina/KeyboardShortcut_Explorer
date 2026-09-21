import { useState, useDeferredValue } from 'react';
import { useVsCodeData } from './hooks/useVsCodeData';
import { CategoryGroup } from './components/CategoryGroup';
import { ExtensionsMenu } from './components/ExtensionsMenu';
import { ReorderGrid } from './components/ReorderGrid';
import './App.css';

export default function App() {
  const {
    shortcutsData,
    pinnedCategories,
    showDisclaimer,
    handleDragEnd,
    togglePin,
    dismissDisclaimer,
    dismissGridTutorial,
    showGridTutorial,
    orderedCats,
    isSearchVisible,
    isCustomMenuVisible,
    isReorderMode,
    setIsCustomMenuVisible,
    availableExtensions,
    hiddenExtensions,
    toggleExtensionVisibility
  } = useVsCodeData();

  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  return (
    <div className="app-container">
      {showDisclaimer && (
        <div className="disclaimer" role="alert">
          <span>Structure updated! Please restart the window (Developer: Reload Window) to apply changes.</span>
          <button 
            className="disclaimer-close" 
            onClick={dismissDisclaimer}
            title="Dismiss notification"
            aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}

      {isCustomMenuVisible && (
        <ExtensionsMenu 
          availableExtensions={availableExtensions}
          hiddenExtensions={hiddenExtensions}
          onToggleExtension={toggleExtensionVisibility}
          onClose={() => setIsCustomMenuVisible(false)}
        />
      )}

      {isSearchVisible && (
        <div className="search-container">
          <div className="search-input-wrapper">
            <input 
              type="text" 
              placeholder="Search (e.g. Save, Ctrl+S)..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Search keyboard shortcuts"
            />
          </div>
        </div>
      )}

      {isReorderMode ? (
        <ReorderGrid 
          categories={orderedCats}
          pinnedCategories={pinnedCategories}
          onTogglePin={togglePin}
          onDragEnd={handleDragEnd}
          showGridTutorial={showGridTutorial}
          dismissGridTutorial={dismissGridTutorial}
        />
      ) : (
        <div id="shortcuts-container" className="shortcuts-container" role="list">
          {orderedCats.map(cat => (
            <CategoryGroup 
              key={cat}
              category={cat}
              shortcuts={shortcutsData[cat]}
              isPinned={pinnedCategories.includes(cat)}
              onTogglePin={togglePin}
              searchQuery={deferredSearchQuery}
              allCategories={orderedCats}
              onDragEnd={handleDragEnd}
            />
          ))}
          {orderedCats.length === 0 && <div id="no-results" role="status">No categories to display.</div>}
        </div>
      )}
    </div>
  );
}
