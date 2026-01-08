---
inclusion: always
---
# Testing Mock Leaflet Interaction Guide

This guide provides comprehensive patterns for mocking complex Leaflet interactions in feature testing, based on the established patterns in this project.

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

This comprehensive mocking strategy ensures reliable, fast, and maintainable tests for complex Leaflet interactions while avoiding the complexity of actual map rendering in test environments.

## Running testing

No need to add '-- --run' after npm test e.g. `npm test ReturnToJapanButton.test.tsx` instead of `npm test -- --run ReturnToJapanButton.test.tsx`
