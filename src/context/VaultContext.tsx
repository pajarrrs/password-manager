import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { VaultItem, Folder, VaultData, EncryptedVaultEnvelope, ItemType, StorageInfo } from '../types/vault';
import { encryptVault, decryptVault } from '../services/crypto';
import {
  saveEncryptedVault,
  loadEncryptedVault,
  hasExistingVault,
  getStorageInfo,
  exportVaultFile,
  eraseVaultFile,
} from '../services/storage';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  unlockWithBiometric,
} from '../services/biometrics';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface VaultContextType {
  isInitialized: boolean;
  isLocked: boolean;
  isLoading: boolean;
  error: string | null;
  items: VaultItem[];
  folders: Folder[];
  activeCategory: ItemType | 'all' | 'favorites';
  searchQuery: string;
  autoLockMinutes: number;
  storageInfo: StorageInfo | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  setActiveCategory: (cat: ItemType | 'all' | 'favorites') => void;
  setSearchQuery: (query: string) => void;
  initializeVault: (masterPassword: string) => Promise<boolean>;
  unlockVault: (masterPassword: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<boolean>;
  lockVault: () => void;
  addItem: (item: any) => Promise<void>;
  updateItem: (item: VaultItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  changeMasterPassword: (oldPass: string, newPass: string) => Promise<boolean>;
  updateAutoLockMinutes: (minutes: number) => Promise<void>;
  exportVault: () => void;
  importVault: (envelope: EncryptedVaultEnvelope, password: string) => Promise<boolean>;
  eraseVault: () => Promise<void>;
  clearError: () => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(5);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<ItemType | 'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const masterPasswordRef = useRef<string | null>(null);
  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger subtle haptic on mobile if available
  const triggerHaptic = useCallback(async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // ignore on non-supported platforms
    }
  }, []);

  // Check initial vault existence and biometrics on mount
  useEffect(() => {
    const checkInit = async () => {
      try {
        const [exists, sInfo, bioAvail, bioEnab] = await Promise.all([
          hasExistingVault(),
          getStorageInfo(),
          isBiometricAvailable(),
          isBiometricEnabled(),
        ]);
        setIsInitialized(exists);
        setStorageInfo(sInfo);
        setBiometricAvailable(bioAvail);
        setBiometricEnabledState(bioEnab);
      } catch (err: any) {
        setError('Failed to check storage: ' + (err.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    checkInit();
  }, []);

  // Lock vault and wipe memory
  const lockVault = useCallback(() => {
    masterPasswordRef.current = null;
    setItems([]);
    setFolders([]);
    setIsLocked(true);
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
      autoLockTimerRef.current = null;
    }
  }, []);

  // Reset auto-lock timer on user activity
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    if (autoLockMinutes > 0 && !isLocked) {
      autoLockTimerRef.current = setTimeout(() => {
        lockVault();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [autoLockMinutes, isLocked, lockVault]);

  useEffect(() => {
    if (isLocked) return;

    const handleActivity = () => {
      resetAutoLockTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    resetAutoLockTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current);
      }
    };
  }, [isLocked, resetAutoLockTimer]);

  // Persist current in-memory state to disk
  const persistVault = async (newItems: VaultItem[], newFolders: Folder[], newAutoLock: number) => {
    if (!masterPasswordRef.current) {
      throw new Error('Vault is locked. Cannot persist changes.');
    }

    const vaultData: VaultData = {
      version: 1,
      items: newItems,
      folders: newFolders,
      autoLockMinutes: newAutoLock,
      lastModified: new Date().toISOString(),
    };

    const envelope = await encryptVault(vaultData, masterPasswordRef.current);
    await saveEncryptedVault(envelope);
  };

  // Setup / Initialize a brand new vault
  const initializeVault = async (masterPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const initialData: VaultData = {
        version: 1,
        items: [],
        folders: [
          { id: 'personal', name: 'Personal' },
          { id: 'work', name: 'Work' },
        ],
        autoLockMinutes: 5,
        lastModified: new Date().toISOString(),
      };

      const envelope = await encryptVault(initialData, masterPassword);
      await saveEncryptedVault(envelope);

      masterPasswordRef.current = masterPassword;
      setItems(initialData.items);
      setFolders(initialData.folders);
      setAutoLockMinutes(initialData.autoLockMinutes);
      setIsInitialized(true);
      setIsLocked(false);

      await triggerHaptic();
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to initialize vault.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock existing vault
  const unlockVault = async (masterPassword: string): Promise<boolean> => {
    try {
      setError(null);

      const envelope = await loadEncryptedVault();
      if (!envelope) {
        throw new Error('No vault file found on device.');
      }

      const decrypted = await decryptVault(envelope, masterPassword);
      masterPasswordRef.current = masterPassword;
      setItems(decrypted.items || []);
      setFolders(decrypted.folders || []);
      setAutoLockMinutes(decrypted.autoLockMinutes ?? 5);
      setIsLocked(false);

      await triggerHaptic();
      return true;
    } catch (err: any) {
      setError(err.message || 'Incorrect master password or corrupted file.');
      return false;
    }
  };

  // Unlock with Fingerprint / Biometrics
  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      setError(null);
      const password = await unlockWithBiometric();
      if (!password) {
        return false;
      }

      const envelope = await loadEncryptedVault();
      if (!envelope) {
        throw new Error('No vault file found on device.');
      }

      const decrypted = await decryptVault(envelope, password);
      masterPasswordRef.current = password;
      setItems(decrypted.items || []);
      setFolders(decrypted.folders || []);
      setAutoLockMinutes(decrypted.autoLockMinutes ?? 5);
      setIsLocked(false);

      await triggerHaptic();
      return true;
    } catch (err: any) {
      setError(err.message || 'Biometric authentication failed.');
      return false;
    }
  };

  // Enable/disable biometric unlock
  const toggleBiometric = async (enabled: boolean): Promise<boolean> => {
    if (!masterPasswordRef.current && enabled) {
      setError('Vault must be unlocked to configure biometrics.');
      return false;
    }

    const ok = await setBiometricEnabled(enabled, masterPasswordRef.current || undefined);
    if (ok) {
      setBiometricEnabledState(enabled);
    }
    return ok;
  };

  // Add Item
  const addItem = async (itemData: any) => {
    const newItem: VaultItem = {
      ...itemData,
      id: crypto.randomUUID ? crypto.randomUUID() : 'item_' + Date.now() + Math.random().toString(36).substring(2, 7),
      isFavorite: !!itemData.isFavorite,
      tags: itemData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...items];
    setItems(updated);
    await persistVault(updated, folders, autoLockMinutes);
    await triggerHaptic();
  };

  // Update Item
  const updateItem = async (item: VaultItem) => {
    const updated = items.map((i) =>
      i.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : i
    );
    setItems(updated);
    await persistVault(updated, folders, autoLockMinutes);
    await triggerHaptic();
  };

  // Delete Item
  const deleteItem = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    await persistVault(updated, folders, autoLockMinutes);
    await triggerHaptic();
  };

  // Toggle Favorite
  const toggleFavorite = async (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, isFavorite: !i.isFavorite } : i
    );
    setItems(updated);
    await persistVault(updated, folders, autoLockMinutes);
    await triggerHaptic();
  };

  // Change Master Password
  const changeMasterPassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (masterPasswordRef.current !== oldPass) {
      setError('Current master password does not match.');
      return false;
    }

    try {
      masterPasswordRef.current = newPass;
      await persistVault(items, folders, autoLockMinutes);
      if (biometricEnabled) {
        await setBiometricEnabled(true, newPass);
      }
      return true;
    } catch (err: any) {
      masterPasswordRef.current = oldPass;
      setError(err.message || 'Failed to update master password.');
      return false;
    }
  };

  // Update auto-lock duration
  const updateAutoLockMinutes = async (minutes: number) => {
    setAutoLockMinutes(minutes);
    await persistVault(items, folders, minutes);
  };

  // Export encrypted vault
  const exportVault = async () => {
    if (!masterPasswordRef.current) return;
    const envelope = await loadEncryptedVault();
    if (envelope) {
      exportVaultFile(envelope);
    }
  };

  // Import vault from external file
  const importVault = async (envelope: EncryptedVaultEnvelope, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const decrypted = await decryptVault(envelope, password);
      await saveEncryptedVault(envelope);

      masterPasswordRef.current = password;
      setItems(decrypted.items || []);
      setFolders(decrypted.folders || []);
      setAutoLockMinutes(decrypted.autoLockMinutes ?? 5);
      setIsInitialized(true);
      setIsLocked(false);
      return true;
    } catch (err: any) {
      setError('Failed to import vault: ' + (err.message || 'Invalid file or password'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Erase all vault data
  const eraseVault = async () => {
    await eraseVaultFile();
    await setBiometricEnabled(false);
    setBiometricEnabledState(false);
    lockVault();
    setIsInitialized(false);
  };

  const clearError = () => setError(null);

  return (
    <VaultContext.Provider
      value={{
        isInitialized,
        isLocked,
        isLoading,
        error,
        items,
        folders,
        activeCategory,
        searchQuery,
        autoLockMinutes,
        storageInfo,
        biometricAvailable,
        biometricEnabled,
        setActiveCategory,
        setSearchQuery,
        initializeVault,
        unlockVault,
        unlockWithBiometrics,
        toggleBiometric,
        lockVault,
        addItem,
        updateItem,
        deleteItem,
        toggleFavorite,
        changeMasterPassword,
        updateAutoLockMinutes,
        exportVault,
        importVault,
        eraseVault,
        clearError,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
