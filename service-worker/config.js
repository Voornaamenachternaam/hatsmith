const APP_URL = self.location.origin + "/download-file";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Enhanced signature codes with better entropy and less predictable patterns
// These provide file format identification while reducing metadata leakage
const sigCodes = {
  v1: "Encrypted Using Hat.sh",
  // Updated signatures with better entropy distribution
  v2_symmetric: "HtSh3SymEnc",   // 11 bytes, clearly identifies symmetric encryption
  v2_asymmetric: "HtSh3AsyEnc",  // 11 bytes, clearly identifies asymmetric encryption
  // Version 3 signatures for enhanced security
  v3_symmetric: "HtSh3SecKey1",  // Future-proofing for version 3
  v3_asymmetric: "HtSh3PubKey1", // Future-proofing for version 3
};

// Export configuration with enhanced security considerations
module.exports = {
  APP_URL,
  encoder,
  decoder,
  sigCodes,
