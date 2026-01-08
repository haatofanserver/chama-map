import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import TrackMarker from './TrackMarker';
import MapEventHandler from './MapEventHandler';
import PrefecturePopup from './PrefecturePopup';
import MapStyles from './MapStyles';
import CurrentPositionMarker from './CurrentPositionMarker';
import GPSControlButton from './GPSControlButton';
import ReturnToJapanButton from './ReturnToJapanButton';
import { TrackProperties, PrefectureProperties } from '@/types/map';
import { useMapRefs } from '@/hooks/useMapRefs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { getFeatureStyle } from '@/utils/mapStyles';
import { createPrefectureHandlers } from '@/utils/mapPrefectureUtils';
// import '@/lib/SmoothWheelZoom';
import { groupMapByNameAndCoordinates } from '@/utils/groupTrackFeatures';
import { useTranslation } from 'react-i18next';

// Fix for default markers in React Leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});
L.SVG.prototype.options.padding = 0.5;

interface JapanMapProps {
  className?: string;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
}

const JapanMap: React.FC<JapanMapProps> = ({ className, japanData, chamaTrack }) => {
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [popupKey, setPopupKey] = useState<number>(0);
  const [isAnimatingToJapan, setIsAnimatingToJapan] = useState<boolean>(false);
  const { markerRefs, popupRef, mapRef, isPopupOpening, registerMarkerRef } = useMapRefs();
  const { i18n, t } = useTranslation();

  // Initialize geolocation hook
  const {
    position,
    error,
    isLoading,
    isPermissionGranted,
    requestLocation,
    watchPosition
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  });

  const groupedChamaTracks = useMemo(() => {
    if (!chamaTrack) return {};
    return groupMapByNameAndCoordinates(chamaTrack, 6);
  }, [chamaTrack]);

  // Handle GPS button click - request location and start watching
  const handleGPSClick = () => {
    if (!isPermissionGranted) {
      requestLocation();
    } else if (!position) {
      requestLocation();
    } else {
      // Position exists, GPS button will center the map (handled in GPSControlButton)
    }

    // Start watching for continuous updates
    if (isPermissionGranted) {
      watchPosition();
    }
  };

  // Handle Return to Japan button click
  const handleReturnToJapan = () => {
    if (!isAnimatingToJapan && mapRef.current) {
      setIsAnimatingToJapan(true);

      // Set up event listeners to track animation completion
      const map = mapRef.current;

      const onMoveEnd = () => {
        setIsAnimatingToJapan(false);
        map.off('moveend', onMoveEnd);
        map.off('zoomend', onZoomEnd);
      };

      const onZoomEnd = () => {
        setIsAnimatingToJapan(false);
        map.off('moveend', onMoveEnd);
        map.off('zoomend', onZoomEnd);
      };

      // Listen for animation completion
      map.on('moveend', onMoveEnd);
      map.on('zoomend', onZoomEnd);

      // Fallback timeout to ensure state is reset even if events don't fire
      setTimeout(() => {
        setIsAnimatingToJapan(false);
        map.off('moveend', onMoveEnd);
        map.off('zoomend', onZoomEnd);
      }, 3000); // 3 seconds should be more than enough for any animation
    }
  };

  // Create prefecture interaction handlers
  const onEachFeature = createPrefectureHandlers(
    (name: string) => {
      // If only one grouped track exists in this prefecture, open it directly
      const groupsForPrefecture = Object.values(groupedChamaTracks).filter(
        (group) => group.length > 0 && group[0].properties.prefecture === name
      );
      if (groupsForPrefecture.length === 1) {
        const rep = groupsForPrefecture[0][0];
        const originalIdx = chamaTrack.features.findIndex((f1) => f1 === rep);
        const ref = markerRefs.current[name]?.[originalIdx];
        if (ref && ref.current) {
          setTimeout(() => {
            ref.current?.openPopup();
          }, 0);
        }
        return;
      }
      // Otherwise show prefecture list popup
      setPopupKey((prev) => prev + 1);
      setSelectedPrefecture(name);
    },
    isPopupOpening,
    chamaTrack
  );

  return (
    <div className={className} style={{ position: 'relative' }}>
      {/* Display geolocation error messages */}
      {error && (
        <div className="absolute top-4 left-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded shadow-lg">
          <div className="text-sm font-medium">
            {error.code === 'PERMISSION_DENIED' && t('geolocation.permissionDenied')}
            {error.code === 'POSITION_UNAVAILABLE' && t('geolocation.positionUnavailable')}
            {error.code === 'TIMEOUT' && t('geolocation.timeout')}
          </div>
          {error.code === 'PERMISSION_DENIED' && (
            <div className="text-xs mt-1">
              {t('geolocation.enableLocationInstructions')}
            </div>
          )}
        </div>
      )}

      <MapContainer
        center={[36.2048, 138.2529]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg shadow-lg"
        zoomControl={false}
      // scrollWheelZoom={false}
      // zoomSnap={1}
      // /** @ts-expect-error smoothWheelZoom is not a valid prop */
      // smoothWheelZoom={true}
      // smoothSensitivity={1}
      >
        <ZoomControl position="bottomright" />

        {/* GPS Control Button */}
        <GPSControlButton
          onLocate={handleGPSClick}
          isLoading={isLoading}
          isDisabled={!navigator.geolocation || (error?.code === 'PERMISSION_DENIED')}
          position={position}
          controlPosition="bottomright"
        />

        {/* Return to Japan Button */}
        <ReturnToJapanButton
          onReturnToJapan={handleReturnToJapan}
          isAnimating={isAnimatingToJapan}
          controlPosition="bottomright"
        />

        <MapEventHandler
          onPopupClose={() => setSelectedPrefecture(null)}
          isPopupOpening={isPopupOpening}
          mapRef={mapRef}
        />

        {!i18n.language.startsWith('ja') ? (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        ) : (
          <TileLayer
            url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
            attribution='出典: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院（地理院タイル）</a>'
          // updateWhenZooming={false}
          />
        )}

        {japanData && (
          <GeoJSON
            data={japanData}
            style={(feature) => getFeatureStyle(feature, chamaTrack)}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Current Position Marker */}
        <CurrentPositionMarker
          position={position}
          accuracy={position?.accuracy}
          isLoading={isLoading}
          isPermissionGranted={isPermissionGranted}
        />

        {/* Render markers for all track */}
        {chamaTrack?.features.map((feature, idx) => {
          // Only render markers for Point geometries
          if (feature.geometry.type !== 'Point') return null;
          const coords = feature.geometry.coordinates as [number, number];
          const name = (feature.properties.name || feature.properties.nameJp || feature.properties.title || '').trim();
          const key = `${name}|${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
          const group = groupedChamaTracks[key];
          return (
            <TrackMarker
              key={idx}
              ref={registerMarkerRef(feature.properties.prefecture, idx)}
              coordinates={coords}
              icon={feature.properties.icon}
              groupedKey={key}
              groupedTracks={group}
              prefecture={feature.properties.prefecture}
            />
          );
        })}

        {/* Prefecture popup */}
        {selectedPrefecture && chamaTrack && (
          <PrefecturePopup
            key={`${selectedPrefecture}-${popupKey}`}
            selectedPrefecture={selectedPrefecture}
            chamaTrack={chamaTrack}
            japanData={japanData}
            markerRefs={markerRefs}
            popupRef={popupRef}
            groupedMap={groupedChamaTracks}
          />
        )}
      </MapContainer>

      <MapStyles />
    </div>
  );
};

export default JapanMap;
