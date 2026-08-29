export function ExtensionsMenu({ 
    availableExtensions, 
    hiddenExtensions, 
    onToggleExtension, 
    onClose 
}) {
    return (
        <>
            <div 
                style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999}} 
                onClick={onClose} 
            />
            <div id="custom-context-menu">
                <div style={{
                    padding: '4px 8px', 
                    fontSize: '11px', 
                    textTransform: 'uppercase', 
                    color: 'var(--vscode-descriptionForeground, #717171)', 
                    marginBottom: '4px',
                    borderBottom: '1px solid var(--vscode-menu-border, #454545)'
                }}>
                    Visible Categories
                </div>
                {availableExtensions.map(ext => {
                    const isVisible = !hiddenExtensions.includes(ext);
                    return (
                        <div 
                            key={ext} 
                            className="context-menu-item" 
                            onClick={() => onToggleExtension(ext)}
                        >
                            <div className="context-menu-check">
                                {isVisible && (
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"></path>
                                    </svg>
                                )}
                            </div>
                            <span>{ext}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
