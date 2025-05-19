# OmniLaunch Feature Ideas

## Per-Shortcut Global vs App-Specific Settings

### Overview
Currently, OmniLaunch has a global toggle to enable/disable all shortcuts system-wide. A more flexible approach would be to allow users to configure each shortcut individually to be either global (works everywhere) or app-specific (only works when OmniLaunch is in focus).

### Implementation Details

#### Data Structure
Enhance the `ShortcutConfig` interface to include a flag for global behavior:

```typescript
interface ShortcutConfig {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  defaultShortcut: string;
  isGlobal: boolean; // Whether this shortcut works system-wide
}
```

#### UI Changes
1. **Preferences UI**: Add a toggle switch next to each shortcut in the list
   - Display a column for "Scope" with options for "Global" or "App-only"
   - Allow users to toggle each shortcut individually

2. **Visual Indicators**: 
   - Use a globe icon (🌐) for global shortcuts
   - Use an app icon (📱) for app-specific shortcuts

#### Functional Changes
1. **Registration Logic**: 
   - Only register shortcuts marked as global with the system
   - Use in-app handlers for app-specific shortcuts

2. **Storage**: 
   - Save the global preference for each shortcut
   - Legacy support for older configurations

### Benefits
- More granular control for users
- Performance improvement (fewer global shortcuts)
- Reduced risk of shortcut conflicts with other apps
- Better user experience (only make essential shortcuts global)

### Sample Implementation
The Preferences component would be updated to include toggles for each shortcut:

```tsx
<div className="flex items-center justify-between">
  <div className="flex-1">
    <div>{shortcut.name}</div>
    <div className="text-sm text-gray-400">{shortcut.description}</div>
  </div>
  
  <div className="flex items-center">
    <button 
      onClick={() => startCapturing(shortcut.id)}
      className="min-w-[140px] px-3 py-1.5 border border-gray-700 rounded bg-gray-800">
      {formatShortcut(shortcut.shortcut)}
    </button>
    
    <div className="ml-4 flex items-center">
      <label className="flex items-center cursor-pointer">
        <span className="mr-2 text-sm text-gray-400">
          {shortcut.isGlobal ? "Global" : "App-only"}
        </span>
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={shortcut.isGlobal}
            onChange={e => toggleShortcutScope(shortcut.id, e.target.checked)}
          />
          <div className="toggle-bg"></div>
        </div>
      </label>
    </div>
  </div>
</div>
```

## Universal Search Across Everything

### Overview
Transform OmniLaunch into a true productivity powerhouse by implementing a universal search capability that searches across all content types simultaneously: applications, files, documents, snippets, clipboard history, and more.

### Implementation Details

#### Architecture
1. **Unified Search Provider Interface**:
   ```typescript
   interface SearchProvider {
     id: string;
     name: string;
     icon: React.ReactNode;
     priority: number;
     search: (query: string) => Promise<SearchResult[]>;
   }
   
   interface SearchResult {
     id: string;
     title: string;
     description?: string;
     icon?: string;
     provider: string;
     action: () => void;
     secondaryActions?: Array<{
       name: string;
       action: () => void;
     }>;
   }
   ```

2. **Modular Provider System**:
   - Application Provider (search installed apps)
   - File Provider (search documents, code, etc.)
   - Web Provider (search bookmarks, history)
   - Clipboard Provider (search clipboard history)
   - Snippet Provider (search saved snippets)
   - Calculator Provider (evaluate mathematical expressions)
   - System Commands Provider (restart, shutdown, etc.)

#### UI Enhancement
1. **Categorized Results**:
   - Results grouped by provider/type
   - Visual distinction between different result types
   - Ability to filter by category

2. **Rich Result Cards**:
   - Preview thumbnails for files/apps
   - Rich text previews for documents
   - Code syntax highlighting for code snippets
   - Context-aware actions (e.g., copy path, open containing folder)

3. **Keyboard Navigation**:
   - Tab to switch between categories
   - Arrow keys to navigate within a category
   - Shortcuts for common actions

### Advanced Features

#### Intelligent Ranking
- Learn from user behavior to prioritize frequently used items
- Context-aware results based on currently active application
- Time-based relevance (e.g., recently used items rank higher)

#### Extensibility
- Plugin API for third-party search providers
- Custom actions for search results
- User-definable search shortcuts

#### Performance Optimization
- Incremental search (results appear as you type)
- Background indexing of files and content
- Caching of frequent searches
- Debounced search to reduce computation

### Sample Implementation

```tsx
function UniversalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    // Collect results from all providers
    const fetchResults = async () => {
      const allResults = await Promise.all(
        searchProviders.map(provider => 
          provider.search(query)
            .then(items => items.map(item => ({
              ...item,
              provider: provider.id
            })))
            .catch(() => [])
        )
      );
      
      // Flatten and sort results by provider priority
      const flattenedResults = allResults
        .flat()
        .sort((a, b) => {
          const providerA = searchProviders.find(p => p.id === a.provider);
          const providerB = searchProviders.find(p => p.id === b.provider);
          return (providerB?.priority || 0) - (providerA?.priority || 0);
        });
      
      setResults(flattenedResults);
    };
    
    fetchResults();
  }, [query]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="search-input">
        <input 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for anything..."
        />
      </div>
      
      <div className="provider-tabs">
        {searchProviders.map(provider => (
          <button 
            key={provider.id}
            className={provider.id === activeProvider ? 'active' : ''}
            onClick={() => setActiveProvider(
              provider.id === activeProvider ? null : provider.id
            )}
          >
            {provider.icon}
            {provider.name}
          </button>
        ))}
      </div>
      
      <div className="results-container">
        {results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          results
            .filter(r => !activeProvider || r.provider === activeProvider)
            .map(result => (
              <ResultCard 
                key={result.id}
                result={result}
                onSelect={() => result.action()}
              />
            ))
        )}
      </div>
    </div>
  );
}
```

## Future Considerations
- Allow users to set different shortcuts for global vs app-specific actions
- Contextual shortcuts based on the active application
- Shortcut conflict detection and warnings
- Import/export settings for sharing configurations 