# Requirements Document

## Introduction

This feature improves the user experience of prefecture popup positioning in the Haachama Radar map. Currently, when users are zoomed in at high levels and click on a prefecture, the popup always appears at the prefecture center, which may not be visible in the current viewport. This forces the map to navigate to include the center, providing a jarring UX. The solution is to intelligently position the popup at the user's click location when the prefecture center is not visible in the current viewport.

## Glossary

- **Prefecture_Popup**: The popup component that displays information about a clicked prefecture and its associated tracks
- **Prefecture_Center**: The geographic center point of a prefecture, typically used for popup positioning
- **Click_Position**: The geographic coordinates where the user clicked on the map
- **Viewport**: The currently visible area of the map on the user's screen
- **Viewport_Bounds**: The geographic boundaries (north, south, east, west) of the current viewport
- **Smart_Positioning**: The logic that determines whether to use prefecture center or click position for popup placement
- **Map_Navigation**: Automatic panning or zooming that occurs when a popup is positioned outside the viewport

## Requirements

### Requirement 1: Viewport Boundary Detection

**User Story:** As a user, I want the system to detect when a prefecture center is outside my current view, so that popups can be positioned intelligently.

#### Acceptance Criteria

1. WHEN a prefecture is clicked, THE system SHALL determine the current viewport boundaries
2. THE system SHALL check if the prefecture center coordinates are within the current viewport bounds
3. WHEN the prefecture center is within the viewport, THE system SHALL use the center for popup positioning
4. WHEN the prefecture center is outside the viewport, THE system SHALL use the click position for popup positioning
5. THE viewport boundary calculation SHALL account for popup dimensions to ensure full popup visibility

### Requirement 2: Click Position Capture

**User Story:** As a user, I want the system to remember where I clicked on a prefecture, so that popups can appear at that location when appropriate.

#### Acceptance Criteria

1. WHEN a prefecture is clicked, THE system SHALL capture the exact geographic coordinates of the click event
2. THE click position SHALL be passed to the prefecture popup component
3. THE click position SHALL be validated to ensure it falls within the clicked prefecture boundaries
4. WHEN click position is invalid or unavailable, THE system SHALL fall back to prefecture center positioning
5. THE click position SHALL be stored temporarily until the popup is closed or another prefecture is selected

### Requirement 3: Smart Popup Positioning Logic

**User Story:** As a user, I want prefecture popups to appear in logical locations that don't force unwanted map navigation, so that I can maintain my current view context.

#### Acceptance Criteria

1. WHEN the prefecture center is visible in the current viewport, THE popup SHALL be positioned at the prefecture center
2. WHEN the prefecture center is not visible in the current viewport, THE popup SHALL be positioned at the click location
3. THE positioning logic SHALL prevent popups from appearing outside the viewport boundaries
4. WHEN the click position would place the popup outside the viewport, THE system SHALL adjust the position to keep it visible
5. THE popup positioning SHALL maintain consistent behavior across different zoom levels and map sizes

### Requirement 4: Popup Visibility and Accessibility

**User Story:** As a user, I want prefecture popups to always be fully visible and accessible, so that I can interact with their content effectively.

#### Acceptance Criteria

1. THE popup SHALL always be positioned to be fully visible within the current viewport
2. WHEN a popup would extend beyond viewport boundaries, THE system SHALL adjust its position automatically
3. THE popup SHALL maintain appropriate padding from viewport edges for comfortable viewing
4. THE popup positioning SHALL not interfere with existing map controls (GPS button, zoom controls, etc.)
5. THE popup SHALL remain accessible via keyboard navigation regardless of positioning method

### Requirement 5: Performance and Responsiveness

**User Story:** As a user, I want prefecture popup positioning to be fast and responsive, so that the interface feels smooth and immediate.

#### Acceptance Criteria

1. THE viewport boundary calculation SHALL complete within 50ms of prefecture click
2. THE popup positioning decision SHALL not cause noticeable delays in popup appearance
3. THE system SHALL cache viewport calculations to avoid redundant computations
4. THE positioning logic SHALL work efficiently on mobile devices with limited processing power
5. THE popup positioning SHALL not interfere with map rendering performance

### Requirement 6: Integration with Existing Popup System

**User Story:** As a user, I want the improved popup positioning to work seamlessly with existing popup functionality, so that all current features remain available.

#### Acceptance Criteria

1. THE smart positioning SHALL work with the existing PrefecturePopup component without breaking changes
2. THE popup content and functionality SHALL remain identical regardless of positioning method
3. THE popup closing behavior SHALL work consistently for both center-positioned and click-positioned popups
4. THE popup SHALL integrate properly with the existing popup management system (popup refs, state management)
5. THE positioning enhancement SHALL not affect the popup's ability to display track information and navigation

### Requirement 7: Edge Case Handling

**User Story:** As a user, I want the popup positioning to work correctly in unusual situations, so that the feature is reliable across all usage scenarios.

#### Acceptance Criteria

1. WHEN clicking near prefecture boundaries, THE system SHALL handle ambiguous click positions gracefully
2. WHEN the map is at extreme zoom levels, THE positioning logic SHALL adapt appropriately
3. WHEN the viewport is very small (mobile devices), THE system SHALL prioritize popup visibility over exact positioning
4. WHEN multiple rapid clicks occur, THE system SHALL handle position updates without conflicts
5. WHEN map animations are in progress, THE positioning logic SHALL account for changing viewport boundaries

### Requirement 8: Fallback and Error Handling

**User Story:** As a user, I want the popup system to work reliably even when positioning calculations fail, so that I can always access prefecture information.

#### Acceptance Criteria

1. WHEN viewport boundary calculation fails, THE system SHALL fall back to prefecture center positioning
2. WHEN click position capture fails, THE system SHALL use prefecture center as the default position
3. WHEN positioning calculations encounter errors, THE system SHALL log the error and continue with fallback behavior
4. THE system SHALL provide graceful degradation that maintains core popup functionality
5. THE error handling SHALL not prevent users from accessing prefecture information under any circumstances