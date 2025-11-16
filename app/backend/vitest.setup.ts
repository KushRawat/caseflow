import { webcrypto } from 'node:crypto';

// Vitest running on Node < 20.10 may not expose getRandomValues by default.
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}
