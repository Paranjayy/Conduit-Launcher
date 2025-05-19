import React, { useState, useEffect, useRef } from 'react';
import { Search, Laptop, ArrowRight } from 'lucide-react';

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
        onAdditionalApps: (callback: (apps: Array<{name: string; path: string; icon: string}>) => void) => () => void;
      };
      shortcuts?: {
        saveShortcuts: (config: any) => Promise<boolean>;
        onGlobalShortcut: (callback: (id: string) => void) => () => void;
      };
    };
  }
}

interface AppSearchProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | "preferences") => void;
}

interface Application {
  name: string;
  path: string;
  icon: string;
}

// Simple cache for applications
let cachedApps: Application[] | null = null;
let lastCacheTime = 0;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

export function AppSearch({ onViewChange }: AppSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const isElectron = typeof window !== 'undefined' && !!window.electron;

  // Load applications when component mounts
  useEffect(() => {
    const loadApplications = async () => {
      if (isElectron && window.electron) {
        try {
          setIsLoading(true);
          setLoadError(null);
          
          // Check cache first
          const now = Date.now();
          if (cachedApps && now - lastCacheTime < CACHE_EXPIRY) {
            console.log('Using cached applications list');
            setApplications(cachedApps);
            setFilteredApps(cachedApps);
            setIsLoading(false);
            return;
          }
          
          console.log('Fetching fresh applications list');
          const apps = await window.electron.app.getApplications();
          
          if (apps && Array.isArray(apps)) {
            // Clean the data to ensure no invalid icons
            const cleanedApps = apps.map(app => ({
              ...app,
              // For now, we'll skip icons since they're causing issues
              icon: '' // Instead of: typeof app.icon === 'string' ? app.icon : ''
            }));
            
            // Update cache
            cachedApps = cleanedApps;
            lastCacheTime = now;
            
            setApplications(cleanedApps);
            setFilteredApps(cleanedApps);
          } else {
            setLoadError('No applications found');
          }
        } catch (error) {
          console.error('Error loading applications:', error);
          setLoadError('Failed to load applications');
          
          // Use cache as fallback if available
          if (cachedApps) {
            console.log('Using cached applications as fallback after error');
            setApplications(cachedApps);
            setFilteredApps(cachedApps);
            setLoadError(null);
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setLoadError('Electron environment not detected');
        setIsLoading(false);
      }
    };

    loadApplications();
    
    // Set up a listener for additional apps that come in asynchronously
    let cleanupListener: (() => void) | null = null;
    
    if (isElectron && window.electron && window.electron.app.onAdditionalApps) {
      cleanupListener = window.electron.app.onAdditionalApps((additionalApps) => {
        if (additionalApps && Array.isArray(additionalApps) && additionalApps.length > 0) {
          console.log(`Received ${additionalApps.length} additional apps`);
          
          setApplications(currentApps => {
            // Create a map of existing paths to avoid duplicates
            const existingPaths = new Set(currentApps.map(app => app.path));
            
            // Only add apps that don't already exist
            const newApps = additionalApps.filter(app => !existingPaths.has(app.path));
            
            if (newApps.length === 0) return currentApps;
            
            // Create a new merged and sorted array
            const mergedApps = [...currentApps, ...newApps];
            mergedApps.sort((a, b) => a.name.localeCompare(b.name));
            
            // Update cache
            cachedApps = mergedApps;
            lastCacheTime = Date.now();
            
            return mergedApps;
          });
        }
      });
    }
    
    // Cleanup listener when component unmounts
    return () => {
      if (cleanupListener) {
        cleanupListener();
      }
    };
  }, [isElectron]);

  // Update filtered apps when applications or search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredApps(applications);
    } else {
      const filtered = applications.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    }
    setSelectedIndex(0);
  }, [searchTerm, applications]);

  // Scroll the selected item into view when selectedIndex changes
  useEffect(() => {
    if (selectedItemRef.current && listRef.current) {
      // Get the container's bounds
      const container = listRef.current;
      const item = selectedItemRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      
      // Check if the item is outside the visible area
      if (itemRect.bottom > containerRect.bottom) {
        // Item is below the visible area
        container.scrollTop += (itemRect.bottom - containerRect.bottom) + 8; // Add a small buffer
      } else if (itemRect.top < containerRect.top) {
        // Item is above the visible area
        container.scrollTop -= (containerRect.top - itemRect.top) + 8; // Add a small buffer
      }
    }
  }, [selectedIndex]);

  // Focus input on mount and when component receives focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Automatically focus when the component is mounted
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus input when window receives focus
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', focusInput);
      
      return () => {
        window.removeEventListener('focus', focusInput);
      };
    }
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (filteredApps.length > 0) {
          setSelectedIndex(prev => 
            prev < filteredApps.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (filteredApps.length > 0 && selectedIndex >= 0 && selectedIndex < filteredApps.length) {
          launchApplication(filteredApps[selectedIndex].path);
        }
        break;
      case 'Escape':
        if (searchTerm) {
          // Clear search first if there's text
          setSearchTerm('');
        } else {
          // Go back to command view if search is already empty
          onViewChange('command');
        }
        break;
      // Add Home and End key support
      case 'Home':
        e.preventDefault();
        if (filteredApps.length > 0) {
          setSelectedIndex(0);
        }
        break;
      case 'End':
        e.preventDefault();
        if (filteredApps.length > 0) {
          setSelectedIndex(filteredApps.length - 1);
        }
        break;
      // Add Page Up and Page Down support
      case 'PageUp':
        e.preventDefault();
        if (filteredApps.length > 0) {
          setSelectedIndex(prev => Math.max(0, prev - 5));
        }
        break;
      case 'PageDown':
        e.preventDefault();
        if (filteredApps.length > 0) {
          setSelectedIndex(prev => Math.min(filteredApps.length - 1, prev + 5));
        }
        break;
    }
  };

  // Launch selected application
  const launchApplication = async (appPath: string) => {
    if (!appPath) {
      console.error('Attempted to launch app with empty path');
      return;
    }
    
    if (isElectron && window.electron) {
      try {
        // Hide the window first for faster perceived response
        if (window.electron.window) {
          window.electron.window.minimize();
        }
        
        const success = await window.electron.app.launchApplication(appPath);
        if (success) {
          console.log(`Launched application: ${appPath}`);
          // Go back to command view after successful launch
          onViewChange('command');
        }
      } catch (error) {
        console.error('Error launching application:', error);
      }
    }
  };

  // Safely render app icon with error handling
  const renderAppIcon = (app: Application) => {
    if (!app || !app.icon) {
      return <Laptop className="h-6 w-6 text-gray-400" />;
    }
    
    try {
      return (
        <img 
          src={`data:image/png;base64,${app.icon}`} 
          alt={app.name} 
          className="h-8 w-8 object-contain"
          onError={(e) => {
            // Replace with fallback icon on error
            e.currentTarget.style.display = 'none';
            e.currentTarget.onerror = null;
          }}
        />
      );
    } catch (error) {
      return <Laptop className="h-6 w-6 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search applications... (e.g., Chrome, Finder)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
      </div>

      {/* Applications list */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-red-400 mb-2">
              <Search className="h-10 w-10 mx-auto mb-2" />
              <p>{loadError}</p>
            </div>
            <p className="text-sm text-gray-500">Try restarting the application</p>
          </div>
        ) : filteredApps.length > 0 ? (
          <ul 
            ref={listRef}
            className="flex-1 overflow-y-auto px-2 space-y-1"
            role="listbox"
          >
            {filteredApps.map((app, index) => (
              <li 
                key={app.path}
                ref={index === selectedIndex ? selectedItemRef : null}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  index === selectedIndex ? 'bg-blue-900 text-white' : 'hover:bg-gray-800 text-gray-200'
                }`}
                onClick={() => launchApplication(app.path)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={index === selectedIndex}
                tabIndex={index === selectedIndex ? 0 : -1}
              >
                <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center">
                  <Laptop className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{app.name}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-400 mb-2">
              <Search className="h-10 w-10 mx-auto mb-2" />
              <p>No applications found</p>
            </div>
            <p className="text-sm text-gray-500">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={() => onViewChange('command')}
          className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center"
        >
          Back to Command View
        </button>
      </div>
    </div>
  );
} 