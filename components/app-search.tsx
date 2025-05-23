import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Laptop, ArrowRight, Filter, ChevronDown } from 'lucide-react';
import { AppSearchProvider } from '@/lib/providers/app-provider';
import type { SearchResult } from '@/lib/search-providers';

// Define filter categories
type FilterCategory = 'all' | 'system' | 'user' | 'utilities' | 'creativity' | 'productivity';

interface AppSearchProps {
  onViewChange: (view: ViewType) => void;
}

type ViewType = 
  | "command" 
  | "clipboard" 
  | "pasteStack" 
  | "snippets" 
  | "appSearch" 
  | "preferences" 
  | "contextualShortcuts" 
  | "calculator" 
  | "menuSearch" 
  | "notes" 
  | "multiClipboard"
  | "emojiSearch"
  | "aiChat";

export function AppSearch({ onViewChange }: AppSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredApps, setFilteredApps] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize the provider instance
  const appSearchProvider = useMemo(() => new AppSearchProvider(), []);

  // Test base64 image to verify if base64 images work at all
  const testBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Listen to provider updates
    const unsubscribe = appSearchProvider.subscribe(() => {
      // Trigger a search to refresh the list when cache updates
      console.log('App cache updated, icon data may have been received.');
      setSearchTerm(prevTerm => prevTerm); // Re-trigger search with current term
    });
    return unsubscribe;
  }, [appSearchProvider]);

  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const results = await appSearchProvider.search(searchTerm);
        
        // Apply category filtering
        let filteredResults = results;
        if (filterCategory !== 'all') {
          filteredResults = filterAppsByCategory(results, filterCategory);
        }
        
        setFilteredApps(filteredResults);
      } catch (error) {
        console.error("Error searching apps:", error);
        setLoadError('Failed to search applications.');
        setFilteredApps([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchTerm, appSearchProvider, filterCategory]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && listRef.current) {
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
  }, [selectedIndex]);

  // Filter apps based on selected category
  const filterAppsByCategory = (apps: SearchResult[], category: FilterCategory): SearchResult[] => {
    switch (category) {
      case 'system':
        return apps.filter(app => app.description?.includes('/System/Applications'));
      case 'user':
        return apps.filter(app => app.description?.includes('/Users/'));
      case 'utilities':
        // Simplified logic - in a real app, you might have more sophisticated category detection
        const utilityKeywords = ['calculator', 'terminal', 'console', 'system', 'preferences', 'utility'];
        return apps.filter(app => 
          utilityKeywords.some(keyword => 
            app.title.toLowerCase().includes(keyword)
          )
        );
      case 'creativity':
        const creativeKeywords = ['photo', 'image', 'video', 'audio', 'music', 'draw', 'paint', 'edit'];
        return apps.filter(app => 
          creativeKeywords.some(keyword => 
            app.title.toLowerCase().includes(keyword)
          )
        );
      case 'productivity':
        const productivityKeywords = ['office', 'document', 'spreadsheet', 'presentation', 'notes', 'mail', 'calendar'];
        return apps.filter(app => 
          productivityKeywords.some(keyword => 
            app.title.toLowerCase().includes(keyword)
          )
        );
      default:
        return apps;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Close dropdown on Escape if it's open
    if (e.key === 'Escape' && showFilterDropdown) {
      setShowFilterDropdown(false);
      return;
    }
    
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
          launchApplication(filteredApps[selectedIndex]);
        }
        break;
      case 'Escape':
        if (searchTerm) setSearchTerm('');
        else onViewChange('command');
        break;
      case 'Home':
        e.preventDefault();
        if (filteredApps.length > 0) setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (filteredApps.length > 0) setSelectedIndex(filteredApps.length - 1);
        break;
      case 'PageUp':
        e.preventDefault();
        if (filteredApps.length > 0) setSelectedIndex(prev => Math.max(0, prev - 5));
        break;
      case 'PageDown':
        e.preventDefault();
        if (filteredApps.length > 0) setSelectedIndex(prev => Math.min(filteredApps.length - 1, prev + 5));
        break;
    }
  };

  const launchApplication = (appResult: SearchResult) => {
    if (appResult.action) {
      appResult.action(); // This should call the action defined in AppSearchProvider
      // onViewChange('command'); // Or hide window if preferred
    } else {
      console.error('No action defined for app:', appResult.title);
    }
  };

  const handleImageError = (appPath: string) => {
    // console.log(`[AppSearch] Failed to load icon for: ${appPath}, using fallback.`);
    setFailedIcons(prev => new Set(prev).add(appPath));
  };

  const renderAppIcon = (searchResult: SearchResult) => {
    const appPath = searchResult.metadata?.path || searchResult.id;
    const iconData = searchResult.metadata?.rawIcon; // Use the raw base64 string

    // Enhanced logging for debugging
    console.log(`[AppSearch] Rendering icon for ${searchResult.title}:`, {
      hasIconData: !!iconData,
      iconDataType: typeof iconData,
      iconDataLength: iconData?.length || 0,
      isFailed: failedIcons.has(appPath),
      appPath,
      iconDataPrefix: iconData?.substring(0, 50) || 'no data'
    });

    if (!iconData || typeof iconData !== 'string' || failedIcons.has(appPath)) {
      console.log(`[AppSearch] Using fallback icon for ${searchResult.title}`);
      return <Laptop className="h-6 w-6 text-blue-400" />;
    }

    // Ensure the iconData has the proper data URL format
    let processedIconData = iconData;
    if (iconData && !iconData.startsWith('data:')) {
      // If iconData is just base64 without the prefix, add it
      processedIconData = `data:image/png;base64,${iconData}`;
      console.log(`[AppSearch] Added data URL prefix for ${searchResult.title}`);
    }

    // Test if this is a valid data URL
    try {
      new URL(processedIconData);
    } catch (e) {
      console.error(`[AppSearch] Invalid data URL for ${searchResult.title}:`, e);
      return <Laptop className="h-6 w-6 text-blue-400" />;
    }

    console.log(`[AppSearch] Attempting to render image for ${searchResult.title} with ${processedIconData.length} character data URL`);

    return (
      <div className="relative w-6 h-6">
        <img 
          src={processedIconData} 
          alt={`${searchResult.title} icon`}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error(`[AppSearch] Image failed to load for ${searchResult.title}:`, {
              src: processedIconData?.substring(0, 50) + '...',
              error: e,
              naturalWidth: (e.target as HTMLImageElement).naturalWidth,
              naturalHeight: (e.target as HTMLImageElement).naturalHeight
            });
            handleImageError(appPath);
          }}
          onLoad={(e) => {
            console.log(`[AppSearch] Image loaded successfully for ${searchResult.title}:`, {
              naturalWidth: (e.target as HTMLImageElement).naturalWidth,
              naturalHeight: (e.target as HTMLImageElement).naturalHeight
            });
          }}
          loading="lazy" // Add lazy loading for better performance with many icons
        />
      </div>
    );
  };

  const getCategoryDisplayName = (category: FilterCategory): string => {
    switch (category) {
      case 'all': return 'All Applications';
      case 'system': return 'System Apps';
      case 'user': return 'User Apps';
      case 'utilities': return 'Utilities';
      case 'creativity': return 'Creativity';
      case 'productivity': return 'Productivity';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      <div className="p-4 space-y-2">
        {/* Debug section - temporary */}
        <div className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
          Debug: Cache size: {appSearchProvider.getCacheStats().totalApps}, 
          Apps with icons: {appSearchProvider.getCacheStats().appsWithIcons}
          <button 
            onClick={() => {
              console.log('[Debug] Manual refresh triggered');
              console.log('[Debug] Cache stats:', appSearchProvider.getCacheStats());
              appSearchProvider.search(searchTerm).then(results => {
                console.log('[Debug] Manual search results:', results.length);
                setFilteredApps(results);
              });
            }}
            className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Refresh
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        
        {/* Filter dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-left bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowFilterDropdown(prev => !prev)}
            type="button"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-blue-400" />
              <span>{getCategoryDisplayName(filterCategory)}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          
          {showFilterDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 rounded-md shadow-lg py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
              {(['all', 'system', 'user', 'utilities', 'creativity', 'productivity'] as FilterCategory[]).map((category) => (
                <button
                  key={category}
                  className={`block px-4 py-2 text-left w-full hover:bg-gray-700 ${
                    category === filterCategory ? 'bg-blue-700 text-white' : 'text-gray-300'
                  }`}
                  onClick={() => {
                    setFilterCategory(category);
                    setShowFilterDropdown(false);
                    setSelectedIndex(0); // Reset selection on filter change
                  }}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 px-3 py-1">
              Showing {filteredApps.length} applications
            </div>
            <ul ref={listRef} className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar max-h-[calc(100vh-15rem)]">
              {filteredApps.map((app, index) => (
                <li 
                  key={app.id}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-100 ${
                    index === selectedIndex ? 'bg-blue-700 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'
                  }`}
                  onClick={() => launchApplication(app)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1} // Keep focus on input
                >
                  <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center bg-gray-800/50 rounded-md p-1">
                    {renderAppIcon(app)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{app.title}</p>
                    <p className="text-xs text-gray-500 truncate">{app.description}</p>
                  </div>
                  {index === selectedIndex && <ArrowRight className="h-4 w-4 text-blue-300 ml-2 flex-shrink-0" />}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-500 mb-2">
              <Search className="h-10 w-10 mx-auto mb-2" />
              <p>No applications found</p>
            </div>
            {searchTerm && <p className="text-sm text-gray-600">Try a different search term</p>}
            {!searchTerm && filterCategory !== 'all' && (
              <p className="text-sm text-gray-600">Try a different category</p>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-gray-800 bg-gray-900 text-xs text-gray-500 flex justify-between">
        <span>{filteredApps.length} results</span>
        <span>↑↓ Navigate | ↵ Select | Esc Back</span>
      </div>
    </div>
  );
} 