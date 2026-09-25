---
name: mobile-touch-and-layout
description: Touch-control, screen-fitting, lifecycle, and back-button conventions for the Android version of the game. Use by mobile-ui-ux-designer, mobile-solution-architect, mobile-junior-developer, and mobile-lead-developer.
---

# Mobile Touch and Layout

Inherits invoking subagent's model.

## Touch controls
- Touch targets at least 48dp; keep primary controls in the bottom
  third where thumbs rest, and away from screen edges that trigger
  system back/home gestures.
- Controls must never require precise taps during fast action; prefer
  relative drag or large zones over small buttons.
- Prevent the browser defaults the game doesn't want: page scroll,
  pinch zoom, double-tap zoom, text selection, long-press menus
  (`touch-action: none` on the game surface, non-passive handlers
  only where `preventDefault` is needed).
- Support multi-touch if the scheme needs move + fire at once.
- Keyboard input keeps working (website, Chromebooks, and
  keyboard-attached tablets) — touch is added, not swapped in.

## Screen fitting
- The game renders at a fixed logical size (800x600); scale it
  uniformly to fit the available area and letterbox the remainder.
  Never stretch non-uniformly.
- Size the canvas backing store by `devicePixelRatio` so it's sharp on
  high-density screens; cap it if performance on low-end phones
  suffers.
- Android targets edge-to-edge: HUD and controls must respect system
  bar and display-cutout insets (`env(safe-area-inset-*)` or the
  inset values from the native layer). Nothing interactive under the
  camera cutout or the gesture bar.
- Check both short (16:9) and tall (20:9+) phones, tablets, and
  foldables, including a live fold/unfold (resize while playing).

## Timing and performance
- Move and animate by elapsed time (delta), never per frame; refresh
  rates are 60, 90, or 120 Hz.
- Pre-render repeated sprites to offscreen canvases rather than
  redrawing vector paths every frame.
- Test smoothness on a low-end emulator profile, not just a flagship.

## Lifecycle
- Pause the game loop, input, and any audio when the app goes to the
  background (Capacitor `App` `pause`/`resume`, or
  `visibilitychange`). Resume into a paused state — never straight into
  live action.
- Persist high score and settings as soon as they change, not only on
  exit; the OS may kill a backgrounded app without warning.

## Back button / back gesture
- During play: pause and show the pause menu.
- On the pause menu: resume (or return to title, per the UX decision).
- On the title screen: exit the app (or confirm, per the UX decision).
- Never swallow back with no visible result.

## Findings format
`[Screen/Device] — [Rule above] — [Specific issue] — [Suggested fix]`.
