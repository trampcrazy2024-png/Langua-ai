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
    private volatile boolean ready = false;

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

        if (text == null || text.trim().isEmpty()) {
            call.reject("TTS text is empty");
            return;
        }

        if (!ready || tts == null) {
            call.reject("Android TTS is not ready");
            return;
        }

        double rateValue = call.getDouble("rate", 1.0);
        double pitchValue = call.getDouble("pitch", 1.0);

        float rate = (float) Math.max(
                0.1,
                Math.min(3.0, rateValue)
        );

        float pitch = (float) Math.max(
                0.1,
                Math.min(2.0, pitchValue)
        );

        try {
            Locale locale = Locale.forLanguageTag(
                    lang.replace('_', '-')
            );

            int languageResult = tts.setLanguage(locale);

            if (languageResult == TextToSpeech.LANG_MISSING_DATA
                    || languageResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                call.reject(
                        "TTS language is not supported: " + lang
                );
                return;
            }

            tts.setSpeechRate(rate);
            tts.setPitch(pitch);

            String utteranceId = UUID.randomUUID().toString();

            tts.setOnUtteranceProgressListener(
                    new UtteranceProgressListener() {

                        @Override
                        public void onStart(String id) {
                        }

                        @Override
                        public void onDone(String id) {
                            if (!utteranceId.equals(id)) {
                                return;
                            }

                            JSObject result = new JSObject();
                            result.put("ok", true);
                            call.resolve(result);
                        }

                        @Override
                        public void onError(String id) {
                            if (!utteranceId.equals(id)) {
                                return;
                            }

                            call.reject("Android TTS failed");
                        }
                    }
            );

            int result = tts.speak(
                    text,
                    TextToSpeech.QUEUE_FLUSH,
                    null,
                    utteranceId
            );

            if (result == TextToSpeech.ERROR) {
                call.reject("Android TTS failed to start");
            }

        } catch (Exception e) {
            call.reject(
                    "Android TTS failed: " + e.getMessage()
            );
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (tts != null) {
            tts.stop();
        }

        JSObject result = new JSObject();
        result.put("ok", true);
        call.resolve(result);
    }

    @Override
    public void handleOnDestroy() {
        ready = false;

        if (tts != null) {
            try {
                tts.stop();
            } catch (Exception ignored) {
            }

            try {
                tts.shutdown();
            } catch (Exception ignored) {
            }

            tts = null;
        }

        super.handleOnDestroy();
    }
}
