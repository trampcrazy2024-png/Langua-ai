package com.lingua.assistant;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.lingua.assistant.plugins.LocalAIPlugin;
import com.lingua.assistant.plugins.NativeTTSPlugin;

/*
 * Bug fix (Android device testing, issue #4): the mic/record button
 * "activated" visually but never actually did anything. AndroidManifest.xml
 * already declares android.permission.RECORD_AUDIO, but that's an
 * install-time declaration only - it does NOT grant the OS-level runtime
 * permission (required on API 23+), and even once granted at the OS level,
 * a WebView's own getUserMedia() calls (used throughout ChatTab, ScenarioTab,
 * TranslatorTab, PodcastTab, MatrixTab for voice input/pronunciation
 * practice) additionally require the *host Activity* to explicitly override
 * WebChromeClient.onPermissionRequest() and grant the resource - this is a
 * well-known, mandatory extra step for any Capacitor/Cordova WebView app;
 * it is never automatic. With neither step present, getUserMedia() either
 * silently rejected or never resolved at all - which is exactly the
 * "button lights up, nothing happens" symptom reported.
 */
public class MainActivity extends BridgeActivity {

    private static final int RC_RECORD_AUDIO = 6001;
    private PermissionRequest pendingWebViewPermissionRequest;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalAIPlugin.class);
        registerPlugin(NativeTTSPlugin.class);
        super.onCreate(savedInstanceState);

        getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClientWithMic(getBridge()));
    }

    /**
     * Capacitor's own file-chooser/camera-intent behavior for
     * <input type="file"> lives in its default WebChromeClient
     * (com.getcapacitor.BridgeWebChromeClient). We extend it rather than
     * replacing it outright, so this fix is additive - only
     * onPermissionRequest is new behavior, everything else Capacitor
     * already handles keeps working exactly as before.
     */
    private class BridgeWebChromeClientWithMic extends com.getcapacitor.BridgeWebChromeClient {
        BridgeWebChromeClientWithMic(Bridge bridge) {
            super(bridge);
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            boolean wantsAudio = false;
            for (String resource : request.getResources()) {
                if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                    wantsAudio = true;
                    break;
                }
            }

            if (!wantsAudio) {
                // Not a mic request (e.g. camera) - fall back to default handling.
                super.onPermissionRequest(request);
                return;
            }

            if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                    == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.getResources());
                return;
            }

            // OS-level runtime permission not granted yet - ask for it, then
            // grant/deny the WebView request once the user answers (see
            // onRequestPermissionsResult below). Only one mic prompt is
            // tracked at a time, matching the app's own single-recognition-
            // session-at-a-time usage pattern (see ChatTab's activeRecognitionRef).
            pendingWebViewPermissionRequest = request;
            ActivityCompat.requestPermissions(
                    MainActivity.this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    RC_RECORD_AUDIO
            );
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode != RC_RECORD_AUDIO || pendingWebViewPermissionRequest == null) {
            return;
        }

        boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
        if (granted) {
            pendingWebViewPermissionRequest.grant(pendingWebViewPermissionRequest.getResources());
        } else {
            pendingWebViewPermissionRequest.deny();
        }
        pendingWebViewPermissionRequest = null;
    }
}
