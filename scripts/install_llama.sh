#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LLAMA_DIR="$ROOT/third-party/llama.cpp"

echo "==> Installing llama.cpp"
echo "    ROOT: $ROOT"
echo "    DEST: $LLAMA_DIR"

if [ -f "$LLAMA_DIR/CMakeLists.txt" ]; then
  echo "==> llama.cpp source already exists; skipping clone."
else
  rm -rf "$LLAMA_DIR"
  mkdir -p "$(dirname "$LLAMA_DIR")"

  git clone --depth 1 https://github.com/ggml-org/llama.cpp.git "$LLAMA_DIR"
fi

echo "==> Verifying llama.cpp source"

test -f "$LLAMA_DIR/CMakeLists.txt"
test -f "$LLAMA_DIR/include/llama.h"

echo "==> llama.cpp source OK"

echo "==> Running CMake build"

cmake -S "$LLAMA_DIR" \
      -B "$LLAMA_DIR/build" \
      -DBUILD_SHARED_LIBS=ON \
      -DLLAMA_BUILD_TESTS=OFF \
      -DLLAMA_BUILD_EXAMPLES=OFF \
      -DLLAMA_BUILD_SERVER=OFF \
      -DLLAMA_BUILD_TOOLS=OFF \
      -DLLAMA_BUILD_COMMON=OFF

cmake --build "$LLAMA_DIR/build" --parallel "$(nproc)"

echo "==> llama.cpp build completed: $LLAMA_DIR/build"
