import { useState, useEffect } from 'react';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : { postMessage: () => {} };

export function useVsCodeData() {
  const [shortcutsData, setShortcutsData] = useState({});
  const [hiddenExtensions, setHiddenExtensions] = useState([]);
  const [pinnedCategories, setPinnedCategories] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [version, setVersion] = useState("1.0.0");

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === 'initData') {
        if (message.shortcutsData) setShortcutsData(message.shortcutsData);
        if (message.settings) {
          applySettingsVariables(message.settings);
        }
        if (message.hiddenExtensions) setHiddenExtensions(message.hiddenExtensions);
        if (message.pinnedCategories) setPinnedCategories(message.pinnedCategories);
        if (message.categoryOrder) setCategoryOrder(message.categoryOrder);
        if (message.showDisclaimer !== undefined) setShowDisclaimer(message.showDisclaimer);
        if (message.version) setVersion(message.version);
      }
    };
    window.addEventListener('message', handleMessage);
    
    vscode.postMessage({ command: 'requestInitData' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

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

  return {
    shortcutsData,
    pinnedCategories,
    showDisclaimer,
    version,
    handleDragEnd,
    togglePin,
    dismissDisclaimer,
    orderedCats: getOrderedCategories()
  };
}
