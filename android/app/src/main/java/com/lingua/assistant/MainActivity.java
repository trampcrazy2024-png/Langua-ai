package com.lingua.assistant;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.lingua.assistant.plugins.LocalAIPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalAIPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
