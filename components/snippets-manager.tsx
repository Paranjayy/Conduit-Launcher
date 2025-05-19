"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ArrowLeft, Scissors, Search, Plus, Folder, Tag, Save, Clipboard, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSnippetsStore } from "@/lib/snippets-store"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface SnippetsManagerProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets") => void
}

export function SnippetsManager({ onViewChange }: SnippetsManagerProps) {
  const { snippets, folders, addSnippet, updateSnippet, deleteSnippet, addFolder } = useSnippetsStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<"folders" | "snippets" | "editor">("snippets")

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const [editedKeyword, setEditedKeyword] = useState("")

  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const [isCreatingSnippet, setIsCreatingSnippet] = useState(false)

  // Filter snippets based on search query and active folder
  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      searchQuery === "" ||
      snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.keyword.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFolder = activeFolder === null || snippet.folderId === activeFolder

    return matchesSearch && matchesFolder
  })

  // Get the selected snippet
  const snippet = snippets.find((s) => s.id === selectedSnippet)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view or clear editing state
      if (e.key === "Escape") {
        if (isEditing || isCreatingSnippet) {
          setIsEditing(false)
          setIsCreatingSnippet(false)
        } else {
          onViewChange("command")
        }
      }

      // Left/Right arrow keys to navigate between panels
      if (!isEditing && !isCreatingSnippet) {
        if (e.key === "ArrowLeft") {
          if (activePanel === "snippets") {
            setActivePanel("folders")
          } else if (activePanel === "editor") {
            setActivePanel("snippets")
          }
        } else if (e.key === "ArrowRight") {
          if (activePanel === "folders") {
            setActivePanel("snippets")
          } else if (activePanel === "snippets" && selectedSnippet) {
            setActivePanel("editor")
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange, activePanel, selectedSnippet, isEditing, isCreatingSnippet])

  // Start editing mode
  const handleStartEdit = () => {
    if (!snippet) return
    setEditedTitle(snippet.title)
    setEditedContent(snippet.content)
    setEditedKeyword(snippet.keyword)
    setIsEditing(true)
  }

  // Save edits
  const handleSaveEdit = () => {
    if (isEditing && snippet) {
      updateSnippet(snippet.id, {
        title: editedTitle,
        content: editedContent,
        keyword: editedKeyword,
      })
      setIsEditing(false)
    } else if (isCreatingSnippet) {
      addSnippet({
        title: editedTitle,
        content: editedContent,
        keyword: editedKeyword,
        folderId: activeFolder,
        tags: [],
      })
      setIsCreatingSnippet(false)
    }

    setEditedTitle("")
    setEditedContent("")
    setEditedKeyword("")
  }

  // Create new snippet
  const handleCreateSnippet = () => {
    setEditedTitle("")
    setEditedContent("")
    setEditedKeyword("")
    setIsCreatingSnippet(true)
    setIsEditing(false)
    setSelectedSnippet(null)
  }

  // Add folder
  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName("")
      setIsAddingFolder(false)
    }
  }

  const handleFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddFolder()
    } else if (e.key === "Escape") {
      setIsAddingFolder(false)
      setNewFolderName("")
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
        <div className="flex items-center flex-1 relative">
          <Search className="absolute left-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search snippets..."
            className="pl-8 border-none shadow-none focus-visible:ring-0 enhanced-focus"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="tooltip absolute right-2">
            <span className="kbd text-xs">⌘F</span>
            <span className="tooltip-text">Focus Search</span>
          </div>
        </div>
        <div className="tooltip">
          <Button variant="outline" size="icon" className="ml-2 btn-hover-effect" onClick={handleCreateSnippet}>
            <Plus className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">Create Snippet</span>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Folders */}
        <div
          className={cn(
            "w-64 border-r flex flex-col h-full",
            activePanel === "folders" && "ring-2 ring-ring ring-inset",
          )}
          onClick={() => setActivePanel("folders")}
          tabIndex={0}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Folders</h3>
            <Button variant="ghost" size="icon" onClick={() => setIsAddingFolder(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isAddingFolder && (
              <div className="mb-2 p-1">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  autoFocus
                  onKeyDown={handleFolderKeyDown}
                  onBlur={handleAddFolder}
                />
              </div>
            )}

            <Button
              variant={activeFolder === null ? "secondary" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => setActiveFolder(null)}
            >
              <Folder className="h-4 w-4 mr-2" />
              All Snippets
            </Button>

            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={activeFolder === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start mb-1"
                onClick={() => setActiveFolder(folder.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                {folder.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Middle Panel - Snippets List */}
        <div
          className={cn("w-80 border-r overflow-y-auto", activePanel === "snippets" && "ring-2 ring-ring ring-inset")}
          onClick={() => setActivePanel("snippets")}
          tabIndex={0}
        >
          {filteredSnippets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p>No snippets found</p>
              {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
              {!searchQuery && (
                <Button variant="outline" className="mt-4" onClick={handleCreateSnippet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snippet
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  className={cn("p-4 cursor-pointer hover:bg-accent/50", selectedSnippet === snippet.id && "bg-accent")}
                  onClick={() => {
                    setSelectedSnippet(snippet.id)
                    setIsCreatingSnippet(false)
                    setIsEditing(false)
                  }}
                >
                  <div className="flex items-start">
                    <Scissors className="h-4 w-4 mr-2 mt-1 text-purple-500" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{snippet.title}</div>
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {snippet.content.substring(0, 60)}
                      </div>
                      {snippet.keyword && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {snippet.keyword}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Snippet Editor */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full overflow-hidden",
            activePanel === "editor" && "ring-2 ring-ring ring-inset",
          )}
          onClick={() => setActivePanel("editor")}
          tabIndex={0}
        >
          {!selectedSnippet && !isCreatingSnippet ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Scissors className="h-6 w-6 text-muted-foreground" />
              </div>
              <p>Select a snippet to view or edit</p>
              <Button variant="outline" className="mt-4 btn-hover-effect" onClick={handleCreateSnippet}>
                <Plus className="h-4 w-4 mr-2" />
                Create Snippet
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-medium">
                  {isCreatingSnippet ? "Create Snippet" : isEditing ? "Edit Snippet" : "Snippet Details"}
                </h3>
                {!isEditing && !isCreatingSnippet ? (
                  <div className="tooltip">
                    <Button variant="ghost" size="icon" onClick={handleStartEdit} className="btn-hover-effect">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <span className="tooltip-text">Edit Snippet</span>
                  </div>
                ) : (
                  <div className="tooltip">
                    <Button variant="ghost" size="icon" onClick={handleSaveEdit} className="btn-hover-effect">
                      <Save className="h-4 w-4" />
                    </Button>
                    <span className="tooltip-text">Save Changes</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="slide-in" style={{ animationDelay: "0ms" }}>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  {isEditing || isCreatingSnippet ? (
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Snippet title"
                      className="enhanced-focus"
                    />
                  ) : (
                    <div className="text-base p-2 bg-muted/50 rounded-md">{snippet?.title}</div>
                  )}
                </div>

                <div className="slide-in" style={{ animationDelay: "50ms" }}>
                  <label className="text-sm font-medium mb-1 block">Keyword/Trigger</label>
                  {isEditing || isCreatingSnippet ? (
                    <Input
                      value={editedKeyword}
                      onChange={(e) => setEditedKeyword(e.target.value)}
                      placeholder="Keyword or trigger (optional)"
                      className="enhanced-focus"
                    />
                  ) : (
                    <div className="text-base p-2 bg-muted/50 rounded-md">
                      {snippet?.keyword || <span className="text-muted-foreground">None</span>}
                    </div>
                  )}
                </div>

                <div className="slide-in" style={{ animationDelay: "100ms" }}>
                  <label className="text-sm font-medium mb-1 block">Content</label>
                  {isEditing || isCreatingSnippet ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Snippet content"
                      className="min-h-[200px] font-mono enhanced-focus"
                    />
                  ) : (
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto font-mono custom-scrollbar">
                      {snippet?.content}
                    </div>
                  )}
                </div>

                {!isCreatingSnippet && snippet && (
                  <div className="slide-in" style={{ animationDelay: "150ms" }}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium block">Tags</label>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Tag
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {snippet.tags && snippet.tags.length > 0 ? (
                        snippet.tags.map((tag, index) => (
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
                )}
              </div>

              {!isCreatingSnippet && snippet && (
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>Created: {new Date(snippet.createdAt).toLocaleString()}</div>
                    <div className="flex items-center">
                      <Clipboard className="h-3 w-3 mr-1" />
                      Used: {snippet.useCount} times
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
