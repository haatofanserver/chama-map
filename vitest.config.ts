import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // Increase timeout to 10 seconds for property-based tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});