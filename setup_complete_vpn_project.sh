#!/bin/bash
echo "🚀 Creating root Gradle files and complete Android VPN codebase..."

mkdir -p "app/src/main/java/com/example/vpn/worker"
mkdir -p "app/src/main/java/com/example/vpn/service"
mkdir -p "app/src/main/cpp"
mkdir -p "gradle/wrapper"
mkdir -p ".github/workflows"

# 1. Root settings.gradle (CRITICAL FOR GITHUB ACTIONS)
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

# 4. gradlew wrapper executable
cat << 'FILE_EOF' > "gradlew"
#!/bin/sh
exec gradle "$@"
FILE_EOF
chmod +x gradlew

# 5. Optimized GitHub Actions build-apk.yml (v5)
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

echo "✅ All root Gradle files generated!"
