import { useState, useEffect, useMemo, useCallback } from 'react';
import { getPresetPalette, getModeSlotKey } from '../constants/themePresets';
import { IPC_COMMANDS } from '../constants/ipcCommands';

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

  const applySettingsVariables = useCallback((s) => {
    const rootStyle = document.documentElement.style;
    const bodyClass = document.body.classList;

    rootStyle.setProperty('--setting-font-family', s.fontFamily);
    rootStyle.setProperty('--setting-font-size', `${s.fontSize}px`);
    rootStyle.setProperty('--setting-keys-font-size', `${s.keysFontSize}px`);
    rootStyle.setProperty('--setting-title-font-size', `${s.titleFontSize}px`);
    
    // Apply Appearance Mode
    bodyClass.remove('theme-force-dark', 'theme-force-light', 'theme-force-hc');
    if (s.appearanceMode === 'Dark') {
        bodyClass.add('theme-force-dark');
    } else if (s.appearanceMode === 'Light') {
        bodyClass.add('theme-force-light');
    } else if (s.appearanceMode === 'High Contrast') {
        bodyClass.add('theme-force-hc');
    }

    // Always clean potential overridden VS Code internal variables on :root
    rootStyle.removeProperty('--vscode-textPreformat-foreground');
    rootStyle.removeProperty('--setting-text-color');
    rootStyle.removeProperty('--setting-title-bg');
    rootStyle.removeProperty('--setting-title-color');
    rootStyle.removeProperty('--setting-keys-bg');
    rootStyle.removeProperty('--setting-keys-color');
    rootStyle.removeProperty('--setting-bubble-color');
    rootStyle.removeProperty('--setting-searchbar-bg');
    rootStyle.removeProperty('--setting-searchbar-text');
    rootStyle.removeProperty('--setting-alternate-row-color');
    rootStyle.removeProperty('--setting-scrollbar-color');

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

        if (textColor) rootStyle.setProperty('--setting-text-color', textColor);
        if (titleBg) rootStyle.setProperty('--setting-title-bg', titleBg);
        if (titleColor) rootStyle.setProperty('--setting-title-color', titleColor);
        if (keysBg) rootStyle.setProperty('--setting-keys-bg', keysBg);
        if (keysColor) rootStyle.setProperty('--setting-keys-color', keysColor);
        if (bubbleColor) rootStyle.setProperty('--setting-bubble-color', bubbleColor);
        if (searchbarBg) rootStyle.setProperty('--setting-searchbar-bg', searchbarBg);
        if (searchbarText) rootStyle.setProperty('--setting-searchbar-text', searchbarText);
        if (alternateRowColor) rootStyle.setProperty('--setting-alternate-row-color', alternateRowColor);
        if (scrollbarColor) rootStyle.setProperty('--setting-scrollbar-color', scrollbarColor);
    } else if (s.colorProfile === "Alternative 1" || s.colorProfile === "Alternative 2") {
        const palette = getPresetPalette(s.appearanceMode, s.colorProfile);
        if (palette) {
            if (palette.textColor) rootStyle.setProperty('--setting-text-color', palette.textColor);
            if (palette.titleBackgroundColor) rootStyle.setProperty('--setting-title-bg', palette.titleBackgroundColor);
            if (palette.titleColor) rootStyle.setProperty('--setting-title-color', palette.titleColor);
            if (palette.keysBackgroundColor) rootStyle.setProperty('--setting-keys-bg', palette.keysBackgroundColor);
            if (palette.keysColor) rootStyle.setProperty('--setting-keys-color', palette.keysColor);
            if (palette.bubbleColor) rootStyle.setProperty('--setting-bubble-color', palette.bubbleColor);
            if (palette.searchbarBackgroundColor) rootStyle.setProperty('--setting-searchbar-bg', palette.searchbarBackgroundColor);
            if (palette.searchbarTextColor) rootStyle.setProperty('--setting-searchbar-text', palette.searchbarTextColor);
            if (palette.alternateRowColor) rootStyle.setProperty('--setting-alternate-row-color', palette.alternateRowColor);
            if (palette.scrollbarColor) rootStyle.setProperty('--setting-scrollbar-color', palette.scrollbarColor);
        }
    }

    if (s.alternateRowColors) {
        bodyClass.add('use-zebra-stripes');
    } else {
        bodyClass.remove('use-zebra-stripes');
    }

    if (s.accessibilityMode) {
        bodyClass.add('dyslexia-mode');
        rootStyle.setProperty('--setting-dyslexia-font', s.dyslexiaFont);
        rootStyle.setProperty('--setting-dyslexia-spacing', s.dyslexiaLetterSpacing);
        if (s.dyslexiaBold) bodyClass.add('dyslexia-bold');
        else bodyClass.remove('dyslexia-bold');
    } else {
        bodyClass.remove('dyslexia-mode');
        bodyClass.remove('dyslexia-bold');
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === IPC_COMMANDS.INIT_DATA) {
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
      } else if (message.command === IPC_COMMANDS.TOGGLE_SEARCH) {
        setIsSearchVisible(prev => !prev);
      } else if (message.command === IPC_COMMANDS.TOGGLE_CUSTOM_MENU) {
        setIsCustomMenuVisible(prev => !prev);
      } else if (message.command === IPC_COMMANDS.TOGGLE_REORDER_MODE) {
        setIsReorderMode(prev => !prev);
      }
    };
    window.addEventListener('message', handleMessage);
    
    vscode.postMessage({ command: IPC_COMMANDS.REQUEST_INIT_DATA });

    return () => window.removeEventListener('message', handleMessage);
  }, [applySettingsVariables]);

  const handleDragEnd = useCallback((resultOrder) => {
    setCategoryOrder(resultOrder);
    vscode.postMessage({ command: IPC_COMMANDS.UPDATE_CATEGORY_ORDER, orderList: resultOrder });
  }, []);

  const togglePin = useCallback((catName) => {
    setPinnedCategories(prev => {
      const newPins = prev.includes(catName)
        ? prev.filter(c => c !== catName)
        : [...prev, catName];
      vscode.postMessage({ command: IPC_COMMANDS.UPDATE_PINNED_CATEGORIES, pinnedList: newPins });
      return newPins;
    });
  }, []);
  
  const dismissDisclaimer = useCallback(() => {
    setShowDisclaimer(false);
    vscode.postMessage({ command: IPC_COMMANDS.DISMISS_DISCLAIMER, version: version });
  }, [version]);

  const dismissGridTutorial = useCallback(() => {
    setShowGridTutorial(false);
    vscode.postMessage({ command: IPC_COMMANDS.DISMISS_GRID_TUTORIAL });
  }, []);

  const toggleExtensionVisibility = useCallback((ext) => {
    setHiddenExtensions(prev => {
      const newHidden = prev.includes(ext)
        ? prev.filter(e => e !== ext)
        : [...prev, ext];
      vscode.postMessage({ command: IPC_COMMANDS.UPDATE_HIDDEN_EXTENSIONS, hiddenList: newHidden });
      return newHidden;
    });
  }, []);

  const orderedCats = useMemo(() => {
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
  }, [shortcutsData, hiddenExtensions, pinnedCategories, categoryOrder]);

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
    orderedCats,
    isSearchVisible,
    isCustomMenuVisible,
    isReorderMode,
    setIsCustomMenuVisible,
    availableExtensions,
    hiddenExtensions,
    toggleExtensionVisibility
  };
}
