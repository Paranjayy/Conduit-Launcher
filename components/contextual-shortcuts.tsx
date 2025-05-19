import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash, Save, Settings, X, Info, Laptop } from 'lucide-react';

interface ContextualShortcut {
  id: string;
  name: string;
  shortcut: string;
  appBundleId?: string;
  appName?: string;
  action: string;
  isEnabled: boolean;
}

interface ContextualShortcutsProps {
  onClose: () => void;
}

export function ContextualShortcuts({ onClose }: ContextualShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<ContextualShortcut[]>([]);
  const [applications, setApplications] = useState<Array<{name: string; path: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Load shortcuts and applications
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load applications
      if ((window as any).electron?.app) {
        try {
          const apps = await (window as any).electron.app.getApplications();
          if (Array.isArray(apps)) {
            // Just need name and path for this feature
            setApplications(apps.map(app => ({ name: app.name, path: app.path })));
          }
        } catch (error) {
          console.error('Failed to load applications:', error);
        }
      }
      
      // Load contextual shortcuts from user preferences
      // For now, use a mock implementation
      // TODO: Implement actual loading from preferences
      setShortcuts([
        {
          id: 'contextual-1',
          name: 'Open New Tab',
          shortcut: 'cmd+t',
          appBundleId: '/Applications/Google Chrome.app',
          appName: 'Google Chrome',
          action: 'new-tab',
          isEnabled: true
        },
        {
          id: 'contextual-2',
          name: 'Quick Note',
          shortcut: 'alt+n',
          appBundleId: '/Applications/Notes.app',
          appName: 'Notes',
          action: 'create-note',
          isEnabled: true
        }
      ]);
      
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  // Handle adding a new shortcut
  const addShortcut = () => {
    const newId = `contextual-${Date.now()}`;
    const newShortcut: ContextualShortcut = {
      id: newId,
      name: 'New Shortcut',
      shortcut: '',
      action: '',
      isEnabled: true
    };
    
    setShortcuts([...shortcuts, newShortcut]);
  };
  
  // Handle removing a shortcut
  const removeShortcut = (id: string) => {
    setShortcuts(shortcuts.filter(shortcut => shortcut.id !== id));
  };
  
  // Handle updating a shortcut
  const updateShortcut = (id: string, field: keyof ContextualShortcut, value: any) => {
    setShortcuts(shortcuts.map(shortcut => 
      shortcut.id === id ? { ...shortcut, [field]: value } : shortcut
    ));
  };
  
  // Handle saving shortcuts
  const saveShortcuts = async () => {
    setSaveStatus('saving');
    
    // TODO: Implement actual saving to preferences
    // For now, just simulate a save with timeout
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('saved');
      
      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Failed to save shortcuts:', error);
      setSaveStatus('error');
    }
  };
  
  // Handle app selection
  const handleAppSelect = (id: string, appPath: string) => {
    const selectedApp = applications.find(app => app.path === appPath);
    
    if (selectedApp) {
      updateShortcut(id, 'appBundleId', appPath);
      updateShortcut(id, 'appName', selectedApp.name);
    }
  };
  
  // Render save button with appropriate status
  const renderSaveButton = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <button 
            className="px-4 py-2 bg-gray-700 text-white rounded-md flex items-center space-x-2 opacity-50 cursor-wait"
            disabled
          >
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Saving...</span>
          </button>
        );
      case 'saved':
        return (
          <button 
            className="px-4 py-2 bg-green-700 text-white rounded-md flex items-center space-x-2"
            disabled
          >
            <Save className="h-4 w-4" />
            <span>Saved!</span>
          </button>
        );
      case 'error':
        return (
          <button 
            className="px-4 py-2 bg-red-700 text-white rounded-md flex items-center space-x-2"
            onClick={saveShortcuts}
          >
            <X className="h-4 w-4" />
            <span>Error - Try Again</span>
          </button>
        );
      default:
        return (
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-2"
            onClick={saveShortcuts}
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        );
    }
  };
  
  // Render app selection dropdown with icons
  const renderAppSelector = (shortcut: ContextualShortcut) => {
    return (
      <div>
        <label className="block text-sm text-gray-400 mb-1">Target Application</label>
        <div className="relative">
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white appearance-none pl-9"
            value={shortcut.appBundleId || ''}
            onChange={(e) => handleAppSelect(shortcut.id, e.target.value)}
          >
            <option value="">Select an application</option>
            {applications.map(app => (
              <option key={app.path} value={app.path}>
                {app.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <Laptop className="h-5 w-5 text-blue-400" />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Contextual Shortcuts</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-full"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Info banner */}
      <div className="bg-gray-800 p-3 flex items-start space-x-3 text-sm">
        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p>
          Contextual shortcuts allow you to define app-specific keyboard shortcuts. 
          When the specified app is active, OmniLaunch will apply these shortcuts.
        </p>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {shortcuts.map(shortcut => (
              <div 
                key={shortcut.id} 
                className="bg-gray-800 p-4 rounded-lg border border-gray-700"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      placeholder="Shortcut Name"
                      value={shortcut.name}
                      onChange={(e) => updateShortcut(shortcut.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="ml-2">
                    <button
                      onClick={() => removeShortcut(shortcut.id)}
                      className="p-2 hover:bg-gray-700 rounded-full text-red-400 hover:text-red-300"
                      aria-label="Remove shortcut"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Keyboard Shortcut</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      placeholder="e.g., cmd+shift+p"
                      value={shortcut.shortcut}
                      onChange={(e) => updateShortcut(shortcut.id, 'shortcut', e.target.value)}
                    />
                  </div>
                  
                  {renderAppSelector(shortcut)}
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Action</label>
                    <input
                      type="text"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      placeholder="Action to perform"
                      value={shortcut.action}
                      onChange={(e) => updateShortcut(shortcut.id, 'action', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center pt-6">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={shortcut.isEnabled}
                        onChange={(e) => updateShortcut(shortcut.id, 'isEnabled', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-300">Enabled</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add new shortcut button */}
            <button
              onClick={addShortcut}
              className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center space-x-2 text-gray-400 hover:text-blue-400 hover:border-blue-400 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Add New Shortcut</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-800 p-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md"
        >
          Cancel
        </button>
        {renderSaveButton()}
      </div>
    </div>
  );
} 