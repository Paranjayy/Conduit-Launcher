const { app, BrowserWindow, ipcMain, clipboard, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

// Keep a global reference to prevent garbage collection
let mainWindow;

function createMainWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden', // Completely hide the title bar
    trafficLightPosition: { x: -999, y: -999 }, // Move traffic lights off-screen
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    // Make it look aesthetically pleasing
    backgroundColor: '#000000',
    show: false,
    frame: false, // Frameless for a more aesthetic look
  });

  // Load the Next.js app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, './out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent flickering
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools if in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Function to register global shortcuts
function registerGlobalShortcuts() {
  // Load user preferences for shortcuts
  let shortcuts = [
    { id: 'toggle-app', shortcut: 'CommandOrControl+Space' },
    { id: 'clipboard', shortcut: 'CommandOrControl+Shift+V' },
    { id: 'paste-stack', shortcut: 'CommandOrControl+Shift+P' },
    { id: 'snippets', shortcut: 'CommandOrControl+Shift+S' },
    { id: 'app-search', shortcut: 'CommandOrControl+Shift+A' },
    { id: 'preferences', shortcut: 'CommandOrControl+Shift+,' }
  ];
  
  // Default to enabled
  let enableGlobalShortcuts = true;

  // Try to load custom shortcuts from user preferences
  try {
    const userDataPath = app.getPath('userData');
    const shortcutsPath = path.join(userDataPath, 'shortcuts.json');
    
    if (fs.existsSync(shortcutsPath)) {
      const userData = JSON.parse(fs.readFileSync(shortcutsPath, 'utf8'));
      
      // New format with enable flag and shortcuts array
      if (userData && userData.shortcuts && Array.isArray(userData.shortcuts)) {
        shortcuts = userData.shortcuts.map(s => {
          // Convert React-Hotkeys format to Electron format
          const electronShortcut = s.shortcut
            .replace(/meta/g, 'Command')
            .replace(/ctrl/g, 'Control')
            .replace(/alt/g, 'Alt')
            .replace(/shift/g, 'Shift')
            .replace(/\+/g, '+');
          return { id: s.id, shortcut: electronShortcut };
        });
        
        // Set global shortcuts enable state
        if (userData.enableGlobal !== undefined) {
          enableGlobalShortcuts = userData.enableGlobal;
        }
      } 
      // Legacy format (just array)
      else if (Array.isArray(userData) && userData.length > 0) {
        shortcuts = userData.map(s => {
          // Convert React-Hotkeys format to Electron format
          const electronShortcut = s.shortcut
            .replace(/meta/g, 'Command')
            .replace(/ctrl/g, 'Control')
            .replace(/alt/g, 'Alt')
            .replace(/shift/g, 'Shift')
            .replace(/\+/g, '+');
          return { id: s.id, shortcut: electronShortcut };
        });
      }
    }
  } catch (error) {
    console.error('Error loading custom shortcuts:', error);
  }

  // Unregister any existing shortcuts
  globalShortcut.unregisterAll();
  
  // Only register if global shortcuts are enabled
  if (!enableGlobalShortcuts) {
    console.log('Global shortcuts are disabled');
    return;
  }

  // Register each shortcut
  shortcuts.forEach(({ id, shortcut }) => {
    const success = globalShortcut.register(shortcut, () => {
      if (mainWindow) {
        if (id === 'toggle-app') {
          // Special handling for toggling the app
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
        } else {
          // For other shortcuts, show window and send command to renderer
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('global-shortcut', id);
        }
      } else {
        // If window was closed, recreate it
        createMainWindow();
      }
    });

    if (!success) {
      console.error(`Failed to register shortcut: ${shortcut}`);
    } else {
      console.log(`Registered global shortcut: ${shortcut} for ${id}`);
    }
  });
}

// Save shortcuts from renderer to disk
ipcMain.handle('save-shortcuts', (event, config) => {
  try {
    const userDataPath = app.getPath('userData');
    const shortcutsPath = path.join(userDataPath, 'shortcuts.json');
    
    // Save the entire config object with shortcuts array and enableGlobal flag
    fs.writeFileSync(shortcutsPath, JSON.stringify(config), 'utf8');
    
    // Re-register shortcuts after saving
    registerGlobalShortcuts();
    return true;
  } catch (error) {
    console.error('Error saving shortcuts:', error);
    return false;
  }
});

// Create window when Electron is ready
app.whenReady().then(() => {
  createMainWindow();
  registerGlobalShortcuts();

  // On macOS, recreate window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for clipboard functionality
ipcMain.handle('get-clipboard-text', () => {
  return clipboard.readText();
});

ipcMain.handle('set-clipboard-text', (event, text) => {
  clipboard.writeText(text);
  return true;
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// App search handlers
ipcMain.handle('get-applications', async () => {
  // For macOS
  if (process.platform === 'darwin') {
    return new Promise((resolve, reject) => {
      try {
        console.log('Starting application search...');
        // Simpler and more reliable approach for macOS
        exec('ls -1 /Applications | grep .app', async (error, stdout, stderr) => {
          if (error) {
            console.error(`Error getting applications: ${error}`);
            // Try alternate location
            try {
              exec('ls -1 /System/Applications | grep .app', async (error2, stdout2, stderr2) => {
                if (error2) {
                  console.error(`Error getting system applications: ${error2}`);
                  resolve([]); // Return empty array instead of reject to prevent crashes
                  return;
                }
                try {
                  processApps(stdout2, '/System/Applications', resolve, reject);
                } catch (processError) {
                  console.error('Error processing system apps:', processError);
                  resolve([]);
                }
              });
            } catch (execError) {
              console.error('Exec error with system apps:', execError);
              resolve([]);
            }
            return;
          }
          
          try {
            processApps(stdout, '/Applications', resolve, reject);
          } catch (processError) {
            console.error('Error processing apps:', processError);
            resolve([]);
          }
        });
      } catch (outerError) {
        console.error('Outer error in get-applications:', outerError);
        resolve([]);
      }
    });
  } else {
    // Fallback for other platforms
    console.log('Non-macOS platform detected, returning empty app list');
    return [];
  }
});

// Helper function to get macOS app icon
async function getAppIcon(appPath) {
  try {
    // Check if app path exists
    if (!fs.existsSync(appPath)) {
      console.log(`App path does not exist: ${appPath}`);
      return null;
    }
    
    // Use a simpler approach with Electron's built-in getFileIcon
    // to avoid crashes with the more complex icon extraction
    try {
      console.log(`Getting icon for app: ${appPath}`);
      const iconNative = await app.getFileIcon(appPath, { size: 'large' });
      return iconNative.toPNG().toString('base64');
    } catch (iconError) {
      console.error(`Error getting icon with Electron method: ${iconError}`);
      return null;
    }
  } catch (error) {
    console.error(`Error in getAppIcon for ${appPath}: ${error}`);
    return null;
  }
}

// Helper function to process applications
async function processApps(stdout, basePath, resolve, reject) {
  try {
    const appNames = stdout.split('\n').filter(Boolean);
    
    // First create the app list without icons
    const appInfos = appNames.map(appName => {
      // Clean app name for display
      const cleanName = appName.replace('.app', '')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add spaces between camelCase
        .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
        .trim();
      
      const fullPath = `${basePath}/${appName}`;
      
      return {
        name: cleanName,
        path: fullPath,
        icon: '' // Start with empty icon
      };
    });
    
    // Process system apps first without waiting for icons
    resolve(appInfos);
    
    // Then try to get icons in the background
    // This approach prevents the app from crashing if icon loading fails
    try {
      // Get apps from user Applications folder
      exec('ls -1 ~/Applications | grep .app', async (error, userStdout) => {
        if (!error && userStdout) {
          const userAppNames = userStdout.split('\n').filter(Boolean);
          const userAppInfos = userAppNames.map(appName => {
            const cleanName = appName.replace('.app', '')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/[-_]/g, ' ')
              .trim();
            
            const fullPath = `${process.env.HOME}/Applications/${appName}`;
            
            return {
              name: cleanName,
              path: fullPath,
              icon: '' // Start with empty icon
            };
          });
          
          // Send this additional list to the renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('additional-apps', userAppInfos);
          }
        }
      });
    } catch (error) {
      console.error('Error getting user applications:', error);
    }
  } catch (err) {
    console.error('Error processing applications:', err);
    resolve([]);
  }
}

// Launch application
ipcMain.handle('launch-application', async (event, appPath) => {
  try {
    if (process.platform === 'darwin') {
      exec(`open "${appPath}"`, (error) => {
        if (error) {
          console.error(`Error launching application: ${error}`);
          return false;
        }
      });
    } else {
      await shell.openPath(appPath);
    }
    return true;
  } catch (error) {
    console.error('Error launching application:', error);
    return false;
  }
});