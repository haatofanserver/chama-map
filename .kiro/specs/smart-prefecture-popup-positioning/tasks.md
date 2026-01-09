# Implementation Plan: Smart Prefecture Popup Positioning

## Overview

This implementation plan converts the smart prefecture popup positioning design into discrete coding tasks. The approach focuses on enhancing the existing prefecture click handling system to capture click positions, detect viewport boundaries, and intelligently position popups based on whether the prefecture center is visible in the current viewport.

## Tasks

- [x] 1. Create viewport calculation utilities
  - Implement ViewportCalculator class with boundary detection methods
  - Add methods for point containment checking and position adjustment
  - Include caching mechanism for viewport calculations
  - _Requirements: 1.1, 1.2, 5.3_

- [ ]* 1.1 Write property test for viewport boundary detection
  - **Property 1: Viewport Boundary Detection**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Write property test for prefecture center containment logic
  - **Property 2: Prefecture Center Containment Logic**
  - **Validates: Requirements 1.2**

- [x] 2. Enhance prefecture click handling to capture click positions
  - Modify createPrefectureHandlers to capture click event coordinates
  - Add click position validation against prefecture boundaries
  - Implement smart positioning decision logic
  - _Requirements: 2.1, 2.2, 2.3, 1.3, 1.4_

- [ ]* 2.1 Write property test for click position capture and validation
  - **Property 4: Click Position Capture and Validation**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 2.2 Write property test for smart positioning decision
  - **Property 3: Smart Positioning Decision**
  - **Validates: Requirements 1.3, 1.4, 3.1, 3.2**

- [x] 3. Update PrefecturePopup component for dynamic positioning
  - Modify PrefecturePopup to accept SmartPositionConfig
  - Implement position adjustment logic for viewport visibility
  - Add popup visibility constraints and padding calculations
  - _Requirements: 3.3, 4.1, 4.3, 3.4, 4.2_

- [ ]* 3.1 Write property test for popup visibility constraints
  - **Property 5: Popup Visibility Constraint**
  - **Validates: Requirements 1.5, 3.3, 4.1, 4.3**

- [ ]* 3.2 Write property test for position adjustment
  - **Property 6: Position Adjustment for Viewport Bounds**
  - **Validates: Requirements 3.4, 4.2**

- [x] 4. Implement control collision detection
  - Add logic to detect existing map control positions
  - Implement popup positioning that avoids control overlap
  - Ensure consistent behavior across different screen sizes
  - _Requirements: 4.4_

- [ ]* 4.1 Write property test for control collision avoidance
  - **Property 8: Control Collision Avoidance**
  - **Validates: Requirements 4.4**

- [x] 5. Update JapanMap component integration
  - Modify prefecture selection handler to pass position configuration
  - Update state management to handle SmartPositionConfig
  - Ensure proper data flow between components
  - _Requirements: 6.2, 6.3_

- [ ]* 5.1 Write property test for content consistency
  - **Property 10: Content Consistency Across Positioning Methods**
  - **Validates: Requirements 6.2**

- [ ]* 5.2 Write property test for popup closing behavior
  - **Property 11: Popup Closing Behavior Consistency**
  - **Validates: Requirements 6.3**

- [-] 6. Checkpoint - Ensure core functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add error handling and fallback mechanisms
  - Implement fallback to prefecture center on viewport calculation failures
  - Add error handling for invalid click positions
  - Include graceful degradation for positioning errors
  - _Requirements: 8.1, 8.2, 8.3, 2.4_

- [ ]* 7.1 Write property test for fallback positioning
  - **Property 12: Fallback Positioning on Errors**
  - **Validates: Requirements 2.4, 8.1, 8.2, 8.3**

- [ ] 8. Implement positioning consistency across map states
  - Add logic to maintain consistent behavior across zoom levels
  - Ensure positioning works correctly with different map sizes
  - Test behavior with extreme zoom levels and small viewports
  - _Requirements: 3.5, 7.2, 7.3_

- [ ]* 8.1 Write property test for positioning consistency
  - **Property 7: Positioning Consistency Across Map States**
  - **Validates: Requirements 3.5**

- [ ] 9. Add viewport calculation caching optimization
  - Implement caching mechanism for repeated viewport calculations
  - Add cache invalidation when map state changes
  - Optimize performance for mobile devices
  - _Requirements: 5.3_

- [ ]* 9.1 Write property test for viewport calculation caching
  - **Property 9: Viewport Calculation Caching**
  - **Validates: Requirements 5.3**

- [ ] 10. Handle edge cases and boundary conditions
  - Implement handling for clicks near prefecture boundaries
  - Add logic for very small viewports prioritizing visibility
  - Include state management for temporary click position storage
  - _Requirements: 7.1, 7.3, 2.5_

- [ ]* 10.1 Write unit tests for edge cases
  - Test boundary click handling and small viewport behavior
  - Test click position storage and cleanup
  - _Requirements: 7.1, 7.3, 2.5_

- [ ] 11. Final integration and testing
  - Wire all components together for end-to-end functionality
  - Ensure backward compatibility with existing popup system
  - Verify performance meets requirements
  - _Requirements: 6.1, 6.4, 6.5_

- [ ]* 11.1 Write integration tests
  - Test complete click-to-popup workflow with smart positioning
  - Test integration with existing popup management system
  - _Requirements: 6.1, 6.4, 6.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- Integration tests ensure components work together correctly
- Checkpoints ensure incremental validation of functionality