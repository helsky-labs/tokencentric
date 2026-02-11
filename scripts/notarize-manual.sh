#!/bin/bash

# TokenCentric Manual Notarization Script
#
# Standalone notarization that bypasses electron-builder and Node.js entirely.
# Use this when the automated pipeline fails or for one-off submissions.
#
# Required environment variables (or source .env.notarization):
#   APPLE_ID                          - Apple ID email
#   APPLE_TEAM_ID                     - Apple Developer Team ID
#   TOKENCENTRIC_APP_SPECIFIC_PASSWORD - App-specific password for notarization
#
# Usage:
#   source ../../.env.notarization
#   ./scripts/notarize-manual.sh [path/to/Tokencentric.app]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
APP_BUNDLE="${1:-$PROJECT_DIR/release/mac-arm64/Tokencentric.app}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[notarize]${NC} $1"; }
warn() { echo -e "${YELLOW}[notarize]${NC} $1"; }
fail() { echo -e "${RED}[notarize]${NC} $1"; exit 1; }

# Validate environment
[ -z "$APPLE_ID" ] && fail "APPLE_ID not set. Run: source ../../.env.notarization"
[ -z "$APPLE_TEAM_ID" ] && fail "APPLE_TEAM_ID not set"
[ -z "$TOKENCENTRIC_APP_SPECIFIC_PASSWORD" ] && fail "TOKENCENTRIC_APP_SPECIFIC_PASSWORD not set"

# Validate app bundle exists
[ ! -d "$APP_BUNDLE" ] && fail "App bundle not found at: $APP_BUNDLE"

# Step 1: Show app size
log "App bundle: $APP_BUNDLE"
log "App size: $(du -sh "$APP_BUNDLE" | cut -f1)"

# Step 2: Verify code signature
log "Verifying code signature..."
codesign --verify --deep --strict "$APP_BUNDLE" || fail "App is NOT properly code signed"
log "Code signature verified"

# Step 3: Show signing details
log "Signing details:"
codesign -dvv "$APP_BUNDLE" 2>&1 | head -5

# Step 4: Create zip for notarization
ZIP_PATH="/tmp/Tokencentric-manual.zip"
log "Creating zip: $ZIP_PATH"
ditto -c -k --keepParent "$APP_BUNDLE" "$ZIP_PATH"
log "Zip size: $(du -sh "$ZIP_PATH" | cut -f1)"

# Step 5: Submit for notarization (45 min timeout for ~105MB binary)
log "Submitting to Apple notarization service (timeout: 45m)..."
log "This may take 10-30 minutes for a ~105MB Electron app."
START_TIME=$(date +%s)

xcrun notarytool submit "$ZIP_PATH" \
    --apple-id "$APPLE_ID" \
    --team-id "$APPLE_TEAM_ID" \
    --password "$TOKENCENTRIC_APP_SPECIFIC_PASSWORD" \
    --wait --timeout 45m

END_TIME=$(date +%s)
ELAPSED=$(( END_TIME - START_TIME ))
log "Notarization completed in ${ELAPSED}s"

# Step 6: Staple the notarization ticket
log "Stapling notarization ticket..."
xcrun stapler staple "$APP_BUNDLE"

# Step 7: Final Gatekeeper verification
log "Final Gatekeeper verification..."
spctl --assess --verbose=2 "$APP_BUNDLE" || warn "Gatekeeper assessment failed (may need full system check)"

# Clean up zip
rm -f "$ZIP_PATH"

log "Notarization and stapling complete!"
log "App bundle: $APP_BUNDLE"
log ""
log "To verify: spctl --assess --verbose=2 \"$APP_BUNDLE\""
log "To check history: xcrun notarytool history --apple-id \$APPLE_ID --team-id \$APPLE_TEAM_ID --password \$TOKENCENTRIC_APP_SPECIFIC_PASSWORD"
