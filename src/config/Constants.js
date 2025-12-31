export const currentVersion = "3.0.1";
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
export const CHUNK_SIZE = 64 * 1024 * 1024;
export const crypto_secretstream_xchacha20poly1305_ABYTES = 17;
export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Enhanced security constants for 2025 standards
export const SECURITY_LEVELS = {
  INTERACTIVE: {
    OPSLIMIT: 4,
    MEMLIMIT: 67108864, // 64MB
    NAME: "interactive"
  },
  SENSITIVE: {
    OPSLIMIT: 32,
    MEMLIMIT: 1073741824, // 1GB
    NAME: "sensitive"
  }
};

// Default to SENSITIVE for new encryptions (2025 security standards)
export const DEFAULT_SECURITY_LEVEL = SECURITY_LEVELS.SENSITIVE;

// Minimum password requirements (enhanced for 2025)
export const MIN_PASSWORD_LENGTH = 16;
export const MIN_PASSPHRASE_WORDS = 6;

export const SIGNATURES = {
  v1: "Encrypted Using Hatsmith",
  v2_symmetric: "zDKO6XYXioc",
  v2_asymmetric: "hTWKbfoikeg",
};
