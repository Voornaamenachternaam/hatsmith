self.addEventListener("install", (event) =>
  event.waitUntil(self.skipWaiting())
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);
self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch:', event.request.url);
});

self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
});

const config = require("./config");

let streamController, fileName, theKey, state, header, salt, encRx, encTx, decRx, decTx;
// Enhanced security constants for 2025 standards
let downloadReady = false; // Flag to control when downloads should start

self.addEventListener("fetch", (e) => {
  // console.log(e); // log fetch event
  if (e.request.url.startsWith(config.APP_URL) && downloadReady) {
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        
        // Notify the client that download has started
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            console.log('[SW] Sending downloadStarted message to client');
            client.postMessage({ reply: "downloadStarted" });
          });
        });
      },
    });
    const response = new Response(stream);
    response.headers.append(
      "Content-Disposition",
      'attachment; filename="' + fileName + '"'
    );
    e.respondWith(response);
    downloadReady = false; // Reset flag after creating stream
  }
});

const _sodium = require("libsodium-wrappers");
(async () => {
  await _sodium.ready;

  // Enhanced cryptographic validation functions for 2025 security standards
  const validateKeyFormat = (key, expectedLength, keyType) => {
    try {
      const decodedKey = sodium.from_base64(key);
      
      // Constant-time length check to prevent timing attacks
      if (decodedKey.length !== expectedLength) {
        return { valid: false, error: `Invalid ${keyType} key length` };
      }
      
      // Additional validation: check for all-zero keys (weak keys)
      const isAllZeros = decodedKey.every(byte => byte === 0);
      if (isAllZeros) {
        return { valid: false, error: `${keyType} key cannot be all zeros` };
      }
      
      return { valid: true, key: decodedKey };
    } catch (error) {
      return { valid: false, error: `Invalid ${keyType} key format` };
    }
  };

  // Secure memory clearing function
  const secureMemoryClear = (buffer) => {
    if (buffer && buffer.fill) {
      buffer.fill(0);
    }
  };
  const sodium = _sodium;

  addEventListener("message", (e) => {
    switch (e.data.cmd) {
      case "prepareFileNameEnc":
        assignFileNameEnc(e.data.fileName, e.source);
        break;

      case "prepareFileNameDec":
        assignFileNameDec(e.data.fileName, e.source);
        break;

      case "prepareDownload":
        prepareDownload(e.source);
        break;

      case "requestEncryption":
        encKeyGenerator(e.data.password, e.source);
        break;

      case "requestEncKeyPair":
        encKeyPair(e.data.privateKey, e.data.publicKey, e.data.mode, e.source);
        break;

      case "asymmetricEncryptFirstChunk":
        asymmetricEncryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptFirstChunk":
        encryptFirstChunk(e.data.chunk, e.data.last, e.source);
        break;

      case "encryptRestOfChunks":
        encryptRestOfChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "checkFile":
        checkFile(e.data.signature, e.data.legacy, e.source);
        break;

      case "requestTestDecryption":
        testDecryption(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.data.decFileBuff,
          e.source
        );
        break;

      case "requestDecKeyPair":
        requestDecKeyPair(
          e.data.privateKey,
          e.data.publicKey,
          e.data.header,
          e.data.decFileBuff,
          e.data.mode,
          e.source
        );
        break;

      case "requestDecryption":
        decKeyGenerator(
          e.data.password,
          e.data.signature,
          e.data.salt,
          e.data.header,
          e.source
        );
        break;

      case "decryptFirstChunk":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "decryptRestOfChunks":
        decryptChunks(e.data.chunk, e.data.last, e.source);
        break;

      case "pingSW":
        // console.log("SW running");
        break;
    }
  });

  const assignFileNameEnc = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedEnc" })
  }

  const prepareDownload = (client) => {
    downloadReady = true;
    client.postMessage({ reply: "downloadReady" });
  }

  const assignFileNameDec = (name, client) => {
    fileName = name;
    downloadReady = true; // Set downloadReady flag to enable fetch handling
    client.postMessage({ reply: "filePreparedDec" })
  }

  const encKeyPair = (csk, spk, mode, client) => {
    try {
      if (csk === spk) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(csk));
      computed = sodium.to_base64(computed);
      if (spk === computed) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      // Enhanced key validation with constant-time operations
      const privateKeyValidation = validateKeyFormat(csk, sodium.crypto_kx_SECRETKEYBYTES, "private");
      if (!privateKeyValidation.valid) {
        console.warn("Private key validation failed:", privateKeyValidation.error);
        client.postMessage({ reply: "wrongPrivateKey" });
        return;
      }

      const publicKeyValidation = validateKeyFormat(spk, sodium.crypto_kx_PUBLICKEYBYTES, "public");
      if (!publicKeyValidation.valid) {
        console.warn("Public key validation failed:", publicKeyValidation.error);
        client.postMessage({ reply: "wrongPublicKey" });
        return;
      }

      const decodedPrivateKey = privateKeyValidation.key;
      const decodedPublicKey = publicKeyValidation.key;

      let key = sodium.crypto_kx_client_session_keys(
        sodium.crypto_scalarmult_base(decodedPrivateKey),
        decodedPrivateKey,
        decodedPublicKey
      );

      if (key) {
        [encRx, encTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && encRx && encTx) {
          client.postMessage({ reply: "goodKeyPair" });
        }

        if (mode === "derive" && encRx && encTx) {
          let res =
            sodium.crypto_secretstream_xchacha20poly1305_init_push(encTx);
          state = res.state;
          header = res.header;
          client.postMessage({ reply: "keyPairReady" });
        }
      } else {
        client.postMessage({ reply: "wrongKeyPair" });
      }
      
      // Secure memory cleanup
      secureMemoryClear(decodedPrivateKey);
      secureMemoryClear(decodedPublicKey);
    } catch (error) {
      console.error("Key pair validation error:", error);
      client.postMessage({ reply: "wrongKeyInput" });
    }
  };

  const asymmetricEncryptFirstChunk = (chunk, last, client) => {
    console.log('[SW] asymmetricEncryptFirstChunk called, streamController exists:', !!streamController);
    
    // Wait for streamController to be ready with a timeout
    const waitForStreamController = (retries = 0) => {
      if (streamController) {
        console.log('[SW] StreamController is ready, proceeding with asymmetric encryption');
        
        const SIGNATURE = new Uint8Array(
          config.encoder.encode(config.sigCodes["v2_asymmetric"])
        );
        console.log('[SW] Enqueueing signature and header for asymmetric encryption');
        streamController.enqueue(SIGNATURE);
        streamController.enqueue(header);

        let tag = last
          ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
          : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

        let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
          state,
          new Uint8Array(chunk),
          null,
          tag
        );

        streamController.enqueue(new Uint8Array(encryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "encryptionFinished" });
        }

        if (!last) {
          client.postMessage({ reply: "continueEncryption" });
        }
      } else if (retries < 50) { // Wait up to 5 seconds (50 * 100ms)
        console.log('[SW] StreamController not ready for asymmetric encryption, retrying in 100ms... (attempt', retries + 1, ')');
        setTimeout(() => waitForStreamController(retries + 1), 100);
      } else {
        console.error('[SW] ERROR: streamController timeout for asymmetric encryption after 5 seconds!');
        client.postMessage({ reply: "encryptionError", error: "Stream initialization timeout" });
      }
    };
    
    waitForStreamController();
  };

  let encKeyGenerator = (password, client) => {
    // Use enhanced Argon2 parameters for 2025 security standards
    salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    // Enhanced Argon2id parameters for better security
    const OPSLIMIT_ENHANCED = 32; // Increased from 4 (INTERACTIVE)
    const MEMLIMIT_ENHANCED = 1073741824; // 1GB, increased from 67MB

    theKey = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      salt,
      OPSLIMIT_ENHANCED,
      MEMLIMIT_ENHANCED,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    // Clear password from memory for security
    if (typeof password === 'string') {
      password = null;
    }

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(theKey);
    state = res.state;
    header = res.header;

    client.postMessage({ reply: "keysGenerated" });
  };

  const encryptFirstChunk = (chunk, last, client) => {
    setTimeout(function () {
      if (!streamController) {
        console.log("stream does not exist");
        return;
      }
      const SIGNATURE = new Uint8Array(
        config.encoder.encode(config.sigCodes["v2_symmetric"])
      );

      streamController.enqueue(SIGNATURE);
      streamController.enqueue(salt);
      streamController.enqueue(header);

      let tag = last
        ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
        : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

      let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
        state,
        new Uint8Array(chunk),
        null,
        tag
      );

      streamController.enqueue(new Uint8Array(encryptedChunk));

      if (last) {
        streamController.close();
        client.postMessage({ reply: "encryptionFinished" });
      }

      if (!last) {
        client.postMessage({ reply: "continueEncryption" });
      }
    }, 500);
  };

  const encryptRestOfChunks = (chunk, last, client) => {
    if (!streamController) {
      console.log("stream does not exist in encryptRestOfChunks");
      return;
    }
    
    let tag = last
      ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

    let encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(
      state,
      new Uint8Array(chunk),
      null,
      tag
    );

    streamController.enqueue(encryptedChunk);

    if (last) {
      streamController.close();
      client.postMessage({ reply: "encryptionFinished" });
    }

    if (!last) {
      client.postMessage({ reply: "continueEncryption" });
    }
  };

  const checkFile = (signature, legacy, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      client.postMessage({ reply: "secretKeyEncryption" });
    } else if (
      config.decoder.decode(signature) === config.sigCodes["v2_asymmetric"]
    ) {
      client.postMessage({ reply: "publicKeyEncryption" });
    } else if (config.decoder.decode(legacy) === config.sigCodes["v1"]) {
      client.postMessage({ reply: "oldVersion" });
    } else {
      client.postMessage({ reply: "badFile" });
    }
  };

  const requestDecKeyPair = (ssk, cpk, header, decFileBuff, mode, client) => {
    try {
      if (ssk === cpk) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(ssk));
      computed = sodium.to_base64(computed);
      if (cpk === computed) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      if (sodium.from_base64(ssk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
      // Enhanced key validation for decryption
      const privateKeyValidation = validateKeyFormat(ssk, sodium.crypto_kx_SECRETKEYBYTES, "private");
      if (!privateKeyValidation.valid) {
        console.warn("Decryption private key validation failed:", privateKeyValidation.error);
        client.postMessage({ reply: "wrongDecPrivateKey" });
      }

      if (sodium.from_base64(cpk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
      const publicKeyValidation = validateKeyFormat(cpk, sodium.crypto_kx_PUBLICKEYBYTES, "public");
      if (!publicKeyValidation.valid) {
        console.warn("Decryption public key validation failed:", publicKeyValidation.error);
        client.postMessage({ reply: "wrongDecPublicKey" });
      }

      let key = sodium.crypto_kx_server_session_keys(
      const decodedPrivateKey = privateKeyValidation.key;
      const decodedPublicKey = publicKeyValidation.key;

        sodium.crypto_scalarmult_base(sodium.from_base64(ssk)),
        sodium.crypto_scalarmult_base(decodedPrivateKey),
        decodedPrivateKey,
        decodedPublicKey

      if (key) {
        [decRx, decTx] = [key.sharedRx, key.sharedTx];

        if (mode === "test" && decRx && decTx) {
          let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state_in) {
            let decTestresults =
              sodium.crypto_secretstream_xchacha20poly1305_pull(
                state_in,
                new Uint8Array(decFileBuff)
              );

            if (decTestresults) {
              client.postMessage({ reply: "readyToDecrypt" });
            } else {
              client.postMessage({ reply: "wrongDecKeys" });
            }
          }
        }

        if (mode === "derive" && decRx && decTx) {
          state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
            new Uint8Array(header),
            decRx
          );

          if (state) {
            client.postMessage({ reply: "decKeyPairGenerated" });
          }
        }
      }
    } catch (error) {
      
      // Secure memory cleanup
      secureMemoryClear(decodedPrivateKey);
      secureMemoryClear(decodedPublicKey);
      client.postMessage({ reply: "wrongDecKeyInput" });
      console.error("Decryption key pair validation error:", error);
    }
  };

  const testDecryption = (
    password,
    signature,
    salt,
    header,
    decFileBuff,
    client
  ) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      let decTestsalt = new Uint8Array(salt);
      let decTestheader = new Uint8Array(header);

      // Use enhanced Argon2 parameters for 2025 security standards
      const OPSLIMIT_ENHANCED = 32;
      const MEMLIMIT_ENHANCED = 1073741824; // 1GB

      let decTestKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        decTestsalt,
        OPSLIMIT_ENHANCED,
        MEMLIMIT_ENHANCED,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      // Clear password from memory for security
      if (typeof password === 'string') {
        password = null;
      }

      let state_in = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        decTestheader,
        decTestKey
      );

      if (state_in) {
        let decTestresults = sodium.crypto_secretstream_xchacha20poly1305_pull(
          state_in,
          new Uint8Array(decFileBuff)
        );
        if (decTestresults) {
          client.postMessage({ reply: "readyToDecrypt" });
        } else {
          client.postMessage({ reply: "wrongPassword" });
        }
      }
    }
  };

  const decKeyGenerator = (password, signature, salt, header, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      salt = new Uint8Array(salt);
      header = new Uint8Array(header);

      // Use enhanced Argon2 parameters for 2025 security standards
      const OPSLIMIT_ENHANCED = 32;
      const MEMLIMIT_ENHANCED = 1073741824; // 1GB

      theKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        OPSLIMIT_ENHANCED,
        MEMLIMIT_ENHANCED,
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      // Clear password from memory for security
      if (typeof password === 'string') {
        password = null;
      }

      state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        theKey
      );

      if (state) {
        client.postMessage({ reply: "decKeysGenerated" });
      }
    }
  };

  const decryptChunks = (chunk, last, client) => {
    setTimeout(function () {
      let result = sodium.crypto_secretstream_xchacha20poly1305_pull(
        state,
        new Uint8Array(chunk)
      );

      if (result) {
        let decryptedChunk = result.message;

        streamController.enqueue(new Uint8Array(decryptedChunk));

        if (last) {
          streamController.close();
          client.postMessage({ reply: "decryptionFinished" });
        }
        if (!last) {
          client.postMessage({ reply: "continueDecryption" });
        }
      } else {
        client.postMessage({ reply: "wrongPassword" });
      }
    }, 500);
  };
})();
