import L from 'leaflet';

/**
 * Interface for viewport information containing bounds, center, zoom, and pixel bounds
 */
export interface ViewportInfo {
  bounds: L.LatLngBounds;
  center: L.LatLng;
  zoom: number;
  pixelBounds: L.Bounds;
}

/**
 * Interface for popup size dimensions
 */
export interface PopupSize {
  width: number;
  height: number;
}

/**
 * Interface for smart position configuration
 */
export interface SmartPositionConfig {
  prefectureCenter: [number, number];
  clickPosition: [number, number];
  useClickPosition: boolean;
  viewportBounds: L.LatLngBounds;
  adjustedPosition?: [number, number];
}

/**
 * Interface for control bounds information
 */
export interface ControlBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  element: Element;
  position: string; // 'topright', 'bottomright', etc.
}

/**
 * ViewportCalculator provides utilities for viewport boundary detection,
 * point containment checking, and position adjustment for popup positioning.
 * Includes caching mechanism for performance optimization.
 */
export class ViewportCalculator {
  private static cache = new Map<string, ViewportInfo>();
  private static readonly CACHE_TTL = 1000; // 1 second cache TTL
  private static cacheTimestamps = new Map<string, number>();

  /**
   * Gets comprehensive viewport information from a Leaflet map instance
   * @param map - The Leaflet map instance
   * @returns ViewportInfo containing bounds, center, zoom, and pixel bounds
   */
  static getViewportInfo(map: L.Map): ViewportInfo {
    const cacheKey = ViewportCalculator.generateCacheKey(map);
    const now = Date.now();

    // Check cache validity
    if (ViewportCalculator.cache.has(cacheKey)) {
      const timestamp = ViewportCalculator.cacheTimestamps.get(cacheKey);
      if (timestamp && (now - timestamp) < ViewportCalculator.CACHE_TTL) {
        return ViewportCalculator.cache.get(cacheKey)!;
      }
    }

    // Calculate fresh viewport info
    const viewportInfo: ViewportInfo = {
      bounds: map.getBounds(),
      center: map.getCenter(),
      zoom: map.getZoom(),
      pixelBounds: map.getPixelBounds()
    };

    // Cache the result
    ViewportCalculator.cache.set(cacheKey, viewportInfo);
    ViewportCalculator.cacheTimestamps.set(cacheKey, now);

    return viewportInfo;
  }

  /**
   * Checks if a geographic point is within the viewport bounds
   * @param point - Geographic coordinates as [lat, lng]
   * @param bounds - Leaflet LatLngBounds object
   * @returns true if point is within bounds, false otherwise
   */
  static isPointInViewport(point: [number, number], bounds: L.LatLngBounds): boolean {
    return bounds.contains(L.latLng(point[0], point[1]));
  }

  /**
   * Adjusts a position to ensure popup visibility within viewport bounds
   * @param position - Geographic coordinates as [lat, lng]
   * @param _bounds - Viewport bounds (reserved for future use)
   * @param popupSize - Popup dimensions in pixels
   * @param map - Leaflet map instance for coordinate conversion
   * @returns Adjusted position coordinates
   */
  static adjustPositionForVisibility(
    position: [number, number],
    _bounds: L.LatLngBounds,
    popupSize: PopupSize,
    map: L.Map
  ): [number, number] {
    const padding = 20; // pixels
    let adjustedLat = position[0];
    let adjustedLng = position[1];

    // Convert position to pixel coordinates
    const positionPoint = map.latLngToContainerPoint(L.latLng(position[0], position[1]));

    // Get container size
    const containerSize = map.getSize();

    // Calculate popup bounds in pixels
    const popupLeft = positionPoint.x - popupSize.width / 2;
    const popupRight = positionPoint.x + popupSize.width / 2;
    const popupTop = positionPoint.y - popupSize.height;
    const popupBottom = positionPoint.y;

    // Adjust horizontally if popup extends beyond viewport
    if (popupLeft < padding) {
      const adjustment = padding - popupLeft;
      const adjustedPoint = L.point(positionPoint.x + adjustment, positionPoint.y);
      const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
      adjustedLng = adjustedLatLng.lng;
    } else if (popupRight > containerSize.x - padding) {
      const adjustment = popupRight - (containerSize.x - padding);
      const adjustedPoint = L.point(positionPoint.x - adjustment, positionPoint.y);
      const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
      adjustedLng = adjustedLatLng.lng;
    }

    // Adjust vertically if popup extends beyond viewport
    if (popupTop < padding) {
      const adjustment = padding - popupTop;
      const adjustedPoint = L.point(positionPoint.x, positionPoint.y + adjustment);
      const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
      adjustedLat = adjustedLatLng.lat;
    } else if (popupBottom > containerSize.y - padding) {
      const adjustment = popupBottom - (containerSize.y - padding);
      const adjustedPoint = L.point(positionPoint.x, positionPoint.y - adjustment);
      const adjustedLatLng = map.containerPointToLatLng(adjustedPoint);
      adjustedLat = adjustedLatLng.lat;
    }

    // Ensure adjusted position is still within map bounds
    const mapBounds = map.getBounds();
    adjustedLat = Math.max(mapBounds.getSouth(), Math.min(mapBounds.getNorth(), adjustedLat));
    adjustedLng = Math.max(mapBounds.getWest(), Math.min(mapBounds.getEast(), adjustedLng));

    return [adjustedLat, adjustedLng];
  }

  /**
   * Determines the optimal popup position based on prefecture center visibility
   * @param prefectureCenter - Prefecture center coordinates
   * @param clickPosition - User click coordinates
   * @param viewportBounds - Current viewport bounds
   * @returns SmartPositionConfig with positioning decision
   */
  static determineSmartPosition(
    prefectureCenter: [number, number],
    clickPosition: [number, number],
    viewportBounds: L.LatLngBounds
  ): SmartPositionConfig {
    const centerInViewport = ViewportCalculator.isPointInViewport(prefectureCenter, viewportBounds);

    return {
      prefectureCenter,
      clickPosition,
      useClickPosition: !centerInViewport,
      viewportBounds
    };
  }

  /**
   * Validates that a click position falls within reasonable bounds
   * @param clickPosition - Click coordinates to validate
   * @param prefectureCenter - Prefecture center for fallback validation
   * @returns true if click position is valid, false otherwise
   */
  static validateClickPosition(
    clickPosition: [number, number],
    prefectureCenter: [number, number]
  ): boolean {
    // Check if coordinates are valid numbers
    if (!Array.isArray(clickPosition) || clickPosition.length !== 2) {
      return false;
    }

    const [lat, lng] = clickPosition;

    // Check for valid latitude and longitude ranges
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return false;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return false;
    }

    // Check if click position is reasonably close to prefecture center
    // This helps catch obviously invalid click positions
    const distance = Math.sqrt(
      Math.pow(lat - prefectureCenter[0], 2) + Math.pow(lng - prefectureCenter[1], 2)
    );

    // Allow clicks within ~100km of prefecture center (rough approximation)
    const maxDistance = 1.0; // degrees (approximately 111km at equator)

    return distance <= maxDistance;
  }

  /**
   * Gets all map control positions and their bounds
   * @param map - Leaflet map instance
   * @returns Array of control bounds information
   */
  static getControlBounds(map: L.Map): ControlBounds[] {
    const controlContainers = map.getContainer().querySelectorAll('.leaflet-control');
    const mapRect = map.getContainer().getBoundingClientRect();
    const controls: ControlBounds[] = [];

    for (const control of controlContainers) {
      const controlRect = control.getBoundingClientRect();

      // Skip controls that are not visible or have zero dimensions
      if (controlRect.width === 0 || controlRect.height === 0) {
        continue;
      }

      // Convert control position to map container coordinates
      const controlBounds = {
        left: controlRect.left - mapRect.left,
        right: controlRect.right - mapRect.left,
        top: controlRect.top - mapRect.top,
        bottom: controlRect.bottom - mapRect.top,
        element: control,
        position: ViewportCalculator.getControlPosition(control)
      };

      controls.push(controlBounds);
    }

    return controls;
  }

  /**
   * Determines the position of a control element based on its CSS classes
   * @param control - Control DOM element
   * @returns Control position string
   */
  private static getControlPosition(control: Element): string {
    const classList = control.classList;

    // Handle case where classList is not available (e.g., in tests)
    if (!classList || typeof classList.contains !== 'function') {
      return 'unknown';
    }

    if (classList.contains('leaflet-top') && classList.contains('leaflet-right')) {
      return 'topright';
    } else if (classList.contains('leaflet-bottom') && classList.contains('leaflet-right')) {
      return 'bottomright';
    } else if (classList.contains('leaflet-top') && classList.contains('leaflet-left')) {
      return 'topleft';
    } else if (classList.contains('leaflet-bottom') && classList.contains('leaflet-left')) {
      return 'bottomleft';
    }

    // Fallback: try to determine from parent container
    const parent = control.parentElement;
    if (parent && parent.classList && typeof parent.classList.contains === 'function') {
      const parentClassList = parent.classList;
      if (parentClassList.contains('leaflet-top') && parentClassList.contains('leaflet-right')) {
        return 'topright';
      } else if (parentClassList.contains('leaflet-bottom') && parentClassList.contains('leaflet-right')) {
        return 'bottomright';
      } else if (parentClassList.contains('leaflet-top') && parentClassList.contains('leaflet-left')) {
        return 'topleft';
      } else if (parentClassList.contains('leaflet-bottom') && parentClassList.contains('leaflet-left')) {
        return 'bottomleft';
      }
    }

    return 'unknown';
  }

  /**
   * Checks if there are existing map controls that might interfere with popup positioning
   * @param map - Leaflet map instance
   * @param position - Proposed popup position in container pixels
   * @param popupSize - Popup dimensions
   * @param padding - Additional padding around controls (default: 10px)
   * @returns true if position would collide with controls, false otherwise
   */
  static checkControlCollision(
    map: L.Map,
    position: L.Point,
    popupSize: PopupSize,
    padding: number = 10
  ): boolean {
    const controls = ViewportCalculator.getControlBounds(map);

    // Calculate popup bounds with center-bottom positioning (typical for Leaflet popups)
    const popupBounds = {
      left: position.x - popupSize.width / 2,
      right: position.x + popupSize.width / 2,
      top: position.y - popupSize.height,
      bottom: position.y
    };

    // Check each control for collision with padding
    for (const control of controls) {
      const controlBoundsWithPadding = {
        left: control.left - padding,
        right: control.right + padding,
        top: control.top - padding,
        bottom: control.bottom + padding
      };

      // Check for overlap using standard rectangle intersection test
      if (!(popupBounds.right < controlBoundsWithPadding.left ||
        popupBounds.left > controlBoundsWithPadding.right ||
        popupBounds.bottom < controlBoundsWithPadding.top ||
        popupBounds.top > controlBoundsWithPadding.bottom)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  }

  /**
   * Finds the best position to avoid control collisions
   * @param map - Leaflet map instance
   * @param originalPosition - Original desired position
   * @param popupSize - Popup dimensions
   * @param padding - Padding around controls
   * @returns Adjusted position that avoids control collisions, or original if no better position found
   */
  static findCollisionFreePosition(
    map: L.Map,
    originalPosition: [number, number],
    popupSize: PopupSize,
    padding: number = 10
  ): [number, number] {
    const originalPoint = map.latLngToContainerPoint(L.latLng(originalPosition[0], originalPosition[1]));

    // If no collision, return original position
    if (!ViewportCalculator.checkControlCollision(map, originalPoint, popupSize, padding)) {
      return originalPosition;
    }

    const controls = ViewportCalculator.getControlBounds(map);
    const containerSize = map.getSize();

    // Try different offset strategies
    const offsetStrategies = [
      { x: 0, y: -50 }, // Move up
      { x: -50, y: 0 }, // Move left
      { x: 50, y: 0 },  // Move right
      { x: 0, y: 50 },  // Move down
      { x: -50, y: -50 }, // Move up-left
      { x: 50, y: -50 },  // Move up-right
      { x: -50, y: 50 },  // Move down-left
      { x: 50, y: 50 }    // Move down-right
    ];

    for (const offset of offsetStrategies) {
      const testPoint = L.point(originalPoint.x + offset.x, originalPoint.y + offset.y);

      // Ensure the test point is within the container bounds
      if (testPoint.x < 0 || testPoint.x > containerSize.x ||
        testPoint.y < 0 || testPoint.y > containerSize.y) {
        continue;
      }

      // Check if this position avoids collisions
      if (!ViewportCalculator.checkControlCollision(map, testPoint, popupSize, padding)) {
        const adjustedLatLng = map.containerPointToLatLng(testPoint);
        return [adjustedLatLng.lat, adjustedLatLng.lng];
      }
    }

    // If no collision-free position found, try to find the position with minimal overlap
    let bestPosition = originalPosition;
    let minOverlapArea = Number.MAX_VALUE;

    for (const offset of offsetStrategies) {
      const testPoint = L.point(originalPoint.x + offset.x, originalPoint.y + offset.y);

      if (testPoint.x < 0 || testPoint.x > containerSize.x ||
        testPoint.y < 0 || testPoint.y > containerSize.y) {
        continue;
      }

      const overlapArea = ViewportCalculator.calculateOverlapArea(testPoint, popupSize, controls, padding);
      if (overlapArea < minOverlapArea) {
        minOverlapArea = overlapArea;
        const adjustedLatLng = map.containerPointToLatLng(testPoint);
        bestPosition = [adjustedLatLng.lat, adjustedLatLng.lng];
      }
    }

    return bestPosition;
  }

  /**
   * Calculates the total overlap area between popup and controls
   * @param position - Popup position in container pixels
   * @param popupSize - Popup dimensions
   * @param controls - Array of control bounds
   * @param padding - Padding around controls
   * @returns Total overlap area in square pixels
   */
  private static calculateOverlapArea(
    position: L.Point,
    popupSize: PopupSize,
    controls: ControlBounds[],
    padding: number
  ): number {
    const popupBounds = {
      left: position.x - popupSize.width / 2,
      right: position.x + popupSize.width / 2,
      top: position.y - popupSize.height,
      bottom: position.y
    };

    let totalOverlap = 0;

    for (const control of controls) {
      const controlBoundsWithPadding = {
        left: control.left - padding,
        right: control.right + padding,
        top: control.top - padding,
        bottom: control.bottom + padding
      };

      // Calculate intersection area
      const intersectionLeft = Math.max(popupBounds.left, controlBoundsWithPadding.left);
      const intersectionRight = Math.min(popupBounds.right, controlBoundsWithPadding.right);
      const intersectionTop = Math.max(popupBounds.top, controlBoundsWithPadding.top);
      const intersectionBottom = Math.min(popupBounds.bottom, controlBoundsWithPadding.bottom);

      if (intersectionLeft < intersectionRight && intersectionTop < intersectionBottom) {
        const overlapWidth = intersectionRight - intersectionLeft;
        const overlapHeight = intersectionBottom - intersectionTop;
        totalOverlap += overlapWidth * overlapHeight;
      }
    }

    return totalOverlap;
  }

  /**
   * Adjusts popup position to avoid control collisions while maintaining viewport visibility
   * @param position - Original position coordinates
   * @param bounds - Viewport bounds
   * @param popupSize - Popup dimensions
   * @param map - Leaflet map instance
   * @returns Position adjusted for both viewport visibility and control collision avoidance
   */
  static adjustPositionForVisibilityAndControls(
    position: [number, number],
    bounds: L.LatLngBounds,
    popupSize: PopupSize,
    map: L.Map
  ): [number, number] {
    // First, adjust for viewport visibility
    let adjustedPosition = ViewportCalculator.adjustPositionForVisibility(
      position,
      bounds,
      popupSize,
      map
    );

    // Then, check for control collisions and adjust if necessary
    const collisionFreePosition = ViewportCalculator.findCollisionFreePosition(
      map,
      adjustedPosition,
      popupSize
    );

    // Ensure the final position is still within viewport bounds
    const finalPosition = ViewportCalculator.adjustPositionForVisibility(
      collisionFreePosition,
      bounds,
      popupSize,
      map
    );

    return finalPosition;
  }

  /**
   * Clears the viewport calculation cache
   * Should be called when map state changes significantly
   */
  static clearCache(): void {
    ViewportCalculator.cache.clear();
    ViewportCalculator.cacheTimestamps.clear();
  }

  /**
   * Generates a cache key based on map state
   * @param map - Leaflet map instance
   * @returns Cache key string
   */
  private static generateCacheKey(map: L.Map): string {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const size = map.getSize();

    return `${center.lat.toFixed(6)}_${center.lng.toFixed(6)}_${zoom}_${size.x}_${size.y}`;
  }
}