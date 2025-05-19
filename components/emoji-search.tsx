"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Search, Copy, Clock, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useClipboardStore } from "@/lib/clipboard-store"

// Define the view types for type safety
type ViewType = 
  | "command" 
  | "clipboard" 
  | "pasteStack" 
  | "snippets" 
  | "appSearch" 
  | "preferences" 
  | "contextualShortcuts" 
  | "calculator" 
  | "menuSearch" 
  | "notes" 
  | "multiClipboard"
  | "emojiSearch"
  | "aiChat";

interface EmojiSearchProps {
  onViewChange: (view: ViewType) => void;
}

// Emoji categories
const CATEGORIES = [
  { id: 'recent', name: 'Recent', icon: <Clock className="h-4 w-4" /> },
  { id: 'favorites', name: 'Favorites', icon: <Star className="h-4 w-4" /> },
  { id: 'smileys', name: 'Smileys & Emotion', emoji: '😀' },
  { id: 'people', name: 'People & Body', emoji: '👋' },
  { id: 'animals', name: 'Animals & Nature', emoji: '🐶' },
  { id: 'food', name: 'Food & Drink', emoji: '🍔' },
  { id: 'travel', name: 'Travel & Places', emoji: '✈️' },
  { id: 'activities', name: 'Activities', emoji: '⚽' },
  { id: 'objects', name: 'Objects', emoji: '💡' },
  { id: 'symbols', name: 'Symbols', emoji: '❤️' },
  { id: 'flags', name: 'Flags', emoji: '🏳️' }
];

// Sample emoji data (in a real implementation, this would be a more complete dataset)
interface Emoji {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
}

// This is a small sample; a real implementation would include hundreds of emojis
const EMOJI_DATA: Emoji[] = [
  { emoji: '😀', name: 'Grinning Face', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😃', name: 'Grinning Face with Big Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😄', name: 'Grinning Face with Smiling Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😁', name: 'Beaming Face with Smiling Eyes', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'grin'] },
  { emoji: '😆', name: 'Grinning Squinting Face', category: 'smileys', keywords: ['smile', 'happy', 'joy', 'laugh'] },
  { emoji: '😅', name: 'Grinning Face with Sweat', category: 'smileys', keywords: ['smile', 'happy', 'relief', 'sweat'] },
  { emoji: '🙂', name: 'Slightly Smiling Face', category: 'smileys', keywords: ['smile', 'neutral', 'slight'] },
  { emoji: '🫠', name: 'Melting Face', category: 'smileys', keywords: ['melt', 'heat', 'dissolve'] },
  { emoji: '😊', name: 'Smiling Face with Smiling Eyes', category: 'smileys', keywords: ['blush', 'smile', 'happy'] },
  { emoji: '😇', name: 'Smiling Face with Halo', category: 'smileys', keywords: ['angel', 'innocent', 'halo'] },
  { emoji: '🥰', name: 'Smiling Face with Hearts', category: 'smileys', keywords: ['love', 'hearts', 'adore'] },
  { emoji: '😍', name: 'Smiling Face with Heart-Eyes', category: 'smileys', keywords: ['love', 'heart', 'adore'] },
  { emoji: '🤩', name: 'Star-Struck', category: 'smileys', keywords: ['star', 'excited', 'amazed'] },
  { emoji: '👋', name: 'Waving Hand', category: 'people', keywords: ['wave', 'hello', 'goodbye'] },
  { emoji: '👏', name: 'Clapping Hands', category: 'people', keywords: ['clap', 'applause', 'praise'] },
  { emoji: '👍', name: 'Thumbs Up', category: 'people', keywords: ['thumbs', 'up', 'approve', 'like'] },
  { emoji: '👎', name: 'Thumbs Down', category: 'people', keywords: ['thumbs', 'down', 'disapprove', 'dislike'] },
  { emoji: '❤️', name: 'Red Heart', category: 'symbols', keywords: ['heart', 'love', 'like'] },
  { emoji: '🔥', name: 'Fire', category: 'symbols', keywords: ['fire', 'hot', 'lit', 'flame'] },
  { emoji: '⭐', name: 'Star', category: 'symbols', keywords: ['star', 'favorite', 'rating'] },
  { emoji: '🌟', name: 'Glowing Star', category: 'symbols', keywords: ['star', 'glow', 'shine'] },
  { emoji: '💯', name: 'Hundred Points', category: 'symbols', keywords: ['hundred', '100', 'score', 'perfect'] },
  { emoji: '🍔', name: 'Hamburger', category: 'food', keywords: ['burger', 'food', 'meat'] },
  { emoji: '🍕', name: 'Pizza', category: 'food', keywords: ['pizza', 'food', 'slice'] },
  { emoji: '🌮', name: 'Taco', category: 'food', keywords: ['taco', 'food', 'mexican'] },
  { emoji: '🍦', name: 'Soft Ice Cream', category: 'food', keywords: ['ice', 'cream', 'dessert', 'sweet'] },
  { emoji: '🐶', name: 'Dog Face', category: 'animals', keywords: ['dog', 'pet', 'animal'] },
  { emoji: '🐱', name: 'Cat Face', category: 'animals', keywords: ['cat', 'pet', 'animal'] },
  { emoji: '🐻', name: 'Bear Face', category: 'animals', keywords: ['bear', 'animal', 'wild'] },
  { emoji: '🦁', name: 'Lion Face', category: 'animals', keywords: ['lion', 'animal', 'wild'] },
  { emoji: '🦊', name: 'Fox Face', category: 'animals', keywords: ['fox', 'animal', 'wild'] }
];

export function EmojiSearch({ onViewChange }: EmojiSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [recentEmojis, setRecentEmojis] = useState<string[]>([])
  const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([])
  const [copiedEmoji, setCopiedEmoji] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { addClip } = useClipboardStore()

  // Filter emojis based on search query
  const filteredEmojis = searchQuery
    ? EMOJI_DATA.filter(emoji => 
        emoji.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emoji.keywords.some(keyword => keyword.includes(searchQuery.toLowerCase()))
      )
    : EMOJI_DATA.filter(emoji => emoji.category === activeCategory)

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Load recent and favorite emojis from localStorage
  useEffect(() => {
    try {
      const storedRecent = localStorage.getItem('recentEmojis')
      const storedFavorites = localStorage.getItem('favoriteEmojis')
      
      if (storedRecent) setRecentEmojis(JSON.parse(storedRecent))
      if (storedFavorites) setFavoriteEmojis(JSON.parse(storedFavorites))
    } catch (error) {
      console.error("Failed to load emojis from localStorage:", error)
    }
  }, [])

  // Save recent and favorite emojis to localStorage
  const saveToLocalStorage = (key: 'recentEmojis' | 'favoriteEmojis', data: string[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error)
    }
  }

  // Handle emoji click - copy to clipboard and add to recent
  const handleEmojiClick = (emoji: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(emoji)
    
    // Add to clipboard manager
    addClip({
      type: "text",
      title: `Emoji: ${emoji}`,
      content: emoji,
      folderId: null,
      tags: ["emoji"],
      source: "Emoji Search"
    })
    
    // Show feedback
    setCopiedEmoji(emoji)
    setTimeout(() => setCopiedEmoji(null), 1500)
    
    // Add to recent emojis
    const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 24)
    setRecentEmojis(newRecent)
    saveToLocalStorage('recentEmojis', newRecent)
  }

  // Toggle favorite status
  const toggleFavorite = (emoji: string) => {
    let newFavorites: string[]
    
    if (favoriteEmojis.includes(emoji)) {
      newFavorites = favoriteEmojis.filter(e => e !== emoji)
    } else {
      newFavorites = [emoji, ...favoriteEmojis].slice(0, 24)
    }
    
    setFavoriteEmojis(newFavorites)
    saveToLocalStorage('favoriteEmojis', newFavorites)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view
      if (e.key === "Escape") {
        onViewChange("command")
      }

      // Command+F to focus search
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange])

  // Render emoji grid
  const renderEmojiGrid = (emojis: Emoji[] | string[]) => {
    const renderEmoji = (emoji: string | Emoji, index: number) => {
      const emojiChar = typeof emoji === 'string' ? emoji : emoji.emoji
      const emojiName = typeof emoji === 'string' 
        ? EMOJI_DATA.find(e => e.emoji === emoji)?.name || 'Emoji'
        : emoji.name
      
      const isFavorite = favoriteEmojis.includes(emojiChar)
      
      return (
        <div 
          key={`${emojiChar}-${index}`}
          className={cn(
            "flex flex-col items-center p-2 rounded-md cursor-pointer hover:bg-accent/50 relative group",
            copiedEmoji === emojiChar && "bg-primary/20"
          )}
          onClick={() => handleEmojiClick(emojiChar)}
          title={emojiName}
        >
          <span className="text-2xl mb-1">{emojiChar}</span>
          {copiedEmoji === emojiChar && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              Copied!
            </div>
          )}
          <button
            className={cn(
              "absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isFavorite && "opacity-100 text-yellow-400"
            )}
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite(emojiChar)
            }}
          >
            <Star className="h-3.5 w-3.5 fill-current" />
          </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-8 gap-1 p-2">
        {emojis.length > 0 ? (
          (Array.isArray(emojis) && typeof emojis[0] === 'string')
            ? (emojis as string[]).map((emoji, index) => renderEmoji(emoji, index))
            : (emojis as Emoji[]).map((emoji, index) => renderEmoji(emoji, index))
        ) : (
          <div className="col-span-8 py-8 text-center text-muted-foreground">
            No emojis found
          </div>
        )}
      </div>
    )
  }

  // Render emoji categories
  const renderCategories = () => {
    return (
      <div className="flex overflow-x-auto p-2 border-b gap-1">
        {CATEGORIES.map(category => (
          <button
            key={category.id}
            className={cn(
              "flex items-center justify-center min-w-10 h-10 rounded-md p-2 shrink-0",
              activeCategory === category.id 
                ? "bg-primary/20 text-primary" 
                : "hover:bg-accent/50"
            )}
            onClick={() => {
              setActiveCategory(category.id)
              setSearchQuery("")
            }}
            title={category.name}
          >
            {category.icon || <span className="text-lg">{category.emoji}</span>}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Top Bar */}
      <div className="flex items-center border-b p-4">
        <div className="tooltip">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewChange("command")}
            className="mr-2 btn-hover-effect"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="tooltip-text">Back (Esc)</span>
        </div>
        
        <h3 className="font-medium flex items-center">Emoji Search</h3>
        
        <div className="flex-1 relative mx-4">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Input
            ref={searchInputRef}
            placeholder="Search emojis..."
            className="pl-8 pr-8 focus-visible:ring-0 border-none shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Emoji Categories */}
      {!searchQuery && renderCategories()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery ? (
          <div className="p-4">
            <h4 className="text-sm text-muted-foreground mb-2">
              {filteredEmojis.length} result{filteredEmojis.length !== 1 ? 's' : ''} for "{searchQuery}"
            </h4>
            {renderEmojiGrid(filteredEmojis)}
          </div>
        ) : (
          <Tabs defaultValue={activeCategory === 'recent' ? 'recent' : activeCategory === 'favorites' ? 'favorites' : 'category'}>
            <TabsContent value="recent" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Recently Used</h4>
                {recentEmojis.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No recent emojis
                  </div>
                ) : (
                  renderEmojiGrid(recentEmojis)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Favorites</h4>
                {favoriteEmojis.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No favorite emojis yet. Click the star icon to add emojis to favorites.
                  </div>
                ) : (
                  renderEmojiGrid(favoriteEmojis)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="category" className="m-0">
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">
                  {CATEGORIES.find(cat => cat.id === activeCategory)?.name || 'Emojis'}
                </h4>
                {renderEmojiGrid(filteredEmojis)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t bg-accent/10 text-xs text-muted-foreground flex justify-between">
        <div>Click emoji to copy • ⌘F to search</div>
        <div>Press ⭐ to favorite</div>
      </div>
    </div>
  )
} 