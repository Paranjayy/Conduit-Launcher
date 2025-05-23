const { app, BrowserWindow, ipcMain, clipboard, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const plist = require('plist');
const { Icns } = require('@fiahfy/icns');
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
    { id: 'calculator', shortcut: 'CommandOrControl+Shift+C' },
    { id: 'menu-search', shortcut: 'CommandOrControl+Shift+M' },
    { id: 'contextual-shortcuts', shortcut: 'CommandOrControl+Shift+K' },
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

// Helper function to process apps and send icons in batches
async function processAndSendIcons(appsToProcess, sourceDescription) {
  console.log(`\n=== [processAndSendIcons] Starting icon processing for ${appsToProcess.length} ${sourceDescription} ===`);
  const batchSize = 3; // Smaller batch size for clearer debugging
  
  // First send all apps without icons to ensure complete list is available
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    console.log(`[processAndSendIcons] 📤 Sending all ${appsToProcess.length} apps without icons first`);
    mainWindow.webContents.send('all-apps-no-icons', appsToProcess);
    console.log(`[processAndSendIcons] ✅ Sent all apps without icons to renderer`);
  }
  
  // Add a delay before starting icon processing
  await new Promise(r => setTimeout(r, 1000));
  
  for (let i = 0; i < appsToProcess.length; i += batchSize) {
    const batch = appsToProcess.slice(i, i + batchSize);
    console.log(`\n--- [processAndSendIcons] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(appsToProcess.length/batchSize)} ---`);
    console.log(`[processAndSendIcons] Apps in this batch: ${batch.map(app => app.name).join(', ')}`);

    const appsWithIcons = await Promise.all(
      batch.map(async (appInfo) => {
        console.log(`[processAndSendIcons] 🔍 Getting icon for: ${appInfo.name}`);
        const icon = await getAppIcon(appInfo.path);
        const result = { ...appInfo, icon: icon || '' }; // Ensure icon is always a string (base64 or empty)
        
        if (icon) {
          console.log(`[processAndSendIcons] ✅ Got icon for ${appInfo.name}: ${icon.length} characters`);
        } else {
          console.log(`[processAndSendIcons] ❌ No icon for ${appInfo.name}`);
        }
        
        return result;
      })
    );

    // Send all apps in the batch, even if icon wasn't found
    if (appsWithIcons.length > 0) {
      const appsWithIconsCount = appsWithIcons.filter(app => app.icon).length;
      console.log(`[processAndSendIcons] 📤 Sending batch of ${appsWithIcons.length} apps (${appsWithIconsCount} with icons) to renderer`);
      
      // Log first app in batch for debugging
      const firstApp = appsWithIcons[0];
      console.log(`[processAndSendIcons] 🔍 First app "${firstApp.name}": icon length = ${firstApp.icon?.length || 0}`);
      
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.send('updated-app-icons', appsWithIcons);
        console.log(`[processAndSendIcons] ✅ Successfully sent batch to renderer via 'updated-app-icons' event`);
      } else {
        console.log(`[processAndSendIcons] ❌ Cannot send batch - window/webContents unavailable`);
      }
    }
    
    // Longer delay between batches for debugging
    console.log(`[processAndSendIcons] ⏱️  Waiting 3 seconds before next batch...`);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log(`\n=== [processAndSendIcons] ✅ Finished icon processing for ${sourceDescription} ===\n`);
}

ipcMain.handle('get-applications', async () => {
  if (process.platform === 'darwin') {
    try {
      console.log('[get-applications] Starting application search...');
      const mainAppsPromise = new Promise((resolve, reject) => {
        exec('ls -1 /Applications | grep .app', (error, stdout) => {
          if (error) {
            console.error('[get-applications] Error getting /Applications:', error.message);
            return resolve([]); // Resolve with empty on error
          }
          const appNames = stdout.split('\n').filter(Boolean);
          console.log(`[get-applications] Found ${appNames.length} apps in /Applications`);
          const appInfos = appNames.map(appName => ({
            name: appName.replace('.app', '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').trim(),
            path: `/Applications/${appName}`,
            icon: '' // Initially no icon
          }));
          resolve(appInfos);
        });
      });

      const systemAppsPromise = new Promise((resolve, reject) => {
         exec('ls -1 /System/Applications | grep .app', (error, stdout) => {
          if (error) {
            console.error('[get-applications] Error getting /System/Applications:', error.message);
            return resolve([]);
          }
          const appNames = stdout.split('\n').filter(Boolean);
          console.log(`[get-applications] Found ${appNames.length} apps in /System/Applications`);
          const appInfos = appNames.map(appName => ({
            name: appName.replace('.app', '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').trim(),
            path: `/System/Applications/${appName}`,
            icon: ''
          }));
          resolve(appInfos);
        });
      });
      
      const userAppsPromise = new Promise((resolve, reject) => {
        const userAppsDir = path.join(app.getPath('home'), 'Applications');
        if (fs.existsSync(userAppsDir)) {
            exec(`ls -1 "${userAppsDir}" | grep .app`, (error, stdout) => {
                if (error) {
                    console.error(`[get-applications] Error getting ${userAppsDir}:`, error.message);
                    return resolve([]);
                }
                const appNames = stdout.split('\n').filter(Boolean);
                console.log(`[get-applications] Found ${appNames.length} apps in ${userAppsDir}`);
                const appInfos = appNames.map(appName => ({
                    name: appName.replace('.app', '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').trim(),
                    path: path.join(userAppsDir, appName),
                    icon: ''
                }));
                resolve(appInfos);
            });
        } else {
            resolve([]);
          }
        });

      const [mainApps, systemApps, userApps] = await Promise.all([
        mainAppsPromise,
        systemAppsPromise,
        userAppsPromise
      ]);
      
      let allApps = [...mainApps, ...systemApps, ...userApps];

      // Remove duplicates by path
      const uniqueAppsMap = new Map();
      allApps.forEach(appInfo => uniqueAppsMap.set(appInfo.path, appInfo));
      allApps = Array.from(uniqueAppsMap.values());
      
      // Sort alphabetically by name - convert to lowercase for proper sorting
      allApps.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

      console.log(`[get-applications] Total unique apps found: ${allApps.length}`);
      
      // Log first 10 and last 10 apps to debug
      if (allApps.length > 0) {
        console.log('[get-applications] First 10 apps:', allApps.slice(0, 10).map(a => a.name));
        if (allApps.length > 10) {
          console.log('[get-applications] Last 10 apps:', allApps.slice(-10).map(a => a.name));
        }
      }

      // Send the initial list (without icons) to the renderer immediately
      // Then, start fetching icons in the background.
      processAndSendIcons([...allApps], 'all applications').catch(err => {
        console.error("[get-applications] Error in background icon processing:", err);
      });
      
      return allApps; // Return apps without icons first

    } catch (error) {
      console.error('[get-applications] Outer error:', error.message);
    return [];
    }
  }
  console.log('[get-applications] Non-macOS platform, returning empty app list.');
  return [];
});

// Helper function to get macOS app icon
async function getAppIcon(appPath) {
  try {
    console.log(`[getAppIcon] Processing: ${appPath}`);
    
    // 1. Check if the path actually exists before trying to get an icon
    if (!fs.existsSync(appPath)) {
      console.warn(`[getAppIcon] Path does not exist: ${appPath}`);
      return null;
    }

    // Don't try to process directories that aren't .app bundles
    if (!appPath.endsWith('.app')) {
      console.warn(`[getAppIcon] Not an app bundle: ${appPath}`);
      return null;
    }
    
    // 2. Find Info.plist inside the .app bundle
    const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
      console.warn(`[getAppIcon] Info.plist not found for: ${appPath}, trying fallback`);
      // Fall back to Electron's getFileIcon if no Info.plist
      try {
        const iconNative = await app.getFileIcon(appPath, { size: 'normal' });
        if (iconNative && !iconNative.isEmpty()) {
          const iconBase64 = `data:image/png;base64,${iconNative.toPNG().toString('base64')}`;
          console.log(`[getAppIcon] Fallback icon successful for: ${appPath}`);
          return iconBase64;
        }
      } catch (err) {
        console.error(`[getAppIcon] Fallback failed for ${appPath}:`, err.message);
      }
      return null;
    }

    // 3. Parse the Info.plist
    const plistContent = fs.readFileSync(infoPlistPath, 'utf8');
    let info;
    try {
      info = plist.parse(plistContent);
    } catch (plistError) {
      console.error(`[getAppIcon] Error parsing Info.plist for ${appPath}: ${plistError.message}`);
      return null;
    }

    // 4. Get the icon file name
    let iconFile = info.CFBundleIconFile || '';
    if (!iconFile && info.CFBundleIcons && info.CFBundleIcons.CFBundlePrimaryIcon) {
      iconFile = info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles?.[0] || '';
    }

    // Add .icns extension if not present
    if (iconFile && !iconFile.endsWith('.icns')) {
      iconFile = `${iconFile}.icns`;
    }

    // If no icon file found in plist
    if (!iconFile) {
      console.warn(`[getAppIcon] No icon file found in Info.plist for: ${appPath}`);
      // Try with the app name
      const appName = path.basename(appPath, '.app');
      iconFile = `${appName}.icns`;
    }

    // 5. Find the icon file in Resources
    const resourcesPath = path.join(appPath, 'Contents', 'Resources');
    const iconPath = path.join(resourcesPath, iconFile);

    if (!fs.existsSync(iconPath)) {
      console.warn(`[getAppIcon] Icon file not found at: ${iconPath}`);
      
      // Try to find any .icns file in Resources
      try {
        const files = fs.readdirSync(resourcesPath);
        const icnsFiles = files.filter(file => file.endsWith('.icns'));
        if (icnsFiles.length > 0) {
          const alternatePath = path.join(resourcesPath, icnsFiles[0]);
          console.log(`[getAppIcon] Found alternative icon: ${alternatePath}`);
          const result = await extractIcns(alternatePath);
          if (result) {
            console.log(`[getAppIcon] Alternative icon extraction successful for: ${appPath}`);
            return result;
          }
        }
      } catch (dirError) {
        console.error(`[getAppIcon] Error reading Resources dir: ${dirError.message}`);
      }
      
      // Fall back to electron's getFileIcon as last resort
      try {
        const iconNative = await app.getFileIcon(appPath, { size: 'normal' });
        if (iconNative && !iconNative.isEmpty()) {
          const iconBase64 = `data:image/png;base64,${iconNative.toPNG().toString('base64')}`;
          console.log(`[getAppIcon] Final fallback successful for: ${appPath}`);
          return iconBase64;
        }
      } catch (err) {
        console.error(`[getAppIcon] Final fallback failed for ${appPath}:`, err.message);
      }
      
      return null;
    }

    // 6. Extract PNG from ICNS and convert to base64
    console.log(`[getAppIcon] Extracting icon from: ${iconPath}`);
    const result = await extractIcns(iconPath);
    if (result) {
      console.log(`[getAppIcon] Successfully extracted icon for: ${appPath}, length: ${result.length}`);
    } else {
      console.warn(`[getAppIcon] Failed to extract icon for: ${appPath}`);
    }
    return result;
    
  } catch (error) {
    console.error(`[getAppIcon] General error for ${appPath}: ${error.message}`);
    return null;
  }
}

// Helper function to extract icons from ICNS files
async function extractIcns(iconPath) {
  try {
    console.log(`[extractIcns] Processing: ${iconPath}`);
    
    // Read the ICNS file
    const iconBuffer = fs.readFileSync(iconPath);
    console.log(`[extractIcns] Read ${iconBuffer.length} bytes from ${iconPath}`);
    
    // Parse the ICNS file
    const icns = Icns.from(iconBuffer);
    
    // Get the largest image (usually the first one)
    if (!icns.images || icns.images.length === 0) {
      console.warn(`[extractIcns] No images found in ICNS file: ${iconPath}`);
      return null;
    }
    
    console.log(`[extractIcns] Found ${icns.images.length} images in ICNS file`);
    
    // Sort by size and get the largest
    const sortedImages = [...icns.images].sort((a, b) => {
      const sizeA = (a.width || 0) * (a.height || 0);
      const sizeB = (b.width || 0) * (b.height || 0);
      return sizeB - sizeA;
    });
    
    const largestImage = sortedImages[0];
    console.log(`[extractIcns] Using image with dimensions ${largestImage.width || 'unknown'}x${largestImage.height || 'unknown'}, data length: ${largestImage.data?.length || 0}`);
    
    // Get the PNG data from the largest image
    const pngBuffer = largestImage.data;
    
    if (!pngBuffer || pngBuffer.length === 0) {
      console.warn(`[extractIcns] Empty PNG buffer for ${iconPath}`);
      return null;
    }
    
    // Convert to base64 data URL
    const base64 = pngBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;
    
    console.log(`[extractIcns] Successfully extracted icon: ${dataUrl.length} characters`);
    return dataUrl;
    
  } catch (error) {
    console.error(`[extractIcns] Error extracting icon from ${iconPath}: ${error.message}`);
    return null;
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

// Get menu items from active application (macOS only)
ipcMain.handle('get-menu-items', async () => {
  if (process.platform !== 'darwin') {
    return { error: 'This feature is only available on macOS' };
  }

  try {
    // AppleScript to get menu items from the frontmost application
    const script = `
    tell application "System Events"
      set frontApp to first application process whose frontmost is true
      set appName to name of frontApp
      
      set menuItems to {}
      set menuNames to {}
      
      tell process appName
        set topMenus to menu bars's menu bar items
        
        repeat with topMenu in topMenus
          set topMenuName to name of topMenu
          
          -- Get submenus
          set theMenu to menu of topMenu
          set menuItems to menuItems & getMenuItems(theMenu, topMenuName, "")
        end repeat
      end tell
      
      return {appName, menuItems}
    end tell
    
    on getMenuItems(theMenu, menuPath, indent)
      set allItems to {}
      
      repeat with menuItem in menu items of theMenu
        set itemName to name of menuItem
        
        if itemName is not "" and itemName is not "-" then
          set fullPath to menuPath & " → " & itemName
          set itemEntry to {name:itemName, path:fullPath, hasSubMenu:false, enabled:true}
          
          try
            set itemEnabled to enabled of menuItem
            set itemEntry to {name:itemName, path:fullPath, hasSubMenu:false, enabled:itemEnabled}
          end try
          
          copy itemEntry to end of allItems
          
          -- Check for submenus
          try
            set subMenu to menu of menuItem
            set itemEntry's hasSubMenu to true
            
            -- Get items from submenu
            set subItems to getMenuItems(subMenu, fullPath, indent & "  ")
            set allItems to allItems & subItems
          end try
        end if
      end repeat
      
      return allItems
    end getMenuItems
    `;

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, { maxBuffer: 2 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.error('Error getting menu items:', error);
          reject({ error: 'Failed to get menu items: ' + error.message });
          return;
        }
        
        try {
          // Parse the output, which should be in the format: {appName:"AppName", menuItems:[{...}, ...]}
          const result = JSON.parse(stdout.replace(/[\r\n]/g, ''));
          resolve(result);
        } catch (parseError) {
          console.error('Error parsing menu items:', parseError);
          reject({ error: 'Failed to parse menu items' });
        }
      });
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return { error: 'Failed to get menu items: ' + error.message };
  }
});

// Execute menu item in active application (macOS only)
ipcMain.handle('execute-menu-item', async (event, menuPath) => {
  if (process.platform !== 'darwin') {
    return { error: 'This feature is only available on macOS' };
  }

  try {
    // Convert the menu path into AppleScript commands
    const menuComponents = menuPath.split(' → ');
    if (menuComponents.length < 2) {
      return { error: 'Invalid menu path' };
    }

    // Build AppleScript to click the specified menu item
    let script = `
    tell application "System Events"
      set frontApp to first application process whose frontmost is true
      tell process (name of frontApp)
        tell menu bar 1
          click menu bar item "${menuComponents[0]}"
          tell menu 1
    `;

    // Build nested tell blocks for each submenu level
    for (let i = 1; i < menuComponents.length - 1; i++) {
      script += `
            click menu item "${menuComponents[i]}"
            tell menu 1
      `;
    }

    // Add the final click command
    script += `
              click menu item "${menuComponents[menuComponents.length - 1]}"
    `;

    // Close all the tell blocks
    for (let i = 0; i < menuComponents.length; i++) {
      script += `
            end tell
      `;
    }

    script += `
        end tell
      end tell
    end tell
    `;

    return new Promise((resolve, reject) => {
      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error executing menu item:', error);
          reject({ error: 'Failed to execute menu item: ' + error.message });
          return;
        }
        resolve({ success: true });
      });
    });
  } catch (error) {
    console.error('Error executing menu item:', error);
    return { error: 'Failed to execute menu item: ' + error.message };
  }
});