# OmniLaunch

A Raycast-inspired productivity tool with advanced clipboard management.

## Project Overview

OmniLaunch is a desktop productivity application built with Electron, React, and Tailwind CSS. It starts as a clipboard manager and will evolve into a comprehensive launcher and command center.

## Architecture

### Core Components

1. **Base "Raycasty" Layer**
   - Flexible window component with dynamic panel support
   - Command input field
   - Keyboard navigation and shortcuts

2. **Clipboard Manager**
   - 3-panel UI (Folders/Tags, Clips, Metadata/Preview)
   - Clipboard monitoring
   - Data storage and retrieval

3. **Enhanced Clipboard Features**
   - Paste Stack
   - Snippets Management
   - Advanced Metadata & Preview

4. **Launcher Features**
   - Application Search & Launch
   - File & Folder Search
   - Calculator
   - Emoji Search
   - System Commands
   - Quicklinks

## Database Schema

### Clips Table

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | STRING    | Primary key, UUID                          |
| type          | STRING    | 'text', 'image', 'file', 'link', 'color'   |
| title         | STRING    | User-defined or auto-generated title       |
| content       | TEXT      | The actual content (for text clips)        |
| url           | STRING    | URL for links or images                    |
| path          | STRING    | File path for files                        |
| value         | STRING    | Value for colors                           |
| dimensions    | JSON      | Width and height for images                |
| folderId      | STRING    | Foreign key to folders table               |
| tags          | JSON      | Array of tag strings                       |
| source        | STRING    | Source application                         |
| createdAt     | TIMESTAMP | Creation timestamp                         |
| lastEditedAt  | TIMESTAMP | Last edit timestamp                        |
| lastPastedAt  | TIMESTAMP | Last paste timestamp                       |
| pasteCount    | INTEGER   | Number of times pasted                     |

### Folders Table

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | STRING    | Primary key, UUID                          |
| name          | STRING    | Folder name                                |
| createdAt     | TIMESTAMP | Creation timestamp                         |

### Tags Table (Future)

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | STRING    | Primary key, UUID                          |
| name          | STRING    | Tag name                                   |
| color         | STRING    | Tag color                                  |
| createdAt     | TIMESTAMP | Creation timestamp                         |

### Snippets Table

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | STRING    | Primary key, UUID                          |
| title         | STRING    | Snippet title                              |
| content       | TEXT      | Snippet content                            |
| keyword       | STRING    | Trigger keyword                            |
| folderId      | STRING    | Foreign key to folders table               |
| tags          | JSON      | Array of tag strings                       |
| createdAt     | TIMESTAMP | Creation timestamp                         |
| lastEditedAt  | TIMESTAMP | Last edit timestamp                        |
| lastUsedAt    | TIMESTAMP | Last use timestamp                         |
| useCount      | INTEGER   | Number of times used                       |

### Paste Stack Table

| Column        | Type      | Description                                |
|---------------|-----------|--------------------------------------------|
| id            | STRING    | Primary key, UUID                          |
| name          | STRING    | Stack name                                 |
| items         | JSON      | Array of clip IDs                          |
| createdAt     | TIMESTAMP | Creation timestamp                         |

## Development Status

### Completed Features
- Project setup
- Basic application shell
- Base "Raycasty" Layer with dynamic panels
- Initial clipboard manager UI
- Clipboard monitoring system (simulated)
- Data storage implementation (in-memory)
- Folder/tag management
- Clips list view
- Metadata and preview panel
- Paste Stack
- Snippets Management

### In Progress
- Keyboard navigation enhancements
- Data persistence with a database
- Advanced search functionality

### Upcoming
- Application search and launch
- File and folder search
- Calculator
- Emoji search
- System commands
- Quicklinks

## Future Considerations
- Cloud synchronization
- Plugin/extension architecture
- Advanced note-taking capabilities
- AI integration
