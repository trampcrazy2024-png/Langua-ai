package com.lligua.assistant.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "LocalAI")
public class LocalAIPlugin extends Plugin {

    private boolean modelLoaded = false;
    private String loadedModelPath = null;

    static {
        System.loadLibrary("localai_jni");
    }

    private native boolean nativeLoadModel(String modelPath);
    private native void nativeUnloadModel();
    private native boolean nativeIsLoaded();
    private native String nativeGenerate(String prompt);

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        result.put("engine", "llama.cpp");
        result.put("runtime", "JNI");
        result.put("loaded", nativeIsLoaded());
        call.resolve(result);
    }

    @PluginMethod
    public void healthCheck(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("modelLoaded", nativeIsLoaded());
        result.put("modelPath", loadedModelPath);
        result.put("engine", "llama.cpp");
        call.resolve(result);
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
                call.reject("Failed to load local GGUF model");
                return;
            }

            loadedModelPath = path;
            modelLoaded = true;

            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("loaded", true);
            result.put("modelPath", path);
            result.put("engine", "llama.cpp");

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Native model loading failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        try {
            nativeUnloadModel();

            modelLoaded = false;
            loadedModelPath = null;

            JSObject result = new JSObject();
            result.put("ok", true);
            result.put("loaded", false);

            call.resolve(result);

        } catch (Exception e) {
            call.reject("Native model unload failed: " + e.getMessage());
        }
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
