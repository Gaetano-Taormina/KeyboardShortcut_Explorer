/**
 * Theme Presets and Alternative Color Profiles for KeyboardShortcut Explorer.
 * Contains 2 dedicated alternative variants for each Appearance Mode (Light, Dark, High Contrast, Native).
 */

export const THEME_PRESETS = {
  'Light': {
    'Default': {
      textColor: '#1e293b',
      titleBackgroundColor: '#e2e8f0',
      titleColor: '#0f172a',
      keysBackgroundColor: '#e2e8f0',
      keysColor: '#0f172a',
      bubbleColor: '#f1f3f5',
      searchbarBackgroundColor: '#ffffff',
      searchbarTextColor: '#0f172a',
      alternateRowColor: '#0000000a',
      scrollbarColor: 'rgba(0, 0, 0, 0.2)'
    },
    'Alternative 1': {
      // Light Variant 1: Sapphire Blue Accent
      textColor: '#1e293b',
      titleBackgroundColor: '#2563eb',
      titleColor: '#ffffff',
      keysBackgroundColor: '#dbeafe',
      keysColor: '#1e40af',
      bubbleColor: '#f8fafc',
      searchbarBackgroundColor: '#ffffff',
      searchbarTextColor: '#0f172a',
      alternateRowColor: 'rgba(37, 99, 235, 0.08)',
      scrollbarColor: 'rgba(37, 99, 235, 0.4)'
    },
    'Alternative 2': {
      // Light Variant 2: Minimalist Charcoal Slate
      textColor: '#334155',
      titleBackgroundColor: '#334155',
      titleColor: '#f8fafc',
      keysBackgroundColor: '#f1f5f9',
      keysColor: '#334155',
      bubbleColor: '#f8fafc',
      searchbarBackgroundColor: '#ffffff',
      searchbarTextColor: '#0f172a',
      alternateRowColor: 'rgba(0, 0, 0, 0.04)',
      scrollbarColor: 'rgba(51, 65, 85, 0.3)'
    }
  },
  'Dark': {
    'Default': {
      textColor: '#e4e4e7',
      titleBackgroundColor: '#27272a',
      titleColor: '#f4f4f5',
      keysBackgroundColor: '#27272a',
      keysColor: '#fbbf24',
      bubbleColor: '#18181b',
      searchbarBackgroundColor: '#27272a',
      searchbarTextColor: '#f4f4f5',
      alternateRowColor: 'rgba(255, 255, 255, 0.03)',
      scrollbarColor: 'rgba(121, 121, 121, 0.4)'
    },
    'Alternative 1': {
      // Dark Variant 1: Electric Cyber Blue
      textColor: '#f8fafc',
      titleBackgroundColor: '#1d4ed8',
      titleColor: '#ffffff',
      keysBackgroundColor: '#1e3a8a',
      keysColor: '#93c5fd',
      bubbleColor: '#0f172a',
      searchbarBackgroundColor: '#1e293b',
      searchbarTextColor: '#f8fafc',
      alternateRowColor: 'rgba(59, 130, 246, 0.08)',
      scrollbarColor: 'rgba(59, 130, 246, 0.4)'
    },
    'Alternative 2': {
      // Dark Variant 2: Emerald Obsidian
      textColor: '#ecfdf5',
      titleBackgroundColor: '#065f46',
      titleColor: '#ffffff',
      keysBackgroundColor: '#064e3b',
      keysColor: '#6ee7b7',
      bubbleColor: '#022c22',
      searchbarBackgroundColor: '#064e3b',
      searchbarTextColor: '#ecfdf5',
      alternateRowColor: 'rgba(16, 185, 129, 0.08)',
      scrollbarColor: 'rgba(16, 185, 129, 0.4)'
    }
  },
  'High Contrast': {
    'Default': {
      textColor: '#ffffff',
      titleBackgroundColor: '#000000',
      titleColor: '#ffffff',
      keysBackgroundColor: '#000000',
      keysColor: '#ffffff',
      bubbleColor: '#000000',
      searchbarBackgroundColor: '#000000',
      searchbarTextColor: '#ffffff',
      alternateRowColor: 'rgba(255, 255, 255, 0.15)',
      scrollbarColor: '#6fc1ff'
    },
    'Alternative 1': {
      // High Contrast Variant 1: Cyber Gold & Cyan
      textColor: '#00ffff',
      titleBackgroundColor: '#000080',
      titleColor: '#ffff00',
      keysBackgroundColor: '#000080',
      keysColor: '#00ffff',
      bubbleColor: '#000000',
      searchbarBackgroundColor: '#000000',
      searchbarTextColor: '#00ffff',
      alternateRowColor: 'rgba(0, 255, 255, 0.12)',
      scrollbarColor: '#00ffff'
    },
    'Alternative 2': {
      // High Contrast Variant 2: Pure Monochrome Inverted
      textColor: '#ffffff',
      titleBackgroundColor: '#262626',
      titleColor: '#ffffff',
      keysBackgroundColor: '#262626',
      keysColor: '#ffffff',
      bubbleColor: '#000000',
      searchbarBackgroundColor: '#000000',
      searchbarTextColor: '#ffffff',
      alternateRowColor: 'rgba(255, 255, 255, 0.08)',
      scrollbarColor: '#ffffff'
    }
  },
  'Native': {
    'Default': {
      textColor: '#cccccc',
      titleBackgroundColor: '#323232',
      titleColor: '#cccccc',
      keysBackgroundColor: '#2b2b2b',
      keysColor: '#cccccc',
      bubbleColor: '#252526',
      searchbarBackgroundColor: '#3c3c3c',
      searchbarTextColor: '#cccccc',
      alternateRowColor: '#82828233',
      scrollbarColor: 'rgba(121, 121, 121, 0.4)'
    },
    'Alternative 1': {
      // Native Variant 1: Badge Accent
      textColor: '#ffffff',
      titleBackgroundColor: '#007acc',
      titleColor: '#ffffff',
      keysBackgroundColor: '#1e3a8a',
      keysColor: '#93c5fd',
      bubbleColor: '#1e1e1e',
      searchbarBackgroundColor: '#252526',
      searchbarTextColor: '#ffffff',
      alternateRowColor: 'rgba(0, 122, 204, 0.12)',
      scrollbarColor: 'rgba(0, 122, 204, 0.5)'
    },
    'Alternative 2': {
      // Native Variant 2: Status Prominent
      textColor: '#e4e4e7',
      titleBackgroundColor: '#181818',
      titleColor: '#ffffff',
      keysBackgroundColor: '#27272a',
      keysColor: '#fbbf24',
      bubbleColor: '#18181b',
      searchbarBackgroundColor: '#27272a',
      searchbarTextColor: '#f4f4f5',
      alternateRowColor: 'rgba(255, 255, 255, 0.05)',
      scrollbarColor: 'rgba(121, 121, 121, 0.4)'
    }
  }
};

/**
 * Normalizes preset names (e.g. 'VS Code Native' -> 'Default')
 */
export function normalizeProfileName(profileName) {
  if (!profileName || profileName === 'VS Code Native' || profileName === 'Default Theme' || profileName === 'Default') {
    return 'Default';
  }
  return profileName;
}

/**
 * Returns exact colors for a specific appearance mode and color profile
 */
export function getPresetPalette(appearanceMode, colorProfile) {
  const modeKey = appearanceMode || 'Native';
  const modePresets = THEME_PRESETS[modeKey] || THEME_PRESETS['Native'];
  const profileKey = normalizeProfileName(colorProfile);
  return modePresets[profileKey] || modePresets['Default'];
}

/**
 * Returns initial default custom theme slots for each of the 4 appearance modes
 */
export function getInitialCustomThemes() {
  return {
    light: { ...THEME_PRESETS['Light']['Default'] },
    dark: { ...THEME_PRESETS['Dark']['Default'] },
    highContrast: { ...THEME_PRESETS['High Contrast']['Default'] },
    native: {
      textColor: '#cccccc',
      titleBackgroundColor: '#323232',
      titleColor: '#cccccc',
      keysBackgroundColor: '#2b2b2b',
      keysColor: '#cccccc',
      bubbleColor: '#252526',
      searchbarBackgroundColor: '#3c3c3c',
      searchbarTextColor: '#cccccc',
      alternateRowColor: '#82828233',
      scrollbarColor: 'rgba(121, 121, 121, 0.4)'
    }
  };
}

/**
 * Maps Appearance Mode display name to customThemes object key ('light' | 'dark' | 'highContrast' | 'native')
 */
export function getModeSlotKey(appearanceMode) {
  switch (appearanceMode) {
    case 'Light': return 'light';
    case 'Dark': return 'dark';
    case 'High Contrast': return 'highContrast';
    case 'Native':
    default:
      return 'native';
  }
}

