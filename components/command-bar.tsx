"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Search, Clipboard, Layers, Code, Laptop, Settings } from 'lucide-react';

interface CommandBarProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | "preferences") => void;
}

export function CommandBar({ onViewChange }: CommandBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    {
      id: 'clipboard',
      name: 'Open Clipboard Manager',
      description: 'Access your clipboard history',
      icon: <Clipboard className="h-5 w-5" />,
      action: () => onViewChange('clipboard')
    },
    {
      id: 'pasteStack',
      name: 'Open Paste Stack',
      description: 'Manage your paste sequences',
      icon: <Layers className="h-5 w-5" />,
      action: () => onViewChange('pasteStack')
    },
    {
      id: 'snippets',
      name: 'Open Snippets Manager',
      description: 'Create and use text snippets',
      icon: <Code className="h-5 w-5" />,
      action: () => onViewChange('snippets')
    },
    {
      id: 'appSearch',
      name: 'Search Applications',
      description: 'Find and launch applications',
      icon: <Laptop className="h-5 w-5" />,
      action: () => onViewChange('appSearch')
    },
    {
      id: 'preferences',
      name: 'Preferences',
      description: 'Configure keyboard shortcuts and settings',
      icon: <Settings className="h-5 w-5" />,
      action: () => onViewChange('preferences')
    }
  ];

  const filteredCommands = searchTerm.trim() === ''
    ? commands
    : commands.filter(command => 
        command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.description.toLowerCase().includes(searchTerm.toLowerCase())
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
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
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
            <Search className="h-5 w-5 text-gray-400" />
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
                  index === selectedIndex ? 'bg-blue-900 text-white' : 'hover:bg-gray-800 text-gray-200'
                }`}
                onClick={command.action}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-shrink-0 w-8 h-8 mr-3 flex items-center justify-center text-gray-400">
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
