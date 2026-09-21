import { CheckIcon } from './common/Icons';

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
                aria-hidden="true"
            />
            <div id="custom-context-menu" role="menu" aria-label="Visible Categories Menu">
                <div style={{
                    padding: '4px 8px', 
                    fontSize: '11px', 
                    textTransform: 'uppercase', 
                    color: 'var(--vscode-descriptionForeground, #717171)', 
                    marginBottom: '4px',
                    borderBottom: '1px solid var(--vscode-menu-border, #454545)'
                }} role="presentation">
                    Visible Categories
                </div>
                {availableExtensions.map(ext => {
                    const isVisible = !hiddenExtensions.includes(ext);
                    return (
                        <div 
                            key={ext} 
                            className="context-menu-item" 
                            onClick={() => onToggleExtension(ext)}
                            role="menuitemcheckbox"
                            aria-checked={isVisible}
                            tabIndex={0}
                        >
                            <div className="context-menu-check">
                                {isVisible && <CheckIcon size={14} />}
                            </div>
                            <span>{ext}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
