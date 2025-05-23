"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Monitor,
  Maximize2,
  Minimize2,
  Move,
  Grid3X3,
  RotateCw,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WindowManagerProps {
  onViewChange: (view: string) => void;
}

interface WindowInfo {
  id: string;
  title: string;
  app: string;
  isVisible: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// Mock window data for demonstration
const MOCK_WINDOWS: WindowInfo[] = [
  {
    id: "1",
    title: "OmniLaunch",
    app: "OmniLaunch",
    isVisible: true,
    isMinimized: false,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
  },
  {
    id: "2",
    title: "Visual Studio Code",
    app: "Code",
    isVisible: true,
    isMinimized: false,
    position: { x: 200, y: 150 },
    size: { width: 1200, height: 800 },
  },
  {
    id: "3",
    title: "Safari",
    app: "Safari",
    isVisible: true,
    isMinimized: true,
    position: { x: 300, y: 200 },
    size: { width: 1000, height: 700 },
  },
];

// Window layout presets
const LAYOUT_PRESETS = [
  {
    id: "split-left-right",
    name: "Split Left/Right",
    icon: <Grid3X3 className="h-4 w-4" />,
    description: "Split screen with two windows side by side",
  },
  {
    id: "split-top-bottom",
    name: "Split Top/Bottom",
    icon: <Grid3X3 className="h-4 w-4 rotate-90" />,
    description: "Split screen with windows stacked vertically",
  },
  {
    id: "quarters",
    name: "Quarters",
    icon: <Grid3X3 className="h-4 w-4" />,
    description: "Divide screen into four equal quadrants",
  },
  {
    id: "center-focus",
    name: "Center Focus",
    icon: <Maximize2 className="h-4 w-4" />,
    description: "Center main window with others minimized",
  },
];

// Desktop spaces
const DESKTOP_SPACES = [
  { id: 1, name: "Main", active: true, windows: 3 },
  { id: 2, name: "Development", active: false, windows: 2 },
  { id: 3, name: "Communication", active: false, windows: 1 },
  { id: 4, name: "Design", active: false, windows: 0 },
];

export function WindowManager({ onViewChange }: WindowManagerProps) {
  const [windows, setWindows] = useState<WindowInfo[]>(MOCK_WINDOWS);
  const [selectedWindows, setSelectedWindows] = useState<string[]>([]);
  const [activeSpace, setActiveSpace] = useState(1);
  const [spaces, setSpaces] = useState(DESKTOP_SPACES);

  // Toggle window selection
  const toggleWindowSelection = (windowId: string) => {
    setSelectedWindows((prev) =>
      prev.includes(windowId)
        ? prev.filter((id) => id !== windowId)
        : [...prev, windowId],
    );
  };

  // Apply layout preset
  const applyLayout = (layoutId: string) => {
    console.log("Applying layout:", layoutId);
    // In a real implementation, this would arrange windows according to the layout
  };

  // Window actions
  const minimizeWindow = (windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w)),
    );
  };

  const maximizeWindow = (windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isMinimized: false } : w)),
    );
  };

  const hideWindow = (windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isVisible: false } : w)),
    );
  };

  const showWindow = (windowId: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === windowId ? { ...w, isVisible: true } : w)),
    );
  };

  // Space management
  const switchToSpace = (spaceId: number) => {
    setSpaces((prev) =>
      prev.map((space) => ({
        ...space,
        active: space.id === spaceId,
      })),
    );
    setActiveSpace(spaceId);
  };

  const createNewSpace = () => {
    const newSpace = {
      id: spaces.length + 1,
      name: `Space ${spaces.length + 1}`,
      active: false,
      windows: 0,
    };
    setSpaces((prev) => [...prev, newSpace]);
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

        <h3 className="font-medium">Window Management & Spaces</h3>
      </div>

      <Tabs defaultValue="windows" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="layouts">Layouts</TabsTrigger>
          <TabsTrigger value="spaces">Spaces</TabsTrigger>
        </TabsList>

        <TabsContent value="windows" className="flex-1 p-4">
          <div className="space-y-4">
            {/* Window Controls */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedWindows.forEach(minimizeWindow)}
                disabled={selectedWindows.length === 0}
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                Minimize Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedWindows.forEach(maximizeWindow)}
                disabled={selectedWindows.length === 0}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Restore Selected
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedWindows.forEach(hideWindow)}
                disabled={selectedWindows.length === 0}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Selected
              </Button>
            </div>

            {/* Window List */}
            <div className="space-y-2">
              {windows.map((window) => (
                <div
                  key={window.id}
                  className={cn(
                    "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                    selectedWindows.includes(window.id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-accent/50",
                    !window.isVisible && "opacity-50",
                  )}
                  onClick={() => toggleWindowSelection(window.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{window.title}</span>
                      <span className="text-sm text-muted-foreground">
                        ({window.app})
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground mt-1">
                      {window.size.width} × {window.size.height} at (
                      {window.position.x}, {window.position.y})
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {window.isMinimized && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Minimized
                        </span>
                      )}
                      {!window.isVisible && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {window.isMinimized ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          maximizeWindow(window.id);
                        }}
                        title="Restore"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          minimizeWindow(window.id);
                        }}
                        title="Minimize"
                      >
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    )}

                    {window.isVisible ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          hideWindow(window.id);
                        }}
                        title="Hide"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          showWindow(window.id);
                        }}
                        title="Show"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="layouts" className="flex-1 p-4">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Choose a layout to automatically arrange your windows
            </div>

            <div className="grid grid-cols-2 gap-4">
              {LAYOUT_PRESETS.map((layout) => (
                <Button
                  key={layout.id}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 text-left"
                  onClick={() => applyLayout(layout.id)}
                >
                  {layout.icon}
                  <div className="text-center">
                    <div className="font-medium">{layout.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {layout.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="border-t pt-4 mt-6">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Move className="h-4 w-4 mr-2" />
                  Tile All Windows
                </Button>
                <Button variant="outline" size="sm">
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Minimize All
                </Button>
                <Button variant="outline" size="sm">
                  <RotateCw className="h-4 w-4 mr-2" />
                  Cycle Windows
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spaces" className="flex-1 p-4">
          <div className="space-y-4">
            {/* Current Spaces */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Desktop Spaces</h4>
                <Button variant="outline" size="sm" onClick={createNewSpace}>
                  <Layers className="h-4 w-4 mr-2" />
                  New Space
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-colors",
                      space.active
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => switchToSpace(space.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{space.name}</span>
                      {space.active && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {space.windows} window{space.windows !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Space Actions */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Space Actions</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Move className="h-4 w-4 mr-2" />
                  Move Window to Space
                </Button>
                <Button variant="outline" size="sm">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Show All Spaces
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
