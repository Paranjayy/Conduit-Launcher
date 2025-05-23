const { contextBridge, ipcRenderer } = require('electron');

// Expose API to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // Clipboard functions
  clipboard: {
    readText: () => ipcRenderer.invoke('get-clipboard-text'),
    writeText: (text) => ipcRenderer.invoke('set-clipboard-text', text),
  },
  
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('minimize-window'),
    maximize: () => ipcRenderer.send('maximize-window'),
    close: () => ipcRenderer.send('close-window'),
  },

  // App information
  app: {
    getApplications: () => {
      console.log('[Preload] Requesting applications...');
      return ipcRenderer.invoke('get-applications');
    },
    launchApplication: (appPath) => {
      console.log('[Preload] Launching application:', appPath);
      return ipcRenderer.invoke('launch-application', appPath);
    },
    getMenuItems: () => ipcRenderer.invoke('get-menu-items'),
    executeMenuItem: (menuPath) => ipcRenderer.invoke('execute-menu-item', menuPath),
    onAdditionalApps: (callback) => {
      const additionalAppsListener = (_, apps) => callback(apps);
      ipcRenderer.on('additional-apps', additionalAppsListener);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener('additional-apps', additionalAppsListener);
      };
    },
    onAllAppsNoIcons: (callback) => {
      console.log('[Preload] Setting up onAllAppsNoIcons listener');
      const handler = (event, apps) => {
        console.log(`[Preload] Received all apps without icons: ${apps.length} apps`);
        callback(apps);
      };
      ipcRenderer.on('all-apps-no-icons', handler);
      return () => {
        console.log('[Preload] Removing onAllAppsNoIcons listener');
        ipcRenderer.removeListener('all-apps-no-icons', handler);
      };
    },
    onUpdatedAppIcons: (callback) => {
      console.log('[Preload] Setting up onUpdatedAppIcons listener');
      const handler = (event, appsWithIcons) => {
        console.log(`[Preload] Received ${appsWithIcons.length} apps with updated icons`);
        // Log first few apps with detailed icon info
        appsWithIcons.slice(0, 3).forEach(app => {
          console.log(`[Preload] App "${app.name}": has icon = ${!!app.icon}, icon length = ${app.icon?.length || 0}`);
        });
        callback(appsWithIcons);
      };
      ipcRenderer.on('updated-app-icons', handler);
      return () => {
        console.log('[Preload] Removing onUpdatedAppIcons listener');
        ipcRenderer.removeListener('updated-app-icons', handler);
      };
    }
  },
  
  // Global shortcuts
  shortcuts: {
    save: (config) => ipcRenderer.invoke('save-shortcuts', config),
    onGlobalShortcut: (callback) => {
      ipcRenderer.on('global-shortcut', (event, shortcutId) => {
        callback(shortcutId);
      });
      return () => {
        ipcRenderer.removeAllListeners('global-shortcut');
      };
    }
  },

  // Version info
  version: () => ipcRenderer.invoke('get-app-version'),

  // Menu functionality (macOS only)
  menu: {
    getItems: () => ipcRenderer.invoke('get-menu-items'),
    executeItem: (menuPath) => ipcRenderer.invoke('execute-menu-item', menuPath)
  },

  // File system operations
  files: {
    getHomeDirectory: () => ipcRenderer.invoke('get-home-directory'),
    readDirectory: (path) => ipcRenderer.invoke('read-directory', path),
    searchFiles: (query, basePath) => ipcRenderer.invoke('search-files', query, basePath),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath)
  },

  // Window management operations (macOS only)
  windowManager: {
    getWindows: () => ipcRenderer.invoke('get-windows'),
    resizeWindow: (action) => ipcRenderer.invoke('resize-window', action),
    minimizeWindow: (windowTitle) => ipcRenderer.invoke('minimize-window-by-id', windowTitle),
    focusWindow: (windowTitle) => ipcRenderer.invoke('focus-window-by-title', windowTitle)
  }
}); 