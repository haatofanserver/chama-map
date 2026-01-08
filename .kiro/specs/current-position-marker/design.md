# Design Document: Current Position Marker

## Overview

This feature adds real-time geolocation capabilities to the Haachama Radar map, displaying the user's current position with a distinctive marker and providing a GPS control button for quick navigation. The implementation leverages the HTML5 Geolocation API integrated with React Leaflet components, following the existing architecture patterns in the codebase.

The feature enhances the "Seichi-junrei" (pilgrimage) experience by helping users understand their proximity to Haachama's visited locations and providing intuitive location-based navigation.

## Architecture

### Component Structure

```
JapanMap (existing)
├── CurrentPositionMarker (new)
│   ├── Position marker with accuracy circle
│   ├── Tooltip with localized text
│   └── Real-time position updates
├── GPSControlButton (new)
│   ├── Custom Leaflet control
│   ├── GPS icon with loading states
│   └── Click handler for map centering
└── GeolocationService (new hook)
    ├── Permission management
    ├── Position tracking
    └── Error handling
```

### Integration Points

- **JapanMap.tsx**: Main container that orchestrates geolocation components
- **useGeolocation hook**: Custom hook managing geolocation state and browser API
- **i18n system**: Existing internationalization for error messages and tooltips
- **Leaflet controls**: Integration with existing zoom controls positioning

## Components and Interfaces

### CurrentPositionMarker Component

```typescript
interface CurrentPositionMarkerProps {
  position: GeolocationPosition | null;
  accuracy?: number;
  isLoading: boolean;
}

interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}
```

**Responsibilities:**
- Render position marker with distinctive styling (blue dot with white border)
- Display accuracy circle when precision data is available
- Show localized tooltip ("Current Location" / "現在地")
- Update position smoothly when location changes

### GPSControlButton Component

```typescript
interface GPSControlButtonProps {
  onLocate: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  position?: 'topright' | 'bottomright' | 'topleft' | 'bottomleft';
}
```

**Responsibilities:**
- Render custom Leaflet control with GPS icon
- Handle click events to center map on current position
- Show loading spinner during location acquisition
- Disable when location permission is denied
- Position near existing zoom controls

### useGeolocation Hook

```typescript
interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isPermissionGranted: boolean;
  requestLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
}

interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT';
  message: string;
}
```

**Responsibilities:**
- Manage browser Geolocation API interactions
- Handle permission requests and status tracking
- Provide position watching with configurable options
- Implement error handling and retry logic
- Optimize battery usage with smart update intervals

## Data Models

### Position Data Structure

```typescript
interface UserPosition {
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracy: number; // meters
  timestamp: number;
  heading?: number; // degrees from north
  speed?: number; // m/s
}
```

### Geolocation Configuration

```typescript
interface GeolocationOptions {
  enableHighAccuracy: boolean;
  timeout: number; // milliseconds
  maximumAge: number; // milliseconds
  watchInterval: number; // milliseconds between updates
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watchInterval: 5000
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I'll analyze the acceptance criteria to determine which can be tested as properties:

### Converting EARS to Properties

Based on the prework analysis, I'll convert the testable acceptance criteria into universally quantified properties, consolidating redundant ones:

**Property 1: Permission state controls marker visibility**
*For any* permission state, when permission is denied, the current position marker should not be rendered and no geolocation API calls should be made
**Validates: Requirements 1.2, 4.3**

**Property 2: Location acquisition triggers on permission grant**
*For any* permission state change from denied/unknown to granted, the geolocation service should automatically begin location acquisition
**Validates: Requirements 1.3, 1.5**

**Property 3: Position data drives marker display**
*For any* valid position data, the current position marker should be rendered at the exact coordinates provided in the data
**Validates: Requirements 2.1, 2.3**

**Property 4: Accuracy data controls circle rendering**
*For any* position data with accuracy information, an accuracy circle should be rendered with radius proportional to the accuracy value
**Validates: Requirements 3.1, 3.2, 3.5**

**Property 5: High inaccuracy triggers warnings**
*For any* position data with accuracy greater than 1000 meters, a warning message about location precision should be displayed
**Validates: Requirements 3.3**

**Property 6: Error states produce appropriate messages**
*For any* geolocation error (timeout, unavailable, permission denied), an appropriate localized error message should be displayed
**Validates: Requirements 4.1, 4.2, 7.2**

**Property 7: GPS button state reflects location availability**
*For any* combination of permission state and location availability, the GPS button should be enabled only when location can be acquired
**Validates: Requirements 6.4, 6.7**

**Property 8: GPS button click centers map**
*For any* valid current position, clicking the GPS button should trigger map centering to that position
**Validates: Requirements 6.3**

**Property 9: Loading states are displayed during acquisition**
*For any* ongoing location acquisition, loading indicators should be visible on both the marker and GPS button
**Validates: Requirements 6.5**

**Property 10: Localization consistency**
*For any* language setting (English/Japanese), all location-related text should use the appropriate translations from the i18n system
**Validates: Requirements 2.4, 7.1, 7.3, 7.5**

**Property 11: Performance optimization based on app state**
*For any* app visibility state (active/background), geolocation options should be optimized accordingly (high accuracy when active, reduced frequency when background)
**Validates: Requirements 5.1, 5.2, 5.4**

**Property 12: Automatic cleanup after inactivity**
*For any* period of user inactivity exceeding the configured timeout, location tracking should automatically stop
**Validates: Requirements 5.3**

## Error Handling

### Permission Management
- **Graceful degradation**: App continues functioning without geolocation when permission is denied
- **Clear messaging**: Localized error messages explain how to enable location access
- **State persistence**: Permission status is tracked and respected across sessions

### Location Acquisition Failures
- **Timeout handling**: 10-second timeout with retry capability
- **Network resilience**: Maintains last known position during connectivity issues
- **Service unavailability**: Graceful fallback when geolocation API is not supported

### Performance Safeguards
- **Battery optimization**: Automatic adjustment of update frequency based on app state
- **Memory management**: Cleanup of watchers and event listeners on component unmount
- **Error boundaries**: Prevent geolocation errors from crashing the application

## Testing Strategy

### Unit Testing Approach
- **Component rendering**: Test marker and button rendering with various props
- **Event handling**: Test click handlers and map interactions
- **State management**: Test hook state transitions and side effects
- **Error scenarios**: Test specific error conditions and edge cases

### Property-Based Testing Configuration
- **Library**: Use `fast-check` for TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Generators**: Custom generators for position data, permission states, and error conditions
- **Test tagging**: Each property test tagged with format: **Feature: current-position-marker, Property {number}: {property_text}**

### Integration Testing
- **Geolocation API mocking**: Mock browser geolocation for consistent testing
- **Map interaction testing**: Test integration with Leaflet map controls
- **i18n integration**: Test localization with different language settings
- **Performance testing**: Verify battery optimization and cleanup behavior

### Test Data Generators
```typescript
// Example generators for property-based testing
const positionGenerator = fc.record({
  lat: fc.double({ min: -90, max: 90 }),
  lng: fc.double({ min: -180, max: 180 }),
  accuracy: fc.double({ min: 1, max: 10000 })
});

const permissionStateGenerator = fc.oneof(
  fc.constant('granted'),
  fc.constant('denied'), 
  fc.constant('prompt')
);
```

The testing strategy ensures comprehensive coverage of both specific examples (unit tests) and universal properties (property-based tests), providing confidence in the correctness of the geolocation implementation across all possible inputs and states.