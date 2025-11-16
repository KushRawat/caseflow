import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  target: 'node20',
  dts: true,
  minify: false,
  skipNodeModulesBundle: true
});
