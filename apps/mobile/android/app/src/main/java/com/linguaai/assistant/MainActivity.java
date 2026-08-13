package com.linguaai.assistant;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.linguaai.assistant.ai.LocalAIPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugin(LocalAIPlugin.class);
    }
}
