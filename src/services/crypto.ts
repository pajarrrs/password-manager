import { EncryptedVaultEnvelope, VaultData } from '../types/vault';

// Helper: Uint8Array to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Compute SHA-256 hash of a string
async function computeHash(message: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64(hashBuffer);
}

// Derive AES-256-GCM key from master password and salt using PBKDF2
async function deriveKey(masterPassword: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt Vault Data using Master Password
 */
export async function encryptVault(data: VaultData, masterPassword: string): Promise<EncryptedVaultEnvelope> {
  const jsonString = JSON.stringify(data);
  const enc = new TextEncoder();
  const plainBytes = enc.encode(jsonString);

  // 16-byte random salt for PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  // 12-byte random IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const iterations = 100000;
  const key = await deriveKey(masterPassword, salt, iterations);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    plainBytes as unknown as BufferSource
  );

  const checksum = await computeHash(jsonString);

  return {
    format: 'keyvault-v1',
    kdf: 'PBKDF2',
    salt: bufferToBase64(salt),
    iterations,
    cipher: 'AES-256-GCM',
    iv: bufferToBase64(iv),
    data: bufferToBase64(cipherBuffer),
    checksum,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt Vault Data using Master Password
 */
export async function decryptVault(envelope: EncryptedVaultEnvelope, masterPassword: string): Promise<VaultData> {
  const salt = base64ToBuffer(envelope.salt);
  const iv = base64ToBuffer(envelope.iv);
  const cipherBytes = base64ToBuffer(envelope.data);

  const key = await deriveKey(masterPassword, salt, envelope.iterations);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      cipherBytes as unknown as BufferSource
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);

    // Verify Checksum
    const checksum = await computeHash(jsonString);
    if (checksum !== envelope.checksum) {
      throw new Error('Vault integrity check failed! The data may be corrupt or tampered with.');
    }

    return JSON.parse(jsonString) as VaultData;
  } catch (err) {
    throw new Error('Invalid master password or corrupted vault file.');
  }
}

/**
 * Base32 Decode for TOTP (Google Authenticator format)
 */
function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanStr = base32.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const idx = alphabet.indexOf(cleanStr[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate 6-digit TOTP (RFC 6238) using Web Crypto HMAC-SHA1
 */
export async function generateTOTP(secret: string): Promise<{ code: string; remainingSeconds: number }> {
  try {
    const epoch = Math.floor(Date.now() / 1000);
    const step = 30;
    const counter = Math.floor(epoch / step);
    const remainingSeconds = step - (epoch % step);

    const keyBytes = base32Decode(secret);
    if (keyBytes.length === 0) {
      return { code: '------', remainingSeconds: 0 };
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    // 8-byte big-endian counter
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setUint32(0, 0, false);
    view.setUint32(4, counter, false);

    const hmac = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
    const hmacBytes = new Uint8Array(hmac);

    // Dynamic truncation
    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    const code = otp.toString().padStart(6, '0');

    return { code, remainingSeconds };
  } catch (e) {
    return { code: 'ERR', remainingSeconds: 0 };
  }
}
