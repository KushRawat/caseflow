const crypto = require('node:crypto');
const { webcrypto } = crypto;

if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: false
  });
}

if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = (...args) => webcrypto.getRandomValues(...args);
}
