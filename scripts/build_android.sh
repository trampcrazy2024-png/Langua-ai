#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================"
echo " Langua AI - Android Build"
echo "========================================"

cd "$ROOT"

echo
echo ">>> Step 1: Prepare llama.cpp"
./scripts/install_llama.sh

echo
echo ">>> Step 2: Verify llama.cpp"
test -f third-party/llama.cpp/CMakeLists.txt
test -f third-party/llama.cpp/include/llama.h

echo "OK: llama.cpp source"

echo
echo ">>> Step 3: Build web app + sync Android"
npm run android:sync

echo
echo ">>> Step 4: Build Android APK"
cd android

./gradlew assembleDebug

echo
echo "========================================"
echo " BUILD SUCCESSFUL"
echo "========================================"

find app/build/outputs/apk -type f -name "*.apk" -print
