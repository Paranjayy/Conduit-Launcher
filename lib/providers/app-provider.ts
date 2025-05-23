import { Laptop, LucideIcon } from 'lucide-react';
import { SearchProvider, SearchResult } from '../search-providers';

// Simple cache for applications
let cachedApps: Application[] | null = null;
let lastCacheTime = 0;
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

interface Application {
  name: string;
  path: string;
  icon: string; // Will be base64 string or empty
}

export class AppSearchProvider implements SearchProvider {
  id = 'app-search';
  name = 'Applications';
  icon = Laptop; // Default/fallback icon for the provider itself
  priority = 90;
  
  private isElectron = typeof window !== 'undefined' && !!window.electron;
  private appCache: Application[] = [];
  private onCacheUpdate: (() => void) | null = null;

  constructor() {
    if (this.isElectron && window.electron?.app) {
      this.initializeApps();
    }
  }

  // Method to allow components to subscribe to cache updates
  subscribe(callback: () => void): () => void {
    this.onCacheUpdate = callback;
    return () => {
      this.onCacheUpdate = null;
    };
  }

  private async initializeApps(): Promise<void> {
    const electron = window.electron as any;
    if (!this.isElectron || !electron?.app?.getApplications) return;

    try {
      console.log('[AppSearchProvider] Requesting initial applications list...');
      const initialApps = await electron.app.getApplications();
      if (initialApps && Array.isArray(initialApps)) {
        this.appCache = initialApps.map(app => ({ ...app, icon: app.icon || '' }));
        console.log(`[AppSearchProvider] Initialized with ${this.appCache.length} apps.`);
        if (this.onCacheUpdate) this.onCacheUpdate();
      }

      // Listen for the complete list of apps without icons
      if (typeof electron?.app?.onAllAppsNoIcons === 'function') {
        console.log('[AppSearchProvider] 🎧 Setting up listener for all apps without icons');
        electron.app.onAllAppsNoIcons((allApps: Application[]) => {
          console.log(`[AppSearchProvider] 📥 Received complete list of ${allApps.length} apps without icons`);
          // Create a map of existing apps by path for quick lookup
          const existingAppsMap = new Map(this.appCache.map(app => [app.path, app]));
          
          // Create an updated app cache
          this.appCache = allApps.map(app => {
            // If we already have this app, keep its existing icon
            const existingApp = existingAppsMap.get(app.path);
            return existingApp ? existingApp : { ...app, icon: '' };
          });
          
          // Sort alphabetically 
          this.appCache.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
          
          console.log(`[AppSearchProvider] ✅ Updated cache with ${this.appCache.length} total apps (${this.appCache.filter(app => app.icon).length} with icons)`);
          if (this.onCacheUpdate) {
            console.log('[AppSearchProvider] 🔄 Triggering cache update callback');
            this.onCacheUpdate();
          }
        });
      } else {
        console.warn('[AppSearchProvider] ❌ onAllAppsNoIcons function not available in electron.app');
      }

      // Check if the onUpdatedAppIcons function exists at runtime
      if (typeof electron?.app?.onUpdatedAppIcons === 'function') {
        console.log('[AppSearchProvider] 🎧 Setting up listener for updated app icons');
        electron.app.onUpdatedAppIcons((updatedAppsWithIcons: Application[]) => {
          console.log(`[AppSearchProvider] 📥 Received ${updatedAppsWithIcons.length} updated app icons`);
          
          // Log details of first few apps for debugging
          updatedAppsWithIcons.slice(0, 2).forEach(app => {
            console.log(`[AppSearchProvider] 🔍 Updated app "${app.name}": icon length = ${app.icon?.length || 0}, starts with = ${app.icon?.substring(0, 20) || 'no icon'}`);
          });
          
          let cacheChanged = false;
          
          // Create a map for fast lookup
          const updateMap = new Map(updatedAppsWithIcons.map(app => [app.path, app]));
          
          this.appCache = this.appCache.map(cachedApp => {
            const updatedApp = updateMap.get(cachedApp.path);
            if (updatedApp && updatedApp.icon && cachedApp.icon !== updatedApp.icon) {
              console.log(`[AppSearchProvider] 🔄 Updating icon for ${cachedApp.name}: ${cachedApp.icon?.length || 0} -> ${updatedApp.icon?.length || 0} chars`);
              cacheChanged = true;
              return { ...cachedApp, icon: updatedApp.icon };
            }
            return cachedApp;
          });
          
          if (cacheChanged) {
            console.log('[AppSearchProvider] ✅ Cache updated with new icons, notifying components');
            console.log(`[AppSearchProvider] 📊 Cache now has ${this.appCache.filter(app => app.icon).length}/${this.appCache.length} apps with icons`);
            if (this.onCacheUpdate) {
              console.log('[AppSearchProvider] 🔄 Triggering cache update callback');
              this.onCacheUpdate();
            }
            // Force a small delay to ensure components re-render
            setTimeout(() => {
              if (this.onCacheUpdate) {
                console.log('[AppSearchProvider] 🔄 Triggering delayed cache update callback');
                this.onCacheUpdate();
              }
            }, 100);
          } else {
            console.log('[AppSearchProvider] ⚠️  No cache changes detected from icon updates');
          }
        });
      } else {
        console.warn('[AppSearchProvider] ❌ onUpdatedAppIcons function not available in electron.app');
      }
    } catch (error) {
      console.error('[AppSearchProvider] Error initializing applications:', error);
    }
  }
  
  // Method to get cache statistics for debugging
  getCacheStats() {
    return {
      totalApps: this.appCache.length,
      appsWithIcons: this.appCache.filter(app => app.icon).length,
      firstFewApps: this.appCache.slice(0, 3).map(app => ({
        name: app.name,
        hasIcon: !!app.icon,
        iconLength: app.icon?.length || 0
      }))
    };
  }

  async search(query: string): Promise<SearchResult[]> {
    const lowercaseQuery = query.toLowerCase();
    // Ensure appCache is used
    const currentApps = this.appCache;

    // Show popular/common apps when there's no search term, or filter by search term
    const matchedApps = query.trim() === '' 
      ? currentApps.slice(0, 10) // Show first 10 apps when no search term
      : currentApps.filter(app => 
          app.name.toLowerCase().includes(lowercaseQuery)
        );
    
    console.log(`[AppSearchProvider] Search for "${query}" returned ${matchedApps.length} results`);
    return matchedApps.map(app => this.appToSearchResult(app));
  }
  
  async getQuickActions(): Promise<SearchResult[]> {
    return this.appCache
      .slice(0, 5)
      .map(app => this.appToSearchResult(app));
  }
  
  private appToSearchResult(app: Application): SearchResult {
    const electron = window.electron as any;
    
    // Debug logging for icon data
    console.log(`[AppSearchProvider] Converting ${app.name} to SearchResult:`, {
      hasIcon: !!app.icon,
      iconLength: app.icon?.length || 0,
      iconPrefix: app.icon?.substring(0, 30) || 'no icon',
      path: app.path
    });
    
    return {
      id: `app:${app.path}`,
      title: app.name,
      description: app.path,
      icon: app.icon || undefined, // Pass base64 string or undefined (renderer will use fallback)
      provider: this.id,
      action: () => {
        if (electron?.app?.launchApplication) {
          electron.app.launchApplication(app.path)
            .catch((err: Error) => console.error(`Failed to launch ${app.path}:`, err));
        }
      },
      secondaryActions: [
        {
          name: 'Copy Path',
          action: () => {
            if (electron?.clipboard?.writeText) {
              electron.clipboard.writeText(app.path);
            } else if (navigator.clipboard) {
              navigator.clipboard.writeText(app.path);
            }
          }
        }
      ],
      metadata: {
        type: 'application',
        path: app.path,
        rawIcon: app.icon // Keep raw base64 for potential direct use in img src
      }
    };
  }
} 