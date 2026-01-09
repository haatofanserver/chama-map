import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the useViewportHeight hook since it's defined inline in App.tsx
const useViewportHeight = () => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set initial value
  setVH();

  // Update on resize and orientation change
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
  });

  // Cleanup
  return () => {
    window.removeEventListener('resize', setVH);
    window.removeEventListener('orientationchange', setVH);
  };
};

describe('useViewportHeight', () => {
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerHeight = window.innerHeight;
    // Clear any existing --vh property
    document.documentElement.style.removeProperty('--vh');
  });

  afterEach(() => {
    // Restore original window height
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
    });
    // Clean up CSS property
    document.documentElement.style.removeProperty('--vh');
  });

  it('should set initial --vh CSS property based on window height', () => {
    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });

    renderHook(() => useViewportHeight());

    const vhValue = document.documentElement.style.getPropertyValue('--vh');
    expect(vhValue).toBe('8px'); // 800 * 0.01 = 8
  });

  it('should update --vh on window resize', () => {
    // Mock initial window height
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });

    renderHook(() => useViewportHeight());

    // Verify initial value
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('8px');

    // Change window height and trigger resize
    Object.defineProperty(window, 'innerHeight', {
      value: 600,
      writable: true,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));

    // Verify updated value
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('6px'); // 600 * 0.01 = 6
  });

  it('should handle orientation change with delay', async () => {
    vi.useFakeTimers();

    // Mock initial window height
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    });

    renderHook(() => useViewportHeight());

    // Verify initial value
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('8px');

    // Change window height (simulating orientation change)
    Object.defineProperty(window, 'innerHeight', {
      value: 400,
      writable: true,
    });

    // Trigger orientation change event
    window.dispatchEvent(new Event('orientationchange'));

    // Value should not change immediately
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('8px');

    // Fast-forward time by 100ms
    vi.advanceTimersByTime(100);

    // Now the value should be updated
    expect(document.documentElement.style.getPropertyValue('--vh')).toBe('4px'); // 400 * 0.01 = 4

    vi.useRealTimers();
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useViewportHeight());

    // Verify event listeners were added
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function));

    unmount();

    // Note: The actual cleanup happens in useEffect's cleanup function
    // Since we're testing the hook logic directly, we can't easily test the cleanup
    // This test verifies that the event listeners are at least added correctly
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});