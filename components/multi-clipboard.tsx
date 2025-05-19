"use client"

import { useState, useEffect } from "react"
import { 
  ArrowLeft, Clipboard, Check, X, Copy, Scissors, 
  FileText, ChevronDown, ChevronUp, ArrowDownToLine 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { useClipboardStore, Clip } from "@/lib/clipboard-store"
import { useNotesStore } from "@/lib/notes-store"
import { cn } from "@/lib/utils"

interface MultiClipboardProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | 
  "preferences" | "contextualShortcuts" | "calculator" | "menuSearch" | 
  "notes" | "multiClipboard") => void;
}

export function MultiClipboard({ onViewChange }: MultiClipboardProps) {
  const { clips } = useClipboardStore()
  const { addClipToNotes } = useNotesStore()
  
  const [selectedClips, setSelectedClips] = useState<string[]>([])
  const [format, setFormat] = useState<"plain" | "separated" | "numbered" | "bulleted">("plain")
  const [separator, setSeparator] = useState("\n\n")
  const [searchQuery, setSearchQuery] = useState("")
  const [previewContent, setPreviewContent] = useState<string>("")

  // Filter clips based on search
  const filteredClips = clips.filter(clip => 
    clip.type === "text" && 
    (searchQuery === "" || 
      clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view
      if (e.key === "Escape") {
        onViewChange("command")
      }

      // Ctrl/Cmd+A to select all
      if (e.key === "a" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (selectedClips.length === filteredClips.length) {
          setSelectedClips([])
        } else {
          setSelectedClips(filteredClips.map(clip => clip.id))
        }
      }

      // Ctrl/Cmd+C to copy selected
      if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        if (selectedClips.length > 0) {
          e.preventDefault()
          handleCopyToClipboard()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange, filteredClips, selectedClips])

  // Update preview when selection changes
  useEffect(() => {
    const selectedItems = clips.filter(clip => selectedClips.includes(clip.id))
    
    let content = ""
    
    switch (format) {
      case "plain":
        content = selectedItems.map(clip => clip.content).join(separator)
        break
      
      case "separated":
        content = selectedItems.map(clip => clip.content).join(separator)
        break
      
      case "numbered":
        content = selectedItems
          .map((clip, index) => `${index + 1}. ${clip.content}`)
          .join("\n\n")
        break
      
      case "bulleted":
        content = selectedItems
          .map(clip => `• ${clip.content}`)
          .join("\n\n")
        break
    }
    
    setPreviewContent(content)
  }, [clips, selectedClips, format, separator])

  // Toggle clip selection
  const handleToggleClip = (id: string) => {
    setSelectedClips(prev => 
      prev.includes(id)
        ? prev.filter(clipId => clipId !== id)
        : [...prev, id]
    )
  }

  // Select all clips
  const handleSelectAll = () => {
    if (selectedClips.length === filteredClips.length) {
      setSelectedClips([])
    } else {
      setSelectedClips(filteredClips.map(clip => clip.id))
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedClips([])
  }

  // Copy combined content to clipboard
  const handleCopyToClipboard = () => {
    if (previewContent && navigator.clipboard) {
      navigator.clipboard.writeText(previewContent)
    }
  }

  // Save to notes
  const handleSaveToNotes = () => {
    const selectedItems = clips.filter(clip => selectedClips.includes(clip.id))
    
    if (selectedItems.length > 0) {
      // Create a single note with all content
      if (format === "plain" || format === "separated") {
        const combinedClip: Clip = {
          id: 'temp-id', // Will be replaced when added to notes
          type: "text",
          title: selectedItems.length === 1 
            ? selectedItems[0].title 
            : `Combined Clips (${selectedItems.length})`,
          content: previewContent,
          folderId: null,
          tags: ["clipboard", "multi-select"],
          createdAt: Date.now(),
          lastEditedAt: Date.now(),
          lastPastedAt: null,
          pasteCount: 0
        }
        
        addClipToNotes([combinedClip])
      } else {
        // Add each clip as a separate note
        addClipToNotes(selectedItems)
      }
    }
  }

  // Render clip item
  const renderClipItem = (clip: Clip) => {
    const isSelected = selectedClips.includes(clip.id)
    
    return (
      <div 
        key={clip.id}
        className={cn(
          "flex items-start gap-3 p-3 rounded-md cursor-pointer border transition-colors",
          isSelected 
            ? "bg-accent/80 border-primary"
            : "hover:bg-accent/50 border-border"
        )}
        onClick={() => handleToggleClip(clip.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleClip(clip.id)}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {clip.title || "Untitled"}
          </div>
          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {clip.content}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(clip.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Top Bar */}
      <div className="flex items-center border-b p-4">
        <div className="tooltip">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("command")}
            className="mr-2 btn-hover-effect"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">Back (Esc)</span>
        </div>
        
        <h3 className="font-medium flex items-center">
          <Clipboard className="h-4 w-4 mr-2" />
          Multi Clipboard
        </h3>
        
        <div className="flex items-center ml-auto gap-2">
          <Input
            placeholder="Search clips..."
            className="w-60 h-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="btn-hover-effect"
          >
            {selectedClips.length === filteredClips.length 
              ? "Deselect All" 
              : "Select All"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Clip list */}
        <div className="w-1/2 border-r p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium">
              {filteredClips.length} text clip{filteredClips.length !== 1 ? 's' : ''}
            </div>
            {selectedClips.length > 0 && (
              <div className="text-sm">
                {selectedClips.length} selected
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSelection}
                  className="h-6 w-6 ml-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          
          {filteredClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Clipboard className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No text clips found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClips.map(renderClipItem)}
            </div>
          )}
        </div>
        
        {/* Right panel - Preview and actions */}
        <div className="w-1/2 flex flex-col">
          {/* Format options */}
          <div className="border-b p-4">
            <div className="text-sm font-medium mb-3">Format Options</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={cn(
                  "flex items-center justify-center p-2 border rounded-md cursor-pointer",
                  format === "plain" && "bg-accent border-primary"
                )}
                onClick={() => setFormat("plain")}
              >
                <FileText className="h-4 w-4 mr-2" />
                <span>Plain Text</span>
              </div>
              
              <div 
                className={cn(
                  "flex items-center justify-center p-2 border rounded-md cursor-pointer",
                  format === "separated" && "bg-accent border-primary"
                )}
                onClick={() => setFormat("separated")}
              >
                <Scissors className="h-4 w-4 mr-2" />
                <span>Separated</span>
              </div>
              
              <div 
                className={cn(
                  "flex items-center justify-center p-2 border rounded-md cursor-pointer",
                  format === "numbered" && "bg-accent border-primary"
                )}
                onClick={() => setFormat("numbered")}
              >
                <ChevronDown className="h-4 w-4 mr-1" />
                <span>Numbered List</span>
              </div>
              
              <div 
                className={cn(
                  "flex items-center justify-center p-2 border rounded-md cursor-pointer",
                  format === "bulleted" && "bg-accent border-primary"
                )}
                onClick={() => setFormat("bulleted")}
              >
                <ChevronUp className="h-4 w-4 mr-1" />
                <span>Bullet List</span>
              </div>
            </div>
            
            {format === "separated" && (
              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-1">
                  Separator
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-between">
                      {separator === "\n\n" 
                        ? "Double Line Break" 
                        : separator === "\n---\n" 
                          ? "Markdown Divider" 
                          : separator === ",\n" 
                            ? "Comma + Line Break" 
                            : separator === " " 
                              ? "Space" 
                              : "Custom"}
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setSeparator("\n\n")}>
                      Double Line Break
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeparator("\n---\n")}>
                      Markdown Divider
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeparator(",\n")}>
                      Comma + Line Break
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSeparator(" ")}>
                      Space
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Preview */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="text-sm font-medium mb-2">Preview</div>
            
            {selectedClips.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <p className="text-muted-foreground">Select clips to preview</p>
              </div>
            ) : (
              <div className="p-3 border rounded-md bg-accent/20 whitespace-pre-wrap max-h-72 overflow-y-auto">
                {previewContent}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="p-4 border-t bg-accent/10">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={selectedClips.length === 0}
                onClick={handleSaveToNotes}
              >
                <ArrowDownToLine className="h-4 w-4 mr-2" />
                Save to Notes
              </Button>
              
              <Button
                variant="default"
                disabled={selectedClips.length === 0}
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 