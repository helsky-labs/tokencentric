# Tokencentric

Desktop app for managing AI coding assistant context files.

Supports:
- Claude Code (CLAUDE.md)
- Cursor (.cursorrules)
- GitHub Copilot (copilot-instructions.md)
- Windsurf (.windsurfrules)
- ChatGPT/OpenAI (AGENTS.md)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# In another terminal, start Electron
npm start
```

## Building

```bash
# Build for current platform
npm run dist

# Build for macOS
npm run dist:mac

# Build for Windows
npm run dist:win
```

## License

MIT
