# KeyboardShortcut Explorer

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

This extension contributes the following settings:

- `keyboardshortcut-explorer.fontFamily`: Change the general font family.
- `keyboardshortcut-explorer.fontSize`: Adjust the base font size of the list.
- `keyboardshortcut-explorer.keysFontSize`: Adjust the font size of the shortcut keys.
- `keyboardshortcut-explorer.titleFontSize`: Adjust the font size of the category titles.
- `keyboardshortcut-explorer.colorProfile`: Choose from different color combinations (VS Code Native, Alternative 1, Alternative 2, Custom) to remix how UI elements pull colors from your theme.
- `keyboardshortcut-explorer.appearanceMode`: Force the overall look to Auto, Dark, Light, or High Contrast.
- `keyboardshortcut-explorer.alternateRowColors`: Enable alternating row colors (zebra striping) for better readability.
- `keyboardshortcut-explorer.alternateRowColor`: Custom color for the alternating rows.
- `keyboardshortcut-explorer.textColor`: Custom RGB/Hex color for text (or inherit from theme).
- `keyboardshortcut-explorer.titleBackgroundColor`: Custom RGB/Hex background color for the category titles.
- `keyboardshortcut-explorer.keysBackgroundColor`: Custom RGB/Hex background color for the keys.
- `keyboardshortcut-explorer.bubbleColor`: Change the background color of the main shortcut container.
- `keyboardshortcut-explorer.scrollbarColor`: Custom color for the vertical scrollbar.
- `keyboardshortcut-explorer.accessibilityMode`: Enable Dyslexia-friendly mode.
- `keyboardshortcut-explorer.dyslexiaFont`: Specify the font used when Dyslexia Mode is enabled.
- `keyboardshortcut-explorer.dyslexiaBold`: Force bold text during Dyslexia Mode.
- `keyboardshortcut-explorer.dyslexiaLetterSpacing`: Adjust letter spacing during Dyslexia Mode.

## Release Notes

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
