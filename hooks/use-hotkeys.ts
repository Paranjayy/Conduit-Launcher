"use client"

import { useEffect } from "react"

type KeyHandler = (event: KeyboardEvent) => void

export function useHotkey(
  key: string,
  handler: KeyHandler,
  options: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  } = {},
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if modifier keys match the options
      const ctrlMatch = options.ctrl ? event.ctrlKey : !options.ctrl
      const shiftMatch = options.shift ? event.shiftKey : !options.shift
      const altMatch = options.alt ? event.altKey : !options.alt
      const metaMatch = options.meta ? event.metaKey : !options.meta

      if (event.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        handler(event)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, handler, options])
}
