import { NativeBiometric } from 'capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const BIOMETRIC_SERVER_ID = 'com.password.manager.vault';
const BIOMETRIC_USERNAME = 'master_vault_user';
const PREF_BIOMETRIC_ENABLED = 'keyvault_biometric_enabled';

/**
 * Check if the device hardware supports biometrics (fingerprint / face)
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const result = await NativeBiometric.isAvailable();
    return !!result.isAvailable;
  } catch {
    return false;
  }
}

/**
 * Check if the user has enabled biometric unlock in the app
 */
export async function isBiometricEnabled(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }
  try {
    const { value } = await Preferences.get({ key: PREF_BIOMETRIC_ENABLED });
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Enable or disable biometric unlock
 */
export async function setBiometricEnabled(
  enabled: boolean,
  masterPassword?: string
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    if (enabled && masterPassword) {
      // First verify hardware availability
      const available = await isBiometricAvailable();
      if (!available) {
        throw new Error('Biometric hardware is not available on this device.');
      }

      // Store in Android Keystore / iOS Keychain
      await NativeBiometric.setCredentials({
        server: BIOMETRIC_SERVER_ID,
        username: BIOMETRIC_USERNAME,
        password: masterPassword,
      });

      await Preferences.set({ key: PREF_BIOMETRIC_ENABLED, value: 'true' });
      return true;
    } else {
      // Delete from Keystore
      try {
        await NativeBiometric.deleteCredentials({
          server: BIOMETRIC_SERVER_ID,
        });
      } catch {
        // ignore if not found
      }

      await Preferences.set({ key: PREF_BIOMETRIC_ENABLED, value: 'false' });
      return true;
    }
  } catch (err: any) {
    console.error('Failed to configure biometrics:', err);
    return false;
  }
}

/**
 * Attempt to unlock using Fingerprint / Biometrics.
 * Returns the decrypted master password from Android Keystore if verified.
 */
export async function unlockWithBiometric(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const enabled = await isBiometricEnabled();
    if (!enabled) return null;

    // Verify identity first with custom dialog title
    await NativeBiometric.verifyIdentity({
      reason: 'Scan fingerprint to unlock KeyVault',
      title: 'Unlock KeyVault',
      subtitle: 'Biometric Authentication',
      description: 'Touch the fingerprint sensor to unlock your passwords',
      negativeButtonText: 'Use Master Password',
    });

    // Retrieve master password from hardware Keystore
    const credentials = await NativeBiometric.getCredentials({
      server: BIOMETRIC_SERVER_ID,
    });

    if (credentials && credentials.password) {
      return credentials.password;
    }

    return null;
  } catch (err: any) {
    // User cancelled or authentication failed
    return null;
  }
}
