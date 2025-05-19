"use client"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"

export interface Snippet {
  id: string
  title: string
  content: string
  keyword: string
  folderId: string | null
  tags: string[]
  createdAt: number
  lastEditedAt: number
  lastUsedAt: number | null
  useCount: number
}

export interface SnippetFolder {
  id: string
  name: string
  createdAt: number
}

interface SnippetsState {
  snippets: Snippet[]
  folders: SnippetFolder[]
  addSnippet: (snippet: Omit<Snippet, "id" | "createdAt" | "lastEditedAt" | "lastUsedAt" | "useCount">) => void
  updateSnippet: (id: string, updates: Partial<Snippet>) => void
  deleteSnippet: (id: string) => void
  useSnippet: (id: string) => void
  addFolder: (name: string) => void
  updateFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  addTagToSnippet: (id: string, tag: string) => void
  removeTagFromSnippet: (id: string, tag: string) => void
}

// Mock data for initial development
const mockFolders: SnippetFolder[] = [
  { id: "folder-1", name: "General", createdAt: Date.now() },
  { id: "folder-2", name: "Code", createdAt: Date.now() },
  { id: "folder-3", name: "Email Templates", createdAt: Date.now() },
]

const mockSnippets: Snippet[] = [
  {
    id: "snippet-1",
    title: "Email Signature",
    content: "Best regards,\nJohn Doe\nProduct Manager\nExample Inc.",
    keyword: "sig",
    folderId: "folder-3",
    tags: ["email", "signature"],
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
    lastUsedAt: null,
    useCount: 0,
  },
  {
    id: "snippet-2",
    title: "React Component",
    content:
      "import React from 'react';\n\nfunction Component() {\n  return <div>Hello World</div>;\n}\n\nexport default Component;",
    keyword: "rfc",
    folderId: "folder-2",
    tags: ["react", "code"],
    createdAt: Date.now() - 3600000,
    lastEditedAt: Date.now() - 3600000,
    lastUsedAt: null,
    useCount: 0,
  },
  {
    id: "snippet-3",
    title: "Meeting Notes Template",
    content: "# Meeting Notes\n\n## Date: {date}\n\n## Attendees\n- \n\n## Agenda\n1. \n\n## Action Items\n- [ ] ",
    keyword: "meeting",
    folderId: "folder-1",
    tags: ["template", "notes"],
    createdAt: Date.now() - 7200000,
    lastEditedAt: Date.now() - 7200000,
    lastUsedAt: null,
    useCount: 0,
  },
]

export const useSnippetsStore = create<SnippetsState>((set, get) => ({
  snippets: mockSnippets,
  folders: mockFolders,

  addSnippet: (snippetData) => {
    const newSnippet: Snippet = {
      id: uuidv4(),
      ...snippetData,
      createdAt: Date.now(),
      lastEditedAt: Date.now(),
      lastUsedAt: null,
      useCount: 0,
    }

    set((state) => ({
      snippets: [...state.snippets, newSnippet],
    }))
  },

  updateSnippet: (id, updates) => {
    set((state) => ({
      snippets: state.snippets.map((snippet) =>
        snippet.id === id ? { ...snippet, ...updates, lastEditedAt: Date.now() } : snippet,
      ),
    }))
  },

  deleteSnippet: (id) => {
    set((state) => ({
      snippets: state.snippets.filter((snippet) => snippet.id !== id),
    }))
  },

  useSnippet: (id) => {
    // In a real implementation, this would copy the snippet to clipboard
    // and potentially expand placeholders

    set((state) => ({
      snippets: state.snippets.map((snippet) =>
        snippet.id === id
          ? {
              ...snippet,
              useCount: snippet.useCount + 1,
              lastUsedAt: Date.now(),
            }
          : snippet,
      ),
    }))

    const snippet = get().snippets.find((s) => s.id === id)
    if (snippet) {
      // Copy to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(snippet.content)
      }

      console.log(`Used snippet: ${snippet.title}`)
    }
  },

  addFolder: (name) => {
    const newFolder: SnippetFolder = {
      id: uuidv4(),
      name,
      createdAt: Date.now(),
    }

    set((state) => ({
      folders: [...state.folders, newFolder],
    }))
  },

  updateFolder: (id, name) => {
    set((state) => ({
      folders: state.folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)),
    }))
  },

  deleteFolder: (id) => {
    // Update any snippets in this folder to have null folderId
    set((state) => ({
      snippets: state.snippets.map((snippet) => (snippet.folderId === id ? { ...snippet, folderId: null } : snippet)),
      folders: state.folders.filter((folder) => folder.id !== id),
    }))
  },

  addTagToSnippet: (id, tag) => {
    set((state) => ({
      snippets: state.snippets.map((snippet) => {
        if (snippet.id === id) {
          // Only add tag if it doesn't already exist
          const tags = snippet.tags.includes(tag) ? snippet.tags : [...snippet.tags, tag]
          return { ...snippet, tags }
        }
        return snippet
      }),
    }))
  },

  removeTagFromSnippet: (id, tag) => {
    set((state) => ({
      snippets: state.snippets.map((snippet) => {
        if (snippet.id === id) {
          const tags = snippet.tags.filter((t) => t !== tag)
          return { ...snippet, tags }
        }
        return snippet
      }),
    }))
  },
}))
