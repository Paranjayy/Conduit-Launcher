import { Laptop, LucideIcon } from "lucide-react";
import { SearchProvider, SearchResult } from "../search-providers";

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
  id = "app-search";
  name = "Applications";
  icon = Laptop; // Default/fallback icon for the provider itself
  priority = 90;

  private isElectron = typeof window !== "undefined" && !!window.electron;
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
        this.appCache = initialApps.map((app) => ({
          ...app,
          icon: app.icon || "",
        }));
        console.log(`[AppSearchProvider] Initialized with ${this.appCache.length} apps, ${this.appCache.filter(app => app.icon).length} with icons`);
        if (this.onCacheUpdate) this.onCacheUpdate();
      }

      // Listen for the complete list of apps without icons
      if (typeof electron?.app?.onAllAppsNoIcons === "function") {
        electron.app.onAllAppsNoIcons((allApps: Application[]) => {
          console.log(
            `[AppSearchProvider] Received complete list of ${allApps.length} apps without icons`,
          );
          // Create a map of existing apps by path for quick lookup
          const existingAppsMap = new Map(
            this.appCache.map((app) => [app.path, app]),
          );

          // Create an updated app cache
          this.appCache = allApps.map((app) => {
            // If we already have this app, keep its existing icon
            const existingApp = existingAppsMap.get(app.path);
            return existingApp ? existingApp : { ...app, icon: "" };
          });

          // Sort alphabetically
          this.appCache.sort((a, b) =>
            a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
          );

          console.log(
            `[AppSearchProvider] Updated cache with ${this.appCache.length} total apps`,
          );
          if (this.onCacheUpdate) this.onCacheUpdate();
        });
      } else {
        console.warn('[AppSearchProvider] ❌ onAllAppsNoIcons function not available in electron.app');
      }

      // Check if the onUpdatedAppIcons function exists at runtime
      if (typeof electron?.app?.onUpdatedAppIcons === "function") {
        console.log('[AppSearchProvider] ✅ Setting up listener for updated app icons.');
        electron.app.onUpdatedAppIcons(
          (updatedAppsWithIcons: Application[]) => {
            console.log(`[AppSearchProvider] 📨 Received ${updatedAppsWithIcons.length} updated app icons from main process`);
            
            // Log first few apps for debugging
            if (updatedAppsWithIcons.length > 0) {
              const firstApp = updatedAppsWithIcons[0];
              console.log(`[AppSearchProvider] 🔍 First app: "${firstApp.name}", icon length: ${firstApp.icon?.length || 0}`);
              
              // More comprehensive debugging
              updatedAppsWithIcons.slice(0, 3).forEach(app => {
                console.log(`[AppSearchProvider] App "${app.name}":`, {
                  hasIcon: !!app.icon,
                  iconLength: app.icon?.length || 0,
                  iconPreview: app.icon ? app.icon.substring(0, 100) + '...' : 'no icon',
                  startsWithData: app.icon ? app.icon.startsWith('data:') : false
                });
              });
            }
            
            let cacheChanged = false;
            let updatedCount = 0;

            // Create a map for fast lookup
            const updateMap = new Map(
              updatedAppsWithIcons.map((app) => [app.path, app]),
            );

            this.appCache = this.appCache.map((cachedApp) => {
              const updatedApp = updateMap.get(cachedApp.path);
              if (
                updatedApp &&
                updatedApp.icon &&
                updatedApp.icon.length > 10 && // Only update with valid icons
                cachedApp.icon !== updatedApp.icon
              ) {
                console.log(`[AppSearchProvider] 🔄 Updating icon for "${cachedApp.name}" (${updatedApp.icon.length} chars)`);
                cacheChanged = true;
                updatedCount++;
                return { ...cachedApp, icon: updatedApp.icon };
              }
              return cachedApp;
            });

            if (cacheChanged) {
              console.log(`[AppSearchProvider] 🎯 Cache updated! ${updatedCount} icons updated. Notifying components...`);
              if (this.onCacheUpdate) {
                console.log(`[AppSearchProvider] 📢 Calling onCacheUpdate callback`);
                this.onCacheUpdate();
              } else {
                console.warn(`[AppSearchProvider] ⚠️ No onCacheUpdate callback registered`);
              }
            } else {
              console.log(`[AppSearchProvider] ⚠️ No cache changes detected from this batch of ${updatedAppsWithIcons.length} apps`);
              // Still trigger an update to ensure UI refreshes
              if (this.onCacheUpdate) {
                this.onCacheUpdate();
              }
            }
          },
        );
      } else {
        console.warn('[AppSearchProvider] ❌ onUpdatedAppIcons function not available in electron.app');
      }
    } catch (error) {
      console.error(
        "[AppSearchProvider] Error initializing applications:",
        error,
      );
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    const lowercaseQuery = query.toLowerCase();
    // Ensure appCache is used
    const currentApps = this.appCache;

    // Show all apps when no search term, filtered apps when searching
    const matchedApps =
      query.trim() === ""
        ? currentApps.slice(0, 50) // Show first 50 apps when no search term for performance
        : currentApps.filter((app) =>
            app.name.toLowerCase().includes(lowercaseQuery),
          );
    return matchedApps.map((app) => this.appToSearchResult(app));
  }

  async getQuickActions(): Promise<SearchResult[]> {
    return this.appCache.slice(0, 5).map((app) => this.appToSearchResult(app));
  }

  getCacheStats() {
    const appsWithIcons = this.appCache.filter(app => app.icon && app.icon.length > 0);
    const appsWithoutIcons = this.appCache.filter(app => !app.icon || app.icon.length === 0);
    
    return {
      totalApps: this.appCache.length,
      appsWithIcons: appsWithIcons.length,
      appsWithoutIcons: appsWithoutIcons.length,
      sampleAppsWithIcons: appsWithIcons.slice(0, 3).map(app => ({
        name: app.name,
        hasIcon: !!app.icon,
        iconLength: app.icon?.length || 0
      })),
      sampleAppsWithoutIcons: appsWithoutIcons.slice(0, 3).map(app => ({
        name: app.name,
        hasIcon: !!app.icon,
        iconLength: app.icon?.length || 0
      }))
    };
  }

  private appToSearchResult(app: Application): SearchResult {
    const electron = window.electron as any;

    // Debug logging for icon processing
    console.log(`[AppProvider] Converting "${app.name}" to SearchResult:`, {
      hasIcon: !!app.icon,
      iconLength: app.icon?.length || 0,
      iconPreview: app.icon ? app.icon.substring(0, 100) + '...' : 'no icon',
      startsWithData: app.icon ? app.icon.startsWith('data:') : false
    });

    return {
      id: `app:${app.path}`,
      title: app.name,
      description: app.path,
      icon: app.icon || "", // Always pass the icon, even if empty
      provider: this.id,
      metadata: {
        path: app.path,
        rawIcon: app.icon // Also store in metadata as backup
      },
      action: () => {
        if (electron?.app?.launchApplication) {
          electron.app
            .launchApplication(app.path)
            .catch((err: Error) =>
              console.error(`Failed to launch ${app.path}:`, err),
            );
        }
      },
      secondaryActions: [
        {
          name: "Copy Path",
          action: () => {
            if (electron?.clipboard?.writeText) {
              electron.clipboard.writeText(app.path);
            }
          },
        },
      ],
    };
  }
}
