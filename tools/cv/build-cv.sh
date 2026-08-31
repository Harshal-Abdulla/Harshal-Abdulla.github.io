#!/usr/bin/env bash
# Renders tools/cv/cv.html to the CV PDF served by the site.
#
#   ./tools/cv/build-cv.sh
#
# Uses the copy of Chrome already on the machine, so there is no PDF
# dependency in package.json and nothing to install. After running it, update
# PROFILE.cvSize in content/profile.ts if the file size changed, and rename
# both the output below and PROFILE.cvPath when the month changes.
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUT="$ROOT/public/Harshal-Abdulla-CV-2026-09.pdf"

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" "file://$ROOT/tools/cv/cv.html" 2>/dev/null

echo "wrote $OUT"
ls -lh "$OUT" | awk '{print "size:", $5}'
