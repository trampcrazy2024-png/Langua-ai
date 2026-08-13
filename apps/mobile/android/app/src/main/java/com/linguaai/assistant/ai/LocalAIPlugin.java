package com.linguaai.assistant.ai;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LocalAI")
public class LocalAIPlugin extends Plugin {

    private boolean modelLoaded = false;
    private String modelPath = null;

    @Override
    public void load() {
        super.load();
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        call.resolve(result);
    }

    @PluginMethod
    public void loadModel(PluginCall call) {
        String path = call.getString("path");

        if (path == null || path.trim().isEmpty()) {
            call.reject("Model path is required");
            return;
        }

        modelPath = path;
        modelLoaded = true;

        JSObject result = new JSObject();
        result.put("loaded", true);
        result.put("path", path);

        call.resolve(result);
    }

    @PluginMethod
    public void unloadModel(PluginCall call) {
        modelLoaded = false;
        modelPath = null;

        JSObject result = new JSObject();
        result.put("loaded", false);

        call.resolve(result);
    }

    @PluginMethod
    public void generate(PluginCall call) {
        if (!modelLoaded) {
            call.reject("No local model loaded");
            return;
        }

        String prompt = call.getString("prompt", "");

        if (prompt.trim().isEmpty()) {
            call.reject("Prompt is empty");
            return;
        }

        String systemPrompt =
                call.getString("systemPrompt", "");

        JSObject options =
                call.getObject("options", new JSObject());

        JSObject result = new JSObject();

        result.put(
                "value",
                "Local AI runtime bridge is ready."
        );

        result.put(
                "modelLoaded",
                true
        );

        result.put(
                "modelPath",
                modelPath
        );

        result.put(
                "systemPromptReceived",
                !systemPrompt.isEmpty()
        );

        result.put(
                "optionsReceived",
                options != null
        );

        call.resolve(result);
    }

    @PluginMethod
    public void healthCheck(PluginCall call) {
        JSObject result = new JSObject();

        result.put("available", true);
        result.put("modelLoaded", modelLoaded);
        result.put("modelPath", modelPath);

        call.resolve(result);
    }
}
