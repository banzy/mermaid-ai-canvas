# Secure API Key Storage

## Overview

API keys are now stored securely in the browser using client-side encryption via the Web Crypto API. This prevents keys from being exposed in plain text in localStorage.

## How It Works

### Encryption Method
- **Algorithm**: AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256 (100,000 iterations)
- **IV Length**: 12 bytes (96 bits) per encryption
- **Salt**: 16 bytes (128 bits), stored once per browser

### Security Features

1. **Client-Side Encryption**: Keys are encrypted in the browser before being stored
2. **Deterministic Key Derivation**: The encryption key is derived from the same seed on the same device, allowing decryption without storing master keys
3. **Authenticated Encryption**: GCM mode provides both confidentiality and authenticity
4. **Random IV**: Each encryption uses a random initialization vector
5. **No Plain Text Storage**: The settings store only shows `***ENCRYPTED***` as a placeholder

### Storage Structure

```
localStorage: {
  'secure_openaiApiKey': {
    ciphertext: 'base64-encoded-encrypted-key',
    iv: 'base64-encoded-initialization-vector',
    salt: 'base64-encoded-salt'
  },
  'secure_groqApiKey': {
    ciphertext: 'base64-encoded-encrypted-key',
    iv: 'base64-encoded-initialization-vector',
    salt: 'base64-encoded-salt'
  },
  'secure_salt': 'base64-encoded-master-salt'
}
```

## Usage

### Setting API Keys

```typescript
const { setSecureApiKey } = useAppStore();

// Save encrypted API key
await setSecureApiKey('openaiApiKey', 'sk-...');
```

### Retrieving API Keys

```typescript
const { getSecureApiKey } = useAppStore();

// Get decrypted API key
const apiKey = await getSecureApiKey('openaiApiKey');
```

## Files Modified

1. **`src/lib/secureStorage.ts`** - New file providing encryption/decryption utilities
2. **`src/stores/useAppStore.ts`** - Added secure API key methods
3. **`src/pages/Settings.tsx`** - Updated to use secure storage and added key length validation
4. **`src/lib/api.ts`** - Updated to retrieve decrypted keys when needed

## Security Considerations

### What This Protects Against
- Casual inspection of localStorage
- Scripts that dump localStorage contents
- Browser dev tools inspection (keys appear encrypted)

### What This Does NOT Protect Against
- JavaScript injection that runs with page access (XSS attacks)
- Compromised browser extensions with full access
- Physical device theft (if encryption keys can be derived)

### Best Practices
1. **Use HTTPS**: Ensure your site is served over HTTPS only
2. **Content Security Policy**: Implement CSP to prevent script injection
3. **API Key Rotation**: Regularly rotate API keys in your provider settings
4. **Limited Scope**: Use API keys with minimal required permissions
5. **Monitoring**: Monitor API usage for suspicious activity

## Validation

- Minimum API key length: 16 characters
- Save and Test buttons are disabled until valid key is entered
- Visual feedback shows validation status

## Browser Compatibility

Requires browser support for:
- Web Crypto API (`crypto.subtle`)
- `TextEncoder` / `TextDecoder`
- `btoa` / `atob` for base64 encoding

Supported in:
- Chrome/Edge 37+
- Firefox 34+
- Safari 11+
- Modern mobile browsers

## Future Improvements

1. Optional PIN/password protection for additional security layer
2. Key rotation mechanism
3. Encrypted backup/export functionality
4. Hardware security key integration (WebAuthn)
