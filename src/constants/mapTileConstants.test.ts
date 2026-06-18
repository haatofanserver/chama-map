import { describe, it, expect, vi, beforeEach } from 'vitest';
import L from 'leaflet';
import { buildCartoTileUrl, isMapViewOverJapan, shouldUseJapaneseBasemap } from './mapTileConstants';

describe('mapTileConstants', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isMapViewOverJapan', () => {
    it('returns true when viewport intersects Japan', () => {
      const map = {
        getBounds: () => L.latLngBounds([35, 138], [37, 140]),
      } as L.Map;

      expect(isMapViewOverJapan(map)).toBe(true);
    });

    it('returns false when viewport is far from Japan', () => {
      const map = {
        getBounds: () => L.latLngBounds([40, -75], [42, -73]),
      } as L.Map;

      expect(isMapViewOverJapan(map)).toBe(false);
    });
  });

  describe('shouldUseJapaneseBasemap', () => {
    const outsideJapanMap = (zoom: number) =>
      ({
        getBounds: () => L.latLngBounds([40, -75], [42, -73]),
        getZoom: () => zoom,
      }) as L.Map;

    it('returns false for non-ja locale', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(10), false)).toBe(false);
    });

    it('returns true when viewport is over Japan', () => {
      const map = {
        getBounds: () => L.latLngBounds([35, 138], [37, 140]),
        getZoom: () => 10,
      } as L.Map;

      expect(shouldUseJapaneseBasemap(map, true)).toBe(true);
    });

    it('keeps GSI outside Japan below zoom threshold', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(7), true)).toBe(true);
    });

    it('switches to Carto outside Japan at or above zoom threshold', () => {
      expect(shouldUseJapaneseBasemap(outsideJapanMap(8), true)).toBe(false);
      expect(shouldUseJapaneseBasemap(outsideJapanMap(12), true)).toBe(false);
    });
  });

  describe('buildCartoTileUrl', () => {
    it('builds a Carto tile URL for the given coordinates', () => {
      vi.spyOn(L.Browser, 'retina', 'get').mockReturnValue(false);

      expect(buildCartoTileUrl({ x: 10, y: 20, z: 6 })).toBe(
        'https://c.basemaps.cartocdn.com/light_all/6/10/20.png'
      );
    });
  });
});
