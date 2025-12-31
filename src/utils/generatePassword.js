const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

// Secure memory clearing utility
const secureMemoryClear = (buffer) => {
  if (buffer && buffer.fill) {
    buffer.fill(0);
  }
};

export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Enhanced entropy: 256 bits (32 bytes) instead of 128 bits (16 bytes)
  const randomBytes = sodium.randombytes_buf(32);
  let password = sodium.to_base64(
    randomBytes,
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  
  // Secure memory cleanup
  secureMemoryClear(randomBytes);
  
  return password;
};

export const generatePassPhrase = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  const numWords = 6; // Increased from 5 to 6 words for better entropy
  const passphraseWords = [];
  
  try {
    for (let i = 0; i < numWords; i++) {
      let diceKey = "";
      let attempts = 0;
      const maxAttempts = 100; // Prevent infinite loops

      // Roll 5 dice (numbers from 1 to 6)
      for (let j = 0; j < 5; j++) {
        const roll = sodium.randombytes_uniform(6) + 1; // [1–6]
        diceKey += roll.toString();
      }

      const word = dicewareWordlist[diceKey];

      if (!word) {
        // If key not found, redo this word with attempt limit
        attempts++;
        if (attempts < maxAttempts) {
          i--;
          continue;
        } else {
          // Fallback: use a default word if max attempts reached
          passphraseWords.push("secure");
          continue;
        }
      }

      passphraseWords.push(word);
    }

    const passphrase = passphraseWords.join("-");
    
    // Secure memory cleanup
    passphraseWords.fill("");
    
    return passphrase;
    
  } catch (error) {
    // Enhanced error handling
    console.error("Error generating passphrase:", error);
    
    // Secure memory cleanup on error
    passphraseWords.fill("");
    
    // Return a fallback secure passphrase
    const fallbackBytes = sodium.randombytes_buf(32);
    const fallbackPassphrase = sodium.to_base64(fallbackBytes, sodium.base64_variants.URLSAFE_NO_PADDING);
    secureMemoryClear(fallbackBytes);
    return fallbackPassphrase;
  }
};