import { useState, useEffect, useCallback } from 'react';

// Define types directly
declare global {
  interface Window {
    electron?: {
      clipboard: {
        readText: () => Promise<string>;
        writeText: (text: string) => Promise<boolean>;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
      app: {
        getAppVersion: () => Promise<string>;
        getApplications: () => Promise<Array<{name: string; path: string; icon: string}>>;
        launchApplication: (appPath: string) => Promise<boolean>;
      };
    };
  }
}

export function useElectronClipboard() {
  const [clipboardText, setClipboardText] = useState<string>('');
  const [isElectron, setIsElectron] = useState<boolean>(false);

  useEffect(() => {
    // Check if we're running in Electron
    setIsElectron(typeof window !== 'undefined' && !!window.electron);
  }, []);

  const readClipboard = useCallback(async () => {
    if (isElectron && window.electron?.clipboard) {
      try {
        const text = await window.electron.clipboard.readText();
        setClipboardText(text);
        return text;
      } catch (error) {
        console.error('Failed to read clipboard:', error);
        return '';
      }
    }
    return '';
  }, [isElectron]);

  const writeClipboard = useCallback(async (text: string) => {
    if (isElectron && window.electron?.clipboard) {
      try {
        const success = await window.electron.clipboard.writeText(text);
        if (success) {
          setClipboardText(text);
        }
        return success;
      } catch (error) {
        console.error('Failed to write to clipboard:', error);
        return false;
      }
    }
    return false;
  }, [isElectron]);

  return {
    clipboardText,
    readClipboard,
    writeClipboard,
    isElectron,
  };
} 