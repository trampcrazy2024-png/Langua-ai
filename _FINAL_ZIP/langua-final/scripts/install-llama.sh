#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/third-party/llama.cpp"
TAG="${LLAMA_CPP_TAG:-}"

mkdir -p "$ROOT/third-party"
if [[ -e "$DEST/.git" ]]; then
  git -C "$DEST" fetch --depth 1 origin
  if [[ -n "$TAG" ]]; then git -C "$DEST" checkout --detach "$TAG"; else git -C "$DEST" checkout --detach origin/master; fi
else
  rm -rf "$DEST"
  if [[ -n "$TAG" ]]; then
    git clone --depth 1 --branch "$TAG" https://github.com/ggml-org/llama.cpp "$DEST"
  else
    git clone --depth 1 https://github.com/ggml-org/llama.cpp "$DEST"
  fi
fi

cd "$DEST"
echo "llama.cpp revision: $(git rev-parse HEAD)"
echo "llama.cpp source is ready for the Android CMake build."
