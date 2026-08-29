import { useDragAndDrop } from '../hooks/useDragAndDrop';

function GridItem({ category, allCategories, isPinned, onTogglePin, onDragEnd }) {
    const {
        groupRef,
        handleDragStart,
        handleDragEndEvent,
        handleDragOver,
        handleDragLeave,
        handleDrop
    } = useDragAndDrop(category, isPinned, allCategories, onDragEnd);

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
        >
            <div className="grid-item-content">
                <span className="grid-item-title">{category}</span>
            </div>
            <button className={`grid-pin-btn ${isPinned ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(); }} title="Pin to top">
                {isPinned ? (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11 6.31V7H2v-.69L4.12 4.19V1h4.76v3.19L11 6.31zM6 14.5v-6.62h1v6.62l-.5.5-.5-.5z"/></svg>
                ) : (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M11.16 6.31l-.22-.3-2.61-2.6L8 3.19V1L7.5.5h-2L5 1v2.19l-.31.22-2.6 2.6-.21.31v1.64h3.62v6.62L6 15h1l.5-.5.5.5h1l.5-.5v-6.62h3.66V6.31zm-1 .69H3V6l2.12-2.12V1h2.76v2.88L10.16 6v1z"/></svg>
                )}
            </button>
        </div>
    );
}

export function ReorderGrid({ categories, pinnedCategories, onTogglePin, onDragEnd, showGridTutorial, dismissGridTutorial }) {
    return (
        <div className="reorder-grid-container">
            {showGridTutorial && (
                <div className="reorder-grid-header" style={{position: 'relative'}}>
                    <button 
                        onClick={dismissGridTutorial} 
                        style={{position: "absolute", right: "0", top: "0", background: "transparent", border: "none", color: "inherit", cursor: "pointer", padding: "4px", fontWeight: "bold"}}
                        title="Dismiss tutorial"
                    >X</button>
                    <h3>Grid Reorder Mode</h3>
                    <p>Drag and drop the tiles to reorder categories. Pinned categories remain at the top.</p>
                </div>
            )}
            <div className="reorder-grid">
                {categories.map(cat => (
                    <GridItem 
                        key={cat}
                        category={cat}
                        allCategories={categories}
                        isPinned={pinnedCategories.includes(cat)}
                        onTogglePin={() => onTogglePin(cat)}
                        onDragEnd={onDragEnd}
                    />
                ))}
            </div>
        </div>
    );
}
