package com.shifat.flux;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FluxVlcPlayerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
