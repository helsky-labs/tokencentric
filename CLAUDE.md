# ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️

## **CLAUDE IS STUPID AND WILL BE DELETING FILES AND REVERTING CHANGES EVEN WITHOUT BEING ASKED FOR.**

---

# 🚨 CLAUDE LIES ABOUT CODE WORKING 🚨

## **NEVER CLAIM CODE WORKS WITHOUT TESTING IT**

1. **NEVER say code is "ready" if you haven't run it**
2. **NEVER assume tests pass without running them**
3. **ALWAYS say: "I have NOT tested this - please run it to verify"**

**CLAUDE CANNOT TEST CODE. IF YOU HAVEN'T RUN IT, YOU DON'T KNOW IF IT WORKS.**

---

# Tokencentric - Development Instructions

## Project Overview
Desktop app for managing AI coding assistant context files (CLAUDE.md, .cursorrules, etc.).

**Tech Stack**: Electron + React + TypeScript + Vite

## Commands
```bash
# Development
npm run dev          # Start in dev mode with hot reload

# Build
npm run build        # Build for production
npm run dist         # Create distributable (macOS/Windows)

# Lint/Format
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

## Project Structure
```
tokencentric/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point
│   │   ├── menu.ts     # App menu
│   │   └── ipc.ts      # IPC handlers
│   ├── renderer/       # React app (renderer process)
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── styles/
│   ├── shared/         # Shared types and utils
│   │   └── types.ts
│   └── preload/        # Preload scripts
│       └── index.ts
├── templates/          # Default file templates
├── resources/          # Icons, assets
├── ROADMAP.md          # Development roadmap
└── package.json
```

## Key Concepts

### Tool Profiles
Each AI tool has a profile defining its patterns and tokenizer:
```typescript
interface ToolProfile {
  id: string;
  name: string;
  patterns: string[];
  tokenizer: 'anthropic' | 'openai';
  icon: string;
  color: string;
}
```

### File Discovery
Uses chokidar to scan directories. Respects exclusions (node_modules, .git).
Results cached in electron-store.

### Token Counting
- Claude files: @anthropic-ai/tokenizer
- Other tools: tiktoken (OpenAI)

## Development Guidelines

1. **Atomic commits** - One feature/fix per commit
2. **Test before commit** - Verify the app still works
3. **No console.log in production** - Use proper logging
4. **Handle errors gracefully** - Never crash, show user-friendly messages

## IPC Communication
Main ↔ Renderer communication via typed IPC:
- `scan-directory`: Trigger file scan
- `get-files`: Get cached files
- `read-file`: Read file contents
- `write-file`: Save file
- `count-tokens`: Get token count for content
- `get-settings` / `set-settings`: Settings management

## UI Components
Using Tailwind CSS. Dark mode via class strategy.

**Current Component Count**: 35+ components

Key components:
- `Sidebar`: Redesigned with collapsible sections (Global Config, Templates, Project Files)
- `Editor`: Monaco editor with split pane support
- `EditorPane`: Multi-pane editing (horizontal/vertical split)
- `EditorTabs`: Tab management per pane with drag-drop reordering
- `Preview`: Markdown preview
- `StatusBar`: Token counts, file info
- `Settings`: Configuration page with AI provider settings
- `HierarchicalCostPanel`: Shows combined token counts across inheritance hierarchy
- `GlobalConfigSection`: Displays ~/.claude/* files
- `TemplatesSection`: 7 built-in templates with categories

## Split View & Multi-Pane Editing (NEW - v0.2.0)

- **Split directions**: horizontal, vertical, or single pane
- **Tab management**: Open, close, reorder, move between panes via drag-drop
- **Cross-pane operations**: Drag tabs between panes, open file in specific pane
- **State persistence**: Editor state saved and restored between sessions
- **Key methods**: `splitPane()`, `unsplit()`, `moveTabToPane()`, `resizePanes()`

## Global Config System (NEW)

Reads `~/.claude/*` directory structure:
- Discovers all files in user's global config
- Marks files as read-only in editor
- Calculates tokens for each global file
- Shows inheritance chain in hierarchical cost display

## AI Provider Integration (NEW)

Multi-provider support for AI-assisted editing:

1. **Anthropic (Claude)**: `claude-sonnet-4-20250514` - streaming support
2. **OpenAI**: `gpt-4o` - streaming support
3. **Ollama** (Local): `llama3.2` at `http://localhost:11434` - no API key needed

**AI Actions**: generate, improve, summarize - all with streaming responses

## Templates System

7 built-in templates:
1. Minimal - Basic CLAUDE.md scaffold
2. Full-Stack JS - Node.js + React + TypeScript
3. Python - Python backend project
4. Monorepo - Workspace structure
5. API Project - REST/GraphQL API guidelines
6. Mobile - React Native/Expo app
7. Careful AI - Safety-focused AI interaction rules

Variables: `{{PROJECT_NAME}}`, `{{AUTHOR}}`, `{{TECH_STACK}}`, etc.

## Current Status

**Version**: 0.2.0
**Phase**: 10+ (Distribution & Refinement)

Recent features (last 30 days):
- Split view with cross-pane drag/drop
- Sidebar redesign with collapsible sections
- Hierarchical cost display for inheritance chains
- Global ~/.claude/* file discovery
- AI provider integration (3 providers with streaming)
- Tab persistence & recovery
