"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, List, Clipboard, ArrowDown, ArrowUp, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePasteStackStore } from "@/lib/paste-stack-store"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface PasteStackProps {
  onViewChange: (view: "command" | "clipboard" | "pasteStack" | "snippets") => void
}

export function PasteStack({ onViewChange }: PasteStackProps) {
  const { stack, isActive, toggleActive, removeFromStack, clearStack, moveItemUp, moveItemDown, pasteAll, saveStack } =
    usePasteStackStore()

  const [listType, setListType] = useState<"numbered" | "bullet">("numbered")

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view
      if (e.key === "Escape") {
        onViewChange("command")
      }

      // Ctrl/Cmd+Enter to paste all
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        pasteAll()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange, pasteAll])

  return (
    <div className="flex flex-col h-[500px]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center">
          <div className="tooltip">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewChange("command")}
              className="mr-2 btn-hover-effect"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="tooltip-text">
              Back to Command Bar <span className="kbd">Esc</span>
            </span>
          </div>
          <h3 className="font-medium">Paste Stack</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="paste-stack-active"
              checked={isActive}
              onCheckedChange={toggleActive}
              className="enhanced-focus"
            />
            <Label htmlFor="paste-stack-active">Active</Label>
          </div>

          <div className="tooltip">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="btn-hover-effect">
                  <List className="h-4 w-4 mr-2" />
                  {listType === "numbered" ? "Numbered" : "Bullet"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setListType("numbered")}>Numbered List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setListType("bullet")}>Bullet List</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="tooltip-text">List Style</span>
          </div>
        </div>
      </div>

      {/* Stack Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {stack.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="rounded-full bg-muted p-3 mb-4">
              <List className="h-6 w-6 text-muted-foreground" />
            </div>
            <p>Paste stack is empty</p>
            <p className="text-sm mt-1">Copy items to add them to the stack</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stack.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-muted rounded-md group hover:shadow-sm transition-all"
              >
                <div className="mt-1 text-muted-foreground min-w-[20px] font-medium">
                  {listType === "numbered" ? `${index + 1}.` : "•"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.title || "Untitled"}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {item.type === "text" && item.content.substring(0, 60)}
                    {item.type === "image" && "Image"}
                    {item.type === "file" && item.path}
                    {item.type === "link" && item.url}
                    {item.type === "color" && item.value}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="tooltip">
                    <Button variant="ghost" size="icon" onClick={() => moveItemUp(index)} className="h-7 w-7">
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <span className="tooltip-text">Move Up</span>
                  </div>
                  <div className="tooltip">
                    <Button variant="ghost" size="icon" onClick={() => moveItemDown(index)} className="h-7 w-7">
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <span className="tooltip-text">Move Down</span>
                  </div>
                  <div className="tooltip">
                    <Button variant="ghost" size="icon" onClick={() => removeFromStack(item.id)} className="h-7 w-7">
                      <X className="h-3 w-3" />
                    </Button>
                    <span className="tooltip-text">Remove</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="text-sm text-muted-foreground">
          {stack.length} {stack.length === 1 ? "item" : "items"} in stack
        </div>
        <div className="flex items-center gap-2">
          <div className="tooltip">
            <Button
              variant="outline"
              size="sm"
              onClick={clearStack}
              disabled={stack.length === 0}
              className="btn-hover-effect"
            >
              Clear Stack
            </Button>
            <span className="tooltip-text">Clear All Items</span>
          </div>
          <div className="tooltip">
            <Button
              variant="outline"
              size="sm"
              onClick={saveStack}
              disabled={stack.length === 0}
              className="btn-hover-effect"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Stack
            </Button>
            <span className="tooltip-text">Save for Later</span>
          </div>
          <div className="tooltip">
            <Button size="sm" onClick={pasteAll} disabled={stack.length === 0} className="btn-hover-effect">
              <Clipboard className="h-4 w-4 mr-2" />
              Paste All
              <span className="ml-2 kbd">⌘↵</span>
            </Button>
            <span className="tooltip-text">Paste All Items</span>
          </div>
        </div>
      </div>
    </div>
  )
}
