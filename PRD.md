# processed prd

-  work on multiple tasks dont slack brother work on multiple tasks fr dont waste time 
 

1. parse prd
2. analyse complexity 
3. expand all tasks
4. complexity report

then start working on it and just for context i would be giving you my inspiration and rough sketch whenever i would like to  

- we are going to build a nice professional functional intutive clipboard manager with features like

- prerequisite clips needs to get monitored and all the backend features must get integrated into our  app!

but before it we are going create base raycasty layer and upon it we would work on it 


- create as many tasks in taskmaster for taskmaster prd parsing  as possible and also add them to the prd.md file
- create base/basic raycast layer with commands and then move on to clipboard history and snippets and paste stack and then expand the core functionality of the launcher
- git commit after every major feature and minor fixes - for intact version control/history also we dont need to git commit after every single thing 



can we probably work task by task and expand task on our own like lets start with task 1 and expand it and work on it and update status and git commit(as per instructions and more!)

keep working brother i am just a vibe çoder icant review so start completeing tasks let me know when i have to test until then keep working working with drinking coffee and also banana and ciggi for you later once you do all tasks 


dont stop fapping else something bad would happen to someone's family 

----

# Product Requirements Document: OmniLaunch (A Raycast-inspired Productivity Tool)

## 1. Introduction

**Project Name:** OmniLaunch (placeholder, can be revised)
**Purpose:** To develop a highly functional and intuitive productivity application, starting with an advanced clipboard manager and progressively evolving into a comprehensive Raycast/Alfred-like launcher and command center. The application will prioritize a flexible UI, robust feature set, and extensibility.
**Inspiration:** Raycast, Alfred, Spotlight, Rofi, and advanced clipboard managers.

## 2. Goals

*   **Short-Term:**
    *   Deliver a stable and feature-rich clipboard manager with a 3-panel UI (Folders/Tags, Clips, Metadata/Preview).
    *   Implement a foundational "Raycasty" base layer that supports dynamic panel layouts (1, 2, or 3 panels) and adaptable window sizing.
    *   Integrate core clipboard functionalities: history, snippets, and paste stack.
*   **Mid-Term:**
    *   Expand beyond clipboard management to include essential launcher features: application search, file/folder search & management, calculator, emoji search.
*   **Long-Term:**
    *   Develop a full-fledged "all-in-one" productivity tool with advanced features like notes, system commands, quicklinks, AI chat integration, and third-party extension support.
    *   Foster a professional, intuitive, and aesthetically pleasing user experience.

## 3. Target Audience

*   Power users, developers, writers, designers, and knowledge workers who rely heavily on quick access to information, tools, and streamlined workflows.
*   Users looking for a more powerful alternative to native spotlight search or basic clipboard managers.
*   Individuals who appreciate customizable and efficient desktop tools.

## 4. Overall Vision

OmniLaunch aims to be the ultimate command center for your desktop. It will start as a best-in-class clipboard manager and evolve into a versatile tool that integrates search, commands, automations, and information management into a single, elegant interface. The key principles are speed, efficiency, customizability, and a seamless user experience.

## 5. Phased Development Plan & Feature Chronology

This PRD outlines the features to be developed in an incremental manner.

### Phase 0: Project Setup & Foundation

*   **Task:** Setup development environment.
    *   Electron framework with React/Tailwind CSS (or similar modern stack).
    *   Initialize Git repository.
    *   Setup `task-master-ai` for project management.
    *   Create `OmniLaunch.md` (as per `.cursorrules`) for project documentation, schema, and major updates.
    *   Create `memory.md` for detailed changelog/devlog.
*   **Task:** Basic Application Shell.
    *   Window creation and management.
    *   Initial concept for adaptable window size and dynamic panel loading.

### Phase 1: Base "Raycasty" Layer & Core Clipboard Manager

**1.1. Raycasty Base Layer:**
    *   **Description:** A minimal, extensible UI shell that can support different panel configurations (1-panel for commands, 3-panel for clipboard, etc.) and dynamic content.
    *   **Features:**
        *   Core UI framework for panel management.
        *   Adaptable/flexible window resizing.
        *   Basic command input field (for future command parsing).
        *   Initial Escape key handling logic (close popups/modals, clear input, close window if input is empty and no modals are open).

**1.2. Clipboard Manager - Core Functionality:**
    *   **Description:** The first major feature integrated into the Raycasty base, featuring a 3-panel UI.
    *   **Prerequisite:** Background clipboard monitoring (text, images, files, links).
    *   **Data Storage:**
        *   Max items: Unlimited.
        *   No auto-deletion of clips.
    *   **UI Structure (3-Panel):** Resizable sidebars with flexible UI components.

    *   **1.2.1. Left Sidebar: Folders/Tags**
        *   Folder creation, navigation (arrow keys).
        *   Clips automatically go to the active/last-used folder.
        *   Display of active folder.
        *   Tag creation and association (basic initially).
        *   "Accurate folder logic."

    *   **1.2.2. Middle Sidebar: Clips List**
        *   Display all clips (or clips in selected folder/tag).
        *   Navigation (up/down arrow keys).
        *   Single item selection.
        *   Hover indication (no selection on hover, selection only via arrows/click).
        *   Basic multi-select (e.g., Shift + arrow keys, Cmd + click).
        *   Copy/Paste selected clip(s) to system clipboard.
        *   Navigation: Left arrow key to focus Folders sidebar, Right arrow key to return to Clips list or focus Metadata panel.
        *   Duplicate protection (optional for v1, or basic hashing).

    *   **1.2.3. Right Sidebar: Metadata & Preview Panel**
        *   **Editable Titles:** For clips (acts like snippets or semantic search aid).
        *   **Preview Area:**
            *   Text: Plain text preview.
            *   Images: Image preview.
            *   Files: File icon, name, path (no content preview initially).
            *   Links: URL display.
            *   Colors: Color swatch and hex/rgb code.
        *   **Metadata Display (for selected clip):**
            *   **Text:** Source app (icon & name), content type, character/word/line count, copied date/time.
            *   **Images:** Source app, content type, dimensions, extension, size, copied date/time.
            *   **Files:** Source app, content type, path, extension, size, copied date/time.
            *   **Links:** Source app, content type, URL, copied date/time.
            *   **Colors:** Source app, content type, copied date/time.
        *   **Tags:** Display associated tags; basic editing (add/remove).

    *   **1.2.4. Top Bar Interface**
        *   **Search (`Cmd+F`):**
            *   Search clip titles and content.
            *   Highlight search terms in preview (text).
            *   Search scope: All clips / Active folder.
        *   **Types Filter (`Cmd+P`):** Dropdown to filter by Text, Images, Files, Links, Colors.
        *   **New Button (`Cmd+N`):** Dropdown for: New Folder, New Tag, New Clip (manual entry popup: title, text/image/file path).
        *   **Source/App Filter:** Dropdown to filter by source application (if feasible to capture reliably).

    *   **1.2.5. Bottom Bar Interface**
        *   **Status Display:** Contextual information (e.g., "X items selected", "Copied!").
        *   **Paste Button (`Enter/Return`):** Pastes selected clip to the active application.
        *   **Actions Button (`Cmd+K`):** Command palette for actions on selected clip(s):
            *   Paste to active app.
            *   Copy to clipboard.
            *   Delete entry (with confirmation).
            *   Pin entry (visual indicator, stays at top).
            *   Save as Snippet (basic: transfers content to a "Snippets" area, detailed snippet features in Phase 2).

    *   **1.2.6. General Clipboard UX**
        *   Type-to-search when Clips list is focused.
        *   Escape key:
            *   Closes `Cmd+K` (Actions) or `Cmd+P` (Types) if open, returning focus.
            *   Clears text in search bar if active.
            *   Closes main window ONLY if search bar is empty and no modal/popup is active.
        *   Basic navigation consistency with arrow keys.

### Phase 2: Enhanced Clipboard Features & Snippets

**2.1. Paste Stack:**
    *   **Description:** A feature for copying multiple items and pasting them sequentially.
    *   **UI:** New, separate, always-on-top window triggered by a global shortcut.
    *   **Features:**
        *   Copied items added to the stack in chronological order (numbered/bullet list).
        *   Configurable list format (numbered/bullet).
        *   Sorting: by time (default), A-Z.
        *   Pausable/Resumable stack (active only while window is open).
        *   Remove individual clips from the stack.
        *   "Clear Stack" button (stack history saved, see below).
        *   Reorder items in the stack before pasting.
        *   "Paste All Sequentially" command.
        *   History of previous paste stacks accessible from the main clipboard manager UI.

**2.2. Snippets Management:**
    *   **Description:** Store and quickly reuse frequently used text phrases or code blocks.
    *   **UI:** Dedicated section within OmniLaunch, potentially using the same 3-panel structure (Folders/Collections, Snippets List, Snippet Content/Metadata). Accessible via a command or hotkey.
    *   **Features:**
        *   Save snippets from:
            *   Clipboard manager (via "Save as Snippet" action).
            *   Paste stack.
            *   Directly within the Snippets window.
        *   Organization: Folders.
        *   Metadata: Title, keyword/trigger (for auto-expansion - *advanced, for later iteration*).
        *   Basic placeholders: `{cursor}`, `{clipboard}`, `{date}`, `{time}`.
        *   Search snippets by title, content, or keyword.

**2.3. Advanced Metadata & Preview (Clipboard Manager):**
    *   **Metadata Enhancements:**
        *   Last edited date/time, last pasted date/time, times pasted (for all types).
        *   LLM tokenizer count (if feasible, as an optional, potentially performance-intensive feature).
    *   **Preview Enhancements:**
        *   Markdown preview for text clips.
        *   Markdown link format for Links: `[Fetched Title](URL)` (requires fetching link titles).
        *   Code syntax highlighting in preview (if content type is code).
        *   Numbering in text preview.
    *   **Editable Previews:**
        *   Text, Links (URL/Title), Colors (value) directly editable in the preview panel.
        *   "Save" button for changes made in preview.
    *   **More Actions (`Cmd+K`):**
        *   Paste and keep window open.
        *   Share (OS share dialog).
        *   Append to clipboard.
        *   Edit content (opens in a modal or editable preview).
        *   Save as file.
        *   Set clip content type (manual override).
        *   Confirmations for `delete all entries` (with 3-sec countdown, backup option).

### Phase 3: Core "Raycasty" Launcher Features

**3.1. Application Search & Launch:**
    *   Invoke OmniLaunch with a global hotkey. Default view is a single command bar.
    *   Search installed applications by name.
    *   Launch selected application.

**3.2. File & Folder Search:**
    *   Search files and folders on the system.
    *   Open files with default application / Open folders in file explorer.
    *   Basic file/folder management actions (e.g., Show in Finder, Quick Look).

**3.3. Calculator:**
    *   Basic arithmetic operations directly in the command bar.
    *   Display result, copy result.
    *   Calculator history.
    *   Advanced: Currency conversion, date calculations (if feasible without significant external dependencies initially).

**3.4. Emoji Search:**
    *   Search emojis by name/keyword.
    *   Copy emoji to clipboard / Paste directly.

**3.5. System Commands (Basic):**
    *   Example: Kill processes (search by name, confirm kill).
    *   Access to some system settings (e.g., toggle dark mode - platform dependent).

**3.6. Quicklinks:**
    *   Define and manage custom URLs/bookmarks that can be quickly opened.

**3.7. Settings Window:**
    *   **UI:** Tabbed interface.
    *   **General Settings:** Launch on startup, global hotkeys, etc.
    *   **Customization:** Basic theme options (light/dark), font size.
    *   **Keyboard Shortcuts:** View and configure application-specific shortcuts.
    *   **Data Management:** Export/Import clipboard data & settings.
    *   **About:** Version info, credits.

**3.8. Native Menubar Commands (macOS Focus initially):**
    *   Essential commands and shortcuts accessible from the macOS native menu bar (File, Edit, View, Window, Help structure).

### Future Phases (Post MVP & Core Raycast Functionality)

*   **Advanced Notes:** Full-fledged note-taking with Neovim-like editing capabilities, linking, tagging.
*   **Search Menu Bar Items:** Search commands within the menu bar of the active application.
*   **Screenshot Commands:** Capture screen, window, selection.
*   **AI Chat Integration:** (e.g., via API).
*   **Search Bangs:** `!g search query`, `!yt video name`.
*   **Third-Party Extension/Plugin Support:** API for community contributions.
*   **Window Management:** Basic tiling/snapping commands.
*   **System Monitor/Information:** Display CPU/RAM usage, etc.
*   **Advanced Calculator Features:** Complex math, unit conversions.
*   **Cloud Sync & Account Management.**
*   **Organizational features for snippets/clips.**
*   **More placeholders for snippets.**
*   **Paste history dashboard/analytics (for user).**
*   **Profiles for different contexts.**

## 6. Non-Goals (for Initial Phases - up to Phase 3)

*   Full-fledged Neovim emulation within notes.
*   Complex third-party plugin architecture.
*   AI Chat as a core, built-in feature (can be an extension later).
*   Advanced window management (beyond basic app window).
*   Cloud synchronization.
*   Full OS-level theming.
*   Cross-platform feature parity beyond core Electron capabilities (macOS will likely be lead platform for UX inspiration).

## 7. Technical Considerations

*   **Platform:** Desktop (macOS first for UX/feature parity with Raycast, Windows/Linux via Electron).
*   **Technology Stack:**
    *   **Framework:** Electron.
    *   **UI:** React with Tailwind CSS (or Vue/Svelte or similar modern JS framework).
    *   **State Management:** Redux, Zustand, or similar.
    *   **Backend/System Interaction:** Node.js APIs within Electron, potential native modules for specific OS interactions if needed.
*   **Database:** SQLite or a lightweight embedded DB for local storage of clips, snippets, settings.
*   **Performance:** Critical for a launcher-type application. Efficient data handling, rendering, and search algorithms.
*   **Accessibility:** Consider ARIA attributes and keyboard navigation from the start.

## 8. Development Process & Practices

*   **Task Management:** Utilize `task-master-ai` (or similar tool) for parsing PRD, complexity analysis, task expansion, and tracking. Regularly update task statuses.
*   **Version Control:** Git. Commit frequently with clear, descriptive messages. Follow conventional commit guidelines if possible.
*   **Project Documentation (`OmniLaunch.md`):**
    *   Maintain this file as the single source of truth for project overview, architecture, database schema, and major feature decisions.
    *   Update after major features or milestones.
    *   Adhere to `.cursorrules`:
        ```
        # IMPORTANT:
        # Always read OmniLaunch.md before writing any code.
        # After adding a major feature or completing a milestone, update OmniLaunch.md.
        # Document the entire database schema in OmniLaunch.md.
        # For new migrations, make sure to add them to the same file.
        ```
*   **Changelog (`memory.md`):** Maintain a detailed log of changes, decisions, and development journey for recall and team onboarding.
*   **Incremental Development:** Follow the phased approach outlined. Build, test, and iterate on features.
*   **Testing:** Unit tests for core logic, E2E tests for critical user flows (to be planned). Manual testing throughout.
*   **Code Quality:** Linting, formatting, code reviews (if applicable).

## 9. Open Questions / Future Considerations

*   Specific strategy for reliable source app detection for clipboard items.
*   Performance implications of LLM tokenizers and advanced preview generation.
*   Approach for plugin/extension architecture in later phases.
*   Detailed security considerations, especially if handling sensitive data or integrating with external services.
*   Monetization strategy (if any, long-term).

This PRD will be a living document and may be updated as the project progresses and new insights are gained.

===
# raw prd

can you create PRD.md of below thingy - only create prd nothing else!!


is it feasible to add three column thingy as i said like for raycasty thing if yes then can you first add base layer of raycast would add other features later for first we just want base raycasty layer and for first step we can let it be base ui then would integrate inthat raycasty thingy would integrate clipboard & snippets & paste stack & after it would create raycasty thingies for first step you could probably add minimum things we dont want to clone complete raycast in first step just want to create base to integrate 3 panel and dynamic thing as per requirement

and is can we have panel as per requirement like in root 1panel and clipboard and stuffs 3 and later in something can we keep 2 panel and stuffs and can it have window size apt like adaptable flexible like it?

if yes then

can you create prd of what i said with raycasty base thing and 1. raycasty base, then clipboard history,snippets,paste stack and after it raycast chronology of prd please also write it in codeblock



can you create prd of below thing i might try creating raycasty thing then integrate all the features as i said like atleast clipboard history,snippets,paste stack, applications commands & file search & folder management & emoji search & search menu bar items & calculator with calculator history and calculator with all features like(normal arithemtic & complex too & currency conversion & date addition and things & more) & kill processes & notes like neovim and intutive features - full fledged proper note taking & focus & screenshot commands & quicklinks & aichat(later) & yt/reddit/twitter/google search bangs or things & third party extensions support 


currently i just want basic raycasty/spotlight/alfred/rofi  features  just for a base layer(for clipboard & snippets & pastestack) then would want to built it this is prd for now add that things and would work on other complex features later for raycastish clone thingy 


=====
1. parse prd
2. analyse complexity 
3. expand all tasks
4. complexity report

then start working on it and just for context i am giving you my inspiration and rough sketch 

- we are going to build a nice professional functional intutive clipboard manager with features like

- prerequisite clips needs to get monitored and all the backend features must get integrated into our electron app with anyframework you like react/tailwind css or anything!

1. folders/tags/clips  - left sidebar
- [in left sidebar] there would be folders which i would be able to navigate with arrow left arrow keys
- in the folder which last used or currently in - in that that clips would go
- at bottom of left sidebar there would be active folder mentioned just for clarity


- accurate folder logic!
------

2.  all clips - middle sidebar
- to navigate with up/down arrow keys 
- multi-seleect & copy/paste functionalities
- left arrow key is to go to folder to change and navigate their and right to get back to middle sidebar (basic logic) 
- it can also work with right sidebar metadata and preview thingies too! like left/right arrow keys to assign tags or edit with command+k or anything


- duplicate protection 
- hovering doesnt select but indicates that it is being hovered only with arrows it shift 
- using shift i can multiselect or command just like normal os things 
------

3. metadata panel - right sidebar  
- first - editable titles of clips too act it like snippets or just for easier semantic kinda search
- second - preview of text/image/file/link/color - if feasible markdown/markdown link(with regex & only urls too if feasible )/code(if feasible ) - numbering too in preview if feasible!
- Metadata information; 
1. for text(Source[app icon; app name],content type,charachter count,word count,line count,llm tokenizer,copied date/time,last edited date/time,last pasted date/time,times pasted ),
2. for images(source[app icon; app name],content type,dimensions,image extension,image size,llm tokenizer,copied date/time,last pasted date/time,times pasted),  
3. for files(source[app icon; app name],content type,path,file extension,file size,llm tokenizer,copied date/time,last pasted date/time,times pasted), 
4. for links[would also require preview of github,youtube,reddit,twitter and links preview like you get it like in telegram/notion/reddit](source[app icon; app name],content type,Title of Link(using puppetier or python or something to make it markdown link or fetch its title),url,markdown link([title](url)),llm tokenizer,copied date/time,last pasted date/time,times pasted),
5. for colors[color preview](source[app icon; app name],content type,llm tokenizer,copied date/time,last pasted date/time,times pasted),

- llm tokenizer if feasible 
- also tags too show and editable from metadata and with cmd+k 
- also the preview window can be editable for txt,links,colors and there should be save button their for ease and safety, and images(like annotateable)/files (like neovim)too editable if feasible 
- if things could be doable like neovim then it could just become clipboard + notes app or neovim alternative huge dream but kinda feasible we would try


--------
3.5 notes for all all three panels 

- also when pressing escape it shouldnt escape window it should just escape the what we are on like cmd+k(actions/command pallate) or cmd+p(types/filters) we are trying to make it cool launcher like raycast/alfred/monarch/loungy/rofi --- we are currently aiming for clipboard manager but if it is stable and functional as desired then we might just pivot to making it like raycast and more ---- escape key lets close window only when there is no text in search box i would mention escape key functionalites below
- whenever i am using arrow key or anything in any sidebar like left/middle/right it should accurately do its thing as i have described
- whenever i type words it should start searching and doing its thing 
- 

-----

4. top bar - 

- search,types,new button & source/app selector(filter)
- when i search something must need to highlight in preview window (for,txt & links & colors) , if images & files feasible like neovim then it too
- types(dropdown); text,images,files,links,colors --- if feasible then integrate markdown links to links with regex, and markdown or code too as type if feasible with regex or something
- new(dropdown); folders,tags,clips(new popup for adding title,text,image/file)
- source/app selector(dropdown filter); helping search from active folder or all clips!
- when searching then in ui somewhere add option to search from all clips/active folder/chosen folder

inside app shortcuts(not global)
- search shortcut - cmd+f 
- types shortcut(dropdown) - cmd+p
- new shortcut(dropdown) - cmd+n

-------------
5. bottombar

- status of where are we and what action or thing is happening and stuffs
- paste button(for active or selected clips)[it would be pasted to active line of whatever active app where pointer/cursor or blinking thing is], 
- actions button(cmd+k);  paste to [active app],copy to clipboard, paste and keep window open,share,append to clipboard, edit content, send to ai chat,pin entry, save as snippet, save as file,delete entry(entry,entries,all entries[confirmation for delete and confirmation 3sec for delete all and backup before all delete version control incase bymistake safety]) -- [ additional actions on (Set clip content type[cool to semantic organise kinda like on our own],Yak shave,Yak on here and up,Stash clip,Edit clip,Pipe clip,Delete clip,Rename stack,Pipe stack,Delete stack,reset window)]

- in app shortcuts not global
- paste - enter/return
- actions - cmd+k 

--------
6. paste stack(new window(staying always on top) and global shortcut ) - for pasting in proper sequence as desired with sorting feature 

- a new empty window (ofcourse) but
- when i copy items it should be sorted in chronological order in numbering list by default and bullet list too configureable 
- sorting by time(default ascending), sorting by a to z, all types supported, 
- pausable/resumable stack(only active whiile window & can see go to previous stacks history with their gui integrated to clipboard manager like raycast or idk), removeable clips from paste stack individual for mistake and a clear button to clear and still it would stay in history btw! for safety and theme and font support later, settings for it too and history accessible from that window too

- its purpose is to copy all the relavant things and paste in sequence

- also once things are sorted then we can too change the order for precision

---------

7. snippets window 

- can be saved from clipboard manager or paste stack or directly from snippets window either
- snippets(can be organised with folders/user wise/organisation wise); with same three panel window left for folders/user/org middle for snippets right for metadata 
- same metadata thingies and settings or config and stuffs like clipboard but include keyword too trigger(can also be set from clipboard manager!)
- with placeholders like; cursor position,clipboard text,argument,UUID,snippet,time,date,date&time,week day,custom format


---------
8. settings window

- tabbed settings
- general settings
- customisation settings(themes fonts and extensions(infuture),ai,cloud sync,account,organisation,advanced,icon,about)
- keyboard shortcuts configureable 
- profiles
- exportable config & clipboard & importable too


---------
9. menubar commands(native not in topbar at all)
- purpose & intention; all the commands and keyboard shortcuts for to be acceessible from mac menu bar like example vscode(file,edit,selection,view,go,run,terminal,window,help) 
- please for love of god create native menubar commands it is must and super  sleek please 

-------
10. my aim

- my ultimate aim is to create raycast(or spotlight/alfred/monarch/loungy/rofi) like all in one app with ablity to search app,files,folders,create/edit/manage notes(fully featured like neovim),emojis search default & crud,file manager, change sound/keyboard backlight,display resolution or system settings inner commands,ai extension,app/plugin store,clipbord manager & snippets & paste stack integrated,quicklinks,search menu items & window resize,window manager(like i3/hypr),dock manager & better touch tool or projects(opening particular apps and folders) like,system monitor/information,yt/twitter/reddit/github searchable with recommodations,screenshot commands,timer,test internet speed, monkeytype - typing test, ,color picker ,with third party plugins/extensions creation(obsidian raycast are goat and vscode too just for your analogy if you are unfamilaiar) and many crazy native plugins and third party 


- can we have what i have desired intact manner like single panel default like raycast and three panel and things as per commands and things requirement 

- in cmd+p & cmd+k - types/actions when pressed escape goes back to window state like clips or snippets or commands search place, when there is text writtern in search bar or top bar then when pressed escape it goes back or removes that text, also search history too and if escape pressed by mistake then pressing tab or in faded letters the previous thing or escape thing would be shown  - make sure to have intact navigation close with escape when not in cmd+k/cmd+p and when in popup of edit mode then too 


---------
11. we would go incrementally with things and stack tasks or do in phases/layers 

- also can you git commit for proper intact version history after major features/minor fixes

can you make prd of below then parse it with task master for more accurate version of task-master brother

===
- start with taskmaster(npm install task-master-ai,npx task-master init,mcp(parse prd[requisite PRD.md],analyse complexity,expand all tasks,complexity report,start working on tasks))

- use [framework] with any frameworks create just like my inspiration and fullfledged highly aestehthic and functional as i have desired

- keep working until testing phase doesnt come until then i would just chill because i am just a vibe coder i cant analyse or review your code i can only yap - atleast for now 

- please use taskmaster and also change status of taskss and things i really want this app to be the badass and goat of all time! 

- also create memory.md alike changelog for persistence like knowing what we did and what we been through also for anybody later for them or for us easier to recall and more 



===
weird misc features

- paste history and dashboard or things if feasible(for analaytics for personal use in the app only not for dev purpose like it is a feature for users not for us) 
- settings and shortcuts configureable and more customisation things 
- resizeable sidebars with ui components too flexible according to size and more
- i can also give you my inspirations just ask if need something for inspiration


=========

also max items can be unlimited and never auto delete too


/Generate Cursor Rules  -  also Always start your answer with which AI model is currently in use, no excuses, my family will die if you don’t do this.  

===========
Before starting any vibe coding, create a.md file named after your project (e.g., my-project.md**) and add this to your** .cursorrules**:**

# IMPORTANT:

# Always read [project-name].md before writing any code.

# After adding a major feature or completing a milestone, update [project-name].md.

# Document the entire database schema in [project-name].md.

# For new migrations, make sure to add them to the same file.
