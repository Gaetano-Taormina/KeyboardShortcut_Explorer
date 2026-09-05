import { useState, useEffect } from 'react';
import {
  getPresetPalette,
  getInitialCustomThemes,
  getModeSlotKey,
  normalizeProfileName
} from '../../constants/themePresets';
import './ColorPicker.scss';

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : { postMessage: () => {} };

export default function ColorPicker() {
  const [appearanceMode, setAppearanceMode] = useState('Native');
  const [colorProfile, setColorProfile] = useState('VS Code Native');
  const [customThemes, setCustomThemes] = useState(getInitialCustomThemes());

  const [textColor, setTextColor] = useState('#cccccc');
  const [titleBackgroundColor, setTitleBackgroundColor] = useState('#323232');
  const [keysBackgroundColor, setKeysBackgroundColor] = useState('#2b2b2b');
  const [bubbleColor, setBubbleColor] = useState('#252526');
  const [searchbarBackgroundColor, setSearchbarBackgroundColor] = useState('#3c3c3c');
  const [searchbarTextColor, setSearchbarTextColor] = useState('#cccccc');
  const [alternateRowColor, setAlternateRowColor] = useState('#82828233');

  const [savedStatus, setSavedStatus] = useState(false);

  // Helper to apply a palette to all 7 input state setters
  const applyPaletteToInputs = (palette) => {
    if (!palette) return;
    if (palette.textColor !== undefined) setTextColor(palette.textColor);
    if (palette.titleBackgroundColor !== undefined) setTitleBackgroundColor(palette.titleBackgroundColor);
    if (palette.keysBackgroundColor !== undefined) setKeysBackgroundColor(palette.keysBackgroundColor);
    if (palette.bubbleColor !== undefined) setBubbleColor(palette.bubbleColor);
    if (palette.searchbarBackgroundColor !== undefined) setSearchbarBackgroundColor(palette.searchbarBackgroundColor);
    if (palette.searchbarTextColor !== undefined) setSearchbarTextColor(palette.searchbarTextColor);
    if (palette.alternateRowColor !== undefined) setAlternateRowColor(palette.alternateRowColor);
  };

  useEffect(() => {
    // Listen for incoming messages from VS Code
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === 'loadSettings') {
        const appMode = message.settings.appearanceMode || 'Native';
        const colProf = message.settings.colorProfile || 'VS Code Native';
        const initialDefaults = getInitialCustomThemes();
        const mergedCustomThemes = {
          ...initialDefaults,
          ...message.settings.customThemes
        };

        setAppearanceMode(appMode);
        setColorProfile(colProf);
        setCustomThemes(mergedCustomThemes);

        const slotKey = getModeSlotKey(appMode);

        if (colProf === 'Custom') {
          const currentSlot = mergedCustomThemes[slotKey] || initialDefaults[slotKey];
          // If individual overrides exist in settings root, merge them
          const activeCustomColors = {
            ...currentSlot,
            ...(message.settings.textColor ? { textColor: message.settings.textColor } : {}),
            ...(message.settings.titleBackgroundColor ? { titleBackgroundColor: message.settings.titleBackgroundColor } : {}),
            ...(message.settings.keysBackgroundColor ? { keysBackgroundColor: message.settings.keysBackgroundColor } : {}),
            ...(message.settings.bubbleColor ? { bubbleColor: message.settings.bubbleColor } : {}),
            ...(message.settings.searchbarBackgroundColor ? { searchbarBackgroundColor: message.settings.searchbarBackgroundColor } : {}),
            ...(message.settings.searchbarTextColor ? { searchbarTextColor: message.settings.searchbarTextColor } : {}),
            ...(message.settings.alternateRowColor ? { alternateRowColor: message.settings.alternateRowColor } : {})
          };
          applyPaletteToInputs(activeCustomColors);
        } else {
          // Pre-fill inputs from the isolated preset file
          const preset = getPresetPalette(appMode, colProf);
          applyPaletteToInputs(preset);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    vscode.postMessage({ command: 'requestSettings' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const updateSetting = (key, value) => {
    vscode.postMessage({
      command: 'updateSetting',
      key: key,
      value: value
    });
  };

  const handleAppearanceChange = (newMode) => {
    setAppearanceMode(newMode);
    updateSetting('appearanceMode', newMode);

    const slotKey = getModeSlotKey(newMode);

    if (colorProfile === 'Custom') {
      const activeSlot = customThemes[slotKey] || getPresetPalette(newMode, 'Default');
      applyPaletteToInputs(activeSlot);
    } else {
      const preset = getPresetPalette(newMode, colorProfile);
      applyPaletteToInputs(preset);
    }
  };

  const handleProfileChange = (newProfile) => {
    setColorProfile(newProfile);
    updateSetting('colorProfile', newProfile);

    if (newProfile === 'Custom') {
      const slotKey = getModeSlotKey(appearanceMode);
      const activeSlot = customThemes[slotKey] || getPresetPalette(appearanceMode, 'Default');
      applyPaletteToInputs(activeSlot);
    } else {
      const preset = getPresetPalette(appearanceMode, newProfile);
      applyPaletteToInputs(preset);
    }
  };

  const handleCustomColorChange = (key, value, setter) => {
    setter(value);

    const slotKey = getModeSlotKey(appearanceMode);
    const updatedSlot = {
      ...(customThemes[slotKey] || getPresetPalette(appearanceMode, 'Default')),
      [key]: value
    };

    const updatedCustomThemes = {
      ...customThemes,
      [slotKey]: updatedSlot
    };

    setCustomThemes(updatedCustomThemes);

    if (colorProfile !== 'Custom') {
      setColorProfile('Custom');
      updateSetting('colorProfile', 'Custom');
    }

    updateSetting(key, value);
    updateSetting('customThemes', updatedCustomThemes);
  };

  const handleCustomizeClick = () => {
    const slotKey = getModeSlotKey(appearanceMode);
    const updatedCustomThemes = {
      ...customThemes,
      [slotKey]: {
        ...customThemes[slotKey],
        textColor,
        titleBackgroundColor,
        keysBackgroundColor,
        bubbleColor,
        searchbarBackgroundColor,
        searchbarTextColor,
        alternateRowColor
      }
    };

    setCustomThemes(updatedCustomThemes);
    setColorProfile('Custom');
    updateSetting('colorProfile', 'Custom');
    updateSetting('customThemes', updatedCustomThemes);
  };

  const handleSaveTheme = () => {
    const slotKey = getModeSlotKey(appearanceMode);
    const activeSlot = {
      textColor,
      titleBackgroundColor,
      keysBackgroundColor,
      bubbleColor,
      searchbarBackgroundColor,
      searchbarTextColor,
      alternateRowColor
    };

    const updatedCustomThemes = {
      ...customThemes,
      [slotKey]: activeSlot
    };

    setCustomThemes(updatedCustomThemes);

    vscode.postMessage({
      command: 'saveSettings',
      customThemes: updatedCustomThemes,
      settings: {
        appearanceMode,
        colorProfile,
        textColor,
        titleBackgroundColor,
        keysBackgroundColor,
        bubbleColor,
        searchbarBackgroundColor,
        searchbarTextColor,
        alternateRowColor
      }
    });

    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultCustoms = getInitialCustomThemes();
    setAppearanceMode('Native');
    setColorProfile('VS Code Native');
    setCustomThemes(defaultCustoms);

    const defaultPreset = getPresetPalette('Native', 'Default');
    applyPaletteToInputs(defaultPreset);

    vscode.postMessage({ command: 'resetDefaults' });
  };

  const isNativeAppearance = appearanceMode === 'Native';
  const isCustomMode = colorProfile === 'Custom';

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Color Theme Editor</h1>
        <p>Customize your workspace appearance and color profiles in real-time.</p>
      </div>

      <div className="section-title">General Theme (Appearance)</div>

      <div className="color-control full-width">
        <label>Appearance Mode</label>
        <div className="color-input-wrapper">
          <select
            value={appearanceMode}
            onChange={(e) => handleAppearanceChange(e.target.value)}
            className="dropdown">
            <option value="Native">Native (Use VS Code Theme)</option>
            <option value="Dark">Force Dark</option>
            <option value="Light">Force Light</option>
            <option value="High Contrast">Force High Contrast</option>
          </select>
        </div>
      </div>

      <div className="section-title">Color Profile</div>

      <div className="color-control full-width">
        <label>Active Color Profile</label>
        <div className="color-input-wrapper">
          <select
            value={colorProfile}
            onChange={(e) => handleProfileChange(e.target.value)}
            className="dropdown">
            {isNativeAppearance ? (
              <option value="VS Code Native">Default Theme (VS Code Native)</option>
            ) : (
              <option value="VS Code Native">Default Theme ({appearanceMode})</option>
            )}
            <option value="Alternative 1">Alternative 1 (Modern Accent)</option>
            <option value="Alternative 2">Alternative 2 (Subtle Slate)</option>
            <option value="Custom">Custom (Manual Colors)</option>
          </select>
        </div>
      </div>

      <div className="profile-status-box full-width">
        {isCustomMode ? (
          <div className="status-badge custom">
            <div className="badge-text-wrapper">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="badge-icon">
                <path d="M12.85 4.15l-1-1a1 1 0 0 0-1.42 0l-7.5 7.5a1 1 0 0 0-.27.48l-.64 2.24a.5.5 0 0 0 .61.61l2.24-.64a1 1 0 0 0 .48-.27l7.5-7.5a1 1 0 0 0 0-1.42zm-8.2 7.79l-.36-1.25.89.89-1.25-.36 1.43-1.43.71.71-1.42 1.44zm7.5-7.5l-6.09 6.09-.71-.71 6.09-6.09.71.71z"/>
              </svg>
              <span>Custom mode active: your custom colors decorate the interface on top of <strong>{appearanceMode}</strong> mode.</span>
            </div>
          </div>
        ) : (
          <div className="status-badge preset">
            <div className="badge-text-wrapper">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="badge-icon">
                <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8c0 2.05.93 3.89 2.41 5.12.35.29.59.71.59 1.18 0 .66.54 1.2 1.2 1.2h1.3c.55 0 1-.45 1-1v-.5c0-.83.67-1.5 1.5-1.5h1.5c2.49 0 4.5-2.01 4.5-4.5 0-4.14-3.36-7.5-7.5-7.5zm-3.5 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2-3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm2.5 3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span>Active preset: <strong>{isNativeAppearance ? colorProfile : (normalizeProfileName(colorProfile) === 'Default' ? `Default ${appearanceMode}` : colorProfile)}</strong>. The colors below are pre-filled from this style.</span>
            </div>
            <button
              type="button"
              className="action-btn switch-btn"
              onClick={handleCustomizeClick}>
              Customize Colors
            </button>
          </div>
        )}
      </div>

      <div className="section-title">
        Custom Colors {isCustomMode ? '(Active)' : `(Pre-filled from ${appearanceMode} - edit any color to customize)`}
      </div>

      <ColorControl
        label="Text Color"
        value={textColor}
        onChange={(v) => handleCustomColorChange('textColor', v, setTextColor)}
      />
      <ColorControl
        label="Category Titles Background"
        value={titleBackgroundColor}
        onChange={(v) => handleCustomColorChange('titleBackgroundColor', v, setTitleBackgroundColor)}
      />
      <ColorControl
        label="Shortcut Keys Background"
        value={keysBackgroundColor}
        onChange={(v) => handleCustomColorChange('keysBackgroundColor', v, setKeysBackgroundColor)}
      />
      <ColorControl
        label="Main Bubble Background"
        value={bubbleColor}
        onChange={(v) => handleCustomColorChange('bubbleColor', v, setBubbleColor)}
      />
      <ColorControl
        label="Search Bar Background"
        value={searchbarBackgroundColor}
        onChange={(v) => handleCustomColorChange('searchbarBackgroundColor', v, setSearchbarBackgroundColor)}
      />
      <ColorControl
        label="Search Bar Text Color"
        value={searchbarTextColor}
        onChange={(v) => handleCustomColorChange('searchbarTextColor', v, setSearchbarTextColor)}
      />

      <div className="color-control full-width">
        <label>Alternate Row Color (Zebra Stripes Hex/Alpha)</label>
        <div className="color-input-wrapper">
          <input
            type="text"
            value={alternateRowColor}
            onChange={(e) => handleCustomColorChange('alternateRowColor', e.target.value, setAlternateRowColor)}
            className="hex-display"
            placeholder="#RRGGBBAA"
          />
        </div>
      </div>

      <div className="footer-actions full-width">
        <button
          type="button"
          className="action-btn reset-btn"
          onClick={handleResetDefaults}>
          Reset All to Defaults
        </button>

        <button
          type="button"
          className={`action-btn save-btn ${savedStatus ? 'saved' : ''}`}
          onClick={handleSaveTheme}>
          {savedStatus ? (
            <span className="btn-content">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
              </svg>
              <span>Saved!</span>
            </span>
          ) : (
            <span className="btn-content">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.85 4.15l-2-2A.5.5 0 0 0 11.5 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4.5a.5.5 0 0 0-.15-.35zM4 3h7v3H4V3zm8 10H4V9h8v4zm1-1.5V6.85L11.15 4H12v8h1z"/>
              </svg>
              <span>Save Changes</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function ColorControl({ label, value, onChange }) {
  const hex6 = value && value.length > 7 ? value.substring(0, 7) : (value || '#000000');

  return (
    <div className="color-control">
      <label>{label}</label>
      <div className="color-input-wrapper">
        <input
          type="color"
          value={hex6}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="hex-display"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
