"use client"

import { useState, useEffect } from "react"
import { CommandBar } from "@/components/command-bar"
import { ClipboardManager } from "@/components/clipboard-manager"
import { PasteStack } from "@/components/paste-stack"
import { SnippetsManager } from "@/components/snippets-manager"
import { AppSearch } from "@/components/app-search"
import { Preferences } from "@/components/preferences"
import { useHotkeys } from "react-hotkeys-hook"
import { TitleBar } from "@/components/ui/window-controls"
import { useElectronClipboard } from "@/hooks/use-electron-clipboard"

export default function Home() {
  const { isElectron, readClipboard } = useElectronClipboard()
  const [isOpen, setIsOpen] = useState(true) // Start with the app open for development
  const [activeView, setActiveView] = useState<"command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | "preferences">("command")

  // Toggle the main window
  useHotkeys("meta+space", () => {
    setIsOpen((prev) => !prev)
  })

  // Toggle clipboard manager
  useHotkeys("meta+shift+v", () => {
    setActiveView("clipboard")
    setIsOpen(true)
  })

  // Toggle paste stack
  useHotkeys("meta+shift+p", () => {
    setActiveView("pasteStack")
    setIsOpen(true)
  })

  // Toggle snippets manager
  useHotkeys("meta+shift+s", () => {
    setActiveView("snippets")
    setIsOpen(true)
  })
  
  // Toggle app search
  useHotkeys("meta+shift+a", () => {
    setActiveView("appSearch")
    setIsOpen(true)
  })
  
  // Toggle preferences
  useHotkeys("meta+shift+comma", () => {
    setActiveView("preferences")
    setIsOpen(true)
  })

  // Handle escape key
  useHotkeys("escape", () => {
    // If not in command view, go back to command view
    if (activeView !== "command") {
      setActiveView("command")
    } else {
      // Only close if we're already at the root level
      setIsOpen(false)
    }
  })

  // Set up listener for global shortcuts from Electron
  useEffect(() => {
    if (isElectron && window.electron && window.electron.shortcuts) {
      const cleanup = window.electron.shortcuts.onGlobalShortcut((id: string) => {
        switch (id) {
          case 'clipboard':
            setActiveView("clipboard")
            break;
          case 'paste-stack':
            setActiveView("pasteStack")
            break;
          case 'snippets':
            setActiveView("snippets")
            break;
          case 'app-search':
            setActiveView("appSearch")
            break;
          case 'preferences':
            setActiveView("preferences")
            break;
          // No need to handle toggle-app as it's managed by the main process
        }
      });
      
      return cleanup;
    }
  }, [isElectron]);

  // For development, log the state
  useEffect(() => {
    console.log("App state:", { isOpen, activeView })
  }, [isOpen, activeView])

  if (!isOpen) return null

  // In Electron mode, we show it as a full window app
  if (isElectron) {
    return (
      <main className="flex flex-col h-screen bg-background">
        <TitleBar title="OmniLaunch" />
        <div className="flex-1 overflow-hidden">
          {activeView === "command" && <CommandBar onViewChange={setActiveView} />}
          {activeView === "clipboard" && <ClipboardManager onViewChange={setActiveView} />}
          {activeView === "pasteStack" && <PasteStack onViewChange={setActiveView} />}
          {activeView === "snippets" && <SnippetsManager onViewChange={setActiveView} />}
          {activeView === "appSearch" && <AppSearch onViewChange={setActiveView} />}
          {activeView === "preferences" && <Preferences onViewChange={setActiveView} />}
        </div>
      </main>
    )
  }

  // In web mode, we show it as an overlay
  return (
    <main className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-background rounded-lg shadow-lg overflow-hidden w-[800px] max-w-[90vw] border border-border/50 glass-panel">
        {activeView === "command" && <CommandBar onViewChange={setActiveView} />}
        {activeView === "clipboard" && <ClipboardManager onViewChange={setActiveView} />}
        {activeView === "pasteStack" && <PasteStack onViewChange={setActiveView} />}
        {activeView === "snippets" && <SnippetsManager onViewChange={setActiveView} />}
        {activeView === "appSearch" && <AppSearch onViewChange={setActiveView} />}
        {activeView === "preferences" && <Preferences onViewChange={setActiveView} />}
      </div>
    </main>
  )
}
