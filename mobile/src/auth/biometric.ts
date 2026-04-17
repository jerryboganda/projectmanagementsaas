import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

/**
 * Biometric unlock — Face ID / Touch ID / Android BiometricPrompt.
 * Secrets (JWT refresh tokens) are stored in the platform Keychain/Keystore
 * via NativeBiometric.setCredentials, which is the secure store the plugin
 * unlocks only after a successful biometric challenge.
 */

const SERVER = 'linearprecision.app';

export type BiometricCapability =
  | { available: false; reason: 'unsupported' | 'not-enrolled' | 'unavailable' }
  | { available: true; type: BiometryType };

export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (!Capacitor.isNativePlatform()) return { available: false, reason: 'unsupported' };
  try {
    const result = await NativeBiometric.isAvailable({ useFallback: true });
    if (!result.isAvailable) return { available: false, reason: 'not-enrolled' };
    return { available: true, type: result.biometryType };
  } catch {
    return { available: false, reason: 'unavailable' };
  }
}

export async function enrollBiometric(username: string, refreshToken: string): Promise<void> {
  await NativeBiometric.setCredentials({
    username,
    password: refreshToken,
    server: SERVER,
  });
}

export async function unlockWithBiometric(): Promise<{ username: string; refreshToken: string } | null> {
  try {
    await NativeBiometric.verifyIdentity({
      reason: 'Unlock Linear Precision',
      title: 'Authenticate',
      subtitle: 'Use Face ID / Touch ID to continue',
      description: 'Protects your workspace data',
      useFallback: true,
      maxAttempts: 3,
    });
    const creds = await NativeBiometric.getCredentials({ server: SERVER });
    return { username: creds.username, refreshToken: creds.password };
  } catch {
    return null;
  }
}

export async function clearBiometric(): Promise<void> {
  try {
    await NativeBiometric.deleteCredentials({ server: SERVER });
  } catch {
    /* ignore */
  }
}

export function biometricLabel(type: BiometryType | undefined): string {
  switch (type) {
    case BiometryType.FACE_ID:
      return 'Face ID';
    case BiometryType.TOUCH_ID:
      return 'Touch ID';
    case BiometryType.FACE_AUTHENTICATION:
      return 'Face Unlock';
    case BiometryType.FINGERPRINT:
      return 'Fingerprint';
    case BiometryType.IRIS_AUTHENTICATION:
      return 'Iris Unlock';
    default:
      return 'Biometric';
  }
}
