package com.lingua.assistant.plugins;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

@CapacitorPlugin(name = "LocalAI")
public class LocalAIPlugin extends Plugin {

    static {
        System.loadLibrary("localai_jni");
    }

    private boolean modelLoaded = false;
    private String loadedModelPath = null;

    private native boolean nativeLoadModel(String modelPath);
    private native void nativeUnloadModel();
    private native boolean nativeIsLoaded();
    private native String nativeGenerate(String prompt);

    @PluginMethod
    public void ping(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("engine", "llama.cpp");
        result.put("native", true);
        call.resolve(result);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        result.put("engine", "llama.cpp");
        result.put("runtime", "android-native");
        result.put("loaded", modelLoaded && nativeIsLoaded());
        call.resolve(result);
    }

    @PluginMethod
    public void healthCheck(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("modelLoaded", modelLoaded && nativeIsLoaded());
        result.put("modelPath", loadedModelPath);
        result.put("engine", "llama.cpp");
        call.resolve(result);
    }

    @PluginMethod
    public void pickModel(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");

        startActivityForResult(intent, "modelPickerResult", call);
    }

    @ActivityCallback
    private void modelPickerResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() != android.app.Activity.RESULT_OK
                || result.getData() == null
                || result.getData().getData() == null) {

            call.reject("Model selection cancelled");
            return;
        }

        Uri uri = result.getData().getData();

        try {
            final int takeFlags =
                    result.getData().getFlags()
                            & (Intent.FLAG_GRANT_READ_URI_PERMISSION
                            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

            if (takeFlags != 0) {
                try {
                    getContext().getContentResolver()
                            .takePersistableUriPermission(uri, takeFlags);
                } catch (Exception ignored) {
                    // Some providers do not support persistable permissions.
                }
            }

            File modelFile = copyModelToAppStorage(uri);

            JSObject response = new JSObject();
            response.put("ok", true);
            response.put("uri", uri.toString());
            response.put("path", modelFile.getAbsolutePath());
            response.put("name", modelFile.getName());
            response.put("size", modelFile.length());

            call.resolve(response);

        } catch (Exception e) {
            call.reject("Failed to import model: " + e.getMessage());
        }
    }

    private File copyModelToAppStorage(Uri uri) throws Exception {
        File modelsDir = new File(
                getContext().getFilesDir(),
                "models"
        );

        if (!modelsDir.exists() && !modelsDir.mkdirs()) {
            throw new Exception("Unable to create models directory");
        }

        String originalName = getDisplayName(uri);

        if (originalName == null || originalName.trim().isEmpty()) {
            originalName = "model.gguf";
        }

        originalName = sanitizeFileName(originalName);

        if (!originalName.toLowerCase().endsWith(".gguf")) {
            originalName = originalName + ".gguf";
        }

        File destination = new File(modelsDir, originalName);

        try (
                InputStream input =
                        getContext().getContentResolver().openInputStream(uri);
                FileOutputStream output =
                        new FileOutputStream(destination)
        ) {
            if (input == null) {
                throw new Exception("Unable to open selected model");
            }

            byte[] buffer = new byte[1024 * 1024];
            int read;

            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }

            output.flush();
        }

        if (!destination.exists() || destination.length() == 0) {
            throw new Exception("Imported model is empty");
        }

        return destination;
    }

    private String getDisplayName(Uri uri) {
        Cursor cursor = null;

        try {
            cursor = getContext()
                    .getContentResolver()
                    .query(
                            uri,
                            new String[]{OpenableColumns.DISPLAY_NAME},
                            null,
                            null,
                            null
                    );

            if (cursor != null && cursor.moveToFirst()) {
                int index =
                        cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);

                if (index >= 0) {
                    return cursor.getString(index);
                }
            }

        } catch (Exception ignored) {
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return null;
    }

    private String sanitizeFileName(String name) {
        return name
                .replaceAll("[\\\\/:*?\"<>|]", "_")
                .trim();
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        String path = call.getString("path");

        if (path == null || path.trim().isEmpty()) {
            call.reject("Model path is required");
            return;
        }

        try {
            boolean loaded = nativeLoadModel(path);

            if (!loaded) {
                modelLoaded = false;
                loadedModelPath = null;
                call.reject("Failed to load local model");
                return;
            }

            modelLoaded = true;
            loadedModelPath = path;

            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("loaded", true);
            result.put("path", loadedModelPath);
            result.put("engine", "llama.cpp");

            call.resolve(result);

        } catch (Exception e) {
            modelLoaded = false;
            loadedModelPath = null;
            call.reject("Model load failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        try {
            nativeUnloadModel();
        } catch (Exception ignored) {
        }

        modelLoaded = false;
        loadedModelPath = null;

        JSObject result = new JSObject();
        result.put("ok", true);
        result.put("loaded", false);
        result.put("engine", "llama.cpp");

        call.resolve(result);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        if (!modelLoaded || !nativeIsLoaded()) {
            call.reject("No local model is loaded");
            return;
        }

        String prompt = call.getString("prompt");

        if (prompt == null || prompt.trim().isEmpty()) {
            call.reject("Prompt is required");
            return;
        }

        try {
            String response = nativeGenerate(prompt);

            JSObject result = new JSObject();
            result.put("value", response != null ? response : "");
            result.put("modelLoaded", true);
            result.put("modelPath", loadedModelPath);
            result.put("engine", "llama.cpp");

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Local generation failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void chat(PluginCall call) {
        if (!modelLoaded || !nativeIsLoaded()) {
            call.reject("No local model is loaded");
            return;
        }

        String message = call.getString("message");

        if (message == null || message.trim().isEmpty()) {
            call.reject("Message is required");
            return;
        }

        try {
            String response = nativeGenerate(message);

            JSObject result = new JSObject();
            result.put("value", response != null ? response : "");
            result.put("modelLoaded", true);
            result.put("modelPath", loadedModelPath);
            result.put("engine", "llama.cpp");

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Local chat failed: " + e.getMessage());
        }
    }
}
