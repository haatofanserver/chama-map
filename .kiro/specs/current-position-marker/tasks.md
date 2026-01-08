# Implementation Plan: Current Position Marker

## Overview

This implementation plan breaks down the current position marker feature into discrete coding tasks that build incrementally. Each task focuses on a specific component or functionality, with testing integrated throughout to ensure correctness. The implementation follows React and TypeScript best practices while integrating seamlessly with the existing Leaflet-based map architecture.

## Tasks

- [x] 1. Create geolocation hook and types
  - Create `src/hooks/useGeolocation.ts` with position tracking logic
  - Define TypeScript interfaces in `src/types/geolocation.ts`
  - Implement browser Geolocation API integration with error handling
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 1.1 Write property tests for geolocation hook
  - **Property 2: Location acquisition triggers on permission grant**
  - **Property 6: Error states produce appropriate messages**
  - **Property 11: Performance optimization based on app state**
  - **Property 12: Automatic cleanup after inactivity**
  - **Validates: Requirements 1.3, 1.5, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4**

- [x] 2. Implement CurrentPositionMarker component
  - Create `src/components/map/CurrentPositionMarker.tsx`
  - Implement marker rendering with distinctive styling (blue dot with white border)
  - Add accuracy circle rendering with proportional sizing
  - Include localized tooltip with i18n integration
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4, 3.5_

- [x] 2.1 Write property tests for CurrentPositionMarker
  - **Property 1: Permission state controls marker visibility**
  - **Property 3: Position data drives marker display**
  - **Property 4: Accuracy data controls circle rendering**
  - **Property 5: High inaccuracy triggers warnings**
  - **Property 10: Localization consistency**
  - **Validates: Requirements 1.2, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3, 3.5, 7.1, 7.3**

- [x] 3. Create GPS control button component
  - Create `src/components/map/GPSControlButton.tsx`
  - Implement custom Leaflet control with GPS icon
  - Add loading states and disabled states based on permission/availability
  - Position button near existing zoom controls (bottomright)
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7_

- [x] 3.1 Write property tests for GPS control button
  - **Property 7: GPS button state reflects location availability**
  - **Property 8: GPS button click centers map**
  - **Property 9: Loading states are displayed during acquisition**
  - **Validates: Requirements 6.3, 6.4, 6.5, 6.7**

- [x] 4. Add internationalization support
  - Add location-related translations to `public/locales/en/translation.json`
  - Add Japanese translations to `public/locales/ja/translation.json`
  - Include error messages, tooltips, and warning text
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 4.1 Write unit tests for internationalization
  - Test translation key usage and fallbacks
  - Test language switching behavior
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [x] 5. Integrate components into JapanMap
  - Modify `src/components/map/JapanMap.tsx` to include geolocation components
  - Add useGeolocation hook integration
  - Render CurrentPositionMarker and GPSControlButton conditionally
  - Handle permission states and error display
  - _Requirements: 1.4, 4.3, 4.4, 4.5_

- [x] 5.1 Write integration tests
  - Test component integration within JapanMap
  - Test error handling and permission flows
  - **Validates: Requirements 1.4, 4.3, 4.4, 4.5**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add CSS styling and animations
  - Create `src/components/map/CurrentPositionMarker.module.css`
  - Style position marker with blue dot and white border
  - Style accuracy circle with semi-transparent appearance
  - Add smooth transitions for position updates
  - _Requirements: 2.2, 3.4_

- [x] 7.1 Write unit tests for styling
  - Test CSS class application
  - Test visual distinction from track markers
  - **Validates: Requirements 2.2, 3.4**

- [x] 8. Implement performance optimizations
  - Add visibility-based geolocation options in useGeolocation hook
  - Implement automatic cleanup and restart logic
  - Add configurable update intervals for mobile optimization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8.1 Write property tests for performance features
  - **Property 11: Performance optimization based on app state**
  - **Property 12: Automatic cleanup after inactivity**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 9. Final integration and testing
  - Test complete feature with real geolocation data
  - Verify error handling across different scenarios
  - Test internationalization with both English and Japanese
  - Ensure no conflicts with existing map functionality
  - _Requirements: All requirements_

- [x] 9.1 Write end-to-end property tests
  - Test complete user workflows
  - Test error recovery scenarios
  - **Validates: All requirements**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- All geolocation functionality gracefully degrades when browser support is unavailable
- Performance optimizations prevent battery drain on mobile devices
- Internationalization follows existing i18n patterns in the codebase