cmake_minimum_required(VERSION 3.22.1)

project("localai_jni")

set(LLAMA_CPP_DIR
    "${CMAKE_CURRENT_LIST_DIR}/../../../../../third-party/llama.cpp"
)

set(BUILD_SHARED_LIBS ON CACHE BOOL "" FORCE)

set(LLAMA_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TOOLS OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_COMMON OFF CACHE BOOL "" FORCE)

add_subdirectory(
    "${LLAMA_CPP_DIR}"
    "${CMAKE_CURRENT_BINARY_DIR}/llama.cpp"
)

add_library(
    localai_jni
    SHARED
    localai_jni.cpp
)

target_include_directories(
    localai_jni
    PRIVATE
    "${LLAMA_CPP_DIR}/include"
)

target_link_libraries(
    localai_jni
    PRIVATE
    llama
    log
)
