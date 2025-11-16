const nodeCrypto = require('node:crypto');

if (typeof nodeCrypto.getRandomValues !== 'function') {
  nodeCrypto.getRandomValues = (buffer) => nodeCrypto.randomFillSync(buffer);
}

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeCrypto.webcrypto;
}
