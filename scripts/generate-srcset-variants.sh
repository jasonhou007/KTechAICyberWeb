#!/usr/bin/env bash
# Generate responsive WebP variants for the About hero (#199).
#
# Source: public/images/about/about-who-we-are.webp (native 800x480).
# We generate TWO variants:
#   - 400w: downscaled to 400px wide (height auto via cwebp resize 400 0).
#   - 800w: re-encoded at the native width (NO upscaling — the source is
#     already 800px wide). The 1200w-tier srcset descriptor in About.vue
#     points at THIS 800px file, not a generated 1200w, so we never upscale.
#
# Idempotent: safe to re-run; overwrites the variant files in place.
# Requires /usr/local/bin/cwebp (libwebp 1.x).
set -euo pipefail

cd "$(dirname "$0")/.."

SRC=public/images/about/about-who-we-are.webp
CWEBP="${CWEBP:-/usr/local/bin/cwebp}"

if [ ! -f "$SRC" ]; then
  echo "ERROR: source not found: $SRC" >&2
  exit 1
fi
if [ ! -x "$CWEBP" ]; then
  echo "ERROR: cwebp not found/executable at $CWEBP" >&2
  echo "Install libwebp or set CWEBP=/path/to/cwebp" >&2
  exit 1
fi

# 400w variant — downscale to 400px wide, height auto (preserve aspect ratio).
"$CWEBP" -quiet -resize 400 0 "$SRC" \
  -o public/images/about/about-who-we-are-400w.webp

# 800w variant — re-encode at native width (NO upscale). cwebp with no -resize
# keeps the source dimensions (800x480).
"$CWEBP" -quiet "$SRC" \
  -o public/images/about/about-who-we-are-800w.webp

echo "wrote 400w + 800w variants for $SRC"
