const fs = require('node:fs');
const path = require('node:path');

const projectRoot = process.cwd();

function copyFile(relativeSource, relativeDestination, { required = true } = {}) {
  const source = path.join(projectRoot, relativeSource);
  const destination = path.join(projectRoot, relativeDestination);

  if (!fs.existsSync(source)) {
    if (required) {
      throw new Error(`Required asset missing: ${relativeSource}`);
    }

    return false;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  return true;
}

function copyFirstAvailable(assetName, candidates, destination) {
  for (const candidate of candidates) {
    if (copyFile(candidate, destination, { required: false })) {
      return candidate;
    }
  }

  throw new Error(`Could not find ${assetName}. Tried: ${candidates.join(', ')}`);
}

copyFile('service-worker/sw.js', 'public/service-worker.js');

const selectedLibsodiumCore = copyFirstAvailable(
  'a libsodium core build',
  [
    'node_modules/libsodium-wrappers/dist/browsers/libsodium.js',
    'node_modules/libsodium/dist/modules/libsodium.js'
  ],
  'public/libsodium.js'
);

const selectedWrapper = copyFirstAvailable(
  'a libsodium wrapper build',
  [
    'node_modules/libsodium-wrappers/dist/browsers/libsodium-wrappers.js',
    'node_modules/libsodium-wrappers/dist/modules/libsodium-wrappers.js'
  ],
  'public/libsodium-wrappers.js'
);

copyFile(
  'node_modules/libsodium-wrappers/dist/browsers/libsodium-wrappers.wasm',
  'public/libsodium-wrappers.wasm',
  { required: false }
);

console.log(
  `Copied service worker assets using ${selectedLibsodiumCore} and ${selectedWrapper}`
);
