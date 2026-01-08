// Test setup file for vitest
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock permissions API
const mockPermissions = {
  query: vi.fn(),
};

Object.defineProperty(global.navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
});

// Mock document.hidden for visibility API
Object.defineProperty(document, 'hidden', {
  value: false,
  writable: true,
});

export { mockGeolocation, mockPermissions };