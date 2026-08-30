# KeyboardShortcut Explorer

[![Install on VS Code](https://img.shields.io/badge/Install%20on-VS%20Code-007ACC.png?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=GaetanoTaormina.keyboardshortcut-explorer)
[![VS Marketplace Version](https://vsmarketplacebadges.dev/version/GaetanoTaormina.keyboardshortcut-explorer.png)](https://marketplace.visualstudio.com/items?itemName=GaetanoTaormina.keyboardshortcut-explorer)
[![VS Marketplace Installs](https://vsmarketplacebadges.dev/installs/GaetanoTaormina.keyboardshortcut-explorer.png)](https://marketplace.visualstudio.com/items?itemName=GaetanoTaormina.keyboardshortcut-explorer)
[![VS Marketplace Downloads](https://vsmarketplacebadges.dev/downloads/GaetanoTaormina.keyboardshortcut-explorer.png)](https://marketplace.visualstudio.com/items?itemName=GaetanoTaormina.keyboardshortcut-explorer)
[![VS Marketplace Rating Stars](https://vsmarketplacebadges.dev/rating-star/GaetanoTaormina.keyboardshortcut-explorer.png)](https://marketplace.visualstudio.com/items?itemName=GaetanoTaormina.keyboardshortcut-explorer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.png)](https://github.com/Gaetano-Taormina/KeyboardShortcut_Explorer/blob/main/LICENSE)

A sleek, professional, and highly customizable VS Code extension to view, search, and manage all your keyboard shortcuts directly from the sidebar.

## Features

- **Sidebar Integration**: Access your shortcuts immediately from the VS Code Activity Bar.
- **Instant Search**: Find shortcuts in milliseconds using command names or key combinations.
- **Extension Filtering**: Hide or show shortcuts added by specific extensions to keep your view clean.
- **Drag & Drop Reordering**: Easily reorder shortcut categories to match your workflow.
- **Pin to Top**: Pin your most frequently used categories (like "Basic Editing") at the very top.
- **Accessibility Friendly**: Supports a dedicated Dyslexia mode via VS Code settings.
- **Customizable Aesthetics**: Tailor bubble colors and font sizes to your preferences.

## Requirements

No special requirements. Works out-of-the-box with any VS Code setup.

## Extension Settings

This extension contributes the following settings grouped by category:

### Colors & Theme (`keyboardshortcut-explorer.colors.*`)

- `keyboardshortcut-explorer.colors.appearanceMode`: Force the overall appearance mode (Native, Dark, Light, or High Contrast).
- `keyboardshortcut-explorer.colors.colorProfile`: Choose from different color combinations (VS Code Native, Alternative 1, Alternative 2, Custom) to remix how UI elements pull colors from your theme.
- `keyboardshortcut-explorer.colors.textColor`: Custom RGB/Hex color for text (or inherit from theme).
- `keyboardshortcut-explorer.colors.titleBackgroundColor`: Custom RGB/Hex background color for the category titles.
- `keyboardshortcut-explorer.colors.keysBackgroundColor`: Custom RGB/Hex background color for the keys.
- `keyboardshortcut-explorer.colors.bubbleColor`: Change the background color of the main shortcut container.
- `keyboardshortcut-explorer.colors.searchbarBackgroundColor`: Custom RGB/Hex background color for the search input bar.
- `keyboardshortcut-explorer.colors.searchbarTextColor`: Custom RGB/Hex text color for the search input bar.
- `keyboardshortcut-explorer.colors.alternateRowColor`: Custom RGB/Hex color for the alternating rows when zebra striping is active.
- `keyboardshortcut-explorer.colors.scrollbarColor`: Custom RGB/Hex color for the Webview scrollbar thumb.

### Typography (`keyboardshortcut-explorer.typography.*`)

- `keyboardshortcut-explorer.typography.fontFamily`: Change the general font family.
- `keyboardshortcut-explorer.typography.fontSize`: Adjust the base font size of the list.
- `keyboardshortcut-explorer.typography.titleFontSize`: Adjust the font size of the category titles.
- `keyboardshortcut-explorer.typography.keysFontSize`: Adjust the font size of the shortcut keys.

### Appearance (`keyboardshortcut-explorer.appearance.*`)

- `keyboardshortcut-explorer.appearance.alternateRowColors`: Enable alternating row colors (zebra striping) for better list readability.

### Accessibility (`keyboardshortcut-explorer.accessibility.*`)

- `keyboardshortcut-explorer.accessibility.accessibilityMode`: Enable Dyslexia-friendly mode.
- `keyboardshortcut-explorer.accessibility.dyslexiaFont`: Specify the font used when Dyslexia Mode is enabled.
- `keyboardshortcut-explorer.accessibility.dyslexiaBold`: Force bold text during Dyslexia Mode.
- `keyboardshortcut-explorer.accessibility.dyslexiaLetterSpacing`: Adjust letter spacing during Dyslexia Mode.

## Release Notes

### 1.0.11

- fix: allow icon.png in package

### 1.0.10

- ci: fix output context in workflow
- ci: add auto-release script
- ci: implement automated release workflow

### 1.0.9

- **Security Fix**: Removed sensitive files from the VSIX package build process to ensure secure Marketplace publishing.

### 1.0.8

- **Vite & React Migration**: Completely rebuilt the Webview UI using Vite and React for significantly better performance and maintainability.
- **Compact UI & Reordering**: Designed an ultra-compact, modern UI optimized specifically for the narrow VS Code sidebar. Added a dedicated Reorder Mode (`+` button) to easily drag, drop, and pin categories.
- **Automated CI/CD**: Fully automated the build and release process using GitHub Actions and Dependabot for seamless updates to the VS Code Marketplace.

### 1.0.7

- **Live Marketplace Badges & Review Stars**: Added dynamic, real-time PNG badges to the top of the README featuring current Marketplace version, install counts, average rating scores, and visual rating stars (`★★★★★`) via `vsmarketplacebadges.dev`.
- **Security & Packaging Hardening**: Updated all badge links from restricted SVG format to high-compatibility PNG images, ensuring 100% compliance with `vsce` Marketplace security policies.

### 1.0.6

- **Modular Search Bar & Keystroke Detection**: Refactored search and keystroke capture logic into a standalone, modular webview component (`searchBar.js`) for cleaner architecture and improved maintainability.
- **Unified Color Settings & Auto-Cleanup**: Reorganized `appearanceMode` cleanly under the `.colors.` configuration hierarchy (`keyboardshortcut-explorer.colors.appearanceMode`). Added automatic cleanup of custom `settings.json` lines when restoring default ("Native") or "VS Code Native" themes, alongside seamless migration and recovery of legacy setting keys without data loss.
- **Enhanced Security Hardening**: Restricted Webview `localResourceRoots` specifically to the `webview/` and `media/` directories and injected strict Content Security Policy (CSP) headers into the Webview DOM.

### 1.0.5

- **Repository Refactoring**: Complete reorganization of the extension source code into a clean, standard structure (`src/`, `webview/`, `media/`) for better maintainability. This update does not alter any existing functionality.

### 1.0.4

- **Complete English Translation**: The entire extension is now fully translated and localized in English.
- **Color Theme Editor Redesign**: The color editor UI is now more compact and utilizes a responsive 2-column grid layout, ensuring all settings fit perfectly on screen.
- **Zebra Striping Fix**: Addressed an issue where custom color profiles applied incorrect default colors for alternate rows.
- **Scrollbar Styling Removed**: Custom scrollbar styling was removed for better stability within the VS Code Webview environment.

### 1.0.3

- **Color Profiles & Color Pickers**: Introduced Color Profiles to quickly remix UI element colors using native VS Code semantic variables. Individual color settings now support native VS Code Color Pickers!
- **Appearance Mode Control**: Force the extension to render in Light, Dark, or High Contrast modes independently from your main VS Code theme.
- **Zebra Striping**: Added a setting to enable/disable alternating row colors for better list readability.
- **Cleaner Default View**: By default, third-party extensions are now hidden when the extension is first loaded, ensuring a clean and focused "System Only" view.
- **Update Banners**: The extension now displays a dismissible update banner within the UI whenever a new version with structural changes is installed.

### 1.0.2

- **Full Customization Update**: Added extensive styling settings! Customize font families, change specific font sizes (keys, titles), and apply custom RGB colors to texts, title backgrounds, key backgrounds, and the scrollbar.
- **Improved Accessibility**: Dyslexia mode settings are now separated, allowing you to freely choose the font, letter spacing, and bold forcing independently.

### 1.0.1

Initial release of KeyboardShortcut Explorer! Features include sorting, search, pinning, drag and drop, and more.

---
**Enjoy exploring your shortcuts!**
