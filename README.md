# TokenCentric

> The dashboard for your AI coding assistants

A free desktop app for managing AI coding assistant context files. Scan your projects, edit context files, and track token counts across Claude Code, Cursor, GitHub Copilot, Windsurf, and more.

[![Download](https://img.shields.io/github/v/release/helsky-labs/tokencentric?label=Download&style=for-the-badge)](https://github.com/helsky-labs/tokencentric/releases)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Support via PIX](https://img.shields.io/badge/Support%20via%20PIX-00D4AA?style=for-the-badge)](https://tokencentric.app/#support)

---

## Why TokenCentric?

If you use AI coding assistants, you know the pain:

- **Context chaos**: CLAUDE.md here, .cursorrules there, copilot-instructions.md somewhere else
- **Token mystery**: Is your context file too long? Too short? You have no idea
- **Project sprawl**: Dozens of projects, each with different AI configurations
- **Tool switching**: Different AI tools need different file formats

**TokenCentric solves all of this** with a single, beautiful desktop app.

---

## Features

### Multi-Tool Support
Manage context files for all major AI coding assistants in one place:

| Tool | File Pattern |
|------|--------------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| ChatGPT/OpenAI | `AGENTS.md` |

### Token Counting
Real-time, accurate token counts using official tokenizers:
- **Anthropic tokenizer** for Claude files
- **tiktoken (OpenAI)** for Cursor, Copilot, Windsurf, and OpenAI files

Color-coded indicators show when files are getting too large.

### Monaco Editor
Full-featured code editor with:
- Syntax highlighting
- Markdown preview (side-by-side or toggle)
- Keyboard shortcuts (Cmd+S to save)
- Unsaved changes indicator

### File Management
- **Scan** directories to find all context files
- **Create** new files from 7 built-in templates
- **Edit**, **duplicate**, and **delete** files
- **Reveal in Finder/Explorer** for quick access

### Templates
Start new projects fast with pre-built templates:
- Minimal
- Full-Stack JS (Node, React, TypeScript)
- Python
- Monorepo
- API Project
- Mobile (React Native/Expo)
- Careful AI (safety-focused rules)

### Dark Mode
Automatic theme detection with manual override. Looks great day and night.

### Auto-Updates
Always stay up to date with automatic updates via GitHub Releases.

---

## Installation

### Download

Download the latest release for your platform:

| Platform | Download |
|----------|----------|
| **macOS** | [Download .dmg](https://github.com/helsky-labs/tokencentric/releases/latest) |
| **Windows** | [Download .exe](https://github.com/helsky-labs/tokencentric/releases/latest) |

### Build from Source

```bash
# Clone the repository
git clone https://github.com/helsky-labs/tokencentric.git
cd tokencentric

# Install dependencies
npm install

# Build for your platform
npm run dist
```

---

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# In a separate terminal, start Electron
npm start
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all dev watchers (main, preload, renderer) |
| `npm start` | Launch Electron app |
| `npm run build` | Build all TypeScript and Vite |
| `npm run dist` | Build and package for current platform |
| `npm run dist:mac` | Build and package for macOS |
| `npm run dist:win` | Build and package for Windows |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Tech Stack

- **Framework**: Electron 28
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Tokenizers**: @anthropic-ai/tokenizer, tiktoken
- **Storage**: electron-store
- **Updates**: electron-updater

---

## Support

TokenCentric is **free and open source**. If you find it useful, consider:

- Starring the repo
- Supporting via PIX (Brazilian instant payment):
  ```
  772337c9-12fc-47fa-8849-32fb5f696129
  ```
- Sharing with friends who use AI coding assistants

---

## Roadmap

### v1.1
- [ ] File watching (auto-refresh on external changes)
- [ ] Combined token count for inheritance chains
- [ ] Search/filter files
- [ ] Custom template creation

### v2.0
- [ ] Custom tool profile creation
- [ ] Template import/export
- [ ] "What context does AI see here?" visualization

---

## License

MIT

---

## More from Helsky Labs

TokenCentric is a [Helsky Labs](https://helsky-labs.com) project. Check out our other tools for developers and creators.
