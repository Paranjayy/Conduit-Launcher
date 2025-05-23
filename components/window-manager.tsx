"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Monitor, 
  Square, 
  Maximize, 
  Minimize2, 
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Grid3X3,
  SplitSquareVertical,
  SplitSquareHorizontal,
  Laptop
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  | "aiChat"
  | "fileSearch"
  | "windowManager";

interface WindowManagerProps {
  onViewChange: (view: ViewType) => void;
}

interface WindowInfo {
  id: string;
  title: string;
  app: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isActive: boolean;
}

interface WindowAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export function WindowManager({ onViewChange }: WindowManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'windows' | 'actions'>('actions');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  // Window management actions
  const windowActions: WindowAction[] = [
    {
      id: 'left-half',
      name: 'Left Half',
      description: 'Move active window to left half of screen',
      icon: <SplitSquareVertical className="h-5 w-5 rotate-180" />,
      action: () => resizeWindow('left-half'),
      shortcut: '⌘ ←'
    },
    {
      id: 'right-half',
      name: 'Right Half',
      description: 'Move active window to right half of screen',
      icon: <SplitSquareVertical className="h-5 w-5" />,
      action: () => resizeWindow('right-half'),
      shortcut: '⌘ →'
    },
    {
      id: 'maximize',
      name: 'Maximize',
      description: 'Maximize active window to full screen',
      icon: <Maximize className="h-5 w-5" />,
      action: () => resizeWindow('maximize'),
      shortcut: '⌘ M'
    },
    {
      id: 'center',
      name: 'Center Window',
      description: 'Center active window on screen',
      icon: <Move className="h-5 w-5" />,
      action: () => resizeWindow('center'),
      shortcut: '⌘ C'
    },
    {
      id: 'minimize',
      name: 'Minimize',
      description: 'Minimize active window',
      icon: <Minimize2 className="h-5 w-5" />,
      action: () => minimizeWindow(),
      shortcut: '⌘ H'
    }
  ];

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
    loadWindows();
  }, []);

  // Load current windows (mock data for now)
  const loadWindows = async () => {
    setIsLoading(true);
    try {
      // Use real window management API
      if (typeof window !== 'undefined' && window.electron?.windowManager?.getWindows) {
        console.log('[WindowManager] Fetching real windows...');
        const result = await window.electron.windowManager.getWindows();
        
        if ('error' in result) {
          console.error('[WindowManager] Error fetching windows:', result.error);
          setWindows([]);
        } else {
          const realWindows: WindowInfo[] = result.windows.map((win: any, index: number) => ({
            id: `${win.appName}-${win.title}-${index}`,
            title: win.title,
            app: win.appName,
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
            isMinimized: win.isMinimized,
            isActive: index === 0 // Assume first window is active
          }));
          console.log(`[WindowManager] Loaded ${realWindows.length} real windows`);
          setWindows(realWindows);
        }
      } else {
        console.warn('[WindowManager] Window management API not available, using mock data');
        // Fallback to mock data if API not available
        const mockWindows: WindowInfo[] = [
          {
            id: '1',
            title: 'VS Code - main.js',
            app: 'Visual Studio Code',
            x: 100,
            y: 100,
            width: 1200,
            height: 800,
            isMinimized: false,
            isActive: true
          },
          {
            id: '2',
            title: 'Safari - GitHub',
            app: 'Safari',
            x: 200,
            y: 200,
            width: 1000,
            height: 700,
            isMinimized: false,
            isActive: false
          }
        ];
        setWindows(mockWindows);
      }
    } catch (error) {
      console.error("Failed to load windows:", error);
      setWindows([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Window management actions
  const resizeWindow = async (action: string) => {
    try {
      console.log(`Window resize action: ${action}`);
      if (typeof window !== 'undefined' && window.electron?.windowManager?.resizeWindow) {
        const result = await window.electron.windowManager.resizeWindow(action);
        if ('error' in result) {
          console.error('[WindowManager] Error resizing window:', result.error);
        } else {
          console.log('[WindowManager] Window resized successfully');
        }
      } else {
        console.warn('[WindowManager] Window resize API not available');
      }
    } catch (error) {
      console.error("Failed to resize window:", error);
    }
  };

  const minimizeWindow = async () => {
    try {
      console.log("Minimizing window");
      if (typeof window !== 'undefined' && window.electron?.windowManager?.resizeWindow) {
        // Get the active window title first
        const activeWindow = windows.find(w => w.isActive);
        if (activeWindow && window.electron?.windowManager?.minimizeWindow) {
          const result = await window.electron.windowManager.minimizeWindow(activeWindow.title);
          if ('error' in result) {
            console.error('[WindowManager] Error minimizing window:', result.error);
          } else {
            console.log('[WindowManager] Window minimized successfully');
            // Refresh window list
            loadWindows();
          }
        }
      } else {
        console.warn('[WindowManager] Window minimize API not available');
      }
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const focusWindow = async (windowId: string) => {
    try {
      console.log(`Focusing window: ${windowId}`);
      const targetWindow = windows.find(w => w.id === windowId);
      if (targetWindow && typeof window !== 'undefined' && window.electron?.windowManager?.focusWindow) {
        const result = await window.electron.windowManager.focusWindow(targetWindow.title);
        if ('error' in result) {
          console.error('[WindowManager] Error focusing window:', result.error);
        } else {
          console.log('[WindowManager] Window focused successfully');
          // Refresh window list to update active state
          loadWindows();
        }
      } else {
        console.warn('[WindowManager] Window focus API not available or window not found');
      }
    } catch (error) {
      console.error("Failed to focus window:", error);
    }
  };

  // Filter windows and actions based on search
  const filteredItems = searchQuery.trim() === "" 
    ? (activeMode === 'actions' ? windowActions : windows)
    : activeMode === 'actions' 
      ? windowActions.filter(action => 
          action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : windows.filter(window =>
          window.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          window.app.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (filteredItems.length > 0) {
          setSelectedIndex((prev) => prev < filteredItems.length - 1 ? prev + 1 : prev);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        if (filteredItems.length > 0 && selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          const item = filteredItems[selectedIndex];
          if (activeMode === 'actions') {
            (item as WindowAction).action();
          } else {
            focusWindow((item as WindowInfo).id);
          }
        }
        break;
      case "Escape":
        if (searchQuery) {
          setSearchQuery("");
        } else {
          onViewChange("command");
        }
        break;
      case "Tab":
        e.preventDefault();
        setActiveMode(prev => prev === 'actions' ? 'windows' : 'actions');
        setSelectedIndex(0);
        break;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && listRef.current) {
      const container = listRef.current;
      const item = selectedItemRef.current;
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      
      if (itemRect.bottom > containerRect.bottom) {
        container.scrollTop += itemRect.bottom - containerRect.bottom + 8;
      } else if (itemRect.top < containerRect.top) {
        container.scrollTop -= containerRect.top - itemRect.top + 8;
      }
    }
  }, [selectedIndex]);

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder={`Search ${activeMode}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* Mode Selector */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setActiveMode('actions');
              setSelectedIndex(0);
            }}
            className={cn(
              "flex-1 px-3 py-2 rounded text-sm font-medium transition-colors",
              activeMode === 'actions'
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Grid3X3 className="h-4 w-4 inline mr-2" />
            Actions ({windowActions.length})
          </button>
          <button
            onClick={() => {
              setActiveMode('windows');
              setSelectedIndex(0);
              loadWindows();
            }}
            className={cn(
              "flex-1 px-3 py-2 rounded text-sm font-medium transition-colors",
              activeMode === 'windows'
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Laptop className="h-4 w-4 inline mr-2" />
            Windows ({windows.length})
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 px-3 py-1">
              {filteredItems.length} {activeMode} found
            </div>
            <ul
              ref={listRef}
              className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar max-h-[calc(100vh-15rem)]"
            >
              {filteredItems.map((item, index) => (
                <li
                  key={activeMode === 'actions' ? (item as WindowAction).id : (item as WindowInfo).id}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  className={cn(
                    "flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-100",
                    index === selectedIndex
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-gray-800 text-gray-300"
                  )}
                  onClick={() => {
                    if (activeMode === 'actions') {
                      (item as WindowAction).action();
                    } else {
                      focusWindow((item as WindowInfo).id);
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center bg-gray-800/30 rounded-md">
                    {activeMode === 'actions' ? (
                      (item as WindowAction).icon
                    ) : (
                      <Square className={cn(
                        "h-5 w-5",
                        (item as WindowInfo).isActive ? "text-green-400" : "text-gray-400"
                      )} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activeMode === 'actions' 
                        ? (item as WindowAction).name 
                        : (item as WindowInfo).title
                      }
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activeMode === 'actions' 
                        ? (item as WindowAction).description
                        : `${(item as WindowInfo).app} • ${(item as WindowInfo).width}×${(item as WindowInfo).height}`
                      }
                    </p>
                  </div>
                  {activeMode === 'actions' && (item as WindowAction).shortcut && (
                    <div className="flex-shrink-0 ml-2">
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {(item as WindowAction).shortcut}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-500 mb-2">
              <Monitor className="h-10 w-10 mx-auto mb-2" />
              <p>No {activeMode} found</p>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-600">
                Try a different search term
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-900 text-xs text-gray-500 flex justify-between">
        <span>{filteredItems.length} {activeMode}</span>
        <span>↑↓ Navigate | ↵ Execute | ⇥ Switch Mode | Esc Back</span>
      </div>
    </div>
  );
}
