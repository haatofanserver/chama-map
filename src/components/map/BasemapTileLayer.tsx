import { useCallback, useMemo, useState } from 'react';
import { TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { TileErrorEvent } from 'leaflet';
import {
  buildCartoTileUrl,
  CARTO_TILE_ATTRIBUTION,
  CARTO_TILE_URL,
  GSI_PALE_TILE_ATTRIBUTION,
  GSI_PALE_TILE_URL,
  shouldUseJapaneseBasemap,
} from '@/constants/mapTileConstants';

interface BasemapTileLayerProps {
  useJapaneseSource: boolean;
}

export default function BasemapTileLayer({ useJapaneseSource }: BasemapTileLayerProps) {
  const map = useMap();
  const [viewKey, setViewKey] = useState(0);

  useMapEvents({
    moveend: () => setViewKey((key) => key + 1),
    zoomend: () => setViewKey((key) => key + 1),
  });

  const useGsi = useMemo(() => {
    void viewKey;
    return shouldUseJapaneseBasemap(map, useJapaneseSource);
  }, [map, useJapaneseSource, viewKey]);
  const url = useGsi ? GSI_PALE_TILE_URL : CARTO_TILE_URL;
  const attribution = useGsi ? GSI_PALE_TILE_ATTRIBUTION : CARTO_TILE_ATTRIBUTION;

  const handleTileError = useCallback(
    (event: TileErrorEvent) => {
      if (!useGsi || !event.coords) return;

      const tile = event.tile as HTMLImageElement;
      if (tile.dataset.cartoFallback === 'true') return;

      tile.dataset.cartoFallback = 'true';
      tile.src = buildCartoTileUrl(event.coords);
    },
    [useGsi]
  );

  const eventHandlers = useMemo(
    () => ({
      tileerror: handleTileError,
    }),
    [handleTileError]
  );

  return <TileLayer url={url} attribution={attribution} eventHandlers={eventHandlers} />;
}
