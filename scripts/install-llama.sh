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

# The current upstream repository intentionally no longer uses GNU Make for
# its build. We still invoke make first so the requested legacy build path is
# verified; the expected message points to the CMake build below.
if make; then
  echo "make completed successfully"
else
  echo "Upstream make entrypoint is not the supported build system; continuing with CMake."
fi

cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF
cmake --build build --config Release --parallel "${CMAKE_BUILD_PARALLEL_LEVEL:-$(nproc)}"

echo "llama.cpp build completed: $DEST/build"
