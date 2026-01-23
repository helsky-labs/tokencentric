# Tokencentric Roadmap

## Development Principles
- **Atomic commits**: Each task = one commit. Easy rollbacks.
- **Test as we go**: Verify each feature works before moving on.
- **Ship incrementally**: Working software at each phase end.

---

## Phase 1: Project Foundation
**Goal**: Working Electron app that opens a window.

- [x] 1.1 Initialize Electron + React + TypeScript + Vite project
- [x] 1.2 Configure electron-builder for macOS + Windows
- [x] 1.3 Set up ESLint + Prettier
- [x] 1.4 Create basic app shell (window, menu bar)
- [x] 1.5 Add electron-store for settings
- [x] 1.6 Implement dark mode (system preference)

**Checkpoint**: App launches, shows empty window, respects system theme.

---

## Phase 2: File Discovery
**Goal**: Scan directories and find AI context files.

- [x] 2.1 Define ToolProfile interface and default profiles
- [x] 2.2 Implement file scanner with chokidar
- [x] 2.3 Add exclusion patterns (node_modules, .git, etc.)
- [ ] 2.4 Create settings UI for scan paths
- [x] 2.5 Cache discovered files to electron-store
- [x] 2.6 Add "Scan Now" button and progress indicator

**Checkpoint**: Can scan a directory, find CLAUDE.md/.cursorrules/etc files.

---

## Phase 3: Tree View
**Goal**: Display discovered files in a navigable tree.

- [x] 3.1 Create sidebar component
- [x] 3.2 Build tree view with folder hierarchy
- [x] 3.3 Add tool icons (Claude, Cursor, Copilot, etc.)
- [x] 3.4 Implement file selection (click to select)
- [ ] 3.5 Add tool filter dropdown
- [x] 3.6 Show empty state when no files found

**Checkpoint**: Tree view shows all discovered files with icons, clickable.

---

## Phase 4: Token Analysis
**Goal**: Show accurate token counts for each file.

- [x] 4.1 Integrate @anthropic-ai/tokenizer
- [x] 4.2 Integrate tiktoken (OpenAI)
- [x] 4.3 Create token counting service (picks tokenizer based on tool)
- [x] 4.4 Count tokens for ALL files during/after scan (background)
- [x] 4.5 Display token count per file in sidebar with color coding:
      - 🟢 Green: < 5,000 tokens (light)
      - 🟡 Yellow: 5,000 - 20,000 tokens (medium)
      - 🔴 Red: > 20,000 tokens (heavy)
- [x] 4.6 Add bottom status bar with selected file tokens
- [x] 4.7 Show model compatibility (fits in 200k context)

**Checkpoint**: Each file shows color-coded token count in sidebar, correct tokenizer per tool. ✅ COMPLETE

---

## Phase 5: Editor
**Goal**: View and edit files with markdown preview.

- [x] 5.1 Integrate Monaco editor
- [x] 5.2 Create split view (editor + preview)
- [x] 5.3 Add markdown preview renderer
- [x] 5.4 Implement file saving (Cmd+S / Ctrl+S)
- [x] 5.5 Show unsaved changes indicator
- [x] 5.6 Add toggle for editor/preview/split modes

**Checkpoint**: Can open, edit, preview, and save any context file. ✅ COMPLETE

---

## Phase 6: File Management
**Goal**: Create, delete, and manage files.

- [ ] 6.1 "New File" dialog with location picker
- [ ] 6.2 Delete file with confirmation modal
- [ ] 6.3 Right-click context menu (edit, delete, reveal in Finder)
- [ ] 6.4 "Open in Finder/Explorer" action
- [ ] 6.5 Duplicate file functionality

**Checkpoint**: Full CRUD operations on context files.

---

## Phase 7: Templates
**Goal**: Create files from pre-built templates.

- [ ] 7.1 Create template data structure
- [ ] 7.2 Build 7 default templates:
      - Minimal
      - Full-Stack JS
      - Python
      - Monorepo
      - API Project
      - Mobile (React Native)
      - "Careful AI" (safety rules)
- [ ] 7.3 Template picker UI in "New File" flow
- [ ] 7.4 Template variable substitution ({{PROJECT_NAME}}, etc.)
- [ ] 7.5 Template preview before creation

**Checkpoint**: Can create new files from any template.

---

## Phase 8: Onboarding & UX Polish
**Goal**: Great first-run experience and polished UI.

- [ ] 8.1 First-run detection
- [ ] 8.2 Welcome screen with setup wizard
- [ ] 8.3 "Add scan directory" step
- [ ] 8.4 "Create your first file" prompt (if none found)
- [ ] 8.5 Keyboard shortcuts (Cmd+N, Cmd+S, Cmd+,, etc.)
- [ ] 8.6 Loading states and skeleton screens
- [ ] 8.7 Error handling with clear messages

**Checkpoint**: New users have guided experience, power users have shortcuts.

---

## Phase 9: Analytics & Settings
**Goal**: Track usage (opt-in) and configurable settings.

- [ ] 9.1 Umami integration (analytics.helsky-labs.com)
- [ ] 9.2 Analytics opt-out toggle in settings
- [ ] 9.3 Settings page UI:
      - Scan paths management
      - Exclusion patterns
      - Theme (system/light/dark)
      - Editor font size
      - Enable/disable tool profiles
- [ ] 9.4 "About" section with version, links

**Checkpoint**: Settings persist, analytics working (when enabled).

---

## Phase 10: Distribution
**Goal**: Ship it.

- [ ] 10.1 App icon design
- [ ] 10.2 Configure auto-update (electron-updater)
- [ ] 10.3 Code signing for macOS (if available)
- [ ] 10.4 Build macOS .dmg
- [ ] 10.5 Build Windows installer
- [ ] 10.6 Create GitHub releases workflow
- [ ] 10.7 Landing page (tokencentric.app)
- [ ] 10.8 "Buy me a coffee" + Helsky Labs links in app
- [ ] 10.9 README with screenshots

**Checkpoint**: v1.0 released, downloadable, auto-updates work.

---

## Post-v1.0 Backlog

### v1.1
- [ ] File watching (auto-refresh on external changes)
- [ ] Combined token count for inheritance chains
- [ ] Search/filter files
- [ ] Custom template creation
- [ ] More keyboard shortcuts

### v2.0
- [ ] Custom tool profile creation
- [ ] Template import/export
- [ ] CLI companion tool
- [ ] "What context does AI see here?" visualization

---

## Current Status

**Phase**: 6 - File Management
**Next Task**: 6.1 "New File" dialog with location picker

**Progress Summary**:
- Phase 1: ✅ COMPLETE
- Phase 2: 5/6 tasks done (missing: settings UI for scan paths)
- Phase 3: 5/6 tasks done (missing: tool filter dropdown)
- Phase 4: ✅ COMPLETE (tokenizers + color-coded sidebar)
- Phase 5: ✅ COMPLETE (Monaco editor + preview + save)
