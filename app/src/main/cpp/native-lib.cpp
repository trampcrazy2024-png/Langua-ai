#include <jni.h>
#include <string>
#include <android/log.h>
#define LOG_TAG "NativeVpnBridge"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

extern "C" JNIEXPORT jlong JNICALL
Java_com_example_vpn_native_SingBoxBridge_nativeInit(JNIEnv* env, jobject thiz) {
    LOGI("Native bridge initialized");
    return 1L;
}
