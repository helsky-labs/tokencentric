# Tokencentric

A desktop app for managing AI coding assistant context files. Scan your projects, edit context files, and track token counts across multiple AI tools.

## Features

- **Multi-tool support**: Claude Code (CLAUDE.md), Cursor (.cursorrules), GitHub Copilot (copilot-instructions.md), Windsurf (.windsurfrules), ChatGPT/OpenAI (AGENTS.md)
- **Token counting**: Real-time token counts using official Anthropic and OpenAI tokenizers
- **Monaco Editor**: Full-featured code editor with syntax highlighting and markdown preview
- **File management**: Create, edit, duplicate, and delete context files
- **Directory scanning**: Recursively scan projects to find all context files
- **Dark mode**: Automatic theme detection with manual override
- **Auto-updates**: Automatic updates via GitHub Releases

## Installation

### Download

Download the latest release for your platform:

- **macOS**: Download `.dmg` from [Releases](https://github.com/helrabelo/tokencentric/releases)
- **Windows**: Download `.exe` installer from [Releases](https://github.com/helrabelo/tokencentric/releases)

### Build from source

```bash
# Clone the repository
git clone https://github.com/helrabelo/tokencentric.git
cd tokencentric

# Install dependencies
npm install

# Build for your platform
npm run dist
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode (terminal 1)
npm run dev

# Start Electron (terminal 2)
npm start
```

### Development scripts

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

## Tech Stack

- **Framework**: Electron 28
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Tokenizers**: @anthropic-ai/tokenizer, tiktoken (OpenAI)
- **Storage**: electron-store
- **Updates**: electron-updater

## Supported Context Files

| Tool | File Pattern |
|------|--------------|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurfrules` |
| ChatGPT/OpenAI | `AGENTS.md` |

## License

MIT
