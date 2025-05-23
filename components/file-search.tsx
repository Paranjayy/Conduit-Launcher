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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileSearchProps {
  onViewChange: (view: string) => void;
}

interface FileResult {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  size?: number;
  modified?: Date;
  extension?: string;
}

// Mock file search results for demonstration
const MOCK_FILES: FileResult[] = [
  {
    id: "1",
    name: "Documents",
    path: "/Users/username/Documents",
    type: "folder",
    modified: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "project.tsx",
    path: "/Users/username/Projects/omnilaunch/project.tsx",
    type: "file",
    size: 2048,
    modified: new Date("2024-01-20"),
    extension: "tsx",
  },
  {
    id: "3",
    name: "README.md",
    path: "/Users/username/Projects/omnilaunch/README.md",
    type: "file",
    size: 1024,
    modified: new Date("2024-01-18"),
    extension: "md",
  },
  {
    id: "4",
    name: "package.json",
    path: "/Users/username/Projects/omnilaunch/package.json",
    type: "file",
    size: 512,
    modified: new Date("2024-01-19"),
    extension: "json",
  },
];

export function FileSearch({ onViewChange }: FileSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileResult[]>(MOCK_FILES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filterType, setFilterType] = useState<"all" | "files" | "folders">(
    "all",
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter files based on search query and type filter
  useEffect(() => {
    let results = MOCK_FILES;

    // Apply search filter
    if (searchQuery.trim()) {
      results = results.filter(
        (file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.path.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      results = results.filter((file) =>
        filterType === "files" ? file.type === "file" : file.type === "folder",
      );
    }

    setFilteredFiles(results);
    setSelectedIndex(0);
  }, [searchQuery, filterType]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && showFilterDropdown) {
      setShowFilterDropdown(false);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (filteredFiles.length > 0) {
          setSelectedIndex((prev) =>
            prev < filteredFiles.length - 1 ? prev + 1 : prev,
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (filteredFiles.length > 0 && selectedIndex >= 0) {
          handleFileAction(filteredFiles[selectedIndex]);
        }
        break;
      case "Escape":
        if (searchQuery) {
          setSearchQuery("");
        } else {
          onViewChange("command");
        }
        break;
    }
  };

  // Handle file/folder actions
  const handleFileAction = (file: FileResult) => {
    if (file.type === "folder") {
      // Open folder in file manager
      console.log("Opening folder:", file.path);
    } else {
      // Open file with default application
      console.log("Opening file:", file.path);
    }
  };

  // Copy file path to clipboard
  const copyPath = (file: FileResult) => {
    navigator.clipboard.writeText(file.path);
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get file icon based on extension
  const getFileIcon = (file: FileResult) => {
    if (file.type === "folder") {
      return <Folder className="h-5 w-5 text-blue-400" />;
    }
    return <File className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center border-b p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewChange("command")}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h3 className="font-medium mr-4">File & Folder Search</h3>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search files and folders..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative ml-4" ref={dropdownRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {filterType === "all"
              ? "All"
              : filterType === "files"
                ? "Files"
                : "Folders"}
            <ChevronDown className="h-4 w-4" />
          </Button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-1 w-32 bg-popover border rounded-md shadow-lg z-10">
              <div className="py-1">
                {["all", "files", "folders"].map((type) => (
                  <button
                    key={type}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      filterType === type && "bg-accent",
                    )}
                    onClick={() => {
                      setFilterType(type as typeof filterType);
                      setShowFilterDropdown(false);
                    }}
                  >
                    {type === "all"
                      ? "All"
                      : type === "files"
                        ? "Files"
                        : "Folders"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No files found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try a different search term"
                : "Start typing to search files and folders"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-1 mb-2">
              {filteredFiles.length} result
              {filteredFiles.length !== 1 ? "s" : ""}
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center p-3 rounded-lg cursor-pointer group",
                    index === selectedIndex
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent/50",
                  )}
                  onClick={() => handleFileAction(file)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0 mr-3">{getFileIcon(file)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{file.name}</p>
                      {file.extension && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {file.extension.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {file.path}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      {file.modified && (
                        <span>
                          Modified {file.modified.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyPath(file);
                      }}
                      title="Copy path"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileAction(file);
                      }}
                      title="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/10 text-xs text-muted-foreground flex justify-between">
        <span>↑↓ Navigate • ↵ Open • Esc Back</span>
        <span>{filteredFiles.length} results</span>
      </div>
    </div>
  );
}
