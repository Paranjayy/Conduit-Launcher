// Type definitions for Electron preload API

interface Clipboard {
  readText: () => Promise<string>;
  writeText: (text: string) => Promise<boolean>;
}

interface WindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

interface AppInfo {
  getAppVersion: () => Promise<string>;
  getApplications: () => Promise<ApplicationInfo[]>;
  launchApplication: (appPath: string) => Promise<boolean>;
  onAdditionalApps: (callback: (apps: ApplicationInfo[]) => void) => () => void;
}

interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  defaultShortcut: string;
}

interface ShortcutsConfig {
  shortcuts: ShortcutConfig[];
  enableGlobal: boolean;
}

interface ShortcutsAPI {
  saveShortcuts: (config: ShortcutsConfig) => Promise<boolean>;
  onGlobalShortcut: (callback: (id: string) => void) => () => void;
}

interface ApplicationInfo {
  name: string;
  path: string;
  icon: string;
}

interface ElectronAPI {
  clipboard: Clipboard;
  window: WindowControls;
  app: AppInfo;
  shortcuts: ShortcutsAPI;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {}; 