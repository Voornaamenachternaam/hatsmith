const _sodium = require("libsodium-wrappers");
const dicewareWordlist = require("../helpers/eef_word_list.json");

/**
 * Generates a cryptographically secure password with 256 bits of entropy
 * Following NIST SP 800-63B guidelines for password generation
 */
export const generatePassword = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  
  // Generate 32 bytes (256 bits) of cryptographically secure random data
  // This provides sufficient entropy for strong cryptographic security
  const randomBytes = sodium.randombytes_buf(32);
  
  // Use URL-safe base64 encoding without padding for better compatibility
  let password = sodium.to_base64(
    randomBytes,
    sodium.base64_variants.URLSAFE_NO_PADDING
  );
  
  return password;
};

export const generatePassPhrase = async () =>{
  await _sodium.ready;
  const sodium = _sodium;
  
  // Increase to 6 words for better security (approximately 77.5 bits of entropy)
  // Each EFF word provides ~12.9 bits of entropy
  const numWords = 6;
  const passphraseWords = [];

  for (let i = 0; i < numWords; i++) {
    let diceKey = "";

    // Roll 5 dice (numbers from 1 to 6)
    for (let j = 0; j < 5; j++) {
      // Use cryptographically secure random number generation
      const roll = sodium.randombytes_uniform(6) + 1; // [1-6]
      diceKey += roll.toString();
    }

    const word = dicewareWordlist[diceKey];

    if (!word) {
      // If key not found, redo this word
      // Decrement counter to retry this word generation
      i--;
      continue;
    }

    passphraseWords.push(word);
  }

  return passphraseWords.join("-");
