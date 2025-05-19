"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { FileText, ImageIcon, File, LinkIcon, PaintBucket } from "lucide-react"
import { useClipboardStore } from "@/lib/clipboard-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ClipsPanelProps {
  searchQuery: string
  activeFolder: string | null
  selectedClip: string | null
  onClipSelect: (clipId: string | null) => void
  isActive: boolean
  onPanelFocus: () => void
}

export function ClipsPanel({
  searchQuery,
  activeFolder,
  selectedClip,
  onClipSelect,
  isActive,
  onPanelFocus,
}: ClipsPanelProps) {
  const { clips } = useClipboardStore()
  const panelRef = useRef<HTMLDivElement>(null)

  // Filter clips based on search query and active folder
  const filteredClips = clips.filter((clip) => {
    const matchesSearch =
      searchQuery === "" ||
      clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (clip.type === "text" && clip.content.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFolder = activeFolder === null || clip.folderId === activeFolder

    return matchesSearch && matchesFolder
  })

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault()

      const currentIndex = selectedClip ? filteredClips.findIndex((clip) => clip.id === selectedClip) : -1

      let newIndex
      if (e.key === "ArrowDown") {
        newIndex = currentIndex < filteredClips.length - 1 ? currentIndex + 1 : 0
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : filteredClips.length - 1
      }

      onClipSelect(filteredClips[newIndex]?.id || null)
    }
  }

  // Scroll selected clip into view
  useEffect(() => {
    if (selectedClip && panelRef.current) {
      const selectedElement = panelRef.current.querySelector(`[data-clip-id="${selectedClip}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedClip])

  // Set up keyboard event listener
  useEffect(() => {
    if (!isActive) return

    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()

        const currentIndex = selectedClip ? filteredClips.findIndex((clip) => clip.id === selectedClip) : -1

        let newIndex
        if (e.key === "ArrowDown") {
          newIndex = currentIndex < filteredClips.length - 1 ? currentIndex + 1 : 0
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : filteredClips.length - 1
        }

        onClipSelect(filteredClips[newIndex]?.id || null)
      }
    }

    window.addEventListener("keydown", handleKeyboardNavigation)
    return () => window.removeEventListener("keydown", handleKeyboardNavigation)
  }, [isActive, filteredClips, selectedClip, onClipSelect])

  // Update the panel with enhanced styling and animations
  return (
    <div
      ref={panelRef}
      className={cn(
        "flex-1 border-r overflow-y-auto panel-transition custom-scrollbar",
        isActive && "ring-2 ring-ring ring-inset",
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={onPanelFocus}
    >
      {filteredClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
          <div className="rounded-full bg-muted p-3 mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p>No clips found</p>
          {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
        </div>
      ) : (
        <div className="divide-y">
          {filteredClips.map((clip) => (
            <div
              key={clip.id}
              data-clip-id={clip.id}
              className={cn(
                "p-4 cursor-pointer hover:bg-accent/50 flex items-start gap-3 transition-colors",
                selectedClip === clip.id && "bg-accent",
              )}
              onClick={() => onClipSelect(clip.id)}
            >
              <div className="mt-0.5">
                {clip.type === "text" && (
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1">
                    <FileText className="h-4 w-4 text-blue-500" />
                  </div>
                )}
                {clip.type === "image" && (
                  <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1">
                    <ImageIcon className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {clip.type === "file" && (
                  <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-1">
                    <File className="h-4 w-4 text-orange-500" />
                  </div>
                )}
                {clip.type === "link" && (
                  <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1">
                    <LinkIcon className="h-4 w-4 text-purple-500" />
                  </div>
                )}
                {clip.type === "color" && (
                  <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-1">
                    <PaintBucket className="h-4 w-4 text-red-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{clip.title || "Untitled"}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {clip.type === "text" && clip.content.substring(0, 60)}
                  {clip.type === "image" && "Image"}
                  {clip.type === "file" && clip.path}
                  {clip.type === "link" && clip.url}
                  {clip.type === "color" && clip.value}
                </div>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-muted-foreground">{new Date(clip.createdAt).toLocaleString()}</div>
                  {clip.source && (
                    <>
                      <div className="mx-1 w-1 h-1 rounded-full bg-muted-foreground"></div>
                      <div className="text-xs text-muted-foreground">{clip.source}</div>
                    </>
                  )}
                  {clip.pasteCount > 0 && (
                    <>
                      <div className="mx-1 w-1 h-1 rounded-full bg-muted-foreground"></div>
                      <div className="text-xs text-muted-foreground">Used {clip.pasteCount} times</div>
                    </>
                  )}
                </div>
                {clip.tags && clip.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clip.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
