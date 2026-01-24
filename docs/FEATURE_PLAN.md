# Feature Implementation Plan

## Feature 1: Global Config Section (~/.claude)

### Overview
Add a dedicated sidebar section showing Claude Code's global configuration folder, always visible regardless of scanned directory.

### What to Show
- `~/.claude/CLAUDE.md` - Global instructions
- `~/.claude/commands/*.md` - Custom slash commands
- `~/.claude/settings.json` - Claude Code settings (read-only)
- `~/.claude/settings.local.json` - Local overrides (read-only)

### Implementation Steps

#### Step 1.1: Add IPC for Global Config
**Files**: `src/main/ipc.ts`, `src/preload/index.ts`, `src/shared/types.ts`

- Add `get-global-config-path` IPC to return `~/.claude` path
- Add `get-global-config-files` IPC to scan and return files from `~/.claude`
- Include file type detection (md, json, directory)
- **Commit**: `feat: add IPC handlers for global config access`

#### Step 1.2: Create GlobalConfigSection Component
**Files**: `src/renderer/components/GlobalConfigSection.tsx` (NEW)

- Collapsible section component
- Tree view of ~/.claude contents
- Visual distinction from project files
- Handle empty state (no ~/.claude folder)
- **Commit**: `feat: add GlobalConfigSection component`

#### Step 1.3: Integrate into Sidebar
**Files**: `src/renderer/components/Sidebar.tsx`

- Add GlobalConfigSection above project files
- Pass necessary handlers (onSelectFile, onContextMenu)
- Persist expanded/collapsed state
- **Commit**: `feat: integrate global config section into sidebar`

#### Step 1.4: Handle Non-Markdown Files
**Files**: `src/renderer/components/MainContent.tsx`

- Detect JSON files and render with proper syntax highlighting
- Add read-only indicator for settings files
- Prevent editing of non-md files (or warn)
- **Commit**: `feat: handle JSON files in editor with read-only mode`

---

## Feature 2: AI Integration

### Overview
Connect to AI APIs (Claude, OpenAI, Ollama) to help users generate, improve, and summarize context files.

### Supported Providers
1. **Anthropic (Claude)** - claude-sonnet-4-20250514, etc.
2. **OpenAI** - gpt-4o, gpt-4o-mini
3. **Ollama** - Local models (llama3, codellama, etc.)

### AI Actions
1. **Generate** - Create a context file from project analysis
2. **Improve** - Enhance existing context with suggestions
3. **Summarize** - Condense verbose context files

### Implementation Steps

#### Step 2.1: Add AI Settings
**Files**: `src/shared/types.ts`, `src/main/store.ts`

- Add `AISettings` type with provider configs
- Store API keys securely (electron-store with encryption)
- Add provider enable/disable toggles
- **Commit**: `feat: add AI provider settings types`

#### Step 2.2: Create AI Settings Tab
**Files**: `src/renderer/components/SettingsDialog.tsx`, `src/renderer/components/settings/AITab.tsx` (NEW)

- New tab in settings for AI configuration
- API key inputs (masked, with test button)
- Provider selection and model preferences
- Ollama URL configuration
- **Commit**: `feat: add AI settings tab with provider configuration`

#### Step 2.3: Create AI Service (Main Process)
**Files**: `src/main/services/ai.ts` (NEW)

- Abstract AI provider interface
- Anthropic SDK integration
- OpenAI SDK integration
- Ollama HTTP client
- Streaming response support
- **Commit**: `feat: add AI service with multi-provider support`

#### Step 2.4: Add AI IPC Handlers
**Files**: `src/main/ipc.ts`, `src/preload/index.ts`

- `ai-generate` - Generate context from project structure
- `ai-improve` - Improve existing content
- `ai-summarize` - Summarize/condense content
- `ai-test-connection` - Verify API key works
- Stream responses via IPC
- **Commit**: `feat: add AI IPC handlers with streaming`

#### Step 2.5: Create AI Action UI
**Files**: `src/renderer/components/AIActions.tsx` (NEW)

- Floating action button or toolbar
- Action menu (Generate, Improve, Summarize)
- Loading state with streaming preview
- Accept/reject generated content
- **Commit**: `feat: add AI actions UI component`

#### Step 2.6: Integrate AI into Editor
**Files**: `src/renderer/components/MainContent.tsx`

- Add AI toolbar above editor
- Inline suggestions panel
- Diff view for improvements
- Token count awareness
- **Commit**: `feat: integrate AI actions into editor`

#### Step 2.7: Project Analysis for Generation
**Files**: `src/main/services/projectAnalyzer.ts` (NEW)

- Scan project structure (package.json, file types, folders)
- Detect tech stack automatically
- Generate context for AI prompt
- Respect .gitignore
- **Commit**: `feat: add project analyzer for AI context generation`

---

## Verification Checklist

After each step:
1. `npm run build` - No compile errors
2. `npm run lint` - No new lint errors
3. `npm run dev` - App starts and works
4. Test the specific feature
5. Commit with conventional commit message

---

## Dependencies to Add

```bash
# For AI integration
npm install @anthropic-ai/sdk openai
```

Ollama uses HTTP so no SDK needed.

---

## Security Considerations

1. **API Keys**: Store encrypted in electron-store
2. **Never log keys**: Redact in any debug output
3. **User consent**: Warn before sending code to external APIs
4. **Local option**: Ollama for privacy-conscious users

---

## Timeline Estimate

- Feature 1 (Global Config): 4 steps, ~2-3 hours
- Feature 2 (AI Integration): 7 steps, ~6-8 hours

Total: ~10 hours of focused work
