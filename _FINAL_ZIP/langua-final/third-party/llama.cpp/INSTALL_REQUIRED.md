# llama.cpp source installation

The real upstream source is required here because the Android JNI CMake build
references this directory directly.

Run:

```bash
./scripts/install-llama.sh
```

The installer clones the current `ggml-org/llama.cpp` repository, invokes the
upstream `make` entrypoint as a compatibility check, and then uses the current
official CMake build system. Current upstream llama.cpp has replaced the old
Makefile build with CMake, so a `make` failure that says the build system
changed is expected and is followed by the supported CMake build.
