/**
 * Haptics helper — uses @capacitor/haptics when running natively and
 * silently no-ops in browser/preview. Use sparingly and meaningfully:
 *
 *  - `light()`   — confirmation of a minor action (toggle, tab switch).
 *  - `medium()`  — successful save, reorder drop, completion.
 *  - `heavy()`   — destructive or critical confirmation.
 *  - `selection()` — picker, slider, stepper changes.
 *  - `success()` / `warning()` / `error()` — outcome banners only.
 *
 * Never chain haptics. Never fire on scroll or every keystroke.
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = () => Capacitor.isNativePlatform();

async function safe(run: () => Promise<unknown>): Promise<void> {
  if (!isNative()) return;
  try {
    await run();
  } catch {
    /* haptics are best-effort; never crash the UI */
  }
}

export const haptics = {
  light: () => safe(() => Haptics.impact({ style: ImpactStyle.Light })),
  medium: () => safe(() => Haptics.impact({ style: ImpactStyle.Medium })),
  heavy: () => safe(() => Haptics.impact({ style: ImpactStyle.Heavy })),
  selection: () => safe(() => Haptics.selectionStart()),
  selectionEnd: () => safe(() => Haptics.selectionEnd()),
  success: () => safe(() => Haptics.notification({ type: NotificationType.Success })),
  warning: () => safe(() => Haptics.notification({ type: NotificationType.Warning })),
  error: () => safe(() => Haptics.notification({ type: NotificationType.Error })),
};
