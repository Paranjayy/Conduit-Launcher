import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Interface for a search result from any provider
 */
export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: string | ReactNode;
  provider: string;
  action: () => void;
  secondaryActions?: Array<{
    name: string;
    action: () => void;
  }>;
  // Additional metadata that might be useful for rendering or sorting
  metadata?: Record<string, any>;
}

/**
 * Interface for a search provider that can be registered with the search system
 */
export interface SearchProvider {
  id: string;
  name: string;
  icon: ReactNode | LucideIcon;
  priority: number; // Higher numbers will be searched first and displayed higher
  search: (query: string) => Promise<SearchResult[]>;
  // Optional methods
  getQuickActions?: () => Promise<SearchResult[]>; // Results to show when no query is entered
  getRecentItems?: () => Promise<SearchResult[]>; // Recent items from this provider
}

/**
 * Registry of all active search providers
 */
export class SearchProviderRegistry {
  private providers: Map<string, SearchProvider> = new Map();
  
  /**
   * Register a new search provider
   */
  register(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
  }
  
  /**
   * Unregister a search provider
   */
  unregister(providerId: string): void {
    this.providers.delete(providerId);
  }
  
  /**
   * Get all registered providers
   */
  getAllProviders(): SearchProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): SearchProvider | undefined {
    return this.providers.get(providerId);
  }
  
  /**
   * Search across all providers
   */
  async search(query: string): Promise<SearchResult[]> {
    // Get sorted providers (by priority)
    const providers = this.getAllProviders();
    
    // Search all providers in parallel
    const resultsArrays = await Promise.all(
      providers.map(async (provider) => {
        try {
          const results = await provider.search(query);
          // Tag each result with its provider ID
          return results.map(result => ({
            ...result,
            provider: provider.id
          }));
        } catch (error) {
          console.error(`Error searching provider ${provider.id}:`, error);
          return [];
        }
      })
    );
    
    // Flatten results and preserve provider priority ordering
    return resultsArrays.flat();
  }
  
  /**
   * Get quick actions from all providers
   */
  async getQuickActions(): Promise<SearchResult[]> {
    const providers = this.getAllProviders();
    const quickActionsArrays = await Promise.all(
      providers.map(async (provider) => {
        if (provider.getQuickActions) {
          try {
            const actions = await provider.getQuickActions();
            return actions.map(action => ({
              ...action,
              provider: provider.id
            }));
          } catch (error) {
            console.error(`Error getting quick actions from provider ${provider.id}:`, error);
          }
        }
        return [];
      })
    );
    
    return quickActionsArrays.flat();
  }
  
  /**
   * Get recent items from all providers
   */
  async getRecentItems(): Promise<SearchResult[]> {
    const providers = this.getAllProviders();
    const recentItemsArrays = await Promise.all(
      providers.map(async (provider) => {
        if (provider.getRecentItems) {
          try {
            const items = await provider.getRecentItems();
            return items.map(item => ({
              ...item,
              provider: provider.id
            }));
          } catch (error) {
            console.error(`Error getting recent items from provider ${provider.id}:`, error);
          }
        }
        return [];
      })
    );
    
    return recentItemsArrays.flat();
  }
}

// Create and export a singleton instance of the registry
export const searchProviderRegistry = new SearchProviderRegistry(); 