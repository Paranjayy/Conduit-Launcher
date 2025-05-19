"use client"
import { Folder, Tag, Plus } from "lucide-react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { useClipboardStore } from "@/lib/clipboard-store"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Input } from "@/components/ui/input"

interface FolderPanelProps {
  activeFolder: string | null
  onFolderSelect: (folderId: string | null) => void
  isActive: boolean
  onPanelFocus: () => void
}

export function FolderPanel({ activeFolder, onFolderSelect, isActive, onPanelFocus }: FolderPanelProps) {
  const { folders, addFolder } = useClipboardStore()
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName("")
      setIsAddingFolder(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddFolder()
    } else if (e.key === "Escape") {
      setIsAddingFolder(false)
      setNewFolderName("")
    }
  }

  return (
    <div
      className={cn(
        "w-64 border-r flex flex-col h-full panel-transition custom-scrollbar",
        isActive && "ring-2 ring-ring ring-inset",
      )}
      onClick={onPanelFocus}
      tabIndex={0}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Folders & Tags</h3>
        <div className="tooltip">
          <Button variant="ghost" size="icon" onClick={() => setIsAddingFolder(true)} className="btn-hover-effect">
            <Plus className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">Add Folder</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {isAddingFolder && (
          <div className="mb-2 p-1 slide-in">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              autoFocus
              onKeyDown={handleKeyDown}
              onBlur={handleAddFolder}
              className="enhanced-focus"
            />
          </div>
        )}

        <Button
          variant={activeFolder === null ? "secondary" : "ghost"}
          className="w-full justify-start mb-1 btn-hover-effect"
          onClick={() => onFolderSelect(null)}
        >
          <Folder className="h-4 w-4 mr-2" />
          All Clips
        </Button>

        {folders.map((folder) => (
          <Button
            key={folder.id}
            variant={activeFolder === folder.id ? "secondary" : "ghost"}
            className="w-full justify-start mb-1 btn-hover-effect"
            onClick={() => onFolderSelect(folder.id)}
          >
            <Folder className="h-4 w-4 mr-2" />
            {folder.name}
          </Button>
        ))}

        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2 px-2">Tags</h4>
          <Button variant="ghost" className="w-full justify-start mb-1 btn-hover-effect">
            <Tag className="h-4 w-4 mr-2 text-red-500" />
            Important
          </Button>
          <Button variant="ghost" className="w-full justify-start mb-1 btn-hover-effect">
            <Tag className="h-4 w-4 mr-2 text-blue-500" />
            Code
          </Button>
          <Button variant="ghost" className="w-full justify-start mb-1 btn-hover-effect">
            <Tag className="h-4 w-4 mr-2 text-green-500" />
            Personal
          </Button>
          <Button variant="ghost" className="w-full justify-start mb-1 btn-hover-effect">
            <Tag className="h-4 w-4 mr-2 text-purple-500" />
            Work
          </Button>
        </div>
      </div>

      <div className="p-3 border-t">
        <div className="text-xs text-muted-foreground">
          Active folder: {activeFolder ? folders.find((f) => f.id === activeFolder)?.name : "All Clips"}
        </div>
      </div>
    </div>
  )
}
