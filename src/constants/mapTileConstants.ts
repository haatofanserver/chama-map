import L from 'leaflet';
import { JAPAN_BOUNDS } from '@/constants/japanMapConstants';

export const CARTO_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const CARTO_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const GSI_PALE_TILE_URL = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
export const GSI_PALE_TILE_ATTRIBUTION =
  '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院（地理院タイル）</a>';

/**
 * Ja locale + viewport outside Japan: switch to Carto only when zoom >= this level.
 * Below threshold, keep GSI (e.g. wide world pan). Tweak for testing.
 */
export const OUTSIDE_JAPAN_CARTO_MIN_ZOOM = 8;

export function isMapViewOverJapan(map: L.Map): boolean {
  const japanTileBounds = L.latLngBounds(
    [JAPAN_BOUNDS.south, JAPAN_BOUNDS.west],
    [JAPAN_BOUNDS.north, JAPAN_BOUNDS.east]
  );
  return map.getBounds().intersects(japanTileBounds);
}

/** Whether to use GSI pale tiles (false = Carto). */
export function shouldUseJapaneseBasemap(map: L.Map, useJapaneseSource: boolean): boolean {
  if (!useJapaneseSource) return false;
  if (isMapViewOverJapan(map)) return true;
  return map.getZoom() < OUTSIDE_JAPAN_CARTO_MIN_ZOOM;
}

export function buildCartoTileUrl(coords: { x: number; y: number; z: number }): string {
  return L.Util.template(CARTO_TILE_URL, {
    ...coords,
    s: ['a', 'b', 'c', 'd'][Math.abs(coords.x) % 4],
    r: L.Browser.retina ? '@2x' : ''
  });
}
