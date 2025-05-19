# OmniLaunch

A Raycast-inspired productivity tool built with Electron, Next.js, and Tailwind CSS.

## Features

- Beautiful, minimal UI with frameless window (no macOS window buttons for a cleaner look)
- Quick app launcher to find and open applications
- Clipboard management
- Paste Stack
- Snippets Manager
- Customizable keyboard shortcuts
- Preferences panel for configuration
- Raycast-inspired interface
- Pure keyboard navigation

## Development

```bash
# Install dependencies
npm install

# Run the development server with Electron
npm run electron-dev

# Build the app
npm run build

# Package the app for distribution
npm run electron-build
```

## Tech Stack

- Electron
- Next.js
- React
- Tailwind CSS
- Shadcn/UI Components

## Keyboard Shortcuts

- `Cmd + Space`: Toggle main window
- `Cmd + Shift + V`: Open clipboard manager
- `Cmd + Shift + P`: Open paste stack
- `Cmd + Shift + S`: Open snippets manager
- `Cmd + Shift + A`: Open app search
- `Cmd + Shift + ,`: Open preferences
- `Escape`: Go back to main view (press twice to close)
- `↑/↓`: Navigate between items
- `Enter`: Select/launch item