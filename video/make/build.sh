#!/usr/bin/env bash
# Rebuilds ../main.mp4 and ../cover.png. Intermediate files go to ../tmp (safe to delete afterwards).
# Needs: node, python (numpy, scipy), ffmpeg on PATH, Chrome at the path set in capture.js / cover.js.
# publish.md is hand-written; edit ../publish.md directly.
set -euo pipefail
cd "$(dirname "$0")"
[ -d node_modules ] || npm ci
node capture.js full                 # 2x frames + sfx.json  -> ../tmp
python audio.py                      # soundtrack            -> ../tmp/music.wav
ffmpeg -y -framerate 30 -i ../tmp/frames/%06d.jpg -i ../tmp/music.wav \
  -vf "scale=1080:1920:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -c:a aac -b:a 192k -shortest \
  -movflags +faststart -metadata title="better-ui" ../main.mp4
node cover.js                        # cover                 -> ../cover.png
