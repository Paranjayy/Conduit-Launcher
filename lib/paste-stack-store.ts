"use client"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import type { Clip } from "./clipboard-store"
import { useClipboardStore } from "./clipboard-store"

interface PasteStackState {
  stack: Clip[]
  stackHistory: Array<{ id: string; name: string; items: Clip[] }>
  isActive: boolean
  toggleActive: () => void
  addToStack: (clip: Clip) => void
  removeFromStack: (id: string) => void
  clearStack: () => void
  moveItemUp: (index: number) => void
  moveItemDown: (index: number) => void
  pasteAll: () => void
  saveStack: () => void
  loadStack: (id: string) => void
}

export const usePasteStackStore = create<PasteStackState>((set, get) => ({
  stack: [],
  stackHistory: [],
  isActive: true,

  toggleActive: () => {
    set((state) => ({ isActive: !state.isActive }))
  },

  addToStack: (clip) => {
    // Only add if active
    if (!get().isActive) return

    // Check if already in stack
    const exists = get().stack.some((item) => item.id === clip.id)
    if (exists) return

    set((state) => ({
      stack: [...state.stack, clip],
    }))
  },

  removeFromStack: (id) => {
    set((state) => ({
      stack: state.stack.filter((item) => item.id !== id),
    }))
  },

  clearStack: () => {
    // Save current stack to history before clearing
    const currentStack = get().stack
    if (currentStack.length > 0) {
      const stackName = `Stack ${get().stackHistory.length + 1}`
      set((state) => ({
        stackHistory: [...state.stackHistory, { id: uuidv4(), name: stackName, items: currentStack }],
        stack: [],
      }))
    } else {
      set({ stack: [] })
    }
  },

  moveItemUp: (index) => {
    if (index <= 0) return

    set((state) => {
      const newStack = [...state.stack]
      const temp = newStack[index]
      newStack[index] = newStack[index - 1]
      newStack[index - 1] = temp
      return { stack: newStack }
    })
  },

  moveItemDown: (index) => {
    set((state) => {
      if (index >= state.stack.length - 1) return state

      const newStack = [...state.stack]
      const temp = newStack[index]
      newStack[index] = newStack[index + 1]
      newStack[index + 1] = temp
      return { stack: newStack }
    })
  },

  pasteAll: () => {
    const { stack } = get()
    const clipboardStore = useClipboardStore.getState()

    // In a real implementation, this would paste all items sequentially
    // For now, we'll just simulate by pasting the first item and logging the rest

    if (stack.length > 0) {
      // Paste first item
      clipboardStore.pasteClip(stack[0].id)

      // Log the rest
      console.log(`Pasting all ${stack.length} items from stack`)
      stack.slice(1).forEach((item, index) => {
        console.log(`Would paste item ${index + 2}: ${item.title}`)
      })
    }
  },

  saveStack: () => {
    const currentStack = get().stack
    if (currentStack.length === 0) return

    // Create a name for the stack
    const stackName = `Stack ${get().stackHistory.length + 1}`

    set((state) => ({
      stackHistory: [...state.stackHistory, { id: uuidv4(), name: stackName, items: currentStack }],
    }))

    console.log(`Saved stack as "${stackName}"`)
  },

  loadStack: (id) => {
    const stackToLoad = get().stackHistory.find((stack) => stack.id === id)
    if (!stackToLoad) return

    set({ stack: stackToLoad.items })
    console.log(`Loaded stack: ${stackToLoad.name}`)
  },
}))
