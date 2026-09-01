#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export JAVA_HOME="/usr/local/sdkman/candidates/java/21.0.12-ms"
export PATH="$JAVA_HOME/bin:$PATH"

echo "Using:"
echo "  JAVA_HOME=$JAVA_HOME"
echo "  NDK=27.0.12077973"
echo "  CMake=3.22.1"
echo "  Ninja=1.10.2"

cd android

./gradlew assembleDebug --no-parallel --max-workers=1
