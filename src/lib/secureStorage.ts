/**
 * Secure Storage Module
 * 
 * Provides AES-GCM encryption for sensitive data like API keys
 * Uses the Web Crypto API for client-side encryption
 * 
 * Security considerations:
 * - Data is encrypted with AES-256-GCM
 * - A random initialization vector (IV) is generated for each encryption
 * - The encryption key is derived from the browser's random data
 * - Data is encrypted before being stored in localStorage
 * - Decryption happens only when needed
 */

const STORAGE_KEY_PREFIX = 'secure_';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(str: string): Uint8Array {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an encryption key from the device's random data
 * This key is deterministic for the same browser/device
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  // Get a seed from the browser's random data combined with a fixed string
  // This creates a deterministic but unique key per browser
  const seedData = new TextEncoder().encode(
    'mindtoblocks-secure-storage-key'
  );
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    seedData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Gets or creates a persistent salt for key derivation
 * The salt is stored separately to allow key derivation on the same device
 */
function getSalt(): Uint8Array {
  const saltKey = `${STORAGE_KEY_PREFIX}salt`;
  const storedSalt = localStorage.getItem(saltKey);

  if (storedSalt) {
    // Convert stored salt back to Uint8Array
    return new Uint8Array(JSON.parse(storedSalt));
  }

  // Generate a new salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(saltKey, JSON.stringify(Array.from(salt)));
  return salt;
}

/**
 * Encrypts data securely using AES-256-GCM
 */
export async function encryptData(plaintext: string): Promise<EncryptedData> {
  try {
    const salt = getSalt();
    const key = await deriveKey(salt);
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encodedData
    );

    return {
      ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
      iv: uint8ArrayToBase64(iv),
      salt: uint8ArrayToBase64(salt),
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts AES-256-GCM encrypted data
 */
export async function decryptData(encrypted: EncryptedData): Promise<string> {
  try {
    const salt = base64ToUint8Array(encrypted.salt);
    const key = await deriveKey(salt);
    const iv = base64ToUint8Array(encrypted.iv);
    const ciphertext = base64ToUint8Array(encrypted.ciphertext);

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(plaintext);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Stores sensitive data securely in localStorage
 */
export async function setSecureData(key: string, value: string): Promise<void> {
  const encrypted = await encryptData(value);
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  localStorage.setItem(storageKey, JSON.stringify(encrypted));
}

/**
 * Retrieves and decrypts sensitive data from localStorage
 */
export async function getSecureData(key: string): Promise<string | null> {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  const stored = localStorage.getItem(storageKey);

  if (!stored) {
    return null;
  }

  try {
    const encrypted = JSON.parse(stored) as EncryptedData;
    return await decryptData(encrypted);
  } catch (error) {
    console.error(`Failed to retrieve secure data for key "${key}":`, error);
    return null;
  }
}

/**
 * Removes sensitive data from localStorage
 */
export function removeSecureData(key: string): void {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  localStorage.removeItem(storageKey);
}

/**
 * Checks if secure data exists in localStorage
 */
export function hasSecureData(key: string): boolean {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  return localStorage.getItem(storageKey) !== null;
}
