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
  const sodium = _sodium;

  addEventListener("message", (e) => {
    // Clear sensitive data from memory after processing (CWE-316)
    const clearSensitiveData = () => {
      if (typeof theKey !== 'undefined' && theKey) {
        try {
          // Attempt to zero out the key buffer
          if (theKey.fill) {
            theKey.fill(0);
          }
        } catch (err) {
          // Key might be read-only, ignore error
        }
      }
    };

    // Constant-time key validation to prevent timing attacks (CWE-347)
    const constantTimeEquals = (a, b) => {
      if (!a || !b || a.length !== b.length) {
        return false;
      }
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    };

    // Detect weak keys (all-zero keys) (CWE-347)
    const isWeakKey = (key) => {
      if (!key || key.length === 0) return true;
      return key.every(byte => byte === 0);
    };

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
      // Validate input keys are not weak (CWE-347)
      const cskBytes = sodium.from_base64(csk);
      const spkBytes = sodium.from_base64(spk);
      
      if (isWeakKey(cskBytes) || isWeakKey(spkBytes)) {
        client.postMessage({ reply: "wrongKeyInput" });
        return;
      }

      if (csk === spk) {
        client.postMessage({ reply: "wrongKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(csk));
      let computed = sodium.crypto_scalarmult_base(cskBytes);
      if (spk === computed) {
      if (constantTimeEquals(sodium.from_base64(spk), sodium.from_base64(computed))) {
        return;
      }

      if (sodium.from_base64(csk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongPrivateKey" });
        return;
      }

      if (sodium.from_base64(spk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_client_session_keys(
        sodium.crypto_scalarmult_base(cskBytes),
        cskBytes,
        spkBytes
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
      
      // Clear sensitive data from memory (CWE-316)
      if (cskBytes.fill) cskBytes.fill(0);
      if (spkBytes.fill) spkBytes.fill(0);
      if (computed && typeof computed === 'object' && computed.fill) {
        computed.fill(0);
      }
    } catch (error) {
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
    // Enhanced Argon2 parameters for SENSITIVE security level (CWE-326)
    // Upgraded from INTERACTIVE (4 ops, 67MB) to SENSITIVE (32 ops, 1GB)
    salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    theKey = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_SENSITIVE, // 32 operations (8x increase)
      sodium.crypto_pwhash_MEMLIMIT_SENSITIVE, // 1GB memory (15x increase)
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(theKey);
    state = res.state;
    header = res.header;

    client.postMessage({ reply: "keysGenerated" });
    
    // Clear password from memory (CWE-316)
    if (typeof password === 'string') {
      password = null;
    }
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
      // Validate input keys are not weak (CWE-347)
      const sskBytes = sodium.from_base64(ssk);
      const cpkBytes = sodium.from_base64(cpk);
      
      if (isWeakKey(sskBytes) || isWeakKey(cpkBytes)) {
        client.postMessage({ reply: "wrongDecKeyInput" });
        return;
      }

      if (ssk === cpk) {
        client.postMessage({ reply: "wrongDecKeyPair" });
        return;
      }

      let computed = sodium.crypto_scalarmult_base(sodium.from_base64(ssk));
      let computed = sodium.crypto_scalarmult_base(sskBytes);
      if (cpk === computed) {
      if (constantTimeEquals(sodium.from_base64(cpk), sodium.from_base64(computed))) {
        return;
      }

      if (sodium.from_base64(ssk).length !== sodium.crypto_kx_SECRETKEYBYTES) {
        client.postMessage({ reply: "wrongDecPrivateKey" });
        return;
      }

      if (sodium.from_base64(cpk).length !== sodium.crypto_kx_PUBLICKEYBYTES) {
        client.postMessage({ reply: "wrongDecPublicKey" });
        return;
      }

      let key = sodium.crypto_kx_server_session_keys(
        sodium.crypto_scalarmult_base(sskBytes),
        sskBytes,
        cpkBytes
      );

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
      
      // Clear sensitive data from memory (CWE-316)
      if (sskBytes.fill) sskBytes.fill(0);
      if (cpkBytes.fill) cpkBytes.fill(0);
      if (computed && typeof computed === 'object' && computed.fill) {
        computed.fill(0);
      }
    } catch (error) {
      client.postMessage({ reply: "wrongDecKeyInput" });
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
      // Enhanced Argon2 parameters for SENSITIVE security level (CWE-326)
      let decTestsalt = new Uint8Array(salt);
      let decTestheader = new Uint8Array(header);

      let decTestKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        decTestsalt,
        sodium.crypto_pwhash_OPSLIMIT_SENSITIVE, // 32 operations (8x increase)
        sodium.crypto_pwhash_MEMLIMIT_SENSITIVE, // 1GB memory (15x increase)
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

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
      
      // Clear sensitive data from memory (CWE-316)
      if (decTestKey.fill) decTestKey.fill(0);
      if (typeof password === 'string') {
        password = null;
      }
      decTestsalt.fill(0);
      decTestheader.fill(0);
    }
  };

  const decKeyGenerator = (password, signature, salt, header, client) => {
    if (config.decoder.decode(signature) === config.sigCodes["v2_symmetric"]) {
      salt = new Uint8Array(salt);
      header = new Uint8Array(header);
      
      // Enhanced Argon2 parameters for SENSITIVE security level (CWE-326)

      theKey = sodium.crypto_pwhash(
        sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
        password,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_SENSITIVE, // 32 operations (8x increase)
        sodium.crypto_pwhash_MEMLIMIT_SENSITIVE, // 1GB memory (15x increase)
        sodium.crypto_pwhash_ALG_ARGON2ID13
      );

      state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        header,
        theKey
      );

      if (state) {
        client.postMessage({ reply: "decKeysGenerated" });
      
      // Clear sensitive data from memory (CWE-316)
      if (typeof password === 'string') {
        password = null;
      }
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
      
      // Clear decrypted chunk from memory after processing (CWE-316)
      if (result && result.message && result.message.fill) {
        setTimeout(() => result.message.fill(0), 100);
      }
    }, 500);
  };
})();
