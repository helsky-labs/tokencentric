# Changelog

All notable changes to TokenCentric will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-07

### Added
- MIT LICENSE file
- Privacy Policy (PRIVACY.md)
- Privacy Policy link in Help menu and About dialog
- macOS code signing and notarization support
- CHANGELOG.md

### Changed
- Version bump from 0.2.0 to 1.0.0
- Updated all GitHub references to helsky-labs org
- Replaced "Buy Me a Coffee" with PIX support links
- Updated README badge URL to tokencentric.app

### Fixed
- Broken GitHub org references (helrabelo -> helsky-labs)
- Dead links to tokencentric.dev (now tokencentric.app)

## [0.2.0] - 2026-01-15

### Added
- Split view with horizontal and vertical pane layouts
- Cross-pane drag and drop for tabs
- Tab persistence and recovery between sessions
- Tab context menu (close, close others, close all)
- Close confirmation dialog for unsaved changes
- Sidebar redesign with collapsible sections (Global Config, Templates, Project Files)
- Templates library with 7 built-in templates
- PIX support section in README

### Changed
- Improved sidebar organization with section headers
- Updated support section to use PIX instead of Buy Me a Coffee

## [0.1.0] - 2025-12-01

### Added
- Initial release
- Multi-tool support: Claude Code, Cursor, GitHub Copilot, Windsurf, OpenAI/ChatGPT
- Real-time token counting with official tokenizers (@anthropic-ai/tokenizer, tiktoken)
- Monaco editor with syntax highlighting and markdown preview
- File management: scan, create, edit, duplicate, delete
- 7 built-in templates (Minimal, Full-Stack JS, Python, Monorepo, API, Mobile, Careful AI)
- Hierarchical context cost display showing inheritance chains
- Global config discovery (~/.claude/* files)
- AI provider integration (Anthropic, OpenAI, Ollama) with streaming
- Settings dialog with AI provider configuration
- Onboarding wizard for first-time users
- Dark mode with system theme detection
- Auto-updates via GitHub Releases
- Anonymous usage analytics (opt-out available)
- About dialog with system info
- macOS and Windows builds via electron-builder
