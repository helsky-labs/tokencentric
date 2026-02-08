# Privacy Policy

**Last updated:** February 2026

TokenCentric is a free, open-source desktop application developed by Helsky Labs. We are committed to protecting your privacy and being transparent about how the app works.

## What TokenCentric Does NOT Collect

- **No personal data** - We never collect your name, email, or any personal information
- **No file contents** - Your code, context files, and project content never leave your machine
- **No project paths** - Directory structures and file paths are never transmitted
- **No keystrokes or editing behavior** - What you type stays on your computer
- **No crash reports** (yet) - We plan to add opt-in crash reporting in the future

## What TokenCentric Collects

TokenCentric collects minimal, anonymous usage analytics to help us understand how the app is used and improve it. This data is sent to our self-hosted Umami analytics instance at `analytics.helsky-labs.com`.

### Anonymous Device ID

When you first launch TokenCentric, a random 16-character hexadecimal string is generated and stored locally on your machine (via `electron-store`). This ID is not linked to any personal information - it's purely random and used only to distinguish unique devices in aggregate analytics.

### Events Tracked

The following events may be sent:

| Event | Description |
|-------|-------------|
| `app_launch` | App was opened |
| `file_created` | A new context file was created |
| `scan_completed` | A directory scan finished |
| `template_used` | A template was applied |
| `settings_changed` | A setting was modified |

### Metadata Included

Each event includes:

- **App version** (e.g., "1.0.0")
- **Platform** (e.g., "darwin", "win32")
- **Locale** (e.g., "en-US")

### Where Data Is Sent

All analytics data is sent to `https://analytics.helsky-labs.com/api/send`, a self-hosted [Umami](https://umami.is) instance. Umami is an open-source, privacy-focused analytics platform that does not use cookies and complies with GDPR.

## How to Opt Out

You can disable analytics entirely in the app:

1. Open TokenCentric
2. Go to **Settings** (Cmd+, on macOS)
3. Navigate to the **Privacy** tab
4. Toggle off **Send anonymous usage data**

When opted out, no data is sent to any server.

## Data Storage

- Analytics data is stored on our self-hosted Umami instance
- The anonymous device ID is stored locally in your system's app data directory
- No data is shared with third parties
- No data is sold or used for advertising

## Open Source

TokenCentric is fully open source. You can inspect exactly what data is collected by reviewing the analytics code at:

- [`src/main/analytics.ts`](https://github.com/helsky-labs/tokencentric/blob/main/src/main/analytics.ts)

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date above and communicated through release notes.

## Contact

If you have questions about this privacy policy, please open an issue at:

https://github.com/helsky-labs/tokencentric/issues
