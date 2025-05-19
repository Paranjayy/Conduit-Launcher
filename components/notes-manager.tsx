"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { 
  ArrowLeft, Search, Plus, Folder, StickyNote, Save, Edit, 
  Trash, Download, Upload, Copy, Pin, CheckSquare, Square, Tag, X 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotesStore, ALL_NOTES_ID, PINNED_NOTES_ID, UNTAGGED_NOTES_ID } from "@/lib/notes-store"
import { cn } from "@/lib/utils"
import { useClipboardStore, Clip } from "@/lib/clipboard-store"

interface NotesManagerProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets" | "appSearch" | 
  "preferences" | "contextualShortcuts" | "calculator" | "menuSearch" | 
  "notes" | "multiClipboard") => void
}

export function NotesManager({ onViewChange }: NotesManagerProps) {
  // Access store
  const { 
    notes, folders, selectedNoteIds, 
    addNote, updateNote, deleteNote, deleteNotes,
    addFolder, updateFolder, deleteFolder,
    addTagToNote, removeTagFromNote,
    toggleNoteSelection, selectNotes, deselectAllNotes,
    importNotes, exportNotes, exportSelectedNotes,
    addClipToNotes
  } = useNotesStore()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFolderId, setActiveFolderId] = useState<string | null>(ALL_NOTES_ID)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<"folders" | "notes" | "editor">("notes")
  
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")
  
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [newTag, setNewTag] = useState("")

  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const contentEditRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get unique tags across all notes
  const allTags = Array.from(
    new Set(notes.flatMap(note => note.tags))
  ).sort()

  // Filter notes based on active folder, tag, and search query
  const filteredNotes = useCallback(() => {
    return notes.filter(note => {
      // Filter by folder
      const matchesFolder = 
        activeFolderId === ALL_NOTES_ID ? true : 
        activeFolderId === PINNED_NOTES_ID ? note.isPinned :
        activeFolderId === UNTAGGED_NOTES_ID ? note.tags.length === 0 :
        note.folderId === activeFolderId

      // Filter by tag
      const matchesTag = !activeTag || note.tags.includes(activeTag)

      // Filter by search
      const matchesSearch = 
        !searchQuery || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesFolder && matchesTag && matchesSearch
    })
  }, [notes, activeFolderId, activeTag, searchQuery])

  // Get the currently selected note
  const selectedNote = selectedNoteId ? notes.find(note => note.id === selectedNoteId) : null

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command or exit editing mode
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false)
          // Revert changes
          if (selectedNote) {
            setEditTitle(selectedNote.title)
            setEditContent(selectedNote.content)
          }
        } else if (isMultiSelectMode) {
          setIsMultiSelectMode(false)
          deselectAllNotes()
        } else if (selectedNoteId) {
          setSelectedNoteId(null)
        } else {
          onViewChange("command")
        }
      }

      // Command+S to save while editing
      if (e.key === "s" && (e.metaKey || e.ctrlKey) && isEditing && selectedNoteId) {
        e.preventDefault()
        handleSaveEdit()
      }

      // Command+N to create new note
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleCreateNote()
      }

      // Command+E to toggle edit mode
      if (e.key === "e" && (e.metaKey || e.ctrlKey) && selectedNoteId && !isEditing) {
        e.preventDefault()
        handleStartEdit()
      }

      // Command+F to focus search
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Delete key to delete selected note(s)
      if (e.key === "Delete" && !isEditing) {
        if (isMultiSelectMode && selectedNoteIds.length > 0) {
          handleDeleteSelectedNotes()
        } else if (selectedNoteId) {
          handleDeleteNote(selectedNoteId)
        }
      }

      // Left/Right arrow keys to navigate between panels
      if (!isEditing) {
        if (e.key === "ArrowLeft") {
          if (activePanel === "notes") {
            setActivePanel("folders")
          } else if (activePanel === "editor") {
            setActivePanel("notes")
          }
        } else if (e.key === "ArrowRight") {
          if (activePanel === "folders") {
            setActivePanel("notes")
          } else if (activePanel === "notes" && selectedNoteId) {
            setActivePanel("editor")
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    onViewChange, activePanel, selectedNoteId, isEditing, selectedNote, 
    isMultiSelectMode, selectedNoteIds, deselectAllNotes
  ])

  // Start editing mode
  const handleStartEdit = () => {
    if (!selectedNote) return
    setEditTitle(selectedNote.title)
    setEditContent(selectedNote.content)
    setIsEditing(true)
    
    // Focus the content editor after state update
    setTimeout(() => {
      contentEditRef.current?.focus()
    }, 0)
  }

  // Save edits
  const handleSaveEdit = () => {
    if (selectedNoteId) {
      updateNote(selectedNoteId, {
        title: editTitle,
        content: editContent
      })
      setIsEditing(false)
    }
  }

  // Create new note
  const handleCreateNote = () => {
    // Determine folder ID (use active folder if not a special folder)
    const folderId = 
      activeFolderId === ALL_NOTES_ID || 
      activeFolderId === PINNED_NOTES_ID || 
      activeFolderId === UNTAGGED_NOTES_ID 
        ? null 
        : activeFolderId
    
    const newNoteId = addNote({
      title: "Untitled Note",
      content: "",
      folderId,
      isPinned: false,
      tags: activeTag ? [activeTag] : []
    })
    
    setSelectedNoteId(newNoteId)
    setEditTitle("Untitled Note")
    setEditContent("")
    setIsEditing(true)
    
    // Focus the title input after state update
    setTimeout(() => {
      contentEditRef.current?.focus()
    }, 0)
  }

  // Delete note
  const handleDeleteNote = (id: string) => {
    deleteNote(id)
    if (selectedNoteId === id) {
      setSelectedNoteId(null)
    }
  }

  // Delete selected notes
  const handleDeleteSelectedNotes = () => {
    deleteNotes(selectedNoteIds)
    setIsMultiSelectMode(false)
  }

  // Toggle note pin status
  const handleTogglePin = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      updateNote(id, { isPinned: !note.isPinned })
    }
  }

  // Toggle note selection in multi-select mode
  const handleToggleNoteSelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    toggleNoteSelection(id)
  }

  // Add folder
  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      const folderId = addFolder(newFolderName.trim())
      setActiveFolderId(folderId)
      setNewFolderName("")
      setIsAddingFolder(false)
    }
  }

  // Add tag to active note
  const handleAddTag = () => {
    if (newTag.trim() && selectedNoteId) {
      addTagToNote(selectedNoteId, newTag.trim())
      setNewTag("")
      setIsAddingTag(false)
    }
  }

  // Remove tag from note
  const handleRemoveTag = (noteId: string, tag: string) => {
    removeTagFromNote(noteId, tag)
  }

  // Import notes from file
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        importNotes(data)
      } catch (error) {
        console.error("Failed to import notes:", error)
        // You could add a toast notification here
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (event.target) {
      event.target.value = ""
    }
  }

  // Export all notes
  const handleExportAllNotes = () => {
    const data = exportNotes()
    downloadJson(data, "omnilaunch-notes.json")
  }

  // Export selected notes
  const handleExportSelectedNotes = () => {
    const data = exportSelectedNotes()
    downloadJson(data, "omnilaunch-selected-notes.json")
  }

  // Helper function to download JSON data
  const downloadJson = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy selected notes to clipboard
  const handleCopySelectedToClipboard = () => {
    const selectedNotes = notes.filter(note => selectedNoteIds.includes(note.id))
    
    // Join note contents with a separator
    const content = selectedNotes
      .map(note => `# ${note.title}\n\n${note.content}`)
      .join("\n\n---\n\n")
    
    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content)
    }
    
    // Exit multi-select mode
    setIsMultiSelectMode(false)
    deselectAllNotes()
  }

  return (
    <div className="flex flex-col h-[600px] bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onViewChange("command")} 
            className="mr-2 btn-hover-effect"
            title="Back to Command Bar (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="relative flex-1 mr-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search notes..."
              className="pl-8 border-none shadow-none focus-visible:ring-0 enhanced-focus"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={cn(
              "btn-hover-effect",
              isMultiSelectMode && "bg-primary/20"
            )}
            title="Multi-select Mode"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Select
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="btn-hover-effect">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAllNotes}>
                Export All Notes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleExportSelectedNotes}
                disabled={selectedNoteIds.length === 0}
              >
                Export Selected Notes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="btn-hover-effect"
            title="Import Notes"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateNote}
            className="btn-hover-effect"
            title="Create Note (Cmd+N)"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Main Content - 3 Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Folders */}
        <div
          className={cn(
            "w-56 border-r flex flex-col h-full",
            activePanel === "folders" && "ring-2 ring-ring ring-inset"
          )}
          onClick={() => setActivePanel("folders")}
        >
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Folders</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAddingFolder(true)}
              className="h-6 w-6"
              title="Add Folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* System Folders */}
            <div className="mb-2">
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                  activeFolderId === ALL_NOTES_ID ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => {
                  setActiveFolderId(ALL_NOTES_ID)
                  setActiveTag(null)
                }}
              >
                <StickyNote className="h-4 w-4" />
                <span>All Notes</span>
                <span className="ml-auto text-xs text-muted-foreground">{notes.length}</span>
              </div>
              
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                  activeFolderId === PINNED_NOTES_ID ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => {
                  setActiveFolderId(PINNED_NOTES_ID)
                  setActiveTag(null)
                }}
              >
                <Pin className="h-4 w-4" />
                <span>Pinned</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {notes.filter(note => note.isPinned).length}
                </span>
              </div>
              
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                  activeFolderId === UNTAGGED_NOTES_ID ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                )}
                onClick={() => {
                  setActiveFolderId(UNTAGGED_NOTES_ID)
                  setActiveTag(null)
                }}
              >
                <Tag className="h-4 w-4" />
                <span>Untagged</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {notes.filter(note => note.tags.length === 0).length}
                </span>
              </div>
            </div>
            
            {/* User Folders */}
            {isAddingFolder ? (
              <div className="px-2 py-1.5">
                <Input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFolder()
                    if (e.key === "Escape") {
                      e.stopPropagation()
                      setIsAddingFolder(false)
                      setNewFolderName("")
                    }
                  }}
                  onBlur={() => {
                    if (newFolderName.trim()) {
                      handleAddFolder()
                    } else {
                      setIsAddingFolder(false)
                    }
                  }}
                  placeholder="Folder name..."
                  className="h-7 text-sm"
                />
              </div>
            ) : (
              <div className="mt-1">
                <div className="text-xs uppercase font-medium text-muted-foreground px-2 mb-1">
                  Folders
                </div>
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                      activeFolderId === folder.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                    onClick={() => {
                      setActiveFolderId(folder.id)
                      setActiveTag(null)
                    }}
                  >
                    <Folder className="h-4 w-4" style={folder.color ? { color: folder.color } : undefined} />
                    <span>{folder.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {notes.filter(note => note.folderId === folder.id).length}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tags */}
            {allTags.length > 0 && (
              <div className="mt-3">
                <div className="text-xs uppercase font-medium text-muted-foreground px-2 mb-1">
                  Tags
                </div>
                {allTags.map((tag) => (
                  <div
                    key={tag}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                      activeTag === tag ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    )}
                    onClick={() => {
                      setActiveTag(tag)
                      // Keep folder context if needed
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>{tag}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {notes.filter(note => note.tags.includes(tag)).length}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Notes List */}
        <div
          className={cn(
            "w-64 border-r flex flex-col h-full",
            activePanel === "notes" && "ring-2 ring-ring ring-inset"
          )}
          onClick={() => setActivePanel("notes")}
        >
          <div className="p-4 border-b">
            <h3 className="font-medium">
              {activeTag 
                ? `Tag: ${activeTag}` 
                : activeFolderId === ALL_NOTES_ID 
                  ? "All Notes" 
                  : activeFolderId === PINNED_NOTES_ID
                    ? "Pinned Notes"
                    : activeFolderId === UNTAGGED_NOTES_ID
                      ? "Untagged Notes"
                      : folders.find(f => f.id === activeFolderId)?.name || "Notes"}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {filteredNotes().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <StickyNote className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No notes found</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateNote}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotes().map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "flex flex-col p-2 rounded-md cursor-pointer border relative",
                      selectedNoteId === note.id 
                        ? "bg-accent border-accent" 
                        : "hover:bg-accent/50",
                      note.isPinned && "border-primary/50"
                    )}
                    onClick={() => {
                      if (!isMultiSelectMode) {
                        setSelectedNoteId(note.id)
                      }
                    }}
                  >
                    {/* Multi-select checkbox */}
                    {isMultiSelectMode && (
                      <div className="absolute top-2 left-2">
                        <div 
                          className="cursor-pointer"
                          onClick={(e) => handleToggleNoteSelection(note.id, e)}
                        >
                          {selectedNoteIds.includes(note.id) 
                            ? <CheckSquare className="h-4 w-4 text-primary" /> 
                            : <Square className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "flex items-start justify-between gap-2",
                      isMultiSelectMode && "ml-6" // Add margin when in multi-select mode
                    )}>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{note.title}</h4>
                      </div>
                      
                      {note.isPinned && (
                        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {note.content}
                    </p>
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="px-1.5 py-0 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(note.lastEditedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Multi-select Actions */}
          {isMultiSelectMode && selectedNoteIds.length > 0 && (
            <div className="p-3 border-t bg-accent/30 flex flex-col gap-2">
              <div className="text-sm font-medium">
                {selectedNoteIds.length} note{selectedNoteIds.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteSelectedNotes}
                  className="flex-1"
                >
                  <Trash className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCopySelectedToClipboard}
                  className="flex-1"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Note Editor/Viewer */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full",
            activePanel === "editor" && "ring-2 ring-ring ring-inset"
          )}
          onClick={() => setActivePanel("editor")}
        >
          {selectedNote ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="font-medium text-lg focus-visible:ring-0 border-none shadow-none"
                    placeholder="Note title"
                  />
                ) : (
                  <h3 className="font-medium">{selectedNote.title}</h3>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePin(selectedNote.id)}
                    className={cn(
                      "h-8 w-8",
                      selectedNote.isPinned && "text-primary"
                    )}
                    title={selectedNote.isPinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  
                  {isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="btn-hover-effect"
                      title="Save changes (Cmd+S)"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="btn-hover-effect"
                      title="Edit note (Cmd+E)"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Delete note"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Note content */}
              <div className="flex-1 overflow-y-auto p-4">
                {isEditing ? (
                  <Textarea
                    ref={contentEditRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[200px] resize-none focus-visible:ring-0 border-none shadow-none"
                    placeholder="Note content..."
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {selectedNote.content.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-medium">Tags</h4>
                  {!isAddingTag && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddingTag(true)}
                      className="h-6 w-6"
                      title="Add tag"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                
                {isAddingTag ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      autoFocus
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTag()
                        if (e.key === "Escape") {
                          e.stopPropagation()
                          setIsAddingTag(false)
                          setNewTag("")
                        }
                      }}
                      onBlur={() => {
                        if (newTag.trim()) {
                          handleAddTag()
                        } else {
                          setIsAddingTag(false)
                        }
                      }}
                      placeholder="New tag..."
                      className="h-7 text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedNote.tags.length > 0 ? (
                      selectedNote.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="outline" 
                          className="flex items-center gap-1 pl-2 pr-1 py-0.5"
                        >
                          <span>{tag}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveTag(selectedNote.id, tag)}
                            className="h-4 w-4 ml-1 hover:bg-accent rounded-full"
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Metadata */}
              <div className="px-3 py-2 border-t bg-accent/10 text-xs text-muted-foreground flex justify-between">
                <div>
                  Created: {new Date(selectedNote.createdAt).toLocaleString()}
                </div>
                <div>
                  Last edited: {new Date(selectedNote.lastEditedAt).toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No note selected</h3>
              <p className="text-muted-foreground mb-4">Select a note from the list or create a new one</p>
              <Button
                onClick={handleCreateNote}
                className="btn-hover-effect"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Note
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 