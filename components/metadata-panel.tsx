"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Clock, Hash, Type, FileText, ImageIcon, Edit, Save, Tag, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useClipboardStore } from "@/lib/clipboard-store"
import { cn } from "@/lib/utils"

interface MetadataPanelProps {
  clipId: string | null
  isActive: boolean
  onPanelFocus: () => void
}

export function MetadataPanel({ clipId, isActive, onPanelFocus }: MetadataPanelProps) {
  const { clips, updateClip, addTagToClip } = useClipboardStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)

  const clip = clips.find((c) => c.id === clipId)

  // Start editing mode
  const handleStartEdit = () => {
    if (!clip) return
    setEditedTitle(clip.title || "")
    setEditedContent(clip.type === "text" ? clip.content : "")
    setIsEditing(true)
  }

  // Save edits
  const handleSaveEdit = () => {
    if (!clip) return
    updateClip(clip.id, {
      title: editedTitle,
      content: clip.type === "text" ? editedContent : clip.content,
    })
    setIsEditing(false)
  }

  // Add tag
  const handleAddTag = () => {
    if (!clip || !newTag.trim()) return
    addTagToClip(clip.id, newTag.trim())
    setNewTag("")
    setIsAddingTag(false)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTag()
    } else if (e.key === "Escape") {
      setIsAddingTag(false)
      setNewTag("")
    }
  }

  if (!clip) {
    return (
      <div
        className={cn(
          "w-80 p-4 flex flex-col items-center justify-center h-full text-muted-foreground",
          isActive && "ring-2 ring-ring ring-inset",
        )}
        onClick={onPanelFocus}
        tabIndex={0}
      >
        <p>Select a clip to view details</p>
      </div>
    )
  }

  return (
    <div
      className={cn("w-80 flex flex-col h-full overflow-hidden", isActive && "ring-2 ring-ring ring-inset")}
      onClick={onPanelFocus}
      tabIndex={0}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-medium">Details & Preview</h3>
        {!isEditing ? (
          <Button variant="ghost" size="icon" onClick={handleStartEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
            <Save className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <div className="p-4 border-b">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="Enter title"
              className="mb-2"
            />
          ) : (
            <h4 className="font-medium mb-2">{clip.title || "Untitled"}</h4>
          )}

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{new Date(clip.createdAt).toLocaleDateString()}</span>
            <Clock className="h-3 w-3 ml-3 mr-1" />
            <span>{new Date(clip.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2">Preview</h4>

          {clip.type === "text" &&
            (isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[100px]"
              />
            ) : (
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {clip.content}
              </div>
            ))}

          {clip.type === "image" && (
            <div className="bg-muted rounded-md p-2 flex items-center justify-center">
              {clip.url ? (
                <img
                  src={clip.url || "/placeholder.svg"}
                  alt="Clipboard image"
                  className="max-w-full max-h-[200px] object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] w-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          {clip.type === "link" && (
            <div className="bg-muted p-3 rounded-md text-sm break-all">
              <a href={clip.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {clip.url}
              </a>
            </div>
          )}

          {clip.type === "file" && <div className="bg-muted p-3 rounded-md text-sm break-all">{clip.path}</div>}

          {clip.type === "color" && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: clip.value }} />
              <span className="text-sm">{clip.value}</span>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="p-4 border-b">
          <h4 className="text-sm font-medium mb-2">Metadata</h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-muted-foreground">Type</div>
            <div className="flex items-center">
              {clip.type === "text" && <FileText className="h-3 w-3 mr-1 text-blue-500" />}
              {clip.type === "image" && <ImageIcon className="h-3 w-3 mr-1 text-green-500" />}
              {clip.type === "file" && <Type className="h-3 w-3 mr-1 text-orange-500" />}
              {clip.type === "link" && <Hash className="h-3 w-3 mr-1 text-purple-500" />}
              {clip.type === "color" && <Edit className="h-3 w-3 mr-1 text-red-500" />}
              <span className="capitalize">{clip.type}</span>
            </div>

            {clip.type === "text" && (
              <>
                <div className="text-muted-foreground">Characters</div>
                <div>{clip.content.length}</div>

                <div className="text-muted-foreground">Words</div>
                <div>{clip.content.split(/\s+/).filter(Boolean).length}</div>

                <div className="text-muted-foreground">Lines</div>
                <div>{clip.content.split("\n").length}</div>
              </>
            )}

            {clip.type === "image" && clip.dimensions && (
              <>
                <div className="text-muted-foreground">Dimensions</div>
                <div>
                  {clip.dimensions.width} × {clip.dimensions.height}
                </div>
              </>
            )}

            {clip.source && (
              <>
                <div className="text-muted-foreground">Source</div>
                <div>{clip.source}</div>
              </>
            )}

            <div className="text-muted-foreground">Times pasted</div>
            <div>{clip.pasteCount || 0}</div>

            <div className="text-muted-foreground">Last pasted</div>
            <div>{clip.lastPastedAt ? new Date(clip.lastPastedAt).toLocaleString() : "Never"}</div>
          </div>
        </div>

        {/* Tags */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">Tags</h4>
            <Button variant="ghost" size="icon" onClick={() => setIsAddingTag(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isAddingTag && (
            <div className="mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="New tag"
                autoFocus
                onKeyDown={handleTagKeyDown}
                onBlur={handleAddTag}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {clip.tags && clip.tags.length > 0 ? (
              clip.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))
            ) : (
              <div className="text-xs text-muted-foreground">No tags</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
