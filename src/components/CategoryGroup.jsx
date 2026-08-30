import { useState } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

export function CategoryGroup({ category, shortcuts, isPinned, onTogglePin, searchQuery, allCategories, onDragEnd }) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    groupRef,
    handleDragStart,
    handleDragEndEvent,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop(category, isPinned, allCategories, onDragEnd);

  const filteredShortcuts = shortcuts.filter(sc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return sc.command.toLowerCase().includes(q) || sc.keys.toLowerCase().includes(q);
  });

  if (filteredShortcuts.length === 0 && searchQuery) return null;

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
          <span className="shortcut-keys">{sc.keys}</span>
          <span className="shortcut-command">{sc.command}</span>
        </div>
      ))}
    </details>
  );
}
