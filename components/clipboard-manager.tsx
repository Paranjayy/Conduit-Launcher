"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, Plus, Clipboard, ArrowLeft, Command, Check, MoreVertical, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FolderPanel } from "@/components/folder-panel"
import { ClipsPanel } from "@/components/clips-panel"
import { MetadataPanel } from "@/components/metadata-panel"
import { useClipboardStore } from "@/lib/clipboard-store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface ClipboardManagerProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets") => void
}

export function ClipboardManager({ onViewChange }: ClipboardManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [selectedClips, setSelectedClips] = useState<string[]>([])
  const [activePanel, setActivePanel] = useState<"folders" | "clips" | "metadata">("clips")
  const [showActions, setShowActions] = useState(false)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  
  const { 
    clips, 
    startMonitoring, 
    stopMonitoring, 
    isMonitoring, 
    pasteClip, 
    deleteClip, 
    addToSnippets 
  } = useClipboardStore()

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
      
      // Command+A to select all in multi-select mode
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && multiSelectMode) {
        e.preventDefault()
        const filteredClipIds = clips
          .filter(clip => 
            (searchQuery === "" || 
             clip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
             (clip.type === "text" && clip.content.toLowerCase().includes(searchQuery.toLowerCase()))) &&
            (activeFolder === null || clip.folderId === activeFolder)
          )
          .map(clip => clip.id)
          
        if (selectedClips.length === filteredClipIds.length) {
          setSelectedClips([])
        } else {
          setSelectedClips(filteredClipIds)
        }
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
        } else if (activePanel === "clips" && selectedClips.length === 1) {
          setActivePanel("metadata")
        }
      }

      // Enter to paste selected clip
      if (e.key === "Enter" && selectedClips.length === 1) {
        pasteClip(selectedClips[0])
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
  }, [activePanel, selectedClips, searchQuery, showActions, pasteClip, clips, multiSelectMode, activeFolder])

  // Handle clip selection
  const handleClipSelect = (clipId: string) => {
    if (multiSelectMode) {
      setSelectedClips(prev => 
        prev.includes(clipId)
          ? prev.filter(id => id !== clipId)
          : [...prev, clipId]
      )
    } else {
      setSelectedClips([clipId])
    }
  }

  // Handle actions for selected clips
  const handleAction = (action: string) => {
    if (selectedClips.length === 0) return

    switch (action) {
      case "paste":
        if (selectedClips.length === 1) {
          pasteClip(selectedClips[0])
        }
        break
      case "delete":
        selectedClips.forEach(clipId => deleteClip(clipId))
        setSelectedClips([])
        break
      case "addToSnippets":
        selectedClips.forEach(clipId => addToSnippets(clipId))
        break
      default:
        break
    }

    setShowActions(false)
  }
  
  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setMultiSelectMode(prev => !prev)
    if (!multiSelectMode) {
      // Keep the current selection when entering multi-select mode
    } else {
      // If leaving multi-select mode and we have multiple clips selected,
      // just keep the first one selected
      if (selectedClips.length > 1) {
        setSelectedClips([selectedClips[0]])
      }
    }
  }
  
  // Clear all selections
  const clearSelections = () => {
    setSelectedClips([])
  }
  
  // Select all clips
  const selectAllClips = () => {
    const filteredClipIds = clips
      .filter(clip => 
        (searchQuery === "" || 
         clip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         (clip.type === "text" && clip.content.toLowerCase().includes(searchQuery.toLowerCase()))) &&
        (activeFolder === null || clip.folderId === activeFolder)
      )
      .map(clip => clip.id)
      
    if (selectedClips.length === filteredClipIds.length) {
      setSelectedClips([])
    } else {
      setSelectedClips(filteredClipIds)
    }
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
        
        {/* App icon and name */}
        <h3 className="font-medium flex items-center">
          <div className="bg-primary/20 rounded-md p-1 mr-2">
            <Clipboard className="h-4 w-4 text-primary" />
          </div>
          <span>OmniLaunch Clipboard</span>
        </h3>
        
        <div className="flex items-center flex-1 relative ml-4">
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
            <Button 
              variant={multiSelectMode ? "default" : "outline"} 
              size="icon" 
              className="btn-hover-effect"
              onClick={toggleMultiSelectMode}
            >
              <Check className="h-4 w-4" />
            </Button>
            <span className="tooltip-text">
              {multiSelectMode ? "Exit Multi-Select" : "Multi-Select Mode"}
            </span>
          </div>
          
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

      {/* Multi-select controls - Show when in multi-select mode */}
      {multiSelectMode && selectedClips.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-accent/30 border-b">
          <div className="text-sm">
            {selectedClips.length} clip{selectedClips.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelections}
              className="h-7"
            >
              Clear
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={selectAllClips}
              className="h-7"
            >
              Select All
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7">
                  Actions
                  <MoreVertical className="h-3.5 w-3.5 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleAction("addToSnippets")}>
                  Save as Snippets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")}>
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

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
          selectedClip={selectedClips.length === 1 ? selectedClips[0] : null}
          onClipSelect={handleClipSelect}
          isActive={activePanel === "clips"}
          onPanelFocus={() => setActivePanel("clips")}
          multiSelectMode={multiSelectMode}
          selectedClips={selectedClips}
        />

        {/* Right Panel - Metadata/Preview */}
        <MetadataPanel
          clipId={selectedClips.length === 1 ? selectedClips[0] : null}
          isActive={activePanel === "metadata"}
          onPanelFocus={() => setActivePanel("metadata")}
        />
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <div className={`w-2 h-2 rounded-full mr-2 ${isMonitoring ? "bg-green-500 pulse" : "bg-red-500"}`}></div>
          {isMonitoring ? "Monitoring clipboard" : "Clipboard monitoring paused"}
          {selectedClips.length > 0 && ` • ${selectedClips.length} clip${selectedClips.length !== 1 ? 's' : ''} selected`}
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
                <DropdownMenuItem onClick={() => handleAction("paste")} disabled={selectedClips.length !== 1}>
                  Paste
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("copy")} disabled={selectedClips.length !== 1}>
                  Copy to Clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("addToSnippets")}>
                  Save as Snippet{selectedClips.length > 1 ? 's' : ''}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("delete")}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="tooltip-text">Show Actions</span>
          </div>

          <div className="tooltip">
            <Button
              size="sm"
              onClick={() => selectedClips.length === 1 && pasteClip(selectedClips[0])}
              disabled={selectedClips.length !== 1}
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
