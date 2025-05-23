"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Folder,
  File,
  ArrowLeft,
  Filter,
  ChevronDown,
  ExternalLink,
  Copy,
  ArrowRight,
  Home,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  | "fileSearch";

interface FileSearchProps {
  onViewChange: (view: ViewType) => void;
}

interface FileResult {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
}

export function FileSearch({ onViewChange }: FileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState("");
  const [results, setResults] = useState<FileResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchMode, setSearchMode] = useState<'browse' | 'search'>('browse');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "files" | "folders">(
    "all",
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewItem, setPreviewItem] = useState<FileResult | null>(null);
  const [showAppSelector, setShowAppSelector] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
    loadHomeDirectory();
  }, []);

  // Load home directory on startup
  const loadHomeDirectory = async () => {
    if (typeof window !== "undefined" && window.electron?.files) {
      try {
        const homeDir = await window.electron.files.getHomeDirectory();
        setCurrentPath(homeDir);
        loadDirectory(homeDir);
      } catch (error) {
        console.error("Failed to load home directory:", error);
        setCurrentPath("/");
        loadDirectory("/");
      }
    }
  };

  // Load directory contents
  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined" && window.electron?.files) {
        const files = await window.electron.files.readDirectory(path);
        setResults(files.map(file => ({
          name: file.name,
          path: file.path,
          type: file.isDirectory ? 'folder' : 'file',
          size: file.size,
          modified: file.modified ? new Date(file.modified) : undefined
        })));
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Failed to load directory:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Search files and folders
  const searchFiles = async (query: string) => {
    if (!query.trim()) {
      setSearchMode('browse');
      loadDirectory(currentPath);
      return;
    }

    setSearchMode('search');
    setIsLoading(true);
    try {
      if (typeof window !== "undefined" && window.electron?.files) {
        const searchResults = await window.electron.files.searchFiles(query, currentPath);
        setResults(searchResults.map(file => ({
          name: file.name,
          path: file.path,
          type: file.isDirectory ? 'folder' : 'file',
          size: file.size,
          modified: file.modified ? new Date(file.modified) : undefined
        })));
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Failed to search files:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFiles(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentPath]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (results.length > 0) {
          setSelectedIndex((prev) => prev < results.length - 1 ? prev + 1 : prev);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
          handleItemAction(results[selectedIndex]);
        }
        break;
      case " ": // Space bar for preview
        e.preventDefault();
        if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
          const item = results[selectedIndex];
          if (item.type === 'file') {
            setPreviewItem(item);
            setShowPreview(true);
          }
        }
        break;
      case "k":
        if (e.metaKey && results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          const item = results[selectedIndex];
          if (item.type === 'file') {
            setPreviewItem(item);
            setShowAppSelector(true);
          }
        }
        break;
      case "Escape":
        if (showPreview) {
          setShowPreview(false);
          setPreviewItem(null);
        } else if (showAppSelector) {
          setShowAppSelector(false);
          setPreviewItem(null);
        } else if (searchQuery) {
          setSearchQuery("");
        } else {
          onViewChange("command");
        }
        break;
      case "Backspace":
        if (e.metaKey && !searchQuery) {
          navigateUp();
        }
        break;
    }
  };

  // Handle item action (open file/folder)
  const handleItemAction = async (item: FileResult) => {
    if (item.type === 'folder') {
      setCurrentPath(item.path);
      setSearchQuery("");
      loadDirectory(item.path);
    } else {
      // Open file
      try {
        if (typeof window !== "undefined" && window.electron?.files) {
          await window.electron.files.openFile(item.path);
        }
      } catch (error) {
        console.error("Failed to open file:", error);
      }
    }
  };

  // Navigate up one directory
  const navigateUp = () => {
    if (currentPath === "/" || !currentPath) return;
    
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
    loadDirectory(parentPath);
  };

  // Navigate to home directory
  const navigateHome = () => {
    loadHomeDirectory();
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

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format file date
  const formatDate = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={navigateHome}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          
          {currentPath !== "/" && (
            <button
              onClick={navigateUp}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>Up</span>
            </button>
          )}
          
          <div className="flex-1 px-2 py-1 bg-gray-900 rounded text-gray-400 truncate">
            {currentPath || "/"}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : results.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <div className="text-xs text-gray-500 px-3 py-1">
              {searchMode === 'search' 
                ? `Found ${results.length} items`
                : `${results.length} items in folder`
              }
            </div>
            <ul
              ref={listRef}
              className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar max-h-[calc(100vh-15rem)]"
            >
              {results.map((item, index) => (
                <li
                  key={item.path}
                  ref={index === selectedIndex ? selectedItemRef : null}
                  className={cn(
                    "flex items-center p-3 rounded-lg cursor-pointer transition-colors duration-100",
                    index === selectedIndex
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-gray-800 text-gray-300"
                  )}
                  onClick={() => handleItemAction(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center">
                    {item.type === 'folder' ? (
                      <Folder className="h-6 w-6 text-blue-400" />
                    ) : (
                      <File className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="truncate">{item.path}</span>
                      {item.size && <span>{formatFileSize(item.size)}</span>}
                      {item.modified && <span>{formatDate(item.modified)}</span>}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <ArrowRight className="h-4 w-4 text-blue-300 ml-2 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-500 mb-2">
              {searchMode === 'search' ? (
                <>
                  <Search className="h-10 w-10 mx-auto mb-2" />
                  <p>No files found</p>
                </>
              ) : (
                <>
                  <FolderOpen className="h-10 w-10 mx-auto mb-2" />
                  <p>Empty folder</p>
                </>
              )}
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
        <span>{results.length} items</span>
        <span>↑↓ Navigate | ↵ Open | ⌫ Up | Esc Back</span>
      </div>
    </div>
  );
}
