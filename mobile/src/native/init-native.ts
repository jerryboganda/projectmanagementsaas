import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapacitorApp } from '@capacitor/app';
import { Network } from '@capacitor/network';

/**
 * Run once at app boot to configure the native shell.
 * Each call is best-effort and silently no-ops when a plugin isn't
 * available (e.g., running the Vite preview in a desktop browser).
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await safe(() => StatusBar.setStyle({ style: Style.Dark }));
  await safe(() => StatusBar.setBackgroundColor({ color: '#0a0a0a' }));
  await safe(() => StatusBar.setOverlaysWebView({ overlay: true }));

  await safe(() => SplashScreen.hide({ fadeOutDuration: 250 }));

  await safe(() =>
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${info.keyboardHeight}px`,
      );
    }),
  );
  await safe(() =>
    Keyboard.addListener('keyboardWillHide', () => {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    }),
  );

  await safe(() =>
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else void CapacitorApp.minimizeApp();
    }),
  );

  await safe(async () => {
    const status = await Network.getStatus();
    document.documentElement.dataset.network = status.connected ? 'online' : 'offline';
    await Network.addListener('networkStatusChange', (s) => {
      document.documentElement.dataset.network = s.connected ? 'online' : 'offline';
      if (s.connected) window.dispatchEvent(new CustomEvent('lp:online'));
      else window.dispatchEvent(new CustomEvent('lp:offline'));
    });
  });
}

async function safe<T>(fn: () => T | Promise<T>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[native-shell]', err);
  }
}
