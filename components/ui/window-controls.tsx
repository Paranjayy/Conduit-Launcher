import React from 'react';
import { Minus, Square, X } from 'lucide-react';

// Define types directly here to avoid import issues
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
      };
    };
  }
}

export function WindowControls() {
  const isElectron = typeof window !== 'undefined' && window.electron;

  const handleMinimize = () => {
    if (isElectron) {
      window.electron?.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (isElectron) {
      window.electron?.window.maximize();
    }
  };

  const handleClose = () => {
    if (isElectron) {
      window.electron?.window.close();
    }
  };

  if (!isElectron) {
    return null;
  }

  return (
    <div className="flex items-center -webkit-app-region-no-drag">
      <button
        onClick={handleMinimize}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:bg-gray-800 rounded-lg"
        aria-label="Minimize"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={handleMaximize}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:bg-gray-800 rounded-lg"
        aria-label="Maximize"
      >
        <Square size={16} />
      </button>
      <button
        onClick={handleClose}
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:bg-red-900 hover:text-white rounded-lg"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function DraggableRegion() {
  return (
    <div 
      className="-webkit-app-region-drag h-8 flex-grow" 
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} 
    />
  );
}

export function TitleBar({ title = 'OmniLaunch' }: { title?: string }) {
  return (
    <div className="flex items-center h-8 px-4 bg-black border-b border-gray-800">
      <div className="flex-1 text-sm font-medium text-gray-300 -webkit-app-region-drag" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {title}
      </div>
      {/* Window controls removed for aesthetic */}
    </div>
  );
} 