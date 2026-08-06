#!/usr/bin/env bash
# Bootstrap for macOS / Linux / WSL / Git Bash.
#   ./setup.sh [--skip-build] [--skip-install] [--non-interactive]
#
# This only checks that Node exists and is new enough — everything else lives
# in scripts/setup.mjs, which needs Node to run in the first place.
set -euo pipefail

cd "$(dirname "$0")"

MIN_MAJOR=18
MIN_MINOR=17

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed (or not on PATH)."
  echo
  echo "Install the current LTS, then re-run this script:"
  echo "  macOS         brew install node"
  echo "  Debian/Ubuntu sudo apt install nodejs npm"
  echo "  Any platform  https://nodejs.org"
  exit 1
fi

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="${NODE_VERSION%%.*}"
NODE_REST="${NODE_VERSION#*.}"
NODE_MINOR="${NODE_REST%%.*}"

if [ "$NODE_MAJOR" -lt "$MIN_MAJOR" ] ||
   { [ "$NODE_MAJOR" -eq "$MIN_MAJOR" ] && [ "$NODE_MINOR" -lt "$MIN_MINOR" ]; }; then
  echo "ERROR: Node $NODE_VERSION is too old. Next.js 14 needs ${MIN_MAJOR}.${MIN_MINOR}+."
  echo "Install the current LTS from https://nodejs.org and re-run."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is not installed (or not on PATH)."
  echo "It normally ships with Node — reinstall Node from https://nodejs.org."
  exit 1
fi

exec node scripts/setup.mjs "$@"
