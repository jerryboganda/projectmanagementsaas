import { Capacitor } from '@capacitor/core';
import { PushNotifications, type Token } from '@capacitor/push-notifications';

/**
 * Register the device for push notifications.
 *
 * Backend push-token registration endpoint is not yet implemented, so
 * for now we only:
 *   1. Request permission
 *   2. Register with the native push service
 *   3. Stash the FCM/APNs token on `window` and dispatch a `lp:push-token`
 *      event so any future endpoint or in-app handler can pick it up.
 *
 * This is safe to call on web and will no-op silently there.
 */
export async function initPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return;

    await PushNotifications.addListener('registration', (token: Token) => {
      (window as unknown as { __lpPushToken?: string }).__lpPushToken = token.value;
      window.dispatchEvent(new CustomEvent('lp:push-token', { detail: { token: token.value } }));
    });

    await PushNotifications.addListener('registrationError', (err) => {
      // eslint-disable-next-line no-console
      console.warn('[push] registration failed', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      window.dispatchEvent(new CustomEvent('lp:push-received', { detail: notification }));
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      window.dispatchEvent(new CustomEvent('lp:push-action', { detail: action }));
    });

    await PushNotifications.register();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push] init failed', err);
  }
}
