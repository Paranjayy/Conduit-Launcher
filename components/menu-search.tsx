import React, { useState, useEffect, useRef } from 'react';
import { Search, MenuSquare, ArrowRight, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface MenuSearchProps {
  onViewChange: (view: string) => void;
}

interface MenuItem {
  name: string;
  path: string;
  hasSubMenu: boolean;
  enabled: boolean;
}

interface MenuData {
  appName: string;
  menuItems: MenuItem[];
}

export function MenuSearch({ onViewChange }: MenuSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  
  // Fetch menu items on initial load
  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('[MenuSearch] Attempting to fetch menu items...');
        
        // Try both possible API paths
        let getMenuItemsFunc = null;
        if (typeof window !== 'undefined' && window.electron) {
          if (window.electron.app?.getMenuItems) {
            getMenuItemsFunc = window.electron.app.getMenuItems;
          } else if (window.electron.menu?.getItems) {
            getMenuItemsFunc = window.electron.menu.getItems;
          }
        }
        
        if (getMenuItemsFunc) {
          console.log('[MenuSearch] Found menu API, calling...');
          const result = await getMenuItemsFunc() as MenuData | { error: string };
          console.log('[MenuSearch] Menu API result:', result);
          
          if ('error' in result) {
            console.error('[MenuSearch] API returned error:', result.error);
            setError(result.error);
            setMenuItems([]);
            setActiveApp(null);
          } else {
            console.log(`[MenuSearch] Successfully loaded ${result.menuItems?.length || 0} menu items for app: ${result.appName}`);
            setMenuItems(result.menuItems || []);
            setActiveApp(result.appName || 'Unknown');
          }
        } else {
          console.error('[MenuSearch] Menu API not available');
          setError('Menu search is only available in the Electron app on macOS');
          setMenuItems([]);
        }
      } catch (err) {
        console.error('[MenuSearch] Error fetching menu items:', err);
        setError(`Failed to fetch menu items: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMenuItems();
    
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Filter menu items when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems([]);
      return;
    }
    
    const lowercaseQuery = searchTerm.toLowerCase();
    const filtered = menuItems.filter(item => 
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.path.toLowerCase().includes(lowercaseQuery)
    );
    
    setFilteredItems(filtered);
    setSelectedIndex(0); // Reset selection on new filter
  }, [searchTerm, menuItems]);
  
  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && listRef.current && filteredItems.length > 0) {
      const container = listRef.current;
      const item = selectedItemRef.current;
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += (itemRect.bottom - containerRect.bottom) + 8;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop -= (containerRect.top - itemRect.top) + 8;
      }
    }
  }, [selectedIndex, filteredItems]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (filteredItems.length > 0 && selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          executeMenuItem(filteredItems[selectedIndex]);
        }
        break;
      case 'Escape':
        if (searchTerm) setSearchTerm('');
        else onViewChange('command');
        break;
      case 'Home':
        e.preventDefault();
        if (filteredItems.length > 0) setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (filteredItems.length > 0) setSelectedIndex(filteredItems.length - 1);
        break;
    }
  };
  
  const executeMenuItem = async (menuItem: MenuItem) => {
    if (!menuItem.enabled) {
      console.log('[MenuSearch] Menu item is disabled, skipping execution:', menuItem.name);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[MenuSearch] Executing menu item:', menuItem.path);
      
      // Try both possible API paths
      let executeMenuItemFunc = null;
      if (typeof window !== 'undefined' && window.electron) {
        if (window.electron.app?.executeMenuItem) {
          executeMenuItemFunc = window.electron.app.executeMenuItem;
        } else if (window.electron.menu?.executeItem) {
          executeMenuItemFunc = window.electron.menu.executeItem;
        }
      }
      
      if (executeMenuItemFunc) {
        const result = await executeMenuItemFunc(menuItem.path) as { success: boolean } | { error: string };
        console.log('[MenuSearch] Execute result:', result);
        
        if ('error' in result) {
          console.error('[MenuSearch] Execute failed:', result.error);
          setError(`Failed to execute: ${result.error}`);
        } else {
          console.log('[MenuSearch] Menu item executed successfully');
          // Hide the app after executing the menu item
          setTimeout(() => {
            onViewChange('command');
          }, 300);
        }
      } else {
        console.error('[MenuSearch] Execute API not available');
        setError('Menu execution is not available');
      }
    } catch (err) {
      console.error('[MenuSearch] Error executing menu item:', err);
      setError(`Failed to execute menu item: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshMenuItems = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (typeof window !== 'undefined' && window.electron?.app?.getMenuItems) {
        const result = await window.electron.app.getMenuItems() as MenuData | { error: string };
        
        if ('error' in result) {
          setError(result.error);
        } else {
          setMenuItems(result.menuItems || []);
          setActiveApp(result.appName || 'Unknown');
          setSearchTerm(''); // Clear search when refreshing
        }
      }
    } catch (err) {
      console.error('Error refreshing menu items:', err);
      setError('Failed to refresh menu items');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MenuSquare className="h-5 w-5 text-blue-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs text-gray-400">
            {activeApp ? `Active App: ${activeApp}` : 'No active app detected'}
          </div>
          <button 
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
            onClick={refreshMenuItems}
            disabled={isLoading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-red-400 mb-2">
              <AlertCircle className="h-10 w-10 mx-auto mb-2" />
              <p>{error}</p>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This feature requires the app to be running in Electron on macOS
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm"
              onClick={() => onViewChange('command')}
            >
              Back to Command Menu
            </button>
          </div>
        ) : searchTerm.trim() === '' ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-500 mb-2">
              <MenuSquare className="h-10 w-10 mx-auto mb-2" />
              <p>Type to search menu items</p>
            </div>
            <p className="text-sm text-gray-600">
              Search for commands in the active application
            </p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 px-3 py-1">
              {filteredItems.length} menu items found
            </div>
            <ul ref={listRef} className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar max-h-[calc(100vh-12rem)]">
              {filteredItems.map((item, index) => (
                <li 
                  key={item.path}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-100 ${
                    !item.enabled ? 'opacity-50 cursor-not-allowed' :
                    index === selectedIndex ? 'bg-blue-700 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'
                  }`}
                  onClick={() => item.enabled && executeMenuItem(item)}
                  onMouseEnter={() => item.enabled && setSelectedIndex(index)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1} // Keep focus on input
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.path}</p>
                  </div>
                  {item.hasSubMenu && (
                    <div className="ml-2 text-gray-400">
                      <MenuSquare className="h-4 w-4" />
                    </div>
                  )}
                  {index === selectedIndex && item.enabled && (
                    <ArrowRight className="h-4 w-4 text-blue-300 ml-2 flex-shrink-0" />
                  )}
                  {!item.enabled && (
                    <XCircle className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-500 mb-2">
              <Search className="h-10 w-10 mx-auto mb-2" />
              <p>No menu items found</p>
            </div>
            <p className="text-sm text-gray-600">Try a different search term</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 bg-gray-900 text-xs text-gray-500 flex justify-between">
        <span>{activeApp || 'No active app'}</span>
        <span>↑↓ Navigate | ↵ Execute | Esc Back</span>
      </div>
    </div>
  );
} 