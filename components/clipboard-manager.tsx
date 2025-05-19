"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Plus, Clipboard, ArrowLeft, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FolderPanel } from "@/components/folder-panel"
import { ClipsPanel } from "@/components/clips-panel"
import { MetadataPanel } from "@/components/metadata-panel"
import { useClipboardStore } from "@/lib/clipboard-store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ClipboardManagerProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets") => void
}

export function ClipboardManager({ onViewChange }: ClipboardManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [selectedClip, setSelectedClip] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<"folders" | "clips" | "metadata">("clips")
  const [showActions, setShowActions] = useState(false)
  const { clips, startMonitoring, stopMonitoring, isMonitoring, pasteClip, deleteClip, addToSnippets } =
    useClipboardStore()

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Start monitoring clipboard when component mounts
  useEffect(() => {
    startMonitoring()
    return () => stopMonitoring()
  }, [startMonitoring, stopMonitoring])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+F to focus search
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Command+K to show actions
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setShowActions(true)
      }

      // Left/Right arrow keys to navigate between panels
      if (e.key === "ArrowLeft") {
        if (activePanel === "clips") {
          setActivePanel("folders")
        } else if (activePanel === "metadata") {
          setActivePanel("clips")
        }
      } else if (e.key === "ArrowRight") {
        if (activePanel === "folders") {
          setActivePanel("clips")
        } else if (activePanel === "clips" && selectedClip) {
          setActivePanel("metadata")
        }
      }

      // Enter to paste selected clip
      if (e.key === "Enter" && selectedClip) {
        pasteClip(selectedClip)
      }

      // Escape to close actions or clear search
      if (e.key === "Escape") {
        if (showActions) {
          setShowActions(false)
        } else if (searchQuery) {
          setSearchQuery("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activePanel, selectedClip, searchQuery, showActions, pasteClip])

  // Handle actions for selected clip
  const handleAction = (action: string) => {
    if (!selectedClip) return

    switch (action) {
      case "paste":
        pasteClip(selectedClip)
        break
      case "delete":
        deleteClip(selectedClip)
        setSelectedClip(null)
        break
      case "addToSnippets":
        addToSnippets(selectedClip)
        break
      default:
        break
    }

    setShowActions(false)
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Top Bar */}
      <div className="flex items-center border-b p-4">
        <div className="tooltip">
          <Button variant="ghost" size="icon" onClick={() => onViewChange("command")} className="mr-2 btn-hover-effect">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">
            Back to Command Bar <span className="kbd">Esc</span>
          </span>
        </div>
        <div className="flex items-center flex-1 relative">
          <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search clips..."
            className="pl-8 border-none shadow-none focus-visible:ring-0 enhanced-focus"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="tooltip absolute right-2">
            <span className="kbd text-xs">⌘F</span>
            <span className="tooltip-text">Focus Search</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <div className="tooltip">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="btn-hover-effect">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>All Types</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Text</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Images</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Files</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Links</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>Colors</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="tooltip-text">Filter Clips</span>
          </div>

          <div className="tooltip">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="btn-hover-effect">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {}}>New Folder</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>New Tag</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>New Clip</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="tooltip-text">Create New</span>
          </div>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Folders/Tags */}
        <FolderPanel
          activeFolder={activeFolder}
          onFolderSelect={setActiveFolder}
          isActive={activePanel === "folders"}
          onPanelFocus={() => setActivePanel("folders")}
        />

        {/* Middle Panel - Clips */}
        <ClipsPanel
          searchQuery={searchQuery}
          activeFolder={activeFolder}
          selectedClip={selectedClip}
          onClipSelect={setSelectedClip}
          isActive={activePanel === "clips"}
          onPanelFocus={() => setActivePanel("clips")}
        />

        {/* Right Panel - Metadata/Preview */}
        <MetadataPanel
          clipId={selectedClip}
          isActive={activePanel === "metadata"}
          onPanelFocus={() => setActivePanel("metadata")}
        />
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full mr-2 ${isMonitoring ? "bg-green-500 pulse" : "bg-red-500"}`}></div>
          {isMonitoring ? "Monitoring clipboard" : "Clipboard monitoring paused"}
          {selectedClip ? " • 1 clip selected" : ""}
        </div>
        <div className="flex items-center gap-2">
          <div className="tooltip">
            <DropdownMenu open={showActions} onOpenChange={setShowActions}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="btn-hover-effect">
                  <Command className="h-4 w-4 mr-2" />
                  Actions
                  <span className="ml-2 kbd">⌘K</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleAction("paste")}>Paste</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("copy")}>Copy to Clipboard</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("addToSnippets")}>Save as Snippet</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="tooltip-text">Show Actions</span>
          </div>

          <div className="tooltip">
            <Button
              size="sm"
              onClick={() => selectedClip && pasteClip(selectedClip)}
              disabled={!selectedClip}
              className="btn-hover-effect"
            >
              <Clipboard className="h-4 w-4 mr-2" />
              Paste
              <span className="ml-2 kbd">↵</span>
            </Button>
            <span className="tooltip-text">Paste Selected Clip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
