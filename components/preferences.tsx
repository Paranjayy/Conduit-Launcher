import React, { useState, useEffect, useRef } from 'react';
import { Settings, Keyboard, Save, Plus, X, ArrowLeft } from 'lucide-react';

interface PreferencesProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | "preferences") => void;
}

interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  defaultShortcut: string;
}

export function Preferences({ onViewChange }: PreferencesProps) {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([
    { 
      id: 'toggle-app', 
      name: 'Toggle OmniLaunch', 
      description: 'Show or hide the main window', 
      shortcut: 'meta+space', 
      defaultShortcut: 'meta+space' 
    },
    { 
      id: 'clipboard', 
      name: 'Open Clipboard Manager', 
      description: 'Access your clipboard history', 
      shortcut: 'meta+shift+v', 
      defaultShortcut: 'meta+shift+v' 
    },
    { 
      id: 'paste-stack', 
      name: 'Open Paste Stack', 
      description: 'Manage your paste sequences', 
      shortcut: 'meta+shift+p', 
      defaultShortcut: 'meta+shift+p' 
    },
    { 
      id: 'snippets', 
      name: 'Open Snippets Manager', 
      description: 'Create and use text snippets', 
      shortcut: 'meta+shift+s', 
      defaultShortcut: 'meta+shift+s' 
    },
    { 
      id: 'app-search', 
      name: 'Open App Search', 
      description: 'Find and launch applications', 
      shortcut: 'meta+shift+a', 
      defaultShortcut: 'meta+shift+a' 
    }
  ]);
  
  const [activeShortcutId, setActiveShortcutId] = useState<string | null>(null);
  const [tempShortcut, setTempShortcut] = useState<string>('');
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [enableGlobalShortcuts, setEnableGlobalShortcuts] = useState<boolean>(true);
  const captureRef = useRef<HTMLDivElement>(null);
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  // Load shortcuts and settings from local storage if available
  useEffect(() => {
    const savedShortcuts = localStorage.getItem('omnilaunch-shortcuts');
    if (savedShortcuts) {
      try {
        const parsed = JSON.parse(savedShortcuts);
        if (Array.isArray(parsed)) {
          setShortcuts(parsed);
        }
      } catch (error) {
        console.error('Failed to parse saved shortcuts', error);
      }
    }
    
    // Load global shortcuts setting
    const globalShortcutsSetting = localStorage.getItem('omnilaunch-global-shortcuts');
    if (globalShortcutsSetting !== null) {
      setEnableGlobalShortcuts(globalShortcutsSetting === 'true');
    }
  }, []);

  // Save shortcuts to local storage when they change
  useEffect(() => {
    if (shortcuts.length > 0) {
      localStorage.setItem('omnilaunch-shortcuts', JSON.stringify(shortcuts));
    }
  }, [shortcuts]);
  
  // Save global shortcuts setting when it changes
  useEffect(() => {
    localStorage.setItem('omnilaunch-global-shortcuts', String(enableGlobalShortcuts));
  }, [enableGlobalShortcuts]);

  // Start capturing keystrokes when a shortcut is being edited
  useEffect(() => {
    if (!activeShortcutId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      const keys: string[] = [];
      if (e.metaKey) keys.push('meta');
      if (e.ctrlKey) keys.push('ctrl');
      if (e.altKey) keys.push('alt');
      if (e.shiftKey) keys.push('shift');
      
      // Only add the key if it's not a modifier
      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        keys.push(e.key.toLowerCase());
      }
      
      // Only register shortcut if there's at least one modifier and one key
      if (keys.length >= 2) {
        const shortcutStr = keys.join('+');
        setTempShortcut(shortcutStr);
        setLastKeyPressed(e.key);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // If the user released a key and we have a temp shortcut, apply it
      if (tempShortcut && activeShortcutId) {
        setShortcuts(prev => 
          prev.map(s => 
            s.id === activeShortcutId 
              ? { ...s, shortcut: tempShortcut } 
              : s
          )
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeShortcutId, tempShortcut]);

  const startCapturing = (id: string) => {
    setActiveShortcutId(id);
    setTempShortcut('');
    if (captureRef.current) {
      captureRef.current.focus();
    }
  };

  const stopCapturing = () => {
    setActiveShortcutId(null);
    setTempShortcut('');
  };

  const resetToDefault = (id: string) => {
    setShortcuts(prev => 
      prev.map(s => 
        s.id === id 
          ? { ...s, shortcut: s.defaultShortcut } 
          : s
      )
    );
  };

  const saveShortcuts = async () => {
    setSaveStatus('saving');
    
    try {
      // First, save to localStorage (already done via useEffect)
      
      // Then, if in Electron, save to the main process for global shortcuts
      if (isElectron && window.electron && window.electron.shortcuts) {
        const success = await window.electron.shortcuts.saveShortcuts({
          shortcuts,
          enableGlobal: enableGlobalShortcuts
        });
        if (success) {
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
        }
      } else {
        // Just for web mode
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
      setSaveStatus('error');
    }
  };

  const formatShortcut = (shortcut: string) => {
    return shortcut
      .split('+')
      .map(key => {
        switch (key) {
          case 'meta': return '⌘';
          case 'ctrl': return '⌃';
          case 'alt': return '⌥';
          case 'shift': return '⇧';
          default: return key.charAt(0).toUpperCase() + key.slice(1);
        }
      })
      .join(' + ');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-800 bg-black">
        <button 
          onClick={() => onViewChange('command')}
          className="mr-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Settings className="mr-2" size={20} />
          Preferences
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900 to-black text-white">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Global Shortcuts Section */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Keyboard className="mr-2" size={18} />
              Keyboard Shortcuts
            </h3>
            
            {/* Global shortcuts toggle */}
            {isElectron && (
              <div className="mb-6 p-4 border border-gray-800 rounded-lg bg-gray-900/50">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-white">Global Shortcuts</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      When enabled, shortcuts work even when OmniLaunch is not in focus
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={enableGlobalShortcuts}
                      onChange={e => setEnableGlobalShortcuts(e.target.checked)}
                    />
                    <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="mt-3 text-xs text-yellow-400 flex items-start">
                  <div className="flex-shrink-0 mr-2 mt-0.5">⚠️</div>
                  <p>Changes to global shortcuts require saving preferences to take effect</p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div 
                  key={shortcut.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-900/50"
                >
                  <div className="flex-1 mr-4">
                    <div className="text-sm font-medium text-white">{shortcut.name}</div>
                    <div className="text-xs text-gray-400">{shortcut.description}</div>
                  </div>

                  <div className="flex items-center">
                    {activeShortcutId === shortcut.id ? (
                      <div 
                        ref={captureRef}
                        className="min-w-[140px] px-3 py-1.5 border border-blue-500 rounded bg-blue-900/30 text-white text-sm flex items-center justify-center"
                        tabIndex={0}
                      >
                        {tempShortcut ? formatShortcut(tempShortcut) : 'Press keys...'}
                        <button 
                          onClick={stopCapturing}
                          className="ml-2 p-0.5 rounded-full hover:bg-gray-700"
                        >
                          <X size={12} className="text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startCapturing(shortcut.id)}
                        className="min-w-[140px] px-3 py-1.5 border border-gray-700 rounded bg-gray-800 text-white text-sm hover:bg-gray-700"
                      >
                        {formatShortcut(shortcut.shortcut)}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => resetToDefault(shortcut.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800"
                      title="Reset to default"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button 
              onClick={saveShortcuts}
              disabled={saveStatus === 'saving'}
              className={`flex items-center px-4 py-2 rounded-lg ${
                saveStatus === 'saving' 
                  ? 'bg-gray-700 text-gray-300 cursor-wait'
                  : saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error' 
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Save className="mr-2" size={16} />
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error!' : 'Save Preferences'}
            </button>
          </div>

          {/* More sections can be added here */}
        </div>
      </div>
    </div>
  );
} 