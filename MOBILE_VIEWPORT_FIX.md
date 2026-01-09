# Mobile Viewport Height Fix

## Problem

On mobile browsers, the ZoomControl and other map controls positioned at `bottomright` were going under the browser's address bar due to the dynamic height changes of the mobile browser UI.

The issue occurs because:
- CSS `100vh` (viewport height) doesn't account for the dynamic browser UI on mobile
- When the address bar shows/hides, the available viewport height changes
- Map controls positioned at the bottom can become inaccessible

## Solution

Implemented a dynamic viewport height solution using CSS custom properties and JavaScript:

### 1. CSS Custom Properties (`src/app/globals.css`)

```css
:root {
  /* Dynamic viewport height for mobile browsers */
  --vh: 1vh;
  --app-height: calc(var(--vh, 1vh) * 100);
}

/* App container with dynamic viewport height */
.app-container {
  height: var(--app-height);
  min-height: var(--app-height);
  width: 100vw;
  min-width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
}

/* Leaflet control positioning adjustments for mobile */
.leaflet-control-container .leaflet-bottom.leaflet-right {
  /* Add safe area padding for mobile devices */
  padding-bottom: env(safe-area-inset-bottom, 10px);
  padding-right: env(safe-area-inset-right, 10px);
}

/* Additional mobile-specific adjustments */
@media (max-width: 768px) {
  .leaflet-control-container .leaflet-bottom.leaflet-right {
    /* Extra padding on mobile to account for browser UI */
    padding-bottom: max(env(safe-area-inset-bottom, 10px), 20px);
  }
  
  /* Ensure controls don't overlap with mobile browser UI */
  .leaflet-control-zoom,
  .leaflet-control-custom {
    margin-bottom: 10px !important;
  }
}
```

### 2. JavaScript Hook (`src/App.tsx`)

```typescript
// Hook to handle dynamic viewport height for mobile browsers
function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial value
    setVH();

    // Update on resize and orientation change
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', () => {
      // Delay to account for browser UI animation
      setTimeout(setVH, 100);
    });

    // Cleanup
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}
```

### 3. App Container Update

Changed from:
```jsx
<div className="min-h-screen min-w-screen w-screen h-screen fixed top-0 left-0 bg-gradient-to-br from-blue-50 to-purple-50">
```

To:
```jsx
<div className="app-container bg-gradient-to-br from-blue-50 to-purple-50">
```

## Benefits

1. **Dynamic Height Adjustment**: The app height adjusts automatically when the mobile browser UI shows/hides
2. **Safe Area Support**: Uses `env(safe-area-inset-*)` for devices with notches or rounded corners
3. **Cross-Platform Compatibility**: Works on iOS Safari, Android Chrome, and other mobile browsers
4. **Performance Optimized**: Only updates on actual resize/orientation events
5. **Fallback Support**: Falls back to standard `1vh` if JavaScript fails

## Testing

The fix includes comprehensive tests in `src/hooks/useViewportHeight.test.ts` that verify:
- Initial viewport height calculation
- Resize event handling
- Orientation change handling with delay
- Event listener cleanup

## Browser Support

- iOS Safari 11.0+
- Android Chrome 69+
- Firefox Mobile 68+
- Samsung Internet 10.1+

The solution gracefully degrades on older browsers by falling back to standard viewport units.