import { useState, useEffect } from 'react';
import { getPresetPalette, getModeSlotKey } from '../constants/themePresets';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : { postMessage: () => {} };

export function useVsCodeData() {
  const [shortcutsData, setShortcutsData] = useState({});
  const [hiddenExtensions, setHiddenExtensions] = useState([]);
  const [pinnedCategories, setPinnedCategories] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [version, setVersion] = useState("1.0.0");
  const [availableExtensions, setAvailableExtensions] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [isCustomMenuVisible, setIsCustomMenuVisible] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showGridTutorial, setShowGridTutorial] = useState(true);

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
        if (message.showGridTutorial !== undefined) setShowGridTutorial(message.showGridTutorial);
        if (message.version) setVersion(message.version);
        if (message.availableExtensions) setAvailableExtensions(message.availableExtensions);
      } else if (message.command === 'toggleSearch') {
        setIsSearchVisible(prev => !prev);
      } else if (message.command === 'toggleCustomMenu') {
        setIsCustomMenuVisible(prev => !prev);
      } else if (message.command === 'toggleReorderMode') {
        setIsReorderMode(prev => !prev);
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
    
    // Apply Appearance Mode
    document.body.classList.remove('theme-force-dark', 'theme-force-light', 'theme-force-hc');
    if (s.appearanceMode === 'Dark') {
        document.body.classList.add('theme-force-dark');
    } else if (s.appearanceMode === 'Light') {
        document.body.classList.add('theme-force-light');
    } else if (s.appearanceMode === 'High Contrast') {
        document.body.classList.add('theme-force-hc');
    }

    // Always clean potential overridden VS Code internal variables on :root
    document.documentElement.style.removeProperty('--vscode-textPreformat-foreground');
    // Clean all custom inline properties so defaults/rules apply cleanly
    document.documentElement.style.removeProperty('--setting-text-color');
    document.documentElement.style.removeProperty('--setting-title-bg');
    document.documentElement.style.removeProperty('--setting-title-color');
    document.documentElement.style.removeProperty('--setting-keys-bg');
    document.documentElement.style.removeProperty('--setting-keys-color');
    document.documentElement.style.removeProperty('--setting-bubble-color');
    document.documentElement.style.removeProperty('--setting-searchbar-bg');
    document.documentElement.style.removeProperty('--setting-searchbar-text');
    document.documentElement.style.removeProperty('--setting-alternate-row-color');
    document.documentElement.style.removeProperty('--setting-scrollbar-color');

    // Apply Color Profiles
    if (s.colorProfile === "Custom") {
        const slotKey = getModeSlotKey(s.appearanceMode);
        const customSlot = (s.customThemes && s.customThemes[slotKey]) || {};

        const textColor = customSlot.textColor || s.textColor;
        const titleBg = customSlot.titleBackgroundColor || s.titleBackgroundColor;
        const titleColor = customSlot.titleColor || customSlot.textColor || s.textColor;
        const keysBg = customSlot.keysBackgroundColor || s.keysBackgroundColor;
        const keysColor = customSlot.keysColor || customSlot.textColor || s.textColor;
        const bubbleColor = customSlot.bubbleColor || s.bubbleColor;
        const searchbarBg = customSlot.searchbarBackgroundColor || s.searchbarBackgroundColor;
        const searchbarText = customSlot.searchbarTextColor || s.searchbarTextColor;
        const alternateRowColor = customSlot.alternateRowColor || s.alternateRowColor;
        const scrollbarColor = customSlot.scrollbarColor || s.scrollbarColor;

        if (textColor) document.documentElement.style.setProperty('--setting-text-color', textColor);
        if (titleBg) document.documentElement.style.setProperty('--setting-title-bg', titleBg);
        if (titleColor) document.documentElement.style.setProperty('--setting-title-color', titleColor);
        if (keysBg) document.documentElement.style.setProperty('--setting-keys-bg', keysBg);
        if (keysColor) document.documentElement.style.setProperty('--setting-keys-color', keysColor);
        if (bubbleColor) document.documentElement.style.setProperty('--setting-bubble-color', bubbleColor);
        if (searchbarBg) document.documentElement.style.setProperty('--setting-searchbar-bg', searchbarBg);
        if (searchbarText) document.documentElement.style.setProperty('--setting-searchbar-text', searchbarText);
        if (alternateRowColor) document.documentElement.style.setProperty('--setting-alternate-row-color', alternateRowColor);
        if (scrollbarColor) document.documentElement.style.setProperty('--setting-scrollbar-color', scrollbarColor);
    } else if (s.colorProfile === "Alternative 1" || s.colorProfile === "Alternative 2") {
        const palette = getPresetPalette(s.appearanceMode, s.colorProfile);
        if (palette) {
            if (palette.textColor) document.documentElement.style.setProperty('--setting-text-color', palette.textColor);
            if (palette.titleBackgroundColor) document.documentElement.style.setProperty('--setting-title-bg', palette.titleBackgroundColor);
            if (palette.titleColor) document.documentElement.style.setProperty('--setting-title-color', palette.titleColor);
            if (palette.keysBackgroundColor) document.documentElement.style.setProperty('--setting-keys-bg', palette.keysBackgroundColor);
            if (palette.keysColor) document.documentElement.style.setProperty('--setting-keys-color', palette.keysColor);
            if (palette.bubbleColor) document.documentElement.style.setProperty('--setting-bubble-color', palette.bubbleColor);
            if (palette.searchbarBackgroundColor) document.documentElement.style.setProperty('--setting-searchbar-bg', palette.searchbarBackgroundColor);
            if (palette.searchbarTextColor) document.documentElement.style.setProperty('--setting-searchbar-text', palette.searchbarTextColor);
            if (palette.alternateRowColor) document.documentElement.style.setProperty('--setting-alternate-row-color', palette.alternateRowColor);
            if (palette.scrollbarColor) document.documentElement.style.setProperty('--setting-scrollbar-color', palette.scrollbarColor);
        }
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

  const dismissGridTutorial = () => {
    setShowGridTutorial(false);
    vscode.postMessage({ command: 'dismissGridTutorial' });
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
    dismissGridTutorial,
    showGridTutorial,
    orderedCats: getOrderedCategories(),
    isSearchVisible,
    isCustomMenuVisible,
    isReorderMode,
    setIsCustomMenuVisible,
    availableExtensions,
    hiddenExtensions,
    toggleExtensionVisibility: (ext) => {
        let newHidden;
        if (hiddenExtensions.includes(ext)) {
            newHidden = hiddenExtensions.filter(e => e !== ext);
        } else {
            newHidden = [...hiddenExtensions, ext];
        }
        setHiddenExtensions(newHidden);
        vscode.postMessage({ command: 'updateHiddenExtensions', hiddenList: newHidden });
    }
  };
}
