#!/usr/bin/env bash
# One-time conversion of the StockIQ intro GIF into web-optimised assets.
# Usage: scripts/convert-intro-gif.sh path/to/intro.gif
# Outputs (committed, so the app never converts at runtime):
#   frontend/public/media/stockiq-intro.mp4
#   frontend/public/media/stockiq-intro.webm
#   frontend/public/media/stockiq-intro-poster.jpg
set -euo pipefail
SRC="${1:?Usage: $0 path/to/intro.gif}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/frontend/public/media"
mkdir -p "$OUT"
SCALE="scale=trunc(iw/2)*2:trunc(ih/2)*2"
ffmpeg -v error -y -i "$SRC" -vf "$SCALE" -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -an "$OUT/stockiq-intro.mp4"
ffmpeg -v error -y -i "$SRC" -vf "$SCALE" -c:v libvpx-vp9 -crf 36 -b:v 0 -an "$OUT/stockiq-intro.webm"
ffmpeg -v error -y -ss 0 -i "$SRC" -frames:v 1 -q:v 3 "$OUT/stockiq-intro-poster.jpg"
ls -lh "$OUT"
