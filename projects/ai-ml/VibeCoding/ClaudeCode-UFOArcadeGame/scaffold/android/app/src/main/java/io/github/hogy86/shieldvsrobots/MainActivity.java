package io.github.hogy86.shieldvsrobots;

// Implements docs/mobile/architecture/mobile-architecture.md §7.3 (M-ADR-0007):
// registers GameShellPlugin before super.onCreate, forwards onWindowFocusChanged to
// it (§8.5), and applies the WebView hardening this document requires: a font-size
// cap honoring the system font scale up to 130% (M2.11), and disabling long-press/
// overscroll effects the game doesn't want (M3.7).

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {

    {
        registerPlugin(GameShellPlugin.class);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        webView.setLongClickable(false);
        webView.setHapticFeedbackEnabled(false);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // M2.11: honor the system font size up to a 130% cap; the shared 12dp text
        // floor (android.css) covers legibility at that cap.
        float fontScale = getResources().getConfiguration().fontScale;
        int textZoom = Math.round(Math.min(fontScale, 1.3f) * 100);
        webView.getSettings().setTextZoom(textZoom);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // M5 (round 2): getPlugin() itself can return null (the PluginHandle, not just
        // its instance) - the old code called .getInstance() on that result directly,
        // which NPEs before the "plugin != null" check below ever runs.
        PluginHandle handle = getBridge().getPlugin("GameShell");
        GameShellPlugin plugin = handle != null ? (GameShellPlugin) handle.getInstance() : null;
        if (plugin != null) plugin.onWindowFocusChanged(hasFocus);
    }
}
