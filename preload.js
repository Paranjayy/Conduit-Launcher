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
    onAdditionalApps: (callback) => {
      const additionalAppsListener = (_, apps) => callback(apps);
      ipcRenderer.on('additional-apps', additionalAppsListener);
      
      // Return a cleanup function
      return () => {
        ipcRenderer.removeListener('additional-apps', additionalAppsListener);
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