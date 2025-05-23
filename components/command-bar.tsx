"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Clipboard,
  Layers,
  Code,
  Laptop,
  Settings,
  Keyboard,
  Calculator,
  MenuSquare,
  StickyNote,
  ClipboardCopy,
  Smile,
  MessageSquare,
  FolderSearch,
  Timer,
  Monitor,
} from "lucide-react";

interface CommandBarProps {
  onViewChange: (
    view:
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
      | "focusSession"
      | "windowManager",
  ) => void;
}

export function CommandBar({ onViewChange }: CommandBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    {
      id: "notes",
      name: "Notes",
      description: "Create and manage your notes with folders and tags",
      icon: <StickyNote className="h-5 w-5" />,
      iconColor: "text-yellow-300",
      action: () => onViewChange("notes"),
    },
    {
      id: "clipboard",
      name: "Clipboard Manager",
      description: "Access your clipboard history",
      icon: <Clipboard className="h-5 w-5" />,
      iconColor: "text-green-400",
      action: () => onViewChange("clipboard"),
    },
    {
      id: "multiClipboard",
      name: "Multi-Clipboard",
      description: "Work with multiple clipboard items simultaneously",
      icon: <ClipboardCopy className="h-5 w-5" />,
      iconColor: "text-blue-300",
      action: () => onViewChange("multiClipboard"),
    },
    {
      id: "aiChat",
      name: "AI Assistant",
      description: "Chat with AI assistants from multiple providers",
      icon: <MessageSquare className="h-5 w-5" />,
      iconColor: "text-blue-400",
      action: () => onViewChange("aiChat"),
    },
    {
      id: "fileSearch",
      name: "File & Folder Search",
      description: "Search and navigate files and folders in your system",
      icon: <FolderSearch className="h-5 w-5" />,
      iconColor: "text-green-500",
      action: () => onViewChange("fileSearch"),
    },
    {
      id: "focusSession",
      name: "Focus Session & Timer",
      description:
        "Start focus sessions, pomodoro timers, and productivity tracking",
      icon: <Timer className="h-5 w-5" />,
      iconColor: "text-red-400",
      action: () => onViewChange("focusSession"),
    },
    {
      id: "windowManager",
      name: "Window Management",
      description:
        "Control window positioning, spaces, and desktop organization",
      icon: <Monitor className="h-5 w-5" />,
      iconColor: "text-purple-400",
      action: () => onViewChange("windowManager"),
    },
    {
      id: "emojiSearch",
      name: "Emoji Search",
      description: "Find and copy emojis quickly",
      icon: <Smile className="h-5 w-5" />,
      iconColor: "text-yellow-400",
      action: () => onViewChange("emojiSearch"),
    },
    {
      id: "pasteStack",
      name: "Paste Stack",
      description: "Manage your paste sequences",
      icon: <Layers className="h-5 w-5" />,
      iconColor: "text-orange-400",
      action: () => onViewChange("pasteStack"),
    },
    {
      id: "snippets",
      name: "Snippets Manager",
      description: "Create and use text snippets",
      icon: <Code className="h-5 w-5" />,
      iconColor: "text-purple-400",
      action: () => onViewChange("snippets"),
    },
    {
      id: "appSearch",
      name: "App Search",
      description: "Find and launch applications",
      icon: <Laptop className="h-5 w-5" />,
      iconColor: "text-blue-400",
      action: () => onViewChange("appSearch"),
    },
    {
      id: "calculator",
      name: "Calculator",
      description: "Perform quick calculations and currency conversions",
      icon: <Calculator className="h-5 w-5" />,
      iconColor: "text-yellow-400",
      action: () => onViewChange("calculator"),
    },
    {
      id: "menuSearch",
      name: "Menu Search",
      description: "Search and execute menu items from active application",
      icon: <MenuSquare className="h-5 w-5" />,
      iconColor: "text-green-600",
      action: () => onViewChange("menuSearch"),
    },
    {
      id: "contextualShortcuts",
      name: "Contextual Shortcuts",
      description: "Set up app-specific keyboard shortcuts",
      icon: <Keyboard className="h-5 w-5" />,
      iconColor: "text-cyan-400",
      action: () => onViewChange("contextualShortcuts"),
    },
    {
      id: "preferences",
      name: "Preferences",
      description: "Configure keyboard shortcuts and settings",
      icon: <Settings className="h-5 w-5" />,
      iconColor: "text-gray-400",
      action: () => onViewChange("preferences"),
    },
  ];

  const filteredCommands =
    searchTerm.trim() === ""
      ? commands
      : commands.filter(
          (command) =>
            command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            command.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()),
        );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-blue-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search commands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Command list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredCommands.length > 0 ? (
          <ul className="space-y-1">
            {filteredCommands.map((command, index) => (
              <li
                key={command.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  index === selectedIndex
                    ? "bg-blue-900 text-white"
                    : "hover:bg-gray-800 text-gray-200"
                }`}
                onClick={command.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center rounded-md bg-gray-800 ${command.iconColor}`}
                >
                  {command.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{command.name}</p>
                  <p className="text-xs text-gray-400">{command.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="text-gray-400 mb-2">
              <Search className="h-10 w-10 mx-auto mb-2" />
              <p>No commands found</p>
            </div>
            <p className="text-sm text-gray-500">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 bg-gray-900">
        <div className="flex justify-between text-xs text-gray-500">
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
          <span>esc to exit</span>
        </div>
      </div>
    </div>
  );
}
