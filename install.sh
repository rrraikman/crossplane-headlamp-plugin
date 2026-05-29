#!/usr/bin/env bash
set -euo pipefail

REPO="rrraikman/crossplane-headlamp-plugin"

case "$(uname -s)" in
  Darwin) PLUGINS_DIR="$HOME/Library/Application Support/Headlamp/plugins" ;;
  Linux)  PLUGINS_DIR="$HOME/.config/Headlamp/plugins" ;;
  *)      echo "Unsupported OS. See README for manual installation."; exit 1 ;;
esac

echo "Fetching latest release..."
DOWNLOAD_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep '"browser_download_url"' \
  | grep '\.tar\.gz' \
  | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Could not find a release artifact. Check https://github.com/$REPO/releases"
  exit 1
fi

echo "Installing to $PLUGINS_DIR..."
mkdir -p "$PLUGINS_DIR"
curl -fsSL "$DOWNLOAD_URL" | tar -xzf - -C "$PLUGINS_DIR"

echo "Done! Restart Headlamp to load the Crossplane plugin."
