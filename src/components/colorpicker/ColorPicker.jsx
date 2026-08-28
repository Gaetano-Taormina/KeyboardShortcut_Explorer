import { useState, useEffect } from 'react';
import './ColorPicker.scss'; // We'll add some basic styling

const vscode = window.acquireVsCodeApi ? window.acquireVsCodeApi() : { postMessage: () => {} };

export default function ColorPicker() {
  const [appearanceMode, setAppearanceMode] = useState('Native');
  const [colorProfile, setColorProfile] = useState('VS Code Native');
  
  const [textColor, setTextColor] = useState('#cccccc');
  const [titleBackgroundColor, setTitleBackgroundColor] = useState('#323232');
  const [keysBackgroundColor, setKeysBackgroundColor] = useState('#2b2b2b');
  const [bubbleColor, setBubbleColor] = useState('#252526');
  const [searchbarBackgroundColor, setSearchbarBackgroundColor] = useState('#3c3c3c');
  const [searchbarTextColor, setSearchbarTextColor] = useState('#cccccc');
  const [alternateRowColor, setAlternateRowColor] = useState('#82828233');

  useEffect(() => {
    // Listen for incoming messages from VS Code
    const handleMessage = (event) => {
      const message = event.data;
      if (message.command === 'loadSettings') {
        if (message.settings.appearanceMode) setAppearanceMode(message.settings.appearanceMode);
        if (message.settings.colorProfile) setColorProfile(message.settings.colorProfile);
        if (message.settings.textColor) setTextColor(message.settings.textColor);
        if (message.settings.titleBackgroundColor) setTitleBackgroundColor(message.settings.titleBackgroundColor);
        if (message.settings.keysBackgroundColor) setKeysBackgroundColor(message.settings.keysBackgroundColor);
        if (message.settings.bubbleColor) setBubbleColor(message.settings.bubbleColor);
        if (message.settings.searchbarBackgroundColor) setSearchbarBackgroundColor(message.settings.searchbarBackgroundColor);
        if (message.settings.searchbarTextColor) setSearchbarTextColor(message.settings.searchbarTextColor);
        if (message.settings.alternateRowColor) setAlternateRowColor(message.settings.alternateRowColor);
      }
    };
    window.addEventListener('message', handleMessage);
    
    // Request initial settings from VS Code
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

  return (
    <div className="dashboard">
      <div className="header">
          <h1>Color Theme Editor</h1>
          <p>Choose colors and theme for your interface. Changes are saved in real-time!</p>
      </div>
      
      <div className="section-title">Basic Settings</div>
      
      <div className="color-control">
          <label>General Theme (Appearance)</label>
          <div className="color-input-wrapper">
              <select 
                value={appearanceMode} 
                onChange={(e) => { setAppearanceMode(e.target.value); updateSetting('appearanceMode', e.target.value); }} 
                className="dropdown">
                  <option value="Native">Native (Use VS Code Theme)</option>
                  <option value="Dark">Force Dark</option>
                  <option value="Light">Force Light</option>
                  <option value="High Contrast">Force High Contrast</option>
              </select>
          </div>
      </div>
      
      <div className="color-control">
          <label>Color Profile (Profile)</label>
          <div className="color-input-wrapper">
              <select 
                value={colorProfile} 
                onChange={(e) => { setColorProfile(e.target.value); updateSetting('colorProfile', e.target.value); }} 
                className="dropdown">
                  <option value="VS Code Native">VS Code Native</option>
                  <option value="Alternative 1">Alternative 1</option>
                  <option value="Alternative 2">Alternative 2</option>
                  <option value="Custom">Custom (Use Manual Colors)</option>
              </select>
          </div>
      </div>

      <div className="section-title">Custom Colors</div>
      
      <ColorControl label="Text Color" value={textColor} onChange={(v) => { setTextColor(v); updateSetting('textColor', v); }} />
      <ColorControl label="Category Titles" value={titleBackgroundColor} onChange={(v) => { setTitleBackgroundColor(v); updateSetting('titleBackgroundColor', v); }} />
      <ColorControl label="Shortcut Keys Background" value={keysBackgroundColor} onChange={(v) => { setKeysBackgroundColor(v); updateSetting('keysBackgroundColor', v); }} />
      <ColorControl label="Main Background (Bubble)" value={bubbleColor} onChange={(v) => { setBubbleColor(v); updateSetting('bubbleColor', v); }} />
      <ColorControl label="Search Bar Background" value={searchbarBackgroundColor} onChange={(v) => { setSearchbarBackgroundColor(v); updateSetting('searchbarBackgroundColor', v); }} />
      <ColorControl label="Search Bar Text" value={searchbarTextColor} onChange={(v) => { setSearchbarTextColor(v); updateSetting('searchbarTextColor', v); }} />
      
      <div className="color-control full-width">
          <label>Alternate Row Color (Requires Checkbox in Settings)</label>
          <div className="color-input-wrapper">
              <input 
                type="text" 
                value={alternateRowColor} 
                onChange={(e) => { setAlternateRowColor(e.target.value); updateSetting('alternateRowColor', e.target.value); }} 
                className="hex-display" 
                placeholder="#RRGGBBAA" />
          </div>
      </div>
    </div>
  );
}

function ColorControl({ label, value, onChange }) {
  const hex6 = value && value.length > 7 ? value.substring(0, 7) : value;
  
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
