#!/bin/bash
set -euo pipefail

echo "Installing openprovider..."

if ! command -v node &>/dev/null; then
  echo "Node.js 18+ is required. Install Node from https://nodejs.org/ and rerun this script." >&2
  exit 1
fi

NODE_MAJOR=$(node -p "Number(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18+ is required. Current version: $(node --version)" >&2
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "npm is required to install the published openprovider package." >&2
  exit 1
fi

echo "Using Node $(node --version)"

# Install openprovider globally
# If npm reports "install scripts blocked" for bun, rerun as:
#   npm install -g --allow-scripts=bun @mdevs/openprovider
# (keep sudo if the original install used sudo)
npm install -g @mdevs/openprovider

if ! command -v opr &>/dev/null; then
  NPM_BIN="$(npm bin -g 2>/dev/null || printf "%s/bin" "$(npm prefix -g)")"
  echo "openprovider installed, but 'opr' is not on PATH." >&2
  echo "Add your npm global bin directory to PATH, then rerun your shell: $NPM_BIN" >&2
  exit 1
fi

if ! opr help >/dev/null; then
  echo "openprovider installed, but 'opr help' failed. Check your npm global install and PATH." >&2
  exit 1
fi

echo ""
echo "✅ openprovider installed! Run 'opr init' to set up."

