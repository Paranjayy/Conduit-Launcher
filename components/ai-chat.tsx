"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  ArrowLeft, Send, Plus, Settings, MessageSquare, 
  MoreVertical, Trash, Edit, User, Bot, Sparkles, 
  Loader2, Copy, Check, X, ChevronDown, Trash2, Download, Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAIChatStore, AIProvider, AIProviderConfig } from "@/lib/ai-chat-store"
import { format } from "date-fns"

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

interface AIChatProps {
  onViewChange: (view: ViewType) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat({ onViewChange }: AIChatProps) {
  const { 
    chats, 
    activeChat, 
    providers, 
    isLoading, 
    error,
    createChat, 
    updateChatTitle, 
    deleteChat, 
    setActiveChat,
    sendMessage, 
    updateProvider
  } = useAIChatStore()
  
  const [input, setInput] = useState("")
  const [editingTitle, setEditingTitle] = useState(false)
  const [chatTitle, setChatTitle] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const activeProvider = providers.find(p => {
    const chat = chats.find(c => c.id === activeChat)
    return chat && p.id === chat.provider
  })
  
  const currentChat = chats.find(c => c.id === activeChat)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [localIsLoading, setLocalIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  
  // Use store state instead of local state for messages when we have a current chat
  const displayMessages = currentChat ? currentChat.messages : messages
  const displayIsLoading = currentChat ? isLoading : localIsLoading
  
  // Scroll to bottom of messages when they change or when loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentChat?.messages, isLoading])
  
  // Set title from active chat when it changes
  useEffect(() => {
    if (currentChat) {
      setChatTitle(currentChat.title)
    }
  }, [currentChat])
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to go back to command view
      if (e.key === "Escape") {
        if (editingTitle) {
          setEditingTitle(false)
          setChatTitle(currentChat?.title || "")
        } else if (showSettings) {
          setShowSettings(false)
        } else {
          onViewChange("command")
        }
      }
      
      // Focus input with / key if not already focused
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onViewChange, editingTitle, showSettings, currentChat])
  
  // Handle new chat button click
  const handleNewChat = () => {
    const defaultProvider = providers.find(p => p.id === "openai") || providers[0]
    createChat(defaultProvider.id, defaultProvider.defaultModel)
  }
  
  // Handle send message
  const handleSendMessage = () => {
    handleSend(); // Use our local mock function
  }
  
  // Handle chat title update
  const handleUpdateTitle = () => {
    if (!activeChat || !chatTitle.trim()) return
    
    updateChatTitle(activeChat, chatTitle.trim())
    setEditingTitle(false)
  }
  
  // Handle delete chat
  const handleDeleteChat = (chatId: string) => {
    deleteChat(chatId)
  }
  
  // Handle API key update
  const handleAPIKeyUpdate = (providerId: string, apiKey: string) => {
    updateProvider(providerId, { apiKey })
  }
  
  // Copy message content to clipboard
  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }
  
  // Sample responses for different types of queries
  const mockResponses = {
    coding: [
      "Here's a solution to your coding problem:\n\n```javascript\nfunction example() {\n  // Your code here\n  return result;\n}\n```\n\nThis approach uses modern JavaScript features for better performance.",
      "I can help you with that! Here's how you might approach this:\n\n1. First, analyze the requirements\n2. Choose the right data structure\n3. Implement the algorithm\n4. Test with edge cases\n\nWould you like me to elaborate on any of these steps?",
      "That's a great question! In this case, you might want to consider:\n\n• Performance implications\n• Memory usage\n• Maintainability\n• Browser compatibility\n\nLet me know if you'd like a specific implementation example."
    ],
    general: [
      "I understand what you're looking for. Let me break this down for you:\n\n✨ Here are the key points to consider...",
      "That's an interesting question! Based on current best practices, I'd recommend...",
      "Great question! Here's what I think about that:\n\n• Point 1: Important consideration\n• Point 2: Another key factor\n• Point 3: Final thought\n\nWhat are your thoughts on this approach?",
      "I can definitely help with that! Here's a comprehensive approach:\n\n1. Start with the basics\n2. Build incrementally\n3. Test thoroughly\n4. Iterate based on feedback\n\nWould you like me to dive deeper into any of these areas?"
    ],
    creative: [
      "Here's a creative approach to that challenge:\n\n🎨 **Idea 1**: Think outside the box...\n🎨 **Idea 2**: Consider the user's perspective...\n🎨 **Idea 3**: What if we tried...\n\nWhich direction interests you most?",
      "I love creative challenges! Here are some brainstorming ideas:\n\n• Unconventional solution A\n• Innovative approach B  \n• Disruptive method C\n\nLet's explore whichever resonates with you!",
      "That's a fascinating creative problem! Consider these angles:\n\n✨ **Artistic approach**: ...\n✨ **Technical innovation**: ...\n✨ **User experience focus**: ...\n\nWhat appeals to your creative vision?"
    ]
  };

  // Mock AI response generation
  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Determine response category
    let category: keyof typeof mockResponses = 'general';
    
    if (lowerMessage.includes('code') || lowerMessage.includes('javascript') || 
        lowerMessage.includes('programming') || lowerMessage.includes('function') ||
        lowerMessage.includes('react') || lowerMessage.includes('typescript')) {
      category = 'coding';
    } else if (lowerMessage.includes('creative') || lowerMessage.includes('design') ||
               lowerMessage.includes('idea') || lowerMessage.includes('brainstorm')) {
      category = 'creative';
    }
    
    // Get random response from category
    const responses = mockResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || localIsLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLocalIsLoading(true);
    setIsTyping(true);

    try {
      // Check if we have a real API key and provider
      if (activeProvider?.apiKey && currentChat) {
        // Use real API
        await sendMessage(currentChat.id, userMessage.content);
      } else {
        // Fallback to mock response
        console.log('[AI Chat] No API key found, using mock response');
        setTimeout(() => {
          const response = generateResponse(userMessage.content);
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
          setLocalIsLoading(false);
          setIsTyping(false);
        }, 1000 + Math.random() * 2000); // 1-3 seconds delay
      }
    } catch (error) {
      console.error('[AI Chat] Error sending message:', error);
      setLocalIsLoading(false);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Using mock response instead.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Fall back to mock response after error
      setTimeout(() => {
        const response = generateResponse(userMessage.content);
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  // Handle input key down for sending
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render chat message
  const renderMessage = (message: any) => {
    return (
      <div 
        key={message.id} 
        className={cn(
          "py-4 px-4 flex gap-3 group",
          message.role === "assistant" ? "bg-accent/50" : "bg-background"
        )}
      >
        <div className="flex-shrink-0 w-6">
          {message.role === "user" ? (
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-blue-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm dark:prose-invert max-w-none mb-1">
            {message.content.split('\n').map((line: string, i: number) => (
              <p key={i} className="mb-1">{line || <br />}</p>
            ))}
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            {format(new Date(message.timestamp), 'MMM d, yyyy · h:mm a')}
          </div>
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopyMessage(message.content, message.id)}
            className="h-6 w-6"
            title="Copy to clipboard"
          >
            {copiedMessageId === message.id ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    )
  }
  
  // Render loading indicator
  const renderLoadingIndicator = () => {
    return (
      <div className="py-4 px-4 flex gap-3 bg-accent/50">
        <div className="flex-shrink-0 w-6">
          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-blue-500" />
          </div>
        </div>
        
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    )
  }
  
  // Render error message
  const renderErrorMessage = () => {
    if (!error) return null
    
    return (
      <div className="py-4 px-4 flex gap-3 bg-red-500/10">
        <div className="flex-shrink-0 w-6">
          <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-red-500">Error: {error}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Please check your API key and connection settings
          </div>
        </div>
      </div>
    )
  }
  
  // Render API key settings dialog
  const renderAPIKeySettingsDialog = () => {
    return (
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API Settings</DialogTitle>
            <DialogDescription>
              Configure API providers and keys for AI chat.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-3">
            {providers.map(provider => (
              <div key={provider.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">{provider.name}</label>
                  {provider.apiKey && (
                    <div className="text-xs text-green-500 flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Connected
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder={`Enter ${provider.apiKeyName}`}
                    value={provider.apiKey || ""}
                    onChange={(e) => handleAPIKeyUpdate(provider.id, e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {provider.id === "openai" && (
                    <span>Get API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI</a></span>
                  )}
                  {provider.id === "anthropic" && (
                    <span>Get API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic</a></span>
                  )}
                  {provider.id === "gemini" && (
                    <span>Get API key from <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a></span>
                  )}
                  {provider.id === "mistral" && (
                    <span>Get API key from <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mistral AI</a></span>
                  )}
                </div>
              </div>
            ))}
            
            <div className="text-xs text-yellow-500 p-2 bg-yellow-500/10 rounded-md">
              <strong>Note:</strong> API keys are stored securely in your browser and are never sent to our servers. They're used directly from your browser to communicate with the AI providers.
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
  
  return (
    <div className="flex h-[600px]">
      {/* Left sidebar - Chat list */}
      <div className="w-60 border-r flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Chat History</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-7 w-7 hover:bg-accent"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2">
          <Button 
            className="w-full justify-start" 
            variant="default"
            onClick={handleNewChat}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          {chats.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div className="space-y-1 px-1">
              {chats.map(chat => (
                <div 
                  key={chat.id}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-md cursor-pointer group",
                    chat.id === activeChat 
                      ? "bg-accent" 
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{chat.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {chat.messages.length 
                        ? `${chat.messages.length} message${chat.messages.length === 1 ? '' : 's'}` 
                        : 'No messages'}
                    </div>
                  </div>
                  
                  {chat.id === activeChat && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTitle(true)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteChat(chat.id)
                          }}
                          className="text-red-500"
                        >
                          <Trash className="h-3.5 w-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onViewChange("command")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Command
          </Button>
        </div>
      </div>
      
      {/* Right content - Chat */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b">
              {editingTitle ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTitle()
                      if (e.key === "Escape") {
                        e.stopPropagation()
                        setEditingTitle(false)
                        setChatTitle(currentChat.title)
                      }
                    }}
                    className="h-8"
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => {
                      setEditingTitle(false)
                      setChatTitle(currentChat.title)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateTitle}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{currentChat.title}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-accent"
                    onClick={() => setEditingTitle(true)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {activeProvider && (
                  <div className="text-xs text-muted-foreground bg-accent/50 py-1 px-2 rounded-full flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {activeProvider.name} • {currentChat.model}
                  </div>
                )}
              </div>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {currentChat.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <Sparkles className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Type a message below to start chatting with the AI assistant.
                    {!activeProvider?.apiKey && (
                      <span className="block mt-2 text-yellow-500">
                        You need to set up an API key first in Settings.
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  {displayMessages.map(renderMessage)}
                  {displayIsLoading && renderLoadingIndicator()}
                  {error && renderErrorMessage()}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t">
              <div className="relative">
                <Textarea
                  ref={inputRef}
                  placeholder="Type a message... (press / to focus)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  className="pr-10 min-h-[100px] resize-none"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || localIsLoading}
                  className={cn(
                    "absolute right-2 bottom-2 h-8 w-8",
                    !input.trim() || localIsLoading ? "opacity-50" : "opacity-100"
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Provider and model selector */}
              <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Select
                    value={currentChat.provider}
                    onValueChange={(value) => {
                      const provider = providers.find(p => p.id === value)
                      if (provider) {
                        createChat(value, provider.defaultModel)
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span>•</span>
                  
                  <Select
                    value={currentChat.model}
                    onValueChange={(value) => {
                      const newChat = createChat(currentChat.provider, value)
                      // Copy title from old chat
                      updateChatTitle(newChat, currentChat.title)
                    }}
                  >
                    <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProvider?.models.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No chat selected</h3>
            <p className="text-muted-foreground mb-4">
              Select a chat from the sidebar or create a new one
            </p>
            <Button onClick={handleNewChat}>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        )}
      </div>
      
      {/* Settings Dialog */}
      {renderAPIKeySettingsDialog()}
    </div>
  )
} 