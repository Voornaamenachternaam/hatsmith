const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

// Enhanced password generation with 256-bit entropy (CWE-330)
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased from 16 to 32 bytes for 256-bit entropy
  let password = sodium.to_base64(
    sodium.randombytes_buf(32),
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  
  // Clear sensitive data from memory (CWE-316)
  if (typeof password === 'string') {
    // Note: JavaScript strings are immutable, but we can at least null the reference
    const result = password;
    password = null;
    return result;
  }
  
  return password;
};

// Enhanced passphrase generation with 6 words and better error handling (CWE-330)
export const generatePassPhrase = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased from 5 to 6 words for better entropy
  const numWords = 6;
  const passphraseWords = [];
  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loops

  for (let i = 0; i < numWords; i++) {
    if (attempts > maxAttempts) {
      throw new Error("Failed to generate secure passphrase after maximum attempts");
    }
    
    let diceKey = "";

    // Roll 5 dice (numbers from 1 to 6)
    for (let j = 0; j < 5; j++) {
      const roll = sodium.randombytes_uniform(6) + 1; // [1–6]
      diceKey += roll.toString();
    }

    const word = dicewareWordlist[diceKey];

    if (!word) {
      // If key not found, redo this word
      i--;
      attempts++;
      continue;
    }

    passphraseWords.push(word);
    attempts = 0; // Reset attempts counter on successful word
  }

  const passphrase = passphraseWords.join("-");
  
  // Clear sensitive data from memory (CWE-316)
  passphraseWords.length = 0;
  
  return passphrase;
};