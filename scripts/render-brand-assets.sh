#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -n "${CHROME:-}" ]]; then
  CHROME_BIN="$CHROME"
else
  CHROME_BIN=""
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium"; do
    if [[ -x "$candidate" ]]; then
      CHROME_BIN="$candidate"
      break
    fi
  done
fi

if [[ -z "$CHROME_BIN" || ! -x "$CHROME_BIN" ]]; then
  echo "Set CHROME to a Chrome/Chromium executable path." >&2
  exit 1
fi

render() {
  local output="$1"
  local width="$2"
  local height="$3"
  local url="$4"

  "$CHROME_BIN" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    "--screenshot=$output" \
    "--window-size=${width},${height}" \
    "$url"
}

AVATAR_HTML="$(mktemp "${TMPDIR:-/tmp}/ateneo-avatar.XXXXXX.html")"
trap 'rm -f "$AVATAR_HTML"' EXIT

cat > "$AVATAR_HTML" <<HTML
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html,
      body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: #ffffff;
      }

      img {
        display: block;
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <img src="file://$ROOT/public/avatar.svg" alt="" />
  </body>
</html>
HTML

render "$ROOT/public/og.png" 1200 630 "file://$ROOT/public/og.svg"
render "$ROOT/public/og-en.png" 1200 630 "file://$ROOT/public/og-en.svg"
render "$ROOT/public/avatar-512.png" 512 512 "file://$AVATAR_HTML"
render "$ROOT/public/avatar-1024.png" 1024 1024 "file://$AVATAR_HTML"
