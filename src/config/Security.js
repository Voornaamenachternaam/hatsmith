/**
 * Enhanced Security Configuration for Hatsmith
 * Updated for 2025 cryptographic standards
 */

// Argon2 Parameters for different security levels
export const ARGON2_PARAMS = {
  // Legacy parameters for backward compatibility
  LEGACY: {
    OPSLIMIT: 4,
    MEMLIMIT: 67108864, // 64MB
    ALG: 'argon2id'
  },
  
  // Enhanced parameters for 2025 security standards
  ENHANCED: {
    OPSLIMIT: 32,
    MEMLIMIT: 1073741824, // 1GB
    ALG: 'argon2id'
  },
  
  // High security for sensitive applications
  HIGH_SECURITY: {
    OPSLIMIT: 64,
    MEMLIMIT: 2147483648, // 2GB
    ALG: 'argon2id'
  }
};

// Default security level for new encryptions
export const DEFAULT_ARGON2_PARAMS = ARGON2_PARAMS.ENHANCED;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 16,
  MIN_COMPLEXITY_TYPES: 3, // lowercase, uppercase, digits, symbols
  FORBIDDEN_PATTERNS: [
    /(.)\1{2,}/, // repeating characters
    /123|abc|qwe|password|admin|login|user/i, // common patterns
    /^[a-z]+$/i, // only letters
    /^\d+$/, // only numbers
  ]
};

// Passphrase requirements
export const PASSPHRASE_REQUIREMENTS = {
  MIN_WORDS: 6,
  SEPARATOR_OPTIONS: ['-', '_', '.', '+'],
  ADD_ENTROPY_SUFFIX: true
};

// Key generation parameters
export const KEY_GENERATION = {
  PASSWORD_ENTROPY_BYTES: 32, // 256 bits
  SALT_BYTES: 32, // 256 bits
  KEY_DERIVATION_ITERATIONS: 100000 // PBKDF2 iterations if needed
};

// Cryptographic algorithm preferences
export const CRYPTO_ALGORITHMS = {
  HASH: ['SHA-256'], // Only secure hash functions
  DEPRECATED_HASH: ['MD5', 'SHA-1'], // Explicitly list deprecated algorithms
  SYMMETRIC_CIPHER: 'XChaCha20-Poly1305',
  KEY_EXCHANGE: 'X25519',
  SIGNATURE: 'Ed25519'
};

// Security headers and CSP (for future use)
export const SECURITY_HEADERS = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  HSTS: "max-age=31536000; includeSubDomains",
  X_FRAME_OPTIONS: "DENY",
  X_CONTENT_TYPE_OPTIONS: "nosniff"
};

// Rate limiting configuration (for future implementation)
export const RATE_LIMITING = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300000, // 5 minutes in milliseconds
  SLIDING_WINDOW: 900000 // 15 minutes in milliseconds
};
