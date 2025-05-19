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
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getApplications: () => ipcRenderer.invoke('get-applications'),
    launchApplication: (appPath) => ipcRenderer.invoke('launch-application', appPath),
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
    onUpdatedAppIcons: (callback) => {
      const updatedIconsListener = (_, apps) => callback(apps);
      ipcRenderer.on('updated-app-icons', updatedIconsListener);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener('updated-app-icons', updatedIconsListener);
      };
    },
    onAllAppsNoIcons: (callback) => {
      const allAppsListener = (_, apps) => callback(apps);
      ipcRenderer.on('all-apps-no-icons', allAppsListener);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener('all-apps-no-icons', allAppsListener);
      };
    }
  },
  
  // Global shortcuts
  shortcuts: {
    saveShortcuts: (config) => ipcRenderer.invoke('save-shortcuts', config),
    onGlobalShortcut: (callback) => {
      const globalShortcutListener = (_, id) => callback(id);
      ipcRenderer.on('global-shortcut', globalShortcutListener);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener('global-shortcut', globalShortcutListener);
      };
    }
  }
}); 