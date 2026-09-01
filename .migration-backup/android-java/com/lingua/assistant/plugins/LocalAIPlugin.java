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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "LocalAI")
public class LocalAIPlugin extends Plugin {

    static {
        System.loadLibrary("localai_jni");
    }

    private boolean modelLoaded = false;
    private String loadedModelPath = null;

    /*
     * Review fix #3: status codes returned by nativeGenerateStream().
     * Must stay numerically in sync with STATUS_* in localai_jni.cpp.
     */
    private static final int STATUS_DONE = 0;
    private static final int STATUS_ERROR = 1;
    private static final int STATUS_CANCELLED = 2;

    /*
     * Phase 8-C: generation must never run on Capacitor's calling
     * thread, since llama_decode() is a long, synchronous, CPU-bound
     * call. A dedicated single-thread executor keeps model calls
     * serialized (only one generation/load at a time, which matches
     * the single global g_model/g_ctx in the native layer) while
     * keeping the UI thread completely free.
     */
    private final ExecutorService aiExecutor =
            Executors.newSingleThreadExecutor();

    /*
     * Accumulates the streamed reply for the current in-flight
     * streamChat() call. Only one stream runs at a time (serialized
     * by aiExecutor), so a single buffer is safe.
     */
    private final StringBuilder streamBuffer = new StringBuilder();

    /*
     * Review fix #5: batch native token callbacks into a JS event
     * every ~40ms instead of firing a Capacitor event per token.
     * On a fast decode this can otherwise mean dozens of bridge
     * messages per second, which is wasteful on low-end devices.
     */
    private final StringBuilder pendingChunk = new StringBuilder();
    private long lastFlushNanos = 0;
    private static final long FLUSH_INTERVAL_NANOS = 40_000_000L;

    private native boolean nativeLoadModel(String modelPath);
    private native void nativeUnloadModel();
    private native boolean nativeIsLoaded();
    private native String nativeGenerate(String prompt);
    private native int nativeGenerateStream(String prompt);
    private native void nativeCancelGeneration();

    /*
     * Called directly from native code (JNIEnv::CallVoidMethod),
     * on the aiExecutor background thread - never on the UI thread.
     * notifyListeners() is safe to call off the main thread; the
     * Capacitor bridge marshals the event to the webview itself.
     */
    public void onNativeToken(String piece) {
        if (piece == null || piece.isEmpty()) {
            return;
        }

        streamBuffer.append(piece);
        pendingChunk.append(piece);

        long now = System.nanoTime();

        if (now - lastFlushNanos >= FLUSH_INTERVAL_NANOS) {
            flushPendingChunk();
            lastFlushNanos = now;
        }
    }

    private void flushPendingChunk() {
        if (pendingChunk.length() == 0) {
            return;
        }

        JSObject data = new JSObject();
        data.put("token", pendingChunk.toString());

        notifyListeners("generationToken", data);

        pendingChunk.setLength(0);
    }

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

        startActivityForResult(call, intent, "modelPickerResult");
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

        /*
         * Model loading reads a multi-hundred-MB file and builds
         * the whole KV cache - also belongs on aiExecutor, not the
         * calling thread.
         */
        aiExecutor.execute(() -> {
            try {
                File requested = new File(path);

                if (!requested.isAbsolute()) {
                    requested = new File(
                            new File(getContext().getFilesDir(), "models"),
                            path.replaceFirst("^models[\\\\/]", "")
                    );
                }

                File modelFile = requested.getCanonicalFile();

                if (!modelFile.exists()) {
                    modelLoaded = false;
                    loadedModelPath = null;
                    call.reject("Model file not found: " + modelFile.getAbsolutePath());
                    return;
                }

                if (!modelFile.isFile() || !modelFile.canRead()) {
                    modelLoaded = false;
                    loadedModelPath = null;
                    call.reject("Model file is not readable: " + modelFile.getAbsolutePath());
                    return;
                }

                boolean loaded = nativeLoadModel(modelFile.getAbsolutePath());

                if (!loaded) {
                    modelLoaded = false;
                    loadedModelPath = null;
                    call.reject("Failed to load local model");
                    return;
                }

                modelLoaded = true;
                loadedModelPath = modelFile.getAbsolutePath();

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
        });
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        aiExecutor.execute(() -> {
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
        });
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

        aiExecutor.execute(() -> {
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
        });
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

        aiExecutor.execute(() -> {
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
        });
    }

    /*
     * Phase 8-D: streaming variant of chat(). Fires a "generationToken"
     * event (batched, see onNativeToken) as pieces are produced, then
     * a "generationStatus" event + the resolved/rejected promise once
     * generation ends - covering the START/TOKEN/DONE/ERROR/CANCELLED
     * lifecycle from the review, not just a silent Promise completion.
     */
    @PluginMethod
    public void streamChat(PluginCall call) {
        if (!modelLoaded || !nativeIsLoaded()) {
            call.reject("No local model is loaded");
            return;
        }

        String message = call.getString("message");

        if (message == null || message.trim().isEmpty()) {
            call.reject("Message is required");
            return;
        }

        aiExecutor.execute(() -> {
            try {
                streamBuffer.setLength(0);
                pendingChunk.setLength(0);
                lastFlushNanos = System.nanoTime();

                notifyListeners("generationStatus", statusEvent("start"));

                int status = nativeGenerateStream(message);

                /*
                 * Flush whatever hasn't hit the 40ms threshold yet,
                 * so no trailing text is lost.
                 */
                flushPendingChunk();

                String statusName = statusName(status);

                notifyListeners("generationStatus", statusEvent(statusName));

                if (status == STATUS_ERROR) {
                    call.reject("Local generation failed during streaming");
                    return;
                }

                JSObject result = new JSObject();
                result.put("value", streamBuffer.toString());
                result.put("status", statusName);
                result.put("modelLoaded", true);
                result.put("modelPath", loadedModelPath);
                result.put("engine", "llama.cpp");

                call.resolve(result);

            } catch (Exception e) {
                call.reject("Local streaming generation failed: " + e.getMessage());
            }
        });
    }

    /*
     * Review fix #4: lets the UI stop an in-flight streamChat().
     * Cancellation is cooperative - it sets a flag that the native
     * generation loop checks once per token, so it can take up to
     * one token's worth of time to actually stop (fine in practice,
     * since a single decode step is a few ms to a few dozen ms).
     */
    @PluginMethod
    public void cancelGeneration(PluginCall call) {
        try {
            nativeCancelGeneration();

            JSObject result = new JSObject();
            result.put("ok", true);

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Cancel failed: " + e.getMessage());
        }
    }

    private String statusName(int status) {
        switch (status) {
            case STATUS_CANCELLED:
                return "cancelled";
            case STATUS_ERROR:
                return "error";
            default:
                return "done";
        }
    }

    private JSObject statusEvent(String status) {
        JSObject event = new JSObject();
        event.put("status", status);
        return event;
    }
}
