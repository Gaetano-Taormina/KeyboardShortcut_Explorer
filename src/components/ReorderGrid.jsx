import { useCallback, memo } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { PinIcon } from './common/Icons';

const GridItem = memo(function GridItem({ category, allCategories, isPinned, onTogglePin, onDragEnd }) {
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

    return (
        <div 
            ref={groupRef}
            className={`grid-item ${isPinned ? 'pinned' : ''}`}
            draggable={!isPinned}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndEvent}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            title={category}
            role="gridcell"
            aria-label={`${category} ${isPinned ? '(pinned)' : ''}`}
            tabIndex={0}
        >
            <div className="grid-item-content">
                <span className="grid-item-title">{category}</span>
            </div>
            <button 
                className={`grid-pin-btn ${isPinned ? 'active' : ''}`} 
                onClick={handlePinClick} 
                title={isPinned ? "Unpin category" : "Pin category to top"}
                aria-label={isPinned ? `Unpin ${category}` : `Pin ${category} to top`}
            >
                <PinIcon active={isPinned} size={12} />
            </button>
        </div>
    );
});

export function ReorderGrid({ categories, pinnedCategories, onTogglePin, onDragEnd, showGridTutorial, dismissGridTutorial }) {
    return (
        <div className="reorder-grid-container" role="region" aria-label="Reorder categories grid">
            {showGridTutorial && (
                <div className="reorder-grid-header" style={{position: 'relative'}} role="note">
                    <button 
                        onClick={dismissGridTutorial} 
                        style={{position: "absolute", right: "0", top: "0", background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "4px", fontWeight: "bold"}}
                        title="Dismiss tutorial"
                        aria-label="Dismiss tutorial"
                    >
                        ×
                    </button>
                    <h3>Grid Reorder Mode</h3>
                    <p>Drag and drop the tiles to reorder categories. Pinned categories remain at the top.</p>
                </div>
            )}
            <div className="reorder-grid" role="grid" aria-label="Categories">
                {categories.map(cat => (
                    <GridItem 
                        key={cat}
                        category={cat}
                        allCategories={categories}
                        isPinned={pinnedCategories.includes(cat)}
                        onTogglePin={onTogglePin}
                        onDragEnd={onDragEnd}
                    />
                ))}
            </div>
        </div>
    );
}
