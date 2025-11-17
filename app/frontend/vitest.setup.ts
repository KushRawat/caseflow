import '@testing-library/jest-dom/vitest';
import './scripts/setup-webcrypto.cjs';
import './src/i18n';

const globalWithActFlag = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean };
if (typeof globalWithActFlag.IS_REACT_ACT_ENVIRONMENT === 'undefined') {
  globalWithActFlag.IS_REACT_ACT_ENVIRONMENT = true;
}
