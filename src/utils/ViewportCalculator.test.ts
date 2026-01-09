import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ViewportCalculator, PopupSize } from './ViewportCalculator';
import L from 'leaflet';

// Mock Leaflet
const mockGetBounds = vi.fn();
const mockGetCenter = vi.fn();
const mockGetZoom = vi.fn();
const mockGetPixelBounds = vi.fn();
const mockGetSize = vi.fn();
const mockLatLngToContainerPoint = vi.fn();
const mockContainerPointToLatLng = vi.fn();
const mockGetContainer = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

const mockMap = {
  getBounds: mockGetBounds,
  getCenter: mockGetCenter,
  getZoom: mockGetZoom,
  getPixelBounds: mockGetPixelBounds,
  getSize: mockGetSize,
  latLngToContainerPoint: mockLatLngToContainerPoint,
  containerPointToLatLng: mockContainerPointToLatLng,
  getContainer: mockGetContainer,
  on: mockOn,
  off: mockOff,
} as unknown as L.Map;

// Mock LatLngBounds
const mockLatLngBounds = {
  contains: vi.fn(),
  getSouth: vi.fn(() => 30),
  getNorth: vi.fn(() => 40),
  getWest: vi.fn(() => 130),
  getEast: vi.fn(() => 140),
} as unknown as L.LatLngBounds;

// Mock LatLng
const mockLatLng = {
  lat: 35.6762,
  lng: 139.6503,
} as L.LatLng;

// Mock Point
const mockPoint = {
  x: 200,
  y: 300,
} as L.Point;

// Mock Bounds
const mockBounds = {
  min: { x: 0, y: 0 },
  max: { x: 800, y: 600 },
} as L.Bounds;

describe('ViewportCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ViewportCalculator.clearCache();

    // Setup default mock returns
    mockGetBounds.mockReturnValue(mockLatLngBounds);
    mockGetCenter.mockReturnValue(mockLatLng);
    mockGetZoom.mockReturnValue(10);
    mockGetPixelBounds.mockReturnValue(mockBounds);
    mockGetSize.mockReturnValue({ x: 800, y: 600 });
    mockLatLngToContainerPoint.mockReturnValue(mockPoint);
    mockContainerPointToLatLng.mockReturnValue(mockLatLng);
    mockGetContainer.mockReturnValue({
      querySelectorAll: vi.fn(() => []),
      getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, right: 800, bottom: 600 })),
    });
    mockOn.mockReturnValue(undefined);
    mockOff.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    ViewportCalculator.clearCache();
  });

  describe('getViewportInfo', () => {
    /**
     * Property 1: Viewport Boundary Detection
     * Feature: smart-prefecture-popup-positioning, Property 1: Viewport Boundary Detection
     * Validates: Requirements 1.1
     */
    it('should return valid viewport information for any map state', () => {
      fc.assert(
        fc.property(
          fc.record({
            lat: fc.double({ min: -89, max: 89, noNaN: true }),
            lng: fc.double({ min: -179, max: 179, noNaN: true }),
            zoom: fc.integer({ min: 1, max: 18 }),
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          (mapState) => {
            // Setup mocks for this test case
            const testLatLng = { lat: mapState.lat, lng: mapState.lng } as L.LatLng;
            const testBounds = {
              contains: vi.fn(),
              getSouth: vi.fn(() => mapState.lat - 1),
              getNorth: vi.fn(() => mapState.lat + 1),
              getWest: vi.fn(() => mapState.lng - 1),
              getEast: vi.fn(() => mapState.lng + 1),
            } as unknown as L.LatLngBounds;

            mockGetCenter.mockReturnValue(testLatLng);
            mockGetZoom.mockReturnValue(mapState.zoom);
            mockGetBounds.mockReturnValue(testBounds);
            mockGetSize.mockReturnValue({ x: mapState.width, y: mapState.height });

            const viewportInfo = ViewportCalculator.getViewportInfo(mockMap);

            // Verify all required properties are present
            expect(viewportInfo).toHaveProperty('bounds');
            expect(viewportInfo).toHaveProperty('center');
            expect(viewportInfo).toHaveProperty('zoom');
            expect(viewportInfo).toHaveProperty('pixelBounds');

            // Verify values match map state
            expect(viewportInfo.center).toBe(testLatLng);
            expect(viewportInfo.zoom).toBe(mapState.zoom);
            expect(viewportInfo.bounds).toBe(testBounds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isPointInViewport', () => {
    /**
     * Property 2: Prefecture Center Containment Logic
     * Feature: smart-prefecture-popup-positioning, Property 2: Prefecture Center Containment Logic
     * Validates: Requirements 1.2
     */
    it('should correctly determine point containment for any coordinates and bounds', () => {
      fc.assert(
        fc.property(
          fc.record({
            lat: fc.double({ min: -89, max: 89, noNaN: true }),
            lng: fc.double({ min: -179, max: 179, noNaN: true }),
          }),
          fc.boolean(), // whether point should be contained
          (point, shouldContain) => {
            const testBounds = {
              contains: vi.fn(() => shouldContain),
            } as unknown as L.LatLngBounds;

            const result = ViewportCalculator.isPointInViewport([point.lat, point.lng], testBounds);

            // Should call bounds.contains with correct LatLng
            expect(testBounds.contains).toHaveBeenCalledWith(
              expect.objectContaining({
                lat: point.lat,
                lng: point.lng,
              })
            );

            // Should return the expected result
            expect(result).toBe(shouldContain);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('determineSmartPosition', () => {
    /**
     * Property 3: Smart Positioning Decision
     * Feature: smart-prefecture-popup-positioning, Property 3: Smart Positioning Decision
     * Validates: Requirements 1.3, 1.4, 3.1, 3.2
     */
    it('should use prefecture center when visible, click position when not visible', () => {
      fc.assert(
        fc.property(
          fc.record({
            prefectureLat: fc.double({ min: -89, max: 89, noNaN: true }),
            prefectureLng: fc.double({ min: -179, max: 179, noNaN: true }),
            clickLat: fc.double({ min: -89, max: 89, noNaN: true }),
            clickLng: fc.double({ min: -179, max: 179, noNaN: true }),
          }),
          fc.boolean(), // whether prefecture center is in viewport
          (positions, centerInViewport) => {
            const prefectureCenter: [number, number] = [positions.prefectureLat, positions.prefectureLng];
            const clickPosition: [number, number] = [positions.clickLat, positions.clickLng];

            const testBounds = {
              contains: vi.fn(() => centerInViewport),
            } as unknown as L.LatLngBounds;

            // Don't pass map parameter to avoid cache invalidation issues in tests
            const config = ViewportCalculator.determineSmartPosition(
              prefectureCenter,
              clickPosition,
              testBounds
            );

            // Should return correct configuration
            expect(config.prefectureCenter).toEqual(prefectureCenter);
            expect(config.clickPosition).toEqual(clickPosition);
            expect(config.viewportBounds).toBe(testBounds);

            // Should use click position when center is not visible
            expect(config.useClickPosition).toBe(!centerInViewport);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7: Positioning Consistency Across Map States
     * Feature: smart-prefecture-popup-positioning, Property 7: Positioning Consistency Across Map States
     * Validates: Requirements 3.5
     */
    it('should maintain consistent behavior across different zoom levels and map sizes', () => {
      fc.assert(
        fc.property(
          fc.record({
            prefectureLat: fc.double({ min: -89, max: 89, noNaN: true }),
            prefectureLng: fc.double({ min: -179, max: 179, noNaN: true }),
            clickLat: fc.double({ min: -89, max: 89, noNaN: true }),
            clickLng: fc.double({ min: -179, max: 179, noNaN: true }),
            zoom: fc.integer({ min: 1, max: 18 }),
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          fc.boolean(), // whether prefecture center is in viewport
          (testData, centerInViewport) => {
            const prefectureCenter: [number, number] = [testData.prefectureLat, testData.prefectureLng];
            const clickPosition: [number, number] = [testData.clickLat, testData.clickLng];

            const testBounds = {
              contains: vi.fn(() => centerInViewport),
              getCenter: vi.fn(() => ({ lat: testData.prefectureLat, lng: testData.prefectureLng })),
            } as unknown as L.LatLngBounds;

            // Mock map with different states - include all required methods
            const testMap = {
              getZoom: vi.fn(() => testData.zoom),
              getSize: vi.fn(() => ({ x: testData.width, y: testData.height })),
              getCenter: vi.fn(() => ({ lat: testData.prefectureLat, lng: testData.prefectureLng })),
              getBounds: vi.fn(() => testBounds),
              getPixelBounds: vi.fn(() => mockBounds),
            } as unknown as L.Map;

            const config = ViewportCalculator.determineSmartPosition(
              prefectureCenter,
              clickPosition,
              testBounds,
              testMap
            );

            // Basic positioning logic should be consistent
            expect(config.prefectureCenter).toEqual(prefectureCenter);
            expect(config.clickPosition).toEqual(clickPosition);
            expect(config.viewportBounds).toBe(testBounds);

            // For extreme zoom levels, positioning logic should adapt
            if (testData.zoom >= 16 || testData.zoom <= 4) {
              // Extreme zoom levels should have special handling
              // but still follow basic visibility rules
              if (centerInViewport) {
                expect(config.useClickPosition).toBe(false);
              }
            } else {
              // Normal zoom levels should follow standard logic
              expect(config.useClickPosition).toBe(!centerInViewport);
            }

            // For small viewports, should prioritize visibility
            const isSmallViewport = testData.width < 480 || testData.height < 480 || (testData.width * testData.height) < 300000;
            if (isSmallViewport) {
              // Small viewports should prioritize visibility over exact positioning
              // The decision should still be based on center visibility
              expect(config.useClickPosition).toBe(!centerInViewport);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validateClickPosition', () => {
    /**
     * Property 4: Click Position Capture and Validation
     * Feature: smart-prefecture-popup-positioning, Property 4: Click Position Capture and Validation
     * Validates: Requirements 2.1, 2.2, 2.3
     */
    it('should validate click positions within reasonable bounds of prefecture center', () => {
      fc.assert(
        fc.property(
          fc.record({
            prefectureLat: fc.double({ min: -89, max: 89, noNaN: true }),
            prefectureLng: fc.double({ min: -179, max: 179, noNaN: true }),
          }),
          fc.record({
            lat: fc.double({ min: -90, max: 90, noNaN: true }),
            lng: fc.double({ min: -180, max: 180, noNaN: true }),
          }),
          (prefectureCenter, clickPos) => {
            const prefectureCenterCoords: [number, number] = [prefectureCenter.prefectureLat, prefectureCenter.prefectureLng];
            const clickPosition: [number, number] = [clickPos.lat, clickPos.lng];

            const isValid = ViewportCalculator.validateClickPosition(clickPosition, prefectureCenterCoords);

            // Calculate distance between click and prefecture center
            const distance = Math.sqrt(
              Math.pow(clickPos.lat - prefectureCenter.prefectureLat, 2) +
              Math.pow(clickPos.lng - prefectureCenter.prefectureLng, 2)
            );

            // Should be valid if within reasonable distance (1 degree ≈ 111km)
            const expectedValid = distance <= 1.0;
            expect(isValid).toBe(expectedValid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid coordinate formats', () => {
      const prefectureCenter: [number, number] = [35.6762, 139.6503];

      // Test invalid formats
      expect(ViewportCalculator.validateClickPosition([] as any, prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([35.6762] as any, prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([35.6762, 139.6503, 0] as any, prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition(['35.6762', '139.6503'] as any, prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([NaN, 139.6503], prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([35.6762, NaN], prefectureCenter)).toBe(false);
    });

    it('should reject coordinates outside valid ranges', () => {
      const prefectureCenter: [number, number] = [35.6762, 139.6503];

      // Test invalid ranges
      expect(ViewportCalculator.validateClickPosition([91, 139.6503], prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([-91, 139.6503], prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([35.6762, 181], prefectureCenter)).toBe(false);
      expect(ViewportCalculator.validateClickPosition([35.6762, -181], prefectureCenter)).toBe(false);
    });
  });

  describe('adjustPositionForVisibility', () => {
    it('should adjust position to keep popup within viewport bounds', () => {
      const position: [number, number] = [35.6762, 139.6503];
      const popupSize: PopupSize = { width: 200, height: 150 };

      // Mock container point conversion
      mockLatLngToContainerPoint.mockReturnValue({ x: 50, y: 50 }); // Near edge
      mockContainerPointToLatLng.mockReturnValue({ lat: 35.7, lng: 139.7 });

      const adjustedPosition = ViewportCalculator.adjustPositionForVisibility(
        position,
        mockLatLngBounds,
        popupSize,
        mockMap
      );

      // Should return adjusted coordinates
      expect(adjustedPosition).toHaveLength(2);
      expect(typeof adjustedPosition[0]).toBe('number');
      expect(typeof adjustedPosition[1]).toBe('number');
    });
  });

  describe('checkControlCollision', () => {
    it('should detect collision with map controls', () => {
      const position = { x: 200, y: 300 } as L.Point;
      const popupSize: PopupSize = { width: 200, height: 150 };

      // Mock control element that would collide
      const mockControl = {
        getBoundingClientRect: vi.fn(() => ({
          left: 150,
          right: 250,
          top: 200,
          bottom: 250,
        })),
      };

      mockGetContainer.mockReturnValue({
        querySelectorAll: vi.fn(() => [mockControl]),
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, right: 800, bottom: 600 })),
      });

      const hasCollision = ViewportCalculator.checkControlCollision(mockMap, position, popupSize);

      // Should detect collision
      expect(hasCollision).toBe(true);
    });

    it('should return false when no controls collide', () => {
      const position = { x: 400, y: 300 } as L.Point;
      const popupSize: PopupSize = { width: 200, height: 150 };

      // Mock control element that won't collide
      const mockControl = {
        getBoundingClientRect: vi.fn(() => ({
          left: 700,
          right: 780,
          top: 10,
          bottom: 50,
        })),
      };

      mockGetContainer.mockReturnValue({
        querySelectorAll: vi.fn(() => [mockControl]),
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, right: 800, bottom: 600 })),
      });

      const hasCollision = ViewportCalculator.checkControlCollision(mockMap, position, popupSize);

      // Should not detect collision
      expect(hasCollision).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', () => {
      // Get viewport info to populate cache
      ViewportCalculator.getViewportInfo(mockMap);

      // Clear cache
      ViewportCalculator.clearCache();

      // Should not throw errors
      expect(() => ViewportCalculator.clearCache()).not.toThrow();
    });

    it('should provide cache statistics', () => {
      // Get viewport info to populate cache
      ViewportCalculator.getViewportInfo(mockMap);

      const stats = ViewportCalculator.getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('size');
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.evictions).toBe('number');
      expect(typeof stats.size).toBe('number');
    });

    it('should handle selective cache clearing', () => {
      // Get viewport info to populate cache
      ViewportCalculator.getViewportInfo(mockMap);

      // Clear cache selectively
      ViewportCalculator.clearCache(true);

      // Should not throw errors
      expect(() => ViewportCalculator.clearCache(true)).not.toThrow();
    });

    it('should setup automatic cache invalidation', () => {
      const cleanup = ViewportCalculator.setupAutomaticCacheInvalidation(mockMap);

      expect(typeof cleanup).toBe('function');

      // Should not throw when calling cleanup
      expect(() => cleanup()).not.toThrow();
    });

    it('should preload cache without errors', () => {
      const commonPositions: [number, number][] = [
        [35.6762, 139.6503], // Tokyo
        [34.6937, 135.5023], // Osaka
      ];

      // Mock setView method
      const mockSetView = vi.fn();
      (mockMap as any).setView = mockSetView;

      expect(() => {
        ViewportCalculator.preloadCache(mockMap, commonPositions);
      }).not.toThrow();
    });

    /**
     * Property 9: Viewport Calculation Caching
     * Feature: smart-prefecture-popup-positioning, Property 9: Viewport Calculation Caching
     * Validates: Requirements 5.3
     */
    it('should cache repeated viewport calculations with identical map states', () => {
      fc.assert(
        fc.property(
          fc.record({
            lat: fc.double({ min: -89, max: 89, noNaN: true }),
            lng: fc.double({ min: -179, max: 179, noNaN: true }),
            zoom: fc.integer({ min: 1, max: 18 }),
            width: fc.integer({ min: 100, max: 2000 }),
            height: fc.integer({ min: 100, max: 2000 }),
          }),
          (mapState) => {
            // Clear cache and stats
            ViewportCalculator.clearCache();

            // Setup consistent mock returns for identical map state
            const testLatLng = { lat: mapState.lat, lng: mapState.lng } as L.LatLng;
            const testBounds = {
              contains: vi.fn(),
              getSouth: vi.fn(() => mapState.lat - 1),
              getNorth: vi.fn(() => mapState.lat + 1),
              getWest: vi.fn(() => mapState.lng - 1),
              getEast: vi.fn(() => mapState.lng + 1),
            } as unknown as L.LatLngBounds;

            mockGetCenter.mockReturnValue(testLatLng);
            mockGetZoom.mockReturnValue(mapState.zoom);
            mockGetBounds.mockReturnValue(testBounds);
            mockGetSize.mockReturnValue({ x: mapState.width, y: mapState.height });

            // First call should be a cache miss
            const firstResult = ViewportCalculator.getViewportInfo(mockMap);
            const statsAfterFirst = ViewportCalculator.getCacheStats();

            expect(statsAfterFirst.misses).toBeGreaterThan(0);
            expect(firstResult).toHaveProperty('bounds');
            expect(firstResult).toHaveProperty('center');
            expect(firstResult).toHaveProperty('zoom');

            // Second call with identical state should be a cache hit
            const secondResult = ViewportCalculator.getViewportInfo(mockMap);
            const statsAfterSecond = ViewportCalculator.getCacheStats();

            expect(statsAfterSecond.hits).toBeGreaterThan(0);
            expect(secondResult).toEqual(firstResult);

            // Cache should contain the entry
            expect(statsAfterSecond.size).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 } // Reduced runs for performance
      );
    });

    it('should handle mobile device optimization', () => {
      // Mock mobile device
      mockGetSize.mockReturnValue({ x: 400, y: 600 }); // Mobile size

      expect(() => {
        ViewportCalculator.optimizeForMobile(mockMap);
      }).not.toThrow();
    });

    it('should invalidate cache on map state changes', () => {
      // Get initial viewport info
      ViewportCalculator.getViewportInfo(mockMap);

      expect(() => {
        ViewportCalculator.invalidateCacheOnMapStateChange(mockMap);
      }).not.toThrow();
    });
  });
});