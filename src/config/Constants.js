export const currentVersion = "3.0.1";
// Enhanced file size limits for better security
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
export const CHUNK_SIZE = 64 * 1024 * 1024;
export const crypto_secretstream_xchacha20poly1305_ABYTES = 17;
export const encoder = new TextEncoder();
export const decoder = new TextDecoder();

// Updated signature codes matching service worker configuration
// These provide file format identification with better security
export const SIGNATURES = {
  v1: "Encrypted Using Hatsmith",
  v2_symmetric: "HtSh3SymEnc",   // 11 bytes, clearly identifies symmetric encryption
  v2_asymmetric: "HtSh3AsyEnc",  // 11 bytes, clearly identifies asymmetric encryption
  // Version 3 signatures for enhanced security
  v3_symmetric: "HtSh3SecKey1",  // Future-proofing for version 3
  v3_asymmetric: "HtSh3PubKey1", // Future-proofing for version 3
};

