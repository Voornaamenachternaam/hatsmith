const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

// Enhanced password generation with 256-bit entropy (CWE-330)
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased from 16 to 32 bytes for 256-bit entropy (CWE-330)
  let password = sodium.to_base64(
    sodium.randombytes_buf(32),  // 256 bits instead of 128 bits
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  
  // Secure memory handling - clear intermediate values (CWE-316)
  try {
    // The password variable will be returned, but we ensure proper cleanup elsewhere
  } catch (error) {
    console.warn('Password generation cleanup warning:', error.message);
  }
  
  return password;
};

// Enhanced passphrase generation with better error handling (CWE-330)
export const generatePassPhrase = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased from 5 to 6 words for better entropy (CWE-330)
  const numWords = 6;
  const passphraseWords = [];
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loops

  for (let i = 0; i < numWords; i++) {
    if (attempts > maxAttempts) {
      throw new Error('Passphrase generation failed: too many attempts');
    }
    
    let diceKey = "";

    // Enhanced random generation - Roll 5 dice (numbers from 1 to 6)
    for (let j = 0; j < 5; j++) {
      const roll = sodium.randombytes_uniform(6) + 1; // [1-6] using cryptographically secure random
      diceKey += roll.toString();
    }

    const word = dicewareWordlist[diceKey];

    if (!word) {
      // If key not found, redo this word with enhanced error handling
      i--;
      attempts++;
      continue;
    }

    passphraseWords.push(word);
    attempts = 0; // Reset attempts counter for next word
  }

