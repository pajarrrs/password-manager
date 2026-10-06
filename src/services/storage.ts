import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { EncryptedVaultEnvelope, StorageInfo } from '../types/vault';

const VAULT_FILE_NAME = 'vault.enc.json';
const WEB_LOCALSTORAGE_KEY = 'keyvault_encrypted_envelope';

/**
 * Check if running natively or on web
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get human-readable storage location info
 */
export async function getStorageInfo(): Promise<StorageInfo> {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  if (isNative) {
    try {
      const uriResult = await Filesystem.getUri({
        path: VAULT_FILE_NAME,
        directory: Directory.Data,
      });

      return {
        isNative: true,
        platform,
        directoryName: 'Directory.Data (Internal App Storage)',
        filePath: VAULT_FILE_NAME,
        fullResolvedPath: uriResult.uri || `/data/data/com.password.manager/files/${VAULT_FILE_NAME}`,
      };
    } catch {
      return {
        isNative: true,
        platform,
        directoryName: 'Directory.Data (Internal App Storage)',
        filePath: VAULT_FILE_NAME,
        fullResolvedPath: `/data/data/com.password.manager/files/${VAULT_FILE_NAME}`,
      };
    }
  }

  return {
    isNative: false,
    platform: 'web',
    directoryName: 'Browser Sandboxed Storage',
    filePath: WEB_LOCALSTORAGE_KEY,
    fullResolvedPath: 'IndexedDB / LocalStorage (Sandboxed Web Origin)',
  };
}

/**
 * Save encrypted vault to file (Android/iOS: /data/data/com.password.manager/files/, Web: localStorage)
 */
export async function saveEncryptedVault(envelope: EncryptedVaultEnvelope): Promise<void> {
  const content = JSON.stringify(envelope, null, 2);

  if (isNativeApp()) {
    await Filesystem.writeFile({
      path: VAULT_FILE_NAME,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  } else {
    localStorage.setItem(WEB_LOCALSTORAGE_KEY, content);
  }
}

/**
 * Load encrypted vault from file or storage
 */
export async function loadEncryptedVault(): Promise<EncryptedVaultEnvelope | null> {
  if (isNativeApp()) {
    try {
      const res = await Filesystem.readFile({
        path: VAULT_FILE_NAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      if (typeof res.data === 'string') {
        return JSON.parse(res.data) as EncryptedVaultEnvelope;
      }
      return null;
    } catch (err) {
      // File does not exist yet (first launch)
      return null;
    }
  } else {
    const raw = localStorage.getItem(WEB_LOCALSTORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as EncryptedVaultEnvelope;
    } catch {
      return null;
    }
  }
}

/**
 * Check if a vault already exists
 */
export async function hasExistingVault(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const stat = await Filesystem.stat({
        path: VAULT_FILE_NAME,
        directory: Directory.Data,
      });
      return !!stat;
    } catch {
      return false;
    }
  } else {
    return !!localStorage.getItem(WEB_LOCALSTORAGE_KEY);
  }
}

/**
 * Delete vault file (Factory reset / Erase all)
 */
export async function eraseVaultFile(): Promise<void> {
  if (isNativeApp()) {
    try {
      await Filesystem.deleteFile({
        path: VAULT_FILE_NAME,
        directory: Directory.Data,
      });
    } catch (e) {
      // ignore if already absent
    }
  } else {
    localStorage.removeItem(WEB_LOCALSTORAGE_KEY);
  }
}

/**
 * Export vault envelope as downloadable file (.vault)
 */
export function exportVaultFile(envelope: EncryptedVaultEnvelope) {
  const json = JSON.stringify(envelope, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `keyvault-backup-${dateStr}.vault`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
