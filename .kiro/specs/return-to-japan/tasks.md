# Implementation Plan: Return to Japan Button

## Overview

This implementation plan breaks down the Return to Japan button feature into discrete coding tasks that build incrementally. Each task focuses on a specific component or functionality, with testing integrated throughout to ensure correctness. The implementation follows the existing GPSControlButton pattern while adding new functionality for quick navigation back to Japan's default map view.

## Tasks

- [x] 1. Create ReturnToJapanButton component and types
  - Create `src/components/map/ReturnToJapanButton.tsx` following GPSControlButton pattern
  - Define TypeScript interfaces for props and configuration
  - Implement custom Leaflet control with React integration
  - Add house icon using React Icons (FaHome)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Write property tests for ReturnToJapanButton component
  - **Property 1: Button visibility across map states**
  - **Property 7: Icon consistency across languages**
  - **Property 8: Responsive behavior**
  - **Validates: Requirements 1.5, 5.4, 6.5**

- [ ] 2. Implement Japan navigation functionality
  - Add Japan view configuration constants (coordinates, zoom, animation options)
  - Implement flyTo animation with proper duration and easing
  - Add animation state management to prevent concurrent animations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Write property tests for navigation functionality
  - **Property 2: Navigation to Japan coordinates**
  - **Property 3: Animation configuration consistency**
  - **Property 9: Animation conflict handling**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 7.3**

- [ ] 3. Add interactive states and accessibility
  - Implement hover, active, and loading states for the button
  - Add keyboard accessibility (focus, Enter, Space key handling)
  - Include proper ARIA labels and screen reader support
  - Add button disable/enable logic during animations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2_

- [ ]* 3.1 Write property tests for interactive states
  - **Property 4: Interactive state management**
  - **Property 5: Keyboard accessibility**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 4.2**

- [ ] 4. Add internationalization support
  - Add Return to Japan translations to `public/locales/en/translation.json`
  - Add Japanese translations to `public/locales/ja/translation.json`
  - Include tooltip text, ARIA labels, and button descriptions
  - Integrate with existing i18n system for dynamic language switching
  - _Requirements: 4.3, 4.4, 5.1, 5.2, 5.3, 5.5_

- [ ]* 4.1 Write property tests for internationalization
  - **Property 6: Comprehensive localization**
  - **Validates: Requirements 4.4, 5.3, 5.5**

- [ ]* 4.2 Write unit tests for specific translations
  - Test English tooltip text "Return to Japan"
  - Test Japanese tooltip text "日本に戻る"
  - Test ARIA label localization
  - **Validates: Requirements 4.3, 5.1, 5.2**

- [ ] 5. Integrate ReturnToJapanButton into JapanMap
  - Modify `src/components/map/JapanMap.tsx` to include the new button
  - Position button in bottomright area with existing controls
  - Add animation state management to JapanMap component
  - Handle button click events and map navigation
  - _Requirements: 1.3, 7.1, 7.4_

- [ ]* 5.1 Write integration tests
  - Test component integration within JapanMap
  - Test positioning relative to existing controls
  - **Property 10: Non-interference with existing functionality**
  - **Validates: Requirements 1.3, 7.1, 7.4**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add CSS styling and responsive design
  - Create consistent styling with existing map controls
  - Ensure proper touch targets for mobile devices (minimum 44px)
  - Add responsive behavior for different screen sizes and orientations
  - Test accessibility color contrast requirements
  - _Requirements: 1.4, 4.5, 6.3, 7.2, 7.5_

- [ ]* 7.1 Write unit tests for styling and accessibility
  - Test CSS class application and consistency
  - Test minimum touch target size (44px)
  - Test color contrast compliance
  - **Validates: Requirements 1.4, 4.5, 6.3, 7.2**

- [ ] 8. Performance optimization and error handling
  - Optimize animation performance for mobile devices
  - Add proper cleanup of event listeners and React roots
  - Implement graceful handling of animation interruptions
  - Add error boundaries for component failures
  - _Requirements: 6.1, 6.2, 6.4_

- [ ]* 8.1 Write unit tests for error handling
  - Test animation interruption scenarios
  - Test component cleanup on unmount
  - Test error boundary behavior
  - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ] 9. Final integration and cross-browser testing
  - Test complete feature across different browsers and devices
  - Verify no conflicts with existing GPS and zoom controls
  - Test animation smoothness and performance
  - Ensure consistent behavior across all supported platforms
  - _Requirements: All requirements_

- [ ]* 9.1 Write end-to-end property tests
  - Test complete user workflows from any map position
  - Test interaction with existing map controls
  - Test language switching during button usage
  - **Validates: All requirements**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Integration tests ensure the button works seamlessly with existing map functionality
- The implementation follows the existing GPSControlButton pattern for consistency
- All functionality gracefully degrades and maintains accessibility standards
- Performance optimizations ensure smooth operation on mobile devices