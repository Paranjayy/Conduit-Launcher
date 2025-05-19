"use client"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { persist } from "zustand/middleware"

export type AIProvider = 
  | "openai" 
  | "anthropic" 
  | "gemini" 
  | "mistral" 
  | "llama" 
  | "custom";

export interface AIProviderConfig {
  id: AIProvider | string;
  name: string;
  apiKeyName: string;
  apiKey: string;
  endpoint?: string;
  models: string[];
  defaultModel: string;
  customRequestHeaders?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  provider: AIProvider | string;
  model: string;
}

interface AIChatState {
  chats: Chat[];
  activeChat: string | null;
  providers: AIProviderConfig[];
  isLoading: boolean;
  error: string | null;
  
  // Chat operations
  createChat: (provider: AIProvider | string, model: string) => string;
  updateChatTitle: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
  setActiveChat: (chatId: string | null) => void;
  
  // Message operations
  addMessage: (chatId: string, role: "user" | "assistant" | "system", content: string) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  
  // Provider operations
  addProvider: (provider: Omit<AIProviderConfig, "id">) => string;
  updateProvider: (providerId: string, config: Partial<AIProviderConfig>) => void;
  deleteProvider: (providerId: string) => void;
  
  // API operations
  sendMessage: (chatId: string, content: string) => Promise<void>;
}

// Default providers
const defaultProviders: AIProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKeyName: "OPENAI_API_KEY",
    apiKey: "",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
    defaultModel: "gpt-3.5-turbo"
  },
  {
    id: "anthropic",
    name: "Anthropic",
    apiKeyName: "ANTHROPIC_API_KEY",
    apiKey: "",
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    defaultModel: "claude-3-haiku"
  },
  {
    id: "gemini",
    name: "Google Gemini",
    apiKeyName: "GEMINI_API_KEY",
    apiKey: "",
    models: ["gemini-pro", "gemini-ultra"],
    defaultModel: "gemini-pro"
  },
  {
    id: "mistral",
    name: "Mistral AI",
    apiKeyName: "MISTRAL_API_KEY",
    apiKey: "",
    models: ["mistral-small", "mistral-medium", "mistral-large"],
    defaultModel: "mistral-small"
  }
];

// Mock function to simulate API calls
const mockAPICall = async (provider: string, model: string, messages: ChatMessage[]): Promise<string> => {
  // In a real implementation, this would make API calls to different providers
  return new Promise((resolve) => {
    setTimeout(() => {
      const lastMessage = messages[messages.length - 1]?.content || "";
      resolve(`This is a mock response from ${provider} (${model}) to your message: "${lastMessage}". In a real implementation, this would connect to the actual API provider.`);
    }, 1000);
  });
};

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,
      providers: defaultProviders,
      isLoading: false,
      error: null,
      
      createChat: (provider, model) => {
        const id = uuidv4();
        const now = Date.now();
        
        const newChat: Chat = {
          id,
          title: `New Chat ${get().chats.length + 1}`,
          messages: [],
          createdAt: now,
          updatedAt: now,
          provider,
          model
        };
        
        set(state => ({
          chats: [newChat, ...state.chats],
          activeChat: id
        }));
        
        return id;
      },
      
      updateChatTitle: (chatId, title) => {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { ...chat, title, updatedAt: Date.now() } 
              : chat
          )
        }));
      },
      
      deleteChat: (chatId) => {
        set(state => {
          const newChats = state.chats.filter(chat => chat.id !== chatId);
          const newActiveChat = state.activeChat === chatId 
            ? (newChats.length > 0 ? newChats[0].id : null) 
            : state.activeChat;
            
          return {
            chats: newChats,
            activeChat: newActiveChat
          };
        });
      },
      
      setActiveChat: (chatId) => {
        set({ activeChat: chatId });
      },
      
      addMessage: (chatId, role, content) => {
        const messageId = uuidv4();
        const now = Date.now();
        
        set(state => ({
          chats: state.chats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: [
                  ...chat.messages,
                  {
                    id: messageId,
                    role,
                    content,
                    timestamp: now
                  }
                ],
                updatedAt: now
              };
            }
            return chat;
          })
        }));
        
        return messageId;
      },
      
      updateMessage: (chatId, messageId, content) => {
        set(state => ({
          chats: state.chats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: chat.messages.map(msg => 
                  msg.id === messageId 
                    ? { ...msg, content } 
                    : msg
                ),
                updatedAt: Date.now()
              };
            }
            return chat;
          })
        }));
      },
      
      deleteMessage: (chatId, messageId) => {
        set(state => ({
          chats: state.chats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: chat.messages.filter(msg => msg.id !== messageId),
                updatedAt: Date.now()
              };
            }
            return chat;
          })
        }));
      },
      
      addProvider: (providerConfig) => {
        const id = providerConfig.name.toLowerCase().replace(/\s+/g, '-');
        
        const newProvider: AIProviderConfig = {
          ...providerConfig,
          id
        };
        
        set(state => ({
          providers: [...state.providers, newProvider]
        }));
        
        return id;
      },
      
      updateProvider: (providerId, config) => {
        set(state => ({
          providers: state.providers.map(provider => 
            provider.id === providerId 
              ? { ...provider, ...config } 
              : provider
          )
        }));
      },
      
      deleteProvider: (providerId) => {
        // Don't allow deleting default providers
        if (["openai", "anthropic", "gemini", "mistral"].includes(providerId)) {
          return;
        }
        
        set(state => ({
          providers: state.providers.filter(provider => provider.id !== providerId)
        }));
      },
      
      sendMessage: async (chatId, content) => {
        const { chats, providers } = get();
        const chat = chats.find(c => c.id === chatId);
        
        if (!chat) {
          set({ error: "Chat not found" });
          return;
        }
        
        const provider = providers.find(p => p.id === chat.provider);
        
        if (!provider) {
          set({ error: "Provider not found" });
          return;
        }
        
        // Add user message
        const userMessageId = uuidv4();
        const now = Date.now();
        
        set(state => ({
          isLoading: true,
          error: null,
          chats: state.chats.map(c => {
            if (c.id === chatId) {
              return {
                ...c,
                messages: [
                  ...c.messages,
                  {
                    id: userMessageId,
                    role: "user",
                    content,
                    timestamp: now
                  }
                ],
                updatedAt: now
              };
            }
            return c;
          })
        }));
        
        try {
          // Get the updated chat with the new user message
          const updatedChat = get().chats.find(c => c.id === chatId)!;
          
          // Call the API
          const response = await mockAPICall(
            provider.name,
            chat.model,
            updatedChat.messages
          );
          
          // Add assistant message
          const assistantMessageId = uuidv4();
          
          set(state => ({
            isLoading: false,
            chats: state.chats.map(c => {
              if (c.id === chatId) {
                return {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: assistantMessageId,
                      role: "assistant",
                      content: response,
                      timestamp: Date.now()
                    }
                  ],
                  updatedAt: Date.now()
                };
              }
              return c;
            })
          }));
          
          // Update chat title if it's the first message
          const chatToUpdate = get().chats.find(c => c.id === chatId)!;
          if (chatToUpdate.messages.length <= 3 && chatToUpdate.title.startsWith('New Chat')) {
            // Generate a title based on the first message
            const title = content.length > 30 
              ? `${content.substring(0, 30)}...` 
              : content;
              
            get().updateChatTitle(chatId, title);
          }
        } catch (error) {
          set({ 
            isLoading: false,
            error: error instanceof Error ? error.message : "An error occurred" 
          });
        }
      }
    }),
    {
      name: "ai-chat-storage",
      // Only persist specific fields
      partialize: (state) => ({
        chats: state.chats,
        providers: state.providers.map(provider => ({
          ...provider,
          // Don't store API keys in localStorage for security
          apiKey: ""
        }))
      })
    }
  )
) 