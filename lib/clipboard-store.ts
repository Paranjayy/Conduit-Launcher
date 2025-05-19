"use client"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { usePasteStackStore } from "./paste-stack-store"
import { useSnippetsStore } from "./snippets-store"

// Types
export type ClipType = "text" | "image" | "file" | "link" | "color"

export interface Clip {
  id: string
  type: ClipType
  title: string
  content: string
  url?: string
  path?: string
  value?: string
  dimensions?: {
    width: number
    height: number
  }
  folderId: string | null
  tags: string[]
  source?: string
  createdAt: number
  lastEditedAt: number
  lastPastedAt: number | null
  pasteCount: number
}

export interface Folder {
  id: string
  name: string
  createdAt: number
}

interface ClipboardState {
  clips: Clip[]
  folders: Folder[]
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  addClip: (clip: Omit<Clip, "id" | "createdAt" | "lastEditedAt" | "lastPastedAt" | "pasteCount">) => void
  updateClip: (id: string, updates: Partial<Clip>) => void
  deleteClip: (id: string) => void
  pasteClip: (id: string) => void
  addFolder: (name: string) => void
  updateFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  addTagToClip: (id: string, tag: string) => void
  removeTagFromClip: (id: string, tag: string) => void
  addToSnippets: (id: string) => void
}

// Mock data for initial development
const mockFolders: Folder[] = [
  { id: "folder-1", name: "General", createdAt: Date.now() },
  { id: "folder-2", name: "Code Snippets", createdAt: Date.now() },
  { id: "folder-3", name: "Images", createdAt: Date.now() },
]

const mockClips: Clip[] = [
  {
    id: "clip-1",
    type: "text",
    title: "Welcome to OmniLaunch",
    content: "This is a sample text clip to demonstrate the clipboard manager functionality.",
    folderId: "folder-1",
    tags: ["sample", "text"],
    source: "OmniLaunch",
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
    lastPastedAt: null,
    pasteCount: 0,
  },
  {
    id: "clip-2",
    type: "text",
    title: "React Component",
    content: "function MyComponent() {\n  return <div>Hello World</div>;\n}",
    folderId: "folder-2",
    tags: ["code", "react"],
    source: "VS Code",
    createdAt: Date.now() - 3600000,
    lastEditedAt: Date.now() - 3600000,
    lastPastedAt: null,
    pasteCount: 0,
  },
  {
    id: "clip-3",
    type: "link",
    title: "GitHub",
    content: "GitHub",
    url: "https://github.com",
    folderId: "folder-1",
    tags: ["website"],
    source: "Chrome",
    createdAt: Date.now() - 7200000,
    lastEditedAt: Date.now() - 7200000,
    lastPastedAt: null,
    pasteCount: 0,
  },
  {
    id: "clip-4",
    type: "color",
    title: "Brand Blue",
    content: "Brand Blue",
    value: "#0070f3",
    folderId: "folder-1",
    tags: ["color", "brand"],
    source: "Figma",
    createdAt: Date.now() - 10800000,
    lastEditedAt: Date.now() - 10800000,
    lastPastedAt: null,
    pasteCount: 0,
  },
]

// Clipboard monitoring implementation
let clipboardMonitorInterval: NodeJS.Timeout | null = null
let lastClipboardText = ""

// Function to monitor clipboard
const monitorClipboard = (addClip: (clip: any) => void) => {
  // In a real implementation, this would use Electron's clipboard API
  // For now, we'll simulate clipboard changes

  // Mock clipboard monitoring for development
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    const checkClipboard = async () => {
      try {
        // This will only work in secure contexts and with user permission
        const text = await navigator.clipboard.readText()

        if (text && text !== lastClipboardText) {
          lastClipboardText = text

          // Add to clipboard store
          addClip({
            type: "text",
            title: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
            content: text,
            folderId: "folder-1", // Default folder
            tags: [],
            source: "Browser",
          })

          console.log("New clipboard content detected:", text.substring(0, 30) + "...")
        }
      } catch (err) {
        // Clipboard API might not be available or permission denied
        console.log("Clipboard monitoring error:", err)
      }
    }

    // Check clipboard every 2 seconds
    return setInterval(checkClipboard, 2000)
  }

  return null
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  clips: mockClips,
  folders: mockFolders,
  isMonitoring: false,

  startMonitoring: () => {
    if (clipboardMonitorInterval) {
      clearInterval(clipboardMonitorInterval)
    }

    clipboardMonitorInterval = monitorClipboard((clipData) => {
      get().addClip(clipData)
    })

    set({ isMonitoring: true })
    console.log("Started monitoring clipboard")
  },

  stopMonitoring: () => {
    if (clipboardMonitorInterval) {
      clearInterval(clipboardMonitorInterval)
      clipboardMonitorInterval = null
    }

    set({ isMonitoring: false })
    console.log("Stopped monitoring clipboard")
  },

  addClip: (clipData) => {
    const newClip: Clip = {
      id: uuidv4(),
      ...clipData,
      createdAt: Date.now(),
      lastEditedAt: Date.now(),
      lastPastedAt: null,
      pasteCount: 0,
    }

    set((state) => ({
      clips: [newClip, ...state.clips],
    }))

    // Also add to paste stack if active
    const pasteStackStore = usePasteStackStore.getState()
    if (pasteStackStore.isActive) {
      pasteStackStore.addToStack(newClip)
    }
  },

  updateClip: (id, updates) => {
    set((state) => ({
      clips: state.clips.map((clip) => (clip.id === id ? { ...clip, ...updates, lastEditedAt: Date.now() } : clip)),
    }))
  },

  deleteClip: (id) => {
    set((state) => ({
      clips: state.clips.filter((clip) => clip.id !== id),
    }))
  },

  pasteClip: (id) => {
    const clip = get().clips.find((c) => c.id === id)
    if (!clip) return

    // In a real implementation, this would use Electron's clipboard API to paste
    // For now, we'll just simulate pasting by copying to clipboard

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      switch (clip.type) {
        case "text":
          navigator.clipboard.writeText(clip.content)
          break
        case "link":
          navigator.clipboard.writeText(clip.url || "")
          break
        case "color":
          navigator.clipboard.writeText(clip.value || "")
          break
        // Image and file would require different handling in Electron
      }
    }

    // Update paste count and last pasted time
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id
          ? {
              ...c,
              pasteCount: c.pasteCount + 1,
              lastPastedAt: Date.now(),
            }
          : c,
      ),
    }))

    console.log(`Pasted clip: ${clip.title}`)
  },

  addFolder: (name) => {
    const newFolder: Folder = {
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
    // First update any clips in this folder to have null folderId
    set((state) => ({
      clips: state.clips.map((clip) => (clip.folderId === id ? { ...clip, folderId: null } : clip)),
      folders: state.folders.filter((folder) => folder.id !== id),
    }))
  },

  addTagToClip: (id, tag) => {
    set((state) => ({
      clips: state.clips.map((clip) => {
        if (clip.id === id) {
          // Only add tag if it doesn't already exist
          const tags = clip.tags.includes(tag) ? clip.tags : [...clip.tags, tag]
          return { ...clip, tags }
        }
        return clip
      }),
    }))
  },

  removeTagFromClip: (id, tag) => {
    set((state) => ({
      clips: state.clips.map((clip) => {
        if (clip.id === id) {
          const tags = clip.tags.filter((t) => t !== tag)
          return { ...clip, tags }
        }
        return clip
      }),
    }))
  },

  addToSnippets: (id) => {
    const clip = get().clips.find((c) => c.id === id)
    if (!clip || clip.type !== "text") return

    // Add to snippets store
    const snippetsStore = useSnippetsStore.getState()
    snippetsStore.addSnippet({
      title: clip.title,
      content: clip.content,
      keyword: "",
      folderId: null,
      tags: clip.tags,
    })

    console.log(`Added clip to snippets: ${clip.title}`)
  },
}))
