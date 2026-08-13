package com.linguaai.assistant.ai;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LocalAI")
public class LocalAIPlugin extends Plugin {

    private boolean modelLoaded = false;
    private String modelPath = null;

    @com.getcapacitor.PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("value", true);
        call.resolve(result);
    }

    @com.getcapacitor.PluginMethod
    public void loadModel(PluginCall call) {
        String path = call.getString("path");

        if (path == null || path.isEmpty()) {
            call.reject("Model path is required");
            return;
        }

        modelPath = path;
        modelLoaded = true;

        call.resolve();
    }

    @com.getcapacitor.PluginMethod
    public void unloadModel(PluginCall call) {
        modelLoaded = false;
        modelPath = null;
        call.resolve();
    }

    @com.getcapacitor.PluginMethod
    public void generate(PluginCall call) {
        if (!modelLoaded) {
            call.reject("No local model loaded");
            return;
        }

        String prompt = call.getString("prompt", "");

        if (prompt.isEmpty()) {
            call.reject("Prompt is empty");
            return;
        }

        JSObject result = new JSObject();

        /*
         * Native llama.cpp / MediaPipe runtime
         * will be connected in the next native-runtime step.
         */
        result.put(
            "value",
            "Local AI runtime initialized."
        );

        call.resolve(result);
    }
}
