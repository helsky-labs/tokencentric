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
Key components:
- `Sidebar`: Tree view with files
- `Editor`: Monaco editor wrapper
- `Preview`: Markdown preview
- `StatusBar`: Token counts, file info
- `Settings`: Configuration page
