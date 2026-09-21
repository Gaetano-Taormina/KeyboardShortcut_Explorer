import { useState, useMemo, memo, useCallback } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { PinIcon } from './common/Icons';

const labelCache = new Map();

export function formatCommandLabel(rawCommand) {
  if (!rawCommand) return '';
  if (labelCache.has(rawCommand)) {
    return labelCache.get(rawCommand);
  }
  if (rawCommand.includes(' ') && !rawCommand.includes('.')) {
    labelCache.set(rawCommand, rawCommand);
    return rawCommand;
  }

  // Strip technical namespace prefixes (e.g. extension., workbench.action., editor.action., quokka.)
  let clean = rawCommand
    .replace(/^extension\./i, '')
    .replace(/^(workbench|editor)\.action\./i, '')
    .replace(/^[a-zA-Z0-9_-]+\.(action\.)?/i, '');

  if (!clean) {
    const parts = rawCommand.split('.');
    clean = parts[parts.length - 1] || rawCommand;
  }

  clean = clean.replace(/^[._]+/, '');

  // Convert camelCase, PascalCase, snake_case or dot notation to readable title
  const formatted = clean
    .replace(/[-_.]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  labelCache.set(rawCommand, formatted);
  return formatted;
}

export const CategoryGroup = memo(function CategoryGroup({ 
  category, 
  shortcuts = [], 
  isPinned, 
  onTogglePin, 
  searchQuery, 
  allCategories, 
  onDragEnd 
}) {
  const [isOpen, setIsOpen] = useState(true);

  const {
    groupRef,
    handleDragStart,
    handleDragEndEvent,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop(category, isPinned, allCategories, onDragEnd);

  const handlePinClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onTogglePin === 'function') {
      onTogglePin(category);
    }
  }, [onTogglePin, category]);

  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return shortcuts;
    const q = searchQuery.toLowerCase().trim();
    return shortcuts.filter(sc => {
      const formatted = formatCommandLabel(sc.command).toLowerCase();
      return (
        sc.command.toLowerCase().includes(q) ||
        formatted.includes(q) ||
        (sc.keys && sc.keys.toLowerCase().includes(q))
      );
    });
  }, [shortcuts, searchQuery]);

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
      role="listitem"
    >
      <summary 
        className="category draggable" 
        draggable={!isPinned} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEndEvent}
        aria-label={`${category} category`}
      >
        <span className="category-title-text">{category}</span>
        <div className={`reorder-controls ${isPinned ? 'always-visible' : ''}`}>
          <button 
            className={`reorder-btn ${isPinned ? 'active' : ''}`} 
            onClick={handlePinClick} 
            title={isPinned ? "Unpin category" : "Pin category to top"}
            aria-label={isPinned ? `Unpin ${category}` : `Pin ${category} to top`}
          >
            <PinIcon active={isPinned} size={14} />
          </button>
        </div>
      </summary>
      
      {filteredShortcuts.map((sc, i) => {
        const keyParts = sc.keys ? sc.keys.trim().split(/\s+/) : [];
        const label = formatCommandLabel(sc.command);
        return (
          <div className="shortcut-item" key={sc.command || i}>
            <span className="shortcut-command" title={`${label} (${sc.command})`}>{label}</span>
            <div className="shortcut-keys-wrapper" title={sc.keys} aria-label={`Shortcut: ${sc.keys}`}>
              {keyParts.map((part, pIdx) => (
                <span className="shortcut-keys" key={pIdx}>{part}</span>
              ))}
            </div>
          </div>
        );
      })}
    </details>
  );
});
