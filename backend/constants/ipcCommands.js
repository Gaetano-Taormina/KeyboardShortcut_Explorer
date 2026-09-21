/**
 * Centralized IPC message command constants between VS Code Extension Host and Webviews.
 */
const IPC_COMMANDS = Object.freeze({
    // Initial Data Handshake
    INIT_DATA: 'initData',
    REQUEST_INIT_DATA: 'requestInitData',

    // Toggle Panels & Controls
    TOGGLE_SEARCH: 'toggleSearch',
    TOGGLE_CUSTOM_MENU: 'toggleCustomMenu',
    TOGGLE_REORDER_MODE: 'toggleReorderMode',

    // User Customization Persistence
    UPDATE_CATEGORY_ORDER: 'updateCategoryOrder',
    UPDATE_PINNED_CATEGORIES: 'updatePinnedCategories',
    UPDATE_HIDDEN_EXTENSIONS: 'updateHiddenExtensions',
    DISMISS_DISCLAIMER: 'dismissDisclaimer',
    DISMISS_GRID_TUTORIAL: 'dismissGridTutorial',

    // Color Picker & Settings IPC
    REQUEST_SETTINGS: 'requestSettings',
    LOAD_SETTINGS: 'loadSettings',
    UPDATE_SETTING: 'updateSetting',
    SAVE_SETTINGS: 'saveSettings',
    RESET_DEFAULTS: 'resetDefaults',
    EXECUTE_COMMAND: 'executeCommand'
});

module.exports = { IPC_COMMANDS };
