package com.lingua.assistant.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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
        call.resolve(result);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        result.put("engine", "llama.cpp");
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
