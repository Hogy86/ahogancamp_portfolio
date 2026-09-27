package io.github.hogy86.shieldvsrobots;

// Implements docs/mobile/architecture/mobile-architecture.md §1/§6.1/§6.6/§8.5
// (M-ADR-0004): the first-party GameShell plugin. Live edge insets (cutout +
// system gestures), immersive mode, keep-screen-on, and window-focus events - no
// permissions, no I/O, about a dozen lines against stable AndroidX APIs per
// function, chosen over three community plugins to keep third-party native code
// at zero (§2.1).

import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.view.OnApplyWindowInsetsListener;
import androidx.core.view.ViewCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GameShell")
public class GameShellPlugin extends Plugin {

    // M5 (round 2): written from the insets listener, which the platform calls on
    // the UI thread; read from getEdgeInsets(), which runs on the plugin's own
    // (non-UI) thread by default. `volatile` makes each thread see the other's
    // latest write instead of a possibly-stale cached value.
    private volatile JSObject lastInsets = insetsToJson(0, 0, 0, 0);
    private volatile boolean hasDispatchedInsets = false;

    @Override
    public void load() {
        // §6.6/code-review-round1.md M2: a ZERO-SIZE child view added to the content
        // root, not the decor view itself - `ViewCompat.setOnApplyWindowInsetsListener`
        // REPLACES whatever listener is already on its target, so putting it on
        // `decorView` (Capacitor/AppCompat's own listener lives there) would silently
        // drop that listener. This child never has a listener of its own to replace,
        // and window insets are dispatched to every view in the tree, so it still
        // receives them.
        ViewGroup contentRoot = getActivity().findViewById(android.R.id.content);
        View insetsProbe = new View(getActivity());
        insetsProbe.setLayoutParams(new ViewGroup.LayoutParams(0, 0));
        contentRoot.addView(insetsProbe);

        // §6.6: immersive mode with a transient swipe-reveal, applied on load and on
        // every window-focus gain (re-hides after a swipe-revealed system bar).
        applyImmersiveMode();

        ViewCompat.setOnApplyWindowInsetsListener(insetsProbe, new OnApplyWindowInsetsListener() {
            @Override
            public WindowInsetsCompat onApplyWindowInsets(View view, WindowInsetsCompat insets) {
                lastInsets = toEdgeInsets(insets);
                hasDispatchedInsets = true;
                notifyListeners("edgeInsetsChanged", lastInsets);
                return insets; // never consumed (§6.6)
            }
        });
    }

    private JSObject toEdgeInsets(WindowInsetsCompat insets) {
        Insets cutout = insets.getInsets(WindowInsetsCompat.Type.displayCutout());
        Insets gestures = insets.getInsets(WindowInsetsCompat.Type.systemGestures());
        float density = getActivity().getResources().getDisplayMetrics().density;

        return insetsToJson(
            Math.max(cutout.left, gestures.left) / density,
            Math.max(cutout.right, gestures.right) / density,
            Math.max(cutout.top, gestures.top) / density,
            Math.max(cutout.bottom, gestures.bottom) / density
        );
    }

    /**
     * Called directly by MainActivity.onWindowFocusChanged (the Capacitor Plugin base
     * class has no such lifecycle hook - see docs/mobile/architecture/mobile-
     * architecture.md §7.3/§8.5: "Override onWindowFocusChanged to forward to GameShell").
     */
    public void onWindowFocusChanged(boolean hasFocus) {
        if (hasFocus) applyImmersiveMode();
        JSObject payload = new JSObject();
        payload.put("hasFocus", hasFocus);
        notifyListeners("windowFocusChanged", payload);
    }

    private void applyImmersiveMode() {
        View decorView = getActivity().getWindow().getDecorView();
        WindowCompat.setDecorFitsSystemWindows(getActivity().getWindow(), false);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getActivity().getWindow(), decorView);
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        controller.hide(WindowInsetsCompat.Type.systemBars());
    }

    @PluginMethod
    public void getEdgeInsets(PluginCall call) {
        // M2: `lastInsets` is only populated once a real dispatch has reached the
        // probe view (load() attaches it, but the FIRST dispatch can lose a race with
        // this call on cold start). Falling back to the decor view's current
        // `getRootWindowInsets()` snapshot means an early caller gets today's real
        // insets instead of the all-zero placeholder.
        if (hasDispatchedInsets) {
            call.resolve(lastInsets);
            return;
        }
        // M5 (round 2): this plugin method runs on the plugin's own (non-UI) thread
        // by default - `getRootWindowInsets` must be read on the UI thread, so the
        // fallback (and the `call.resolve` that uses its result) is dispatched there
        // rather than read from whichever thread happened to call this method.
        getActivity().runOnUiThread(() -> {
            View decorView = getActivity().getWindow().getDecorView();
            WindowInsetsCompat current = ViewCompat.getRootWindowInsets(decorView);
            if (current != null) lastInsets = toEdgeInsets(current);
            call.resolve(lastInsets);
        });
    }

    @PluginMethod
    public void setKeepAwake(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        getActivity().runOnUiThread(() -> {
            if (enabled) {
                getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
        call.resolve();
    }

    private static JSObject insetsToJson(double left, double right, double top, double bottom) {
        JSObject insets = new JSObject();
        insets.put("left", left);
        insets.put("right", right);
        insets.put("top", top);
        insets.put("bottom", bottom);
        return insets;
    }
}
