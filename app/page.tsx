"use client"

import { useState, useEffect } from "react"
import { CommandBar } from "@/components/command-bar"
import { ClipboardManager } from "@/components/clipboard-manager"
import { PasteStack } from "@/components/paste-stack"
import { SnippetsManager } from "@/components/snippets-manager"
import { AppSearch } from "@/components/app-search"
import { Preferences } from "@/components/preferences"
import { ContextualShortcuts } from "@/components/contextual-shortcuts"
import { Calculator } from "@/components/calculator"
import { MenuSearch } from "@/components/menu-search"
import { NotesManager } from "@/components/notes-manager"
import { MultiClipboard } from "@/components/multi-clipboard"
import { EmojiSearch } from "@/components/emoji-search"
import { AIChat } from "@/components/ai-chat"
import { useHotkeys } from "react-hotkeys-hook"
import { TitleBar } from "@/components/ui/window-controls"
import { useElectronClipboard } from "@/hooks/use-electron-clipboard"

// Define the view types for type safety
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

export default function Home() {
  const { isElectron, readClipboard } = useElectronClipboard()
  const [isOpen, setIsOpen] = useState(true) // Start with the app open for development
  const [activeView, setActiveView] = useState<ViewType>("command")

  // Handler for changing views
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  // Toggle the main window
  useHotkeys("meta+space", () => {
    setIsOpen((prev) => !prev)
  })

  // Toggle notes manager
  useHotkeys("meta+shift+n", () => {
    setActiveView("notes")
    setIsOpen(true)
  })

  // Toggle multi-clipboard
  useHotkeys("meta+shift+x", () => {
    setActiveView("multiClipboard")
    setIsOpen(true)
  })

  // Toggle AI Chat
  useHotkeys("meta+shift+i", () => {
    setActiveView("aiChat")
    setIsOpen(true)
  })

  // Toggle emoji search
  useHotkeys("meta+shift+e", () => {
    setActiveView("emojiSearch")
    setIsOpen(true)
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
  
  // Toggle calculator
  useHotkeys("meta+shift+c", () => {
    setActiveView("calculator")
    setIsOpen(true)
  })
  
  // Toggle menu search
  useHotkeys("meta+shift+m", () => {
    setActiveView("menuSearch")
    setIsOpen(true)
  })
  
  // Toggle preferences
  useHotkeys("meta+shift+comma", () => {
    setActiveView("preferences")
    setIsOpen(true)
  })
  
  // Toggle contextual shortcuts
  useHotkeys("meta+shift+k", () => {
    setActiveView("contextualShortcuts")
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
    // @ts-ignore - Safely access window.electron.shortcuts which might not be in the type definition
    if (isElectron && window.electron && window.electron.shortcuts?.onGlobalShortcut) {
      // @ts-ignore
      const cleanup = window.electron.shortcuts.onGlobalShortcut((id: string) => {
        switch (id) {
          case 'notes':
            setActiveView("notes")
            break;
          case 'multi-clipboard':
            setActiveView("multiClipboard")
            break;
          case 'ai-chat':
            setActiveView("aiChat")
            break;
          case 'emoji-search':
            setActiveView("emojiSearch")
            break;
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
          case 'calculator':
            setActiveView("calculator")
            break;
          case 'preferences':
            setActiveView("preferences")
            break;
          case 'contextual-shortcuts':
            setActiveView("contextualShortcuts")
            break;
          // No need to handle toggle-app as it's managed by the main process
        }
        setIsOpen(true);
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
          {activeView === "command" && <CommandBar onViewChange={handleViewChange} />}
          {activeView === "notes" && <NotesManager onViewChange={handleViewChange} />}
          {activeView === "multiClipboard" && <MultiClipboard onViewChange={handleViewChange} />}
          {activeView === "aiChat" && <AIChat onViewChange={handleViewChange} />}
          {activeView === "emojiSearch" && <EmojiSearch onViewChange={handleViewChange} />}
          {activeView === "clipboard" && <ClipboardManager onViewChange={handleViewChange} />}
          {activeView === "pasteStack" && <PasteStack onViewChange={handleViewChange} />}
          {activeView === "snippets" && <SnippetsManager onViewChange={handleViewChange} />}
          {activeView === "appSearch" && <AppSearch onViewChange={handleViewChange} />}
          {activeView === "calculator" && <Calculator onViewChange={handleViewChange} />}
          {activeView === "preferences" && <Preferences onViewChange={handleViewChange} />}
          {activeView === "contextualShortcuts" && <ContextualShortcuts onClose={() => setActiveView("command")} />}
          {activeView === "menuSearch" && <MenuSearch onViewChange={handleViewChange} />}
        </div>
      </main>
    )
  }

  // In web mode, we show it as an overlay
  return (
    <main className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-background rounded-lg shadow-lg overflow-hidden w-[800px] max-w-[90vw] border border-border/50 glass-panel">
        {activeView === "command" && <CommandBar onViewChange={handleViewChange} />}
        {activeView === "notes" && <NotesManager onViewChange={handleViewChange} />}
        {activeView === "multiClipboard" && <MultiClipboard onViewChange={handleViewChange} />}
        {activeView === "aiChat" && <AIChat onViewChange={handleViewChange} />}
        {activeView === "emojiSearch" && <EmojiSearch onViewChange={handleViewChange} />}
        {activeView === "clipboard" && <ClipboardManager onViewChange={handleViewChange} />}
        {activeView === "pasteStack" && <PasteStack onViewChange={handleViewChange} />}
        {activeView === "snippets" && <SnippetsManager onViewChange={handleViewChange} />}
        {activeView === "appSearch" && <AppSearch onViewChange={handleViewChange} />}
        {activeView === "calculator" && <Calculator onViewChange={handleViewChange} />}
        {activeView === "preferences" && <Preferences onViewChange={handleViewChange} />}
        {activeView === "contextualShortcuts" && <ContextualShortcuts onClose={() => setActiveView("command")} />}
        {activeView === "menuSearch" && <MenuSearch onViewChange={handleViewChange} />}
      </div>
    </main>
  )
}
