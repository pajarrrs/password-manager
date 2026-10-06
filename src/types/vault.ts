export type ItemType = 'login' | 'note' | 'card' | 'identity';

export interface BaseVaultItem {
  id: string;
  type: ItemType;
  title: string;
  folderId?: string;
  isFavorite: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginItem extends BaseVaultItem {
  type: 'login';
  username?: string;
  email?: string;
  password?: string;
  urls: string[];
  totpSecret?: string;
}

export interface NoteItem extends BaseVaultItem {
  type: 'note';
  content: string;
}

export interface CardItem extends BaseVaultItem {
  type: 'card';
  cardholderName?: string;
  cardNumber?: string;
  brand?: string;
  expMonth?: string;
  expYear?: string;
  cvv?: string;
  pin?: string;
}

export interface IdentityItem extends BaseVaultItem {
  type: 'identity';
  fullName?: string;
  idType?: string; // KTP, SIM, Passport, etc.
  idNumber?: string;
  birthDate?: string;
  address?: string;
  phoneNumber?: string;
}

export type VaultItem = LoginItem | NoteItem | CardItem | IdentityItem;

export interface Folder {
  id: string;
  name: string;
  icon?: string;
}

export interface VaultData {
  version: number;
  items: VaultItem[];
  folders: Folder[];
  lastModified: string;
  autoLockMinutes: number;
}

export interface EncryptedVaultEnvelope {
  format: 'keyvault-v1';
  kdf: 'PBKDF2';
  salt: string; // Base64
  iterations: number;
  cipher: 'AES-256-GCM';
  iv: string; // Base64
  data: string; // Base64 (ciphertext + auth tag)
  checksum: string; // SHA-256 of plaintext
  updatedAt: string;
}

export interface StorageInfo {
  isNative: boolean;
  platform: string;
  directoryName: string;
  filePath: string;
  fullResolvedPath: string;
}
