import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          motion: ['framer-motion'],
          utils: ['@turf/boolean-point-in-polygon', 'fflate', '@xmldom/xmldom', 'striptags'],
        },
      },
    },
    // Optimize for production
    minify: 'terser',
    target: 'es2020',
  },
  server: {
    port: 3000,
    open: true,
    host: true, // Allow external connections
  },
  preview: {
    port: 3000,
    host: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'leaflet',
      'react-leaflet',
      '@reduxjs/toolkit',
      'react-redux',
      'i18next',
      'react-i18next',
      'framer-motion',
    ],
  },
  // Environment variable handling - no need for define block since we're using import.meta.env
});