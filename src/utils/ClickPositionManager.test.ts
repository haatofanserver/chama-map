import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClickPositionManager, type ClickPositionState } from './ClickPositionManager';

describe('ClickPositionManager', () => {
  let manager: ClickPositionManager;

  beforeEach(() => {
    // Get a fresh instance for each test
    manager = ClickPositionManager.getInstance();
    manager.clearAllPositions();
    vi.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ClickPositionManager.getInstance();
      const instance2 = ClickPositionManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('storeClickPosition', () => {
    it('should store click position with metadata', () => {
      const position: [number, number] = [35.6762, 139.6503];
      const prefecture = 'Tokyo';

      manager.storeClickPosition(position, prefecture, false, 1.0);

      const recent = manager.getRecentClickPosition(prefecture);
      expect(recent).toBeTruthy();
      expect(recent?.position).toEqual(position);
      expect(recent?.prefecture).toBe(prefecture);
      expect(recent?.isNearBoundary).toBe(false);
      expect(recent?.confidence).toBe(1.0);
    });

    it('should maintain history size limit', () => {
      // Store more than MAX_HISTORY_SIZE positions
      for (let i = 0; i < 15; i++) {
        manager.storeClickPosition([35 + i, 139 + i], `Prefecture${i}`, false, 1.0);
      }

      const stats = manager.getClickStatistics();
      expect(stats.totalClicks).toBeLessThanOrEqual(10); // MAX_HISTORY_SIZE
    });
  });

  describe('handleRapidClicks', () => {
    it('should return new position when no recent clicks exist', () => {
      const position: [number, number] = [35.6762, 139.6503];
      const prefecture = 'Tokyo';

      const result = manager.handleRapidClicks(position, prefecture, false, 1.0);

      expect(result.position).toEqual(position);
      expect(result.prefecture).toBe(prefecture);
      expect(result.confidence).toBe(1.0);
    });

    it('should return higher confidence position during rapid clicks', () => {
      const position1: [number, number] = [35.6762, 139.6503];
      const position2: [number, number] = [35.6800, 139.6600];
      const prefecture = 'Tokyo';

      // Store first click with lower confidence
      manager.storeClickPosition(position1, prefecture, false, 0.7);

      // Rapid click with higher confidence should be preferred
      const result = manager.handleRapidClicks(position2, prefecture, false, 0.9);

      expect(result.position).toEqual(position2);
      expect(result.confidence).toBe(0.9);
    });

    it('should return previous position when it has higher confidence', () => {
      const position1: [number, number] = [35.6762, 139.6503];
      const position2: [number, number] = [35.6800, 139.6600];
      const prefecture = 'Tokyo';

      // Store first click with higher confidence
      manager.storeClickPosition(position1, prefecture, false, 0.9);

      // Rapid click with lower confidence should use previous
      const result = manager.handleRapidClicks(position2, prefecture, false, 0.7);

      expect(result.position).toEqual(position1);
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('clearPrefecturePositions', () => {
    it('should clear positions for specific prefecture only', () => {
      manager.storeClickPosition([35.6762, 139.6503], 'Tokyo', false, 1.0);
      manager.storeClickPosition([34.6937, 135.5023], 'Osaka', false, 1.0);

      manager.clearPrefecturePositions('Tokyo');

      expect(manager.getRecentClickPosition('Tokyo')).toBeNull();
      expect(manager.getRecentClickPosition('Osaka')).toBeTruthy();
    });
  });

  describe('getClickStatistics', () => {
    it('should return correct statistics', () => {
      manager.storeClickPosition([35.6762, 139.6503], 'Tokyo', true, 0.8);
      manager.storeClickPosition([34.6937, 135.5023], 'Osaka', false, 1.0);
      manager.storeClickPosition([35.0116, 135.7681], 'Kyoto', true, 0.6);

      const stats = manager.getClickStatistics();

      expect(stats.totalClicks).toBe(3);
      expect(stats.boundaryClicks).toBe(2);
      expect(stats.averageConfidence).toBeCloseTo(0.8);
      expect(stats.prefecturesClicked).toHaveLength(3);
      expect(stats.prefecturesClicked).toContain('Tokyo');
      expect(stats.prefecturesClicked).toContain('Osaka');
      expect(stats.prefecturesClicked).toContain('Kyoto');
    });

    it('should handle empty history', () => {
      const stats = manager.getClickStatistics();

      expect(stats.totalClicks).toBe(0);
      expect(stats.boundaryClicks).toBe(0);
      expect(stats.averageConfidence).toBe(0);
      expect(stats.prefecturesClicked).toEqual([]);
    });
  });

  describe('automatic cleanup', () => {
    it('should clean up old entries', async () => {
      // Mock Date.now to control timestamps
      const originalNow = Date.now;
      let mockTime = 1000000;
      vi.spyOn(Date, 'now').mockImplementation(() => mockTime);

      // Store a position
      manager.storeClickPosition([35.6762, 139.6503], 'Tokyo', false, 1.0);

      // Advance time beyond cleanup threshold (5 seconds)
      mockTime += 6000;

      // Trigger cleanup by calling getClickStatistics
      const stats = manager.getClickStatistics();

      expect(stats.totalClicks).toBe(0);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });
});