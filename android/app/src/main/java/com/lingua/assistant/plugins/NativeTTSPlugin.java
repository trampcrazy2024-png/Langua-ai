package com.lingua.assistant.plugins;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Locale;
import java.util.UUID;

@CapacitorPlugin(name = "NativeTTS")
public class NativeTTSPlugin extends Plugin {
    private TextToSpeech tts;
    private boolean ready = false;

    @Override
    public void load() {
        super.load();
        tts = new TextToSpeech(getContext(), status -> {
            ready = status == TextToSpeech.SUCCESS;
        });
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = call.getString("lang", "en-US");
        double rate = call.getDouble("rate", 1.0);
        double pitch = call.getDouble("pitch", 1.0);

        if (text == null || text.trim().isEmpty()) {
            call.reject("TTS text is empty");
            return;
        }
        if (!ready || tts == null) {
            call.reject("Android TTS is not ready");
            return;
        }

        Locale locale = Locale.forLanguageTag(lang.replace('_', '-'));
        int languageResult = tts.setLanguage(locale);
        if (languageResult == TextToSpeech.LANG_MISSING_DATA || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
            call.reject("TTS language is not supported: " + lang);
            return;
        }

        tts.setSpeechRate((float)Math.max(0.1, Math.min(3.0, rate)));
        tts.setPitch((float)Math.max(0.1, Math.min(2.0, pitch)));

        String utteranceId = UUID.randomUUID().toString();
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) {
                if (utteranceId.equals(id)) {
                    JSObject result = new JSObject();
                    result.put("ok", true);
                    call.resolve(result);
                }
            }
            @Override public void onError(String id) {
                if (utteranceId.equals(id)) call.reject("Android TTS failed");
            }
        });

        int result = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId);
        if (result == TextToSpeech.ERROR) call.reject("Android TTS failed to start");
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) tts.stop();
        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @Override
    protected void handleOnDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        super.handleOnDestroy();
    }
}
