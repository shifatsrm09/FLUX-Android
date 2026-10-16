package com.shifat.flux;

import android.content.Intent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FluxVlcPlayer")
public class FluxVlcPlayerPlugin extends Plugin {

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url", "");
        String title = call.getString("title", "FLUX");
        String quality = call.getString("quality", "HD");
        
        long positionMs = 0;
        if (call.hasOption("positionMs")) {
            Double d = call.getDouble("positionMs");
            if (d != null) {
                positionMs = d.longValue();
            }
        }
        
        String sourcesJson = call.getString("sourcesJson", "");

        Intent intent = new Intent(getContext(), VlcPlayerActivity.class);
        intent.putExtra(VlcPlayerActivity.EXTRA_URL, url);
        intent.putExtra(VlcPlayerActivity.EXTRA_TITLE, title);
        intent.putExtra(VlcPlayerActivity.EXTRA_QUALITY, quality);
        intent.putExtra(VlcPlayerActivity.EXTRA_POSITION_MS, positionMs);
        intent.putExtra(VlcPlayerActivity.EXTRA_SOURCES_JSON, sourcesJson);

        startActivityForResult(call, intent, "playerResult");
    }

    @ActivityCallback
    private void playerResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        if (result != null && result.getData() != null) {
            Intent data = result.getData();
            ret.put("positionMs", data.getLongExtra(VlcPlayerActivity.RESULT_POSITION_MS, 0));
            ret.put("durationMs", data.getLongExtra(VlcPlayerActivity.RESULT_DURATION_MS, 0));
            ret.put("completed", data.getBooleanExtra(VlcPlayerActivity.RESULT_COMPLETED, false));
        } else {
            ret.put("positionMs", 0);
            ret.put("durationMs", 0);
            ret.put("completed", false);
        }
        call.resolve(ret);
    }
}
