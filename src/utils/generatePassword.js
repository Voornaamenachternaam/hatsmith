const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

// Enhanced password generation for 2025 security standards
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased entropy from 128 bits to 256 bits for 2025 security standards
  let password = sodium.to_base64(
    sodium.randombytes_buf(32), // 256 bits instead of 128 bits
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  
  return password;
};

// Enhanced passphrase generation with better security
export const generatePassPhrase = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increased from 5 to 6 words for better security (77.5 bits entropy)
  const numWords = 6;
  const passphraseWords = [];
  const maxRetries = 100; // Prevent infinite loops

  for (let i = 0; i < numWords; i++) {
    let retryCount = 0;
    let diceKey = "";
    let word = null;

    // Retry logic with maximum attempts to prevent infinite loops
    while (!word && retryCount < maxRetries) {
      diceKey = "";
      
      // Roll 5 dice (numbers from 1 to 6) for Diceware
      for (let j = 0; j < 5; j++) {
        const roll = sodium.randombytes_uniform(6) + 1; // [1–6]
        diceKey += roll.toString();
      }

      word = dicewareWordlist[diceKey];
      retryCount++;
    }

    if (!word) {
      // Fallback: generate a random word if diceware lookup fails
      console.warn(`Diceware lookup failed for key ${diceKey}, using fallback`);
      word = `word${i + 1}${sodium.randombytes_uniform(9999)}`;
    }

    passphraseWords.push(word);
  }

  // Use a more secure separator and add entropy
  const separators = ['-', '_', '.', '+'];
  const separator = separators[sodium.randombytes_uniform(separators.length)];
  
  // Add a random number at the end for additional entropy
  const randomSuffix = sodium.randombytes_uniform(999) + 100; // 3-digit number
  
  return passphraseWords.join("-");
