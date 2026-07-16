#!/usr/bin/env bash
# Install Graphify and build the Mokaid monorepo knowledge graph (code-only, no API key).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is required. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

export UV_TOOL_BIN_DIR="${UV_TOOL_BIN_DIR:-$HOME/bin}"
mkdir -p "$UV_TOOL_BIN_DIR"
uv tool install graphifyy --force
export PATH="$UV_TOOL_BIN_DIR:$PATH"

graphify cursor install --project
graphify extract . --code-only --force
graphify cluster-only . --no-label
graphify hook install

echo "Graphify ready: graphify-out/graph.json — query with: graphify query \"…\""
