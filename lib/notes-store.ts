"use client"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { Clip } from "./clipboard-store"

export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  isPinned: boolean
  tags: string[]
  createdAt: number
  lastEditedAt: number
  selectedText?: string // For highlighting specific text
}

export interface NoteFolder {
  id: string
  name: string
  color?: string
  createdAt: number
}

// Special IDs for system folders
export const ALL_NOTES_ID = 'all-notes'
export const PINNED_NOTES_ID = 'pinned-notes'
export const UNTAGGED_NOTES_ID = 'untagged-notes'

interface NotesState {
  notes: Note[]
  folders: NoteFolder[]
  selectedNoteIds: string[] // For multi-select functionality
  addNote: (note: Omit<Note, "id" | "createdAt" | "lastEditedAt">) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  deleteNotes: (ids: string[]) => void
  addFolder: (name: string, color?: string) => string
  updateFolder: (id: string, updates: Partial<NoteFolder>) => void
  deleteFolder: (id: string) => void
  addTagToNote: (id: string, tag: string) => void
  removeTagFromNote: (id: string, tag: string) => void
  toggleNoteSelection: (id: string) => void
  selectNotes: (ids: string[]) => void
  deselectAllNotes: () => void
  importNotes: (importData: { notes: Note[], folders: NoteFolder[] }) => void
  exportNotes: () => { notes: Note[], folders: NoteFolder[] }
  exportSelectedNotes: () => { notes: Note[] }
  addClipToNotes: (clips: Clip[]) => string[]
}

// Sample data for initial development
const sampleFolders: NoteFolder[] = [
  { id: "folder-1", name: "General", createdAt: Date.now() },
  { id: "folder-2", name: "Work", color: "#0ea5e9", createdAt: Date.now() },
  { id: "folder-3", name: "Personal", color: "#22c55e", createdAt: Date.now() },
  { id: "folder-4", name: "Ideas", color: "#f59e0b", createdAt: Date.now() },
]

const sampleNotes: Note[] = [
  {
    id: "note-1",
    title: "Welcome to OmniLaunch Notes",
    content: "This is a sample note to help you get started with OmniLaunch Notes.\n\n- Create new notes\n- Organize with folders and tags\n- Import and export your notes\n- Use multi-select clipboard for quick access",
    folderId: "folder-1",
    isPinned: true,
    tags: ["help", "getting-started"],
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
  },
  {
    id: "note-2",
    title: "Project Ideas",
    content: "# Future Project Ideas\n\n1. Build a personal website\n2. Create a mobile app for task management\n3. Learn a new programming language\n4. Start a technical blog",
    folderId: "folder-4",
    isPinned: false,
    tags: ["ideas", "projects"],
    createdAt: Date.now() - 3600000,
    lastEditedAt: Date.now() - 3600000,
  },
  {
    id: "note-3",
    title: "Meeting Notes: Team Sync",
    content: "# Team Sync Meeting\n\n**Date:** June 15, 2023\n\n## Attendees:\n- Alice\n- Bob\n- Charlie\n\n## Action Items:\n- [ ] Research competitor products\n- [ ] Create initial wireframes\n- [ ] Schedule follow-up meeting",
    folderId: "folder-2",
    isPinned: false,
    tags: ["meeting", "work"],
    createdAt: Date.now() - 7200000,
    lastEditedAt: Date.now() - 7200000,
  },
]

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: sampleNotes,
  folders: sampleFolders,
  selectedNoteIds: [],

  addNote: (noteData) => {
    const newNote: Note = {
      id: uuidv4(),
      ...noteData,
      createdAt: Date.now(),
      lastEditedAt: Date.now(),
    }

    set((state) => ({
      notes: [newNote, ...state.notes],
    }))

    return newNote.id
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, lastEditedAt: Date.now() } : note
      ),
    }))
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedNoteIds: state.selectedNoteIds.filter(noteId => noteId !== id)
    }))
  },

  deleteNotes: (ids) => {
    set((state) => ({
      notes: state.notes.filter((note) => !ids.includes(note.id)),
      selectedNoteIds: state.selectedNoteIds.filter(noteId => !ids.includes(noteId))
    }))
  },

  addFolder: (name, color) => {
    const newFolder: NoteFolder = {
      id: uuidv4(),
      name,
      color,
      createdAt: Date.now(),
    }

    set((state) => ({
      folders: [...state.folders, newFolder],
    }))

    return newFolder.id
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      folders: state.folders.map((folder) => 
        folder.id === id ? { ...folder, ...updates } : folder
      ),
    }))
  },

  deleteFolder: (id) => {
    // Update any notes in this folder to have null folderId
    set((state) => ({
      notes: state.notes.map((note) => 
        note.folderId === id ? { ...note, folderId: null } : note
      ),
      folders: state.folders.filter((folder) => folder.id !== id),
    }))
  },

  addTagToNote: (id, tag) => {
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id === id) {
          // Only add tag if it doesn't already exist
          const tags = note.tags.includes(tag) ? note.tags : [...note.tags, tag]
          return { ...note, tags, lastEditedAt: Date.now() }
        }
        return note
      }),
    }))
  },

  removeTagFromNote: (id, tag) => {
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id === id) {
          const tags = note.tags.filter((t) => t !== tag)
          return { ...note, tags, lastEditedAt: Date.now() }
        }
        return note
      }),
    }))
  },

  toggleNoteSelection: (id) => {
    set((state) => {
      if (state.selectedNoteIds.includes(id)) {
        return {
          selectedNoteIds: state.selectedNoteIds.filter(noteId => noteId !== id)
        }
      } else {
        return {
          selectedNoteIds: [...state.selectedNoteIds, id]
        }
      }
    })
  },

  selectNotes: (ids) => {
    set({ selectedNoteIds: ids })
  },

  deselectAllNotes: () => {
    set({ selectedNoteIds: [] })
  },

  importNotes: (importData) => {
    // Generate new IDs for imported notes and folders to avoid conflicts
    const folderIdMap = new Map<string, string>()
    
    const newFolders = importData.folders.map(folder => {
      const newId = uuidv4()
      folderIdMap.set(folder.id, newId)
      return {
        ...folder,
        id: newId,
        createdAt: Date.now()
      }
    })
    
    const newNotes = importData.notes.map(note => {
      // Update folder reference if needed
      const folderId = note.folderId ? (folderIdMap.get(note.folderId) || null) : null
      
      return {
        ...note,
        id: uuidv4(),
        folderId,
        createdAt: Date.now(),
        lastEditedAt: Date.now()
      }
    })
    
    set((state) => ({
      folders: [...state.folders, ...newFolders],
      notes: [...newNotes, ...state.notes]
    }))
  },

  exportNotes: () => {
    const { notes, folders } = get()
    return { notes, folders }
  },

  exportSelectedNotes: () => {
    const { notes, selectedNoteIds } = get()
    const selectedNotes = notes.filter(note => selectedNoteIds.includes(note.id))
    return { notes: selectedNotes }
  },

  addClipToNotes: (clips) => {
    const newNoteIds: string[] = []
    
    clips.forEach(clip => {
      const newNoteId = get().addNote({
        title: clip.title || 'Untitled Clip',
        content: clip.content,
        folderId: null,
        isPinned: false,
        tags: clip.tags || [],
      })
      
      newNoteIds.push(newNoteId)
    })
    
    return newNoteIds
  }
})) 