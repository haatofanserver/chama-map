---
inclusion: always
---
# Testing Mock Leaflet Interaction Guide

This guide provides comprehensive patterns for mocking complex Leaflet interactions in feature testing, based on the established patterns in this project.

## Testing Framework Configuration

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 10000, // Increase timeout for property-based tests
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File
```typescript
// src/test/setup.ts
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
```

## Core Mocking Strategy

### 1. Leaflet Core Library Mocking

Mock the main Leaflet library with essential components:

```typescript
vi.mock('leaflet', () => ({
  default: {
    // Icon system for markers
    Icon: class MockIcon {
      constructor(options: any) {
        this.options = options;
      }
      options: any;
      static Default = {
        prototype: {},
        mergeOptions: vi.fn(),
      };
    },
    
    // Custom div icons for position markers
    divIcon: vi.fn(() => ({
      options: {},
      createIcon: vi.fn(() => {
        const div = document.createElement('div');
        div.className = 'current-position-marker';
        return div;
      }),
      createShadow: vi.fn(() => null),
    })),
    
    // Control system for custom map controls
    Control: class MockControl {
      protected options: any;
      constructor(options?: any) {
        this.options = options || {};
      }
      onAdd = vi.fn(() => {
        const div = document.createElement('div');
        div.className = 'leaflet-control-custom';
        return div;
      });
      onRemove = vi.fn();
      addTo = vi.fn();
      remove = vi.fn();
    },
    
    // DOM utilities for control creation
    DomUtil: {
      create: vi.fn((tag: string, className: string) => {
        const element = document.createElement(tag);
        element.className = className;
        return element;
      }),
    },
    
    // Event handling utilities
    DomEvent: {
      disableClickPropagation: vi.fn(),
      disableScrollPropagation: vi.fn(),
    },
    
    // SVG renderer configuration
    SVG: {
      prototype: {
        options: { padding: 0.5 },
      },
    },
  },
}));
```

### 2. React Leaflet Component Mocking

Mock React Leaflet components to render as testable DOM elements:

```typescript
vi.mock('react-leaflet', async () => {
  const actual = await vi.importActual('react-leaflet');
  return {
    ...actual,
    
    // Main map container
    MapContainer: ({ children, style, className, center, zoom, zoomControl, ...props }: any) => (
      <div
        data-testid="map-container"
        style={style || {}}
        className={className}
        data-center={center?.join(',')}
        data-zoom={zoom}
        data-zoom-control={zoomControl}
        {...props}
      >
        {children}
      </div>
    ),
    
    // Tile layer for map tiles
    TileLayer: ({ url, attribution, ...props }: any) => (
      <div data-testid="tile-layer" data-url={url} data-attribution={attribution} {...props} />
    ),
    
    // GeoJSON layer for geographic data
    GeoJSON: ({ data, style, onEachFeature, ...props }: any) => (
      <div data-testid="geojson" data-features-count={data?.features?.length || 0} {...props} />
    ),
    
    // Map controls
    ZoomControl: ({ position, ...props }: any) => (
      <div data-testid="zoom-control" data-position={position} {...props} />
    ),
    
    // Markers for point locations
    Marker: ({ children, position, icon, zIndexOffset, ...props }: any) => (
      <div data-testid="marker" data-position={position?.join(',')} data-z-index={zIndexOffset} {...props}>
        {children}
      </div>
    ),
    
    // Circles for accuracy visualization
    Circle: ({ center, radius, pathOptions, ...props }: any) => (
      <div
        data-testid="circle"
        data-center={center?.join(',')}
        data-radius={radius}
        {...props}
      />
    ),
    
    // Tooltips for marker information
    Tooltip: ({ children, direction, offset, opacity, permanent, ...props }: any) => (
      <div
        data-testid="tooltip"
        data-direction={direction}
        data-offset={offset?.join(',')}
        data-opacity={opacity}
        data-permanent={permanent}
        {...props}
      >
        {children}
      </div>
    ),
    
    // Map instance hook with essential methods
    useMap: () => ({
      flyTo: mockFlyTo,
      getZoom: mockGetZoom,
      getCenter: mockGetCenter,
      stop: mockStop,
      addControl: mockAddControl,
      removeControl: mockRemoveControl,
    }),
  };
});
```

### 3. Map Instance Method Mocking

Create mock functions for map interactions:

```typescript
const mockFlyTo = vi.fn();
const mockGetZoom = vi.fn(() => 10);
const mockGetCenter = vi.fn(() => ({ lat: 35.6762, lng: 139.6503 }));
const mockStop = vi.fn();
const mockAddControl = vi.fn();
const mockRemoveControl = vi.fn();
```

## Geolocation API Mocking

### 1. Browser Geolocation API

Mock the browser's geolocation API in test setup:

```typescript
// In src/test/setup.ts
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
```

### 2. Geolocation Hook Mocking

Mock custom geolocation hooks for component testing:

```typescript
const mockUseGeolocation = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

// Configure mock return values
mockUseGeolocation.mockReturnValue({
  position: null,
  error: null,
  isLoading: false,
  isPermissionGranted: false,
  requestLocation: vi.fn(),
  watchPosition: vi.fn(),
  stopWatching: vi.fn(),
});
```

## Testing Patterns and Methodologies

### Property-Based Testing with fast-check

The project extensively uses property-based testing for robust validation:

```typescript
import * as fc from 'fast-check';

// Generate valid coordinates
const positionArbitrary = fc.record({
  lat: fc.double({ min: -89, max: 89, noNaN: true }),
  lng: fc.double({ min: -179, max: 179, noNaN: true }),
  accuracy: fc.double({ min: 1, max: 10000, noNaN: true }),
  timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
});

// Property-based test example
fc.assert(
  fc.property(positionArbitrary, (position) => {
    // Test implementation
  }),
  { numRuns: 100 }
);
```

### Test Categories

#### 1. Unit Tests
- Test individual components in isolation
- Mock all external dependencies
- Focus on component behavior and props

#### 2. Integration Tests
- Test component interactions within map context
- Test with real providers (I18nextProvider, MapContainer)
- Verify cross-component communication

#### 3. End-to-End (E2E) Tests
- Test complete user workflows
- Simulate real user interactions
- Test across different browsers and devices

#### 4. Styling Tests
- Test CSS class application
- Verify accessibility attributes
- Test responsive behavior

#### 5. Internationalization Tests
- Test translation key usage
- Test language switching
- Verify fallback behavior

### Error Boundary Testing

```typescript
// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});
```

## Property-Based Testing Patterns

### 1. Position Data Generation

Use fast-check for generating realistic geographic data:

```typescript
import * as fc from 'fast-check';

// Generate valid coordinates
const positionArbitrary = fc.record({
  lat: fc.double({ min: -89, max: 89, noNaN: true }),
  lng: fc.double({ min: -179, max: 179, noNaN: true }),
  accuracy: fc.double({ min: 1, max: 10000, noNaN: true }),
  timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
});

// Test with property-based approach
fc.assert(
  fc.property(positionArbitrary, (position) => {
    // Test implementation
  }),
  { numRuns: 100 }
);
```

### 2. Error State Testing

Generate different error scenarios:

```typescript
const errorTypeArbitrary = fc.oneof(
  fc.constant('PERMISSION_DENIED'),
  fc.constant('POSITION_UNAVAILABLE'),
  fc.constant('TIMEOUT')
);

// Mock error responses
mockGeolocation.getCurrentPosition.mockImplementation((_success, error) => {
  error({
    code: errorCode,
    message: 'Test error',
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  });
});
```

### 3. User Agent Testing

Test across different browsers and devices:

```typescript
const testUserAgents = [
  {
    name: 'Chrome Desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isMobile: false,
  },
  {
    name: 'iOS Safari',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
    isMobile: true,
  },
  {
    name: 'Android Chrome',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
    isMobile: true,
  },
];

// Mock user agent for testing
Object.defineProperty(navigator, 'userAgent', {
  value: userAgent,
  writable: true,
});
```

### 4. Animation and Performance Testing

```typescript
// Test animation configuration
expect(ANIMATION_CONFIG.DURATION_MIN).toBe(1.0);
expect(ANIMATION_CONFIG.DURATION_MAX).toBe(2.0);
expect(ANIMATION_CONFIG.EASE_LINEARITY).toBe(0.25);

// Test with fake timers
vi.useFakeTimers();
act(() => {
  vi.advanceTimersByTime(300000); // 5 minutes
});
vi.useRealTimers();
```

## Component Integration Testing

### 1. Test Wrapper Setup

Create consistent test wrappers with required providers:

```typescript
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <MapContainer center={[35.6762, 139.6503]} zoom={10} style={{ height: '400px', width: '400px' }}>
      {children}
    </MapContainer>
  </I18nextProvider>
);
```

### 2. Mock Cleanup

Ensure proper mock cleanup between tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // Reset document.hidden for visibility API
  Object.defineProperty(document, 'hidden', {
    value: false,
    writable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers(); // If using fake timers
});
```

### 3. Comprehensive Integration Testing

Test components within full map context:

```typescript
// Mock all child components for isolation
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...props }: any) => (
    <div data-testid="track-marker" data-coordinates={coordinates.join(',')} {...props} />
  ),
}));

vi.mock('./MapEventHandler', () => ({
  default: ({ ...props }: any) => <div data-testid="map-event-handler" {...props} />,
}));

// Test with real map data
const mockJapanData: FeatureCollection<MultiPolygon, PrefectureProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Tokyo',
        nameJp: '東京都',
        visited: true,
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[139.0, 35.0], [140.0, 35.0], [140.0, 36.0], [139.0, 36.0], [139.0, 35.0]]]],
      },
    },
  ],
};
```

## Advanced Mocking Patterns

### 1. Custom Component Mocking

Mock complex child components to isolate testing:

```typescript
// Mock TrackMarker to avoid Leaflet Icon issues
vi.mock('./TrackMarker', () => ({
  default: ({ coordinates, ...props }: any) => (
    <div data-testid="track-marker" data-coordinates={coordinates.join(',')} {...props} />
  ),
}));

// Mock other map components
vi.mock('./MapEventHandler', () => ({
  default: ({ ...props }: any) => <div data-testid="map-event-handler" {...props} />,
}));
```

### 2. Utility Function Mocking

Mock utility functions that interact with Leaflet:

```typescript
vi.mock('@/utils/mapStyles', () => ({
  getFeatureStyle: vi.fn(() => ({})),
}));

vi.mock('@/utils/mapPrefectureUtils', () => ({
  createPrefectureHandlers: vi.fn(() => vi.fn()),
}));
```

### 3. Dynamic Mock Configuration

Configure mocks based on test scenarios:

```typescript
// Configure different geolocation states
const configureGeolocationMock = (state: 'success' | 'error' | 'loading') => {
  switch (state) {
    case 'success':
      mockUseGeolocation.mockReturnValue({
        position: { lat: 35.6762, lng: 139.6503, accuracy: 10, timestamp: Date.now() },
        error: null,
        isLoading: false,
        isPermissionGranted: true,
        requestLocation: vi.fn(),
        watchPosition: vi.fn(),
        stopWatching: vi.fn(),
      });
      break;
    case 'error':
      mockUseGeolocation.mockReturnValue({
        position: null,
        error: { code: 'PERMISSION_DENIED', message: 'Permission denied' },
        isLoading: false,
        isPermissionGranted: false,
        requestLocation: vi.fn(),
        watchPosition: vi.fn(),
        stopWatching: vi.fn(),
      });
      break;
    case 'loading':
      mockUseGeolocation.mockReturnValue({
        position: null,
        error: null,
        isLoading: true,
        isPermissionGranted: true,
        requestLocation: vi.fn(),
        watchPosition: vi.fn(),
        stopWatching: vi.fn(),
      });
      break;
  }
};
```

### 4. Hook Mocking Patterns

Mock custom hooks with comprehensive return values:

```typescript
const mockUseGeolocation = vi.fn();
vi.mock('@/hooks/useGeolocation', () => ({
  useGeolocation: () => mockUseGeolocation(),
}));

// Configure mock return values
mockUseGeolocation.mockReturnValue({
  position: null,
  error: null,
  isLoading: false,
  isPermissionGranted: false,
  requestLocation: vi.fn(),
  watchPosition: vi.fn(),
  stopWatching: vi.fn(),
});
```

### 5. Control Mocking with DOM Elements

Create realistic control mocks that render testable elements:

```typescript
vi.mock('leaflet', () => ({
  default: {
    Control: class MockControl {
      protected options: any;
      constructor(options?: any) {
        this.options = options || {};
      }
      onAdd = vi.fn(() => {
        const div = document.createElement('div');
        div.className = 'leaflet-control-custom';
        // Create testable button element
        const button = document.createElement('button');
        button.setAttribute('data-testid', 'control-button');
        button.setAttribute('aria-label', 'Control Button');
        button.style.minWidth = '44px';
        button.style.minHeight = '44px';
        div.appendChild(button);
        return div;
      });
      onRemove = vi.fn();
      updateState = vi.fn();
    },
  },
}));
```

## Testing Best Practices

### 1. Test Data Attributes

Use data-testid attributes for reliable element selection:

```typescript
// In component mocks
<div data-testid="map-container" data-center={center?.join(',')} data-zoom={zoom}>

// In tests
const mapContainer = container.querySelector('[data-testid="map-container"]');
expect(mapContainer).toBeInTheDocument();
```

### 2. Mock Verification

Verify mock interactions to ensure proper integration:

```typescript
// Verify control was added to map
expect(mockAddControl).toHaveBeenCalled();

// Verify cleanup on unmount
expect(mockRemoveControl).toHaveBeenCalled();

// Verify map navigation
expect(mockFlyTo).toHaveBeenCalledWith([lat, lng], zoom, options);
```

### 3. State Transition Testing

Test component behavior across different states:

```typescript
// Test loading → success transition
act(() => {
  rerender(<Component isLoading={false} position={validPosition} />);
});

// Test error → recovery transition
act(() => {
  rerender(<Component error={null} position={validPosition} />);
});
```

### 4. Internationalization Testing

Test components with different language contexts:

```typescript
// Test with Japanese locale
act(() => {
  i18n.changeLanguage('ja');
});

// Verify translations are used
expect(i18n.t('geolocation.currentLocation')).toBe('現在地');
```

### 5. Accessibility Testing

Verify accessibility attributes and behavior:

```typescript
// Check ARIA attributes
expect(button).toHaveAttribute('aria-label', 'Return to Japan');
expect(button).toHaveAttribute('role', 'button');
expect(button).toHaveAttribute('tabindex', '0');

// Check minimum touch target size
expect(button.style.minWidth).toBe('44px');
expect(button.style.minHeight).toBe('44px');

// Test keyboard navigation
act(() => {
  button.focus();
  fireEvent.keyDown(button, { key: 'Enter' });
});
```

### 6. Error Handling Testing

Test error scenarios and recovery:

```typescript
// Suppress console.error for error tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock function to throw error
mockAddControl.mockImplementationOnce(() => {
  throw new Error('Control creation failed');
});

// Verify error was logged but didn't crash
expect(consoleSpy).toHaveBeenCalledWith(
  expect.stringContaining('Error creating control'),
  expect.any(Error)
);

consoleSpy.mockRestore();
```

### 7. Performance Testing

Test performance-related behavior:

```typescript
// Test rapid interactions
for (let i = 0; i < 5; i++) {
  act(() => {
    fireEvent.click(button);
  });
}

// Should handle rapid clicks gracefully
expect(mockFlyTo.mock.calls.length).toBeGreaterThanOrEqual(1);

// Test cleanup after inactivity
vi.useFakeTimers();
act(() => {
  vi.advanceTimersByTime(300000); // 5 minutes
});
expect(mockClearWatch).toHaveBeenCalled();
vi.useRealTimers();
```

### 8. Cross-Browser Testing

Test across different user agents:

```typescript
const testUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', // Chrome
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)', // iOS Safari
  'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36', // Android
];

testUserAgents.forEach((userAgent) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    writable: true,
  });
  
  // Test component behavior with this user agent
});
```

## Performance Testing Considerations

### 1. Timer Mocking

Use fake timers for testing time-dependent behavior:

```typescript
vi.useFakeTimers();

// Fast-forward time
act(() => {
  vi.advanceTimersByTime(300000); // 5 minutes
});

vi.useRealTimers();
```

### 2. User Agent Mocking

Mock user agent for mobile-specific testing:

```typescript
const originalUserAgent = navigator.userAgent;
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  writable: true,
});

// Restore after test
Object.defineProperty(navigator, 'userAgent', {
  value: originalUserAgent,
  writable: true,
});
```

### 3. Memory Leak Testing

Test for proper cleanup and resource management:

```typescript
// Test multiple re-renders
for (let i = 0; i < 5; i++) {
  rerender(<Component key={i} />);
  
  await waitFor(() => {
    expect(container.querySelector('[data-testid="component"]')).toBeInTheDocument();
  });
}

// Verify no memory leaks by checking mock call counts
expect(mockAddControl.mock.calls.length).toBeLessThanOrEqual(5);
```

### 4. Viewport Testing

Test responsive behavior across different screen sizes:

```typescript
const viewports = [
  { width: 320, height: 568 }, // Mobile portrait
  { width: 768, height: 1024 }, // Tablet
  { width: 1920, height: 1080 } // Desktop
];

viewports.forEach((viewport) => {
  Object.defineProperty(window, 'innerWidth', {
    value: viewport.width,
    writable: true,
  });
  
  // Test component behavior at this viewport size
});
```

## End-to-End Testing Patterns

### 1. Complete User Workflows

Test entire user journeys from start to finish:

```typescript
it('should handle complete user workflow from permission request to position display', () => {
  // Step 1: Initial state - no permission
  // Step 2: User clicks GPS button
  // Step 3: Permission granted, loading state
  // Step 4: Position acquired successfully
  // Step 5: User clicks GPS button again to center map
  // Step 6: Verify final state
});
```

### 2. Error Recovery Scenarios

Test how components handle and recover from errors:

```typescript
it('should handle error recovery scenarios correctly', () => {
  // Step 1: Initial error state
  // Step 2: User attempts retry
  // Step 3: Successful recovery
  // Step 4: Verify final working state
});
```

### 3. Language Switching During Usage

Test internationalization during active component usage:

```typescript
it('should handle language switching during active usage', () => {
  // Step 1: Render in English
  // Step 2: Switch to Japanese
  // Step 3: Verify functionality remains intact
  // Step 4: Switch back to English
  // Step 5: Verify continued functionality
});
```

### 4. Cross-Platform Compatibility

Test across different browsers and devices:

```typescript
it('should work correctly across different browsers and devices', () => {
  // Test with different user agents
  // Test touch vs mouse interactions
  // Test keyboard navigation
  // Verify accessibility across platforms
});
```

## Specialized Testing Scenarios

### 1. Animation Testing

Test animation states and transitions:

```typescript
// Test animation configuration constants
expect(JAPAN_DEFAULT_VIEW.animationOptions.duration).toBe(1.5);
expect(JAPAN_DEFAULT_VIEW.animationOptions.easeLinearity).toBe(0.25);

// Test animation conflict handling
it('should handle animation conflicts correctly', () => {
  // Test with ongoing animation
  // Test rapid clicks during animation
  // Verify animation interruption handling
});
```

### 2. Geolocation Hook Testing

Test custom geolocation hook behavior:

```typescript
// Test permission state changes
// Test position acquisition
// Test error handling
// Test performance optimizations
// Test cleanup behavior
```

### 3. Styling and CSS Testing

Test visual aspects and styling:

```typescript
// Test CSS class application
expect(buttonElement?.className).toContain('return-to-japan-button');
expect(buttonElement?.className).toContain('bg-white');

// Test responsive classes
expect(buttonElement?.className).toContain('w-11'); // Mobile
expect(buttonElement?.className).toContain('sm:w-8'); // Desktop

// Test accessibility styling
expect(buttonElement?.style.minWidth).toBe('44px');
expect(buttonElement?.style.minHeight).toBe('44px');
```

This comprehensive mocking strategy ensures reliable, fast, and maintainable tests for complex Leaflet interactions while avoiding the complexity of actual map rendering in test environments.

## Running testing

No need to add '-- --run' after npm test e.g. `npm test ReturnToJapanButton.test.tsx` instead of `npm test -- --run ReturnToJapanButton.test.tsx`
