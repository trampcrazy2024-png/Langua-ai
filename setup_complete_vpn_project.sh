#!/bin/bash
echo "🚀 Creating full fixed Android VPN repository structure and root Gradle files..."

mkdir -p "app/src/main/java/com/example/vpn/worker"
mkdir -p "app/src/main/java/com/example/vpn/service"
mkdir -p "app/src/main/cpp"
mkdir -p "gradle/wrapper"
mkdir -p ".github/workflows"

# 1. Root settings.gradle
cat << 'FILE_EOF' > "settings.gradle"
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "vpn"
include ':app'
FILE_EOF

# 2. Root build.gradle
cat << 'FILE_EOF' > "build.gradle"
buildscript {
    ext.kotlin_version = '1.9.22'
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        classpath 'com.google.dagger:hilt-android-gradle-plugin:2.50'
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
FILE_EOF

# 3. Gradle wrapper properties
cat << 'FILE_EOF' > "gradle/wrapper/gradle-wrapper.properties"
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
FILE_EOF

# 4. gradlew wrapper script
cat << 'FILE_EOF' > "gradlew"
#!/bin/sh
exec gradle "$@"
FILE_EOF
chmod +x gradlew

# 5. Kotlin & Native missing files
cat << 'FILE_EOF' > "app/src/main/java/com/example/vpn/worker/ConfigUpdateWorker.kt"
package com.example.vpn.worker

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.vpn.data.remote.RemoteConfigRepository
import com.example.vpn.data.repository.ServerRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

@HiltWorker
class ConfigUpdateWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val remoteConfigRepository: RemoteConfigRepository,
    private val serverRepository: ServerRepository
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            Log.i("ConfigUpdateWorker", "Starting background config update...")
            val newConfigs = remoteConfigRepository.fetchConfigs()
            Result.success()
        } catch (e: Exception) {
            Log.e("ConfigUpdateWorker", "Error updating configs in background", e)
            Result.retry()
        }
    }
}
FILE_EOF

cat << 'FILE_EOF' > "app/src/main/java/com/example/vpn/service/NotificationHelper.kt"
package com.example.vpn.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.vpn.MainActivity
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        const val CHANNEL_ID = "vpn_service_channel"
        const val NOTIFICATION_ID = 1001
    }

    private val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "VPN Connection Status",
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun createNotification(title: String, content: String, isConnected: Boolean): Notification {
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
FILE_EOF

cat << 'FILE_EOF' > "app/proguard-rules.pro"
-keep class com.example.vpn.native.SingBoxBridge { *; }
-keep class com.example.vpn.native.SingBoxBridge$TunnelCallback { *; }
-keepclassmembers class com.example.vpn.native.SingBoxBridge { native <methods>; }
-keep class android.net.VpnService { *; }
-keep class com.example.vpn.service.CoreVpnService { *; }
FILE_EOF

cat << 'FILE_EOF' > "app/src/main/cpp/CMakeLists.txt"
cmake_minimum_required(VERSION 3.22.1)
project("vpnbridge")
add_library(vpnbridge SHARED native-lib.cpp)
find_library(log-lib log)
target_link_libraries(vpnbridge \${log-lib})
FILE_EOF

cat << 'FILE_EOF' > "app/src/main/cpp/native-lib.cpp"
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
FILE_EOF

# 6. Updated GitHub Actions build-apk.yml (No deprecation warnings, uses Gradle Setup Action)
cat << 'FILE_EOF' > ".github/workflows/build-apk.yml"
name: Build Android VPN APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build & Release APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v5
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Make gradlew executable
        run: chmod +x gradlew || true

      - name: Build Debug APK
        run: gradle assembleDebug || ./gradlew assembleDebug

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: android-vpn-debug-apk
          path: app/build/outputs/apk/debug/*.apk
FILE_EOF

echo "✅ Root Gradle build files & GitHub Actions workflow generated!"
