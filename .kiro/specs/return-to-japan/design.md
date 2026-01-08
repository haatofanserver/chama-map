# Design Document: Return to Japan Button

## Overview

This feature adds a dedicated "Return to Japan" button to the Haachama Radar map, providing users with a quick and intuitive way to navigate back to Japan's default view from any location worldwide. The implementation follows established map UI patterns using a house icon to represent the "home" view, positioned alongside existing map controls for consistency.

The feature addresses a critical UX gap where users who use the GPS functionality to view their current location (especially when far from Japan) struggle to return to exploring Haachama's visited locations. This is particularly important for international users who want to use the app as a travel planning tool.

## Architecture

### Component Structure

```
JapanMap (existing)
├── ReturnToJapanButton (new)
│   ├── Custom Leaflet control
│   ├── House icon with hover states
│   ├── Click handler for map navigation
│   └── Loading state during animation
└── Map Controls Layout (updated)
    ├── ZoomControl (existing)
    ├── GPSControlButton (existing)
    └── ReturnToJapanButton (new)
```

### Integration Points

- **JapanMap.tsx**: Main container that manages the new control
- **Leaflet Controls API**: Custom control following existing GPS button pattern
- **React Icons**: Using FaHome icon for universal recognition
- **i18n system**: Existing internationalization for tooltips and ARIA labels
- **Map animation**: Leveraging Leaflet's flyTo method for smooth transitions

## Components and Interfaces

### ReturnToJapanButton Component

```typescript
interface ReturnToJapanButtonProps {
  onReturnToJapan: () => void;
  isAnimating: boolean;
  controlPosition?: 'topright' | 'bottomright' | 'topleft' | 'bottomleft';
}

interface JapanViewConfig {
  center: [number, number]; // [36.2048, 138.2529]
  zoom: number; // 6
  animationOptions: {
    duration: number; // 1.5 seconds
    easeLinearity: number; // 0.25
  };
}
```

**Responsibilities:**
- Render custom Leaflet control with house icon
- Handle click events to trigger Japan navigation
- Show loading state during map animation
- Provide accessible interaction (keyboard, screen readers)
- Position consistently with existing controls

### Custom Leaflet Control Implementation

```typescript
class ReturnToJapanControl extends L.Control {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private onReturnToJapan: () => void;
  private isAnimating: boolean;
  private t: any; // Translation function

  constructor(
    onReturnToJapan: () => void,
    isAnimating: boolean,
    t: any,
    options?: L.ControlOptions
  ) {
    super(options);
    this.onReturnToJapan = onReturnToJapan;
    this.isAnimating = isAnimating;
    this.t = t;
  }

  onAdd(): HTMLElement {
    // Create control container with Leaflet styling
    // Render React component with createRoot
    // Handle event propagation prevention
  }

  updateState(
    onReturnToJapan: () => void,
    isAnimating: boolean,
    t: any
  ): void {
    // Update control state and re-render
  }
}
```

**Key Features:**
- Follows existing GPSControlButton implementation pattern
- Uses React createRoot for component rendering within Leaflet control
- Prevents map event propagation during button interactions
- Supports dynamic state updates for animation feedback

## Data Models

### Japan View Configuration

```typescript
interface JapanViewConfig {
  center: {
    lat: number; // 36.2048
    lng: number; // 138.2529
  };
  zoom: number; // 6
  bounds?: {
    north: number; // 45.5
    south: number; // 30.0
    east: number; // 146.0
    west: number; // 129.0
  };
}

const JAPAN_DEFAULT_VIEW: JapanViewConfig = {
  center: { lat: 36.2048, lng: 138.2529 },
  zoom: 6,
  bounds: {
    north: 45.5,
    south: 30.0,
    east: 146.0,
    west: 129.0
  }
};
```

### Animation Configuration

```typescript
interface FlyToOptions {
  duration: number; // 1.5 seconds for optimal UX
  easeLinearity: number; // 0.25 for smooth deceleration
  noMoveStart?: boolean; // false to trigger move events
}

const JAPAN_ANIMATION_OPTIONS: FlyToOptions = {
  duration: 1.5,
  easeLinearity: 0.25,
  noMoveStart: false
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Now I'll analyze the acceptance criteria to determine which can be tested as properties:

### Property Reflection

After reviewing all properties identified in the prework, I'll consolidate redundant ones:

- Properties 2.1, 2.2, 2.5 can be combined into one comprehensive navigation property
- Properties 3.3, 3.4, 3.5 can be combined into one animation state management property  
- Properties 4.4, 5.3, 5.5 can be combined into one comprehensive localization property
- Properties 7.2, 7.5 can be combined with layout consistency testing

### Converting EARS to Properties

Based on the prework analysis, here are the consolidated correctness properties:

**Property 1: Button visibility across map states**
*For any* map zoom level and position, the Return to Japan button should be visible and accessible
**Validates: Requirements 1.5**

**Property 2: Navigation to Japan coordinates**
*For any* current map position, clicking the Return to Japan button should animate the map to Japan's coordinates (36.2048°N, 138.2529°E) with zoom level 6
**Validates: Requirements 2.1, 2.2, 2.5**

**Property 3: Animation configuration consistency**
*For any* Return to Japan navigation, the flyTo animation should use duration between 1-2 seconds and appropriate easing parameters
**Validates: Requirements 2.3, 2.4**

**Property 4: Interactive state management**
*For any* button interaction (hover, click, animation), the appropriate visual states should be applied and the button should be disabled during animations
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

**Property 5: Keyboard accessibility**
*For any* keyboard interaction (focus, Enter, Space), the button should respond appropriately and trigger the same navigation as mouse clicks
**Validates: Requirements 4.2**

**Property 6: Comprehensive localization**
*For any* language setting (English/Japanese), all button text, tooltips, and ARIA labels should display in the correct language and update when language changes
**Validates: Requirements 4.4, 5.3, 5.5**

**Property 7: Icon consistency across languages**
*For any* language setting, the button should display the same house icon regardless of the selected language
**Validates: Requirements 5.4**

**Property 8: Responsive behavior**
*For any* screen orientation (portrait/landscape) and device type, the button should function correctly and maintain proper positioning
**Validates: Requirements 6.5**

**Property 9: Animation conflict handling**
*For any* concurrent animation requests, the system should handle them gracefully without conflicts or overlapping animations
**Validates: Requirements 7.3**

**Property 10: Non-interference with existing functionality**
*For any* existing map interaction (zoom, pan, GPS, markers), the Return to Japan button should not interfere with or break existing functionality
**Validates: Requirements 7.4**

## Error Handling

### Animation Management
- **Concurrent animations**: Prevent multiple simultaneous flyTo operations by disabling button during animation
- **Animation interruption**: Allow user interactions to interrupt ongoing animations gracefully
- **State cleanup**: Ensure button state resets properly if animation is interrupted

### Accessibility Safeguards
- **Keyboard navigation**: Full keyboard support with proper focus management
- **Screen reader support**: Comprehensive ARIA labels and live region updates
- **High contrast mode**: Ensure button remains visible in high contrast themes

### Performance Considerations
- **Animation optimization**: Use requestAnimationFrame for smooth animations
- **Memory management**: Proper cleanup of event listeners and React roots
- **Mobile optimization**: Touch-friendly sizing and responsive behavior

## Testing Strategy

### Unit Testing Approach
- **Component rendering**: Test button rendering with various props and states
- **Event handling**: Test click, keyboard, and hover interactions
- **State management**: Test animation states and button disable/enable logic
- **Accessibility**: Test ARIA attributes, keyboard navigation, and screen reader support

### Property-Based Testing Configuration
- **Library**: Use `fast-check` for TypeScript property-based testing
- **Iterations**: Minimum 100 iterations per property test
- **Generators**: Custom generators for map positions, zoom levels, language settings, and device orientations
- **Test tagging**: Each property test tagged with format: **Feature: return-to-japan, Property {number}: {property_text}**

### Integration Testing
- **Leaflet integration**: Test custom control integration with Leaflet map
- **Map animation testing**: Test flyTo behavior and animation completion
- **Control positioning**: Test layout and positioning relative to existing controls
- **i18n integration**: Test localization with language switching

### Test Data Generators
```typescript
// Example generators for property-based testing
const mapPositionGenerator = fc.record({
  lat: fc.double({ min: -90, max: 90 }),
  lng: fc.double({ min: -180, max: 180 }),
  zoom: fc.integer({ min: 1, max: 18 })
});

const languageGenerator = fc.oneof(
  fc.constant('en'),
  fc.constant('ja')
);

const deviceOrientationGenerator = fc.oneof(
  fc.constant('portrait'),
  fc.constant('landscape')
);
```

### Example Test Cases
```typescript
// Unit test example
test('should render Return to Japan button with house icon', () => {
  const mockOnReturn = jest.fn();
  render(<ReturnToJapanButton onReturnToJapan={mockOnReturn} isAnimating={false} />);
  
  expect(screen.getByRole('button')).toBeInTheDocument();
  expect(screen.getByLabelText(/return to japan/i)).toBeInTheDocument();
});

// Property test example
test('Property 2: Navigation to Japan coordinates', () => {
  fc.assert(fc.property(mapPositionGenerator, (currentPosition) => {
    // Setup map at current position
    // Click Return to Japan button
    // Verify map animates to Japan coordinates with zoom 6
    expect(finalPosition).toEqual({ lat: 36.2048, lng: 138.2529, zoom: 6 });
  }));
});
```

The testing strategy ensures comprehensive coverage of both specific examples (unit tests) and universal properties (property-based tests), providing confidence in the correctness of the Return to Japan button implementation across all possible map states and user interactions.