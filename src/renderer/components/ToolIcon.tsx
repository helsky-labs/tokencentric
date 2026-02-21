interface ToolIconProps {
  toolId: string;
  size?: number;
  className?: string;
}

/**
 * Renders SVG brand icons for AI coding tools and generic UI icons.
 * All icons use currentColor so they inherit the parent's text color.
 */
export function ToolIcon({ toolId, size = 16, className = '' }: ToolIconProps) {
  const props = {
    width: size,
    height: size,
    fill: 'currentColor',
    className,
    'aria-hidden': true as const,
  };

  switch (toolId) {
    case 'claude':
      // Anthropic sparkle — organic starburst with varying ray lengths
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 1.5l.8 8.1 4.3-5.7.6 6.1 5.8-2.5-3.5 5.5 6 .5-5.5 3.5 4.5 4.2-6-.5 2 5.8-4.5-4-1.5 6-1.5-6-4.5 4 2-5.8-6 .5 4.5-4.2L.5 13l6-.5L3 7l5.8 2.5.6-6.1 4.3 5.7z" />
        </svg>
      );

    case 'cursor':
      // Cursor — hexagonal gem with three faceted faces
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" fill="currentColor" opacity="0.15" />
          <path d="M12 2l9 5-9 5-9-5 9-5z" fill="currentColor" opacity="0.55" />
          <path d="M3 7l9 5v10l-9-5V7z" fill="currentColor" opacity="0.35" />
          <path d="M21 7l-9 5v10l9-5V7z" fill="currentColor" opacity="0.75" />
        </svg>
      );

    case 'copilot':
      // GitHub Copilot — pilot helmet with goggle eyes and visor vents
      return (
        <svg {...props} viewBox="0 0 24 24" fillRule="evenodd">
          <path d="M12 3C7.6 3 4 6 3.6 10c-.9.6-1.6 1.6-1.6 3v1.5c0 1.3.7 2.3 1.6 2.9C4.4 20 7.8 22 12 22s7.6-2 8.4-4.6c.9-.6 1.6-1.6 1.6-2.9V13c0-1.4-.7-2.4-1.6-3C20 6 16.4 3 12 3zM7.5 10C6.1 10 5 11.1 5 12.5S6.1 15 7.5 15 10 13.9 10 12.5 8.9 10 7.5 10zm9 0c-1.4 0-2.5 1.1-2.5 2.5S15.1 15 16.5 15s2.5-1.1 2.5-2.5S17.9 10 16.5 10zM10 17.5h1v2h-1zm3 0h1v2h-1z" />
        </svg>
      );

    case 'windsurf':
      // Windsurf/Codeium — stylized wave
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M2 16.5c2.5-4 5-7 9-7 3 0 4.5 3 7.5 3 1.8 0 3-1 3.5-1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M2 10.5c2.5-4 5-7 9-7 3 0 4.5 3 7.5 3 1.8 0 3-1 3.5-1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    case 'openai':
      // OpenAI hexagonal flower mark
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M20.58 10.82a5.49 5.49 0 00-.47-4.51 5.56 5.56 0 00-6-2.56A5.49 5.49 0 0010 2a5.52 5.52 0 00-5.27 3.75 5.49 5.49 0 00-3.68 2.66 5.56 5.56 0 00.68 6.52A5.49 5.49 0 002.2 19.44a5.56 5.56 0 006 2.56A5.49 5.49 0 0012.35 24a5.52 5.52 0 005.27-3.75 5.49 5.49 0 003.68-2.66 5.56 5.56 0 00-.68-6.52l-.04-.25zM12.35 22.5a4.1 4.1 0 01-2.63-.96l.13-.07 4.37-2.52a.71.71 0 00.36-.62v-6.16l1.84 1.07a.07.07 0 01.04.05v5.1a4.13 4.13 0 01-4.11 4.11zM4.35 18.46a4.1 4.1 0 01-.49-2.76l.13.08 4.37 2.52a.71.71 0 00.71 0l5.34-3.08v2.13a.07.07 0 01-.03.06l-4.42 2.55a4.13 4.13 0 01-5.61-1.5zM3.15 8.39A4.1 4.1 0 015.3 6.58v5.19a.71.71 0 00.36.62l5.34 3.08-1.85 1.07a.07.07 0 01-.06 0l-4.42-2.55A4.13 4.13 0 013.15 8.39zm15.22 3.54l-5.34-3.08 1.85-1.07a.07.07 0 01.06 0l4.42 2.55a4.13 4.13 0 01-1.63 7.61v-5.39a.71.71 0 00-.36-.62zm1.84-2.78l-.13-.08-4.37-2.52a.71.71 0 00-.71 0L9.66 9.63V7.5a.07.07 0 01.03-.06l4.42-2.55a4.13 4.13 0 016.1 4.26zM8.68 12.93l-1.85-1.07a.07.07 0 01-.04-.05V6.71a4.13 4.13 0 016.74-3.19l-.13.07-4.37 2.52a.71.71 0 00-.36.62v6.2zm1-2.17L12 9.38l2.32 1.34v2.68L12 14.74l-2.32-1.34v-2.62z" />
        </svg>
      );

    // --- Generic UI icons (non-tool) ---

    case 'document':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'package':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'bolt':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );

    case 'robot':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="9" cy="14" r="1.5" fill="currentColor" />
          <circle cx="15" cy="14" r="1.5" fill="currentColor" />
          <path d="M12 4v4M10 4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'gear':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    case 'folder':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'folder-open':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 10h20l-2.5 11H4.5L2 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'markdown':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M6 8v8l3-3 3 3V8M17 8v8m0 0l-2-3m2 3l2-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'search':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'chart':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'warning':
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      // Fallback document icon
      return (
        <svg {...props} viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
