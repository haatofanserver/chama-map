import React from 'react';
import { Marker, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useTranslation } from 'react-i18next';
import type { UserGeolocationPosition } from '@/types/geolocation';
import styles from './CurrentPositionMarker.module.css';

interface CurrentPositionMarkerProps {
  position: UserGeolocationPosition | null;
  accuracy?: number;
  isLoading: boolean;
  isPermissionGranted: boolean;
}

// Create a custom icon for the current position marker
const createCurrentPositionIcon = (isLoading: boolean = false) => {
  const loadingClass = isLoading ? ' loading' : '';
  return L.divIcon({
    className: `${styles['current-position-marker']}${loadingClass}`,
    html: `
      <div style="
        width: 16px;
        height: 16px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        position: relative;
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
  });
};

const CurrentPositionMarker: React.FC<CurrentPositionMarkerProps> = ({
  position,
  accuracy,
  isLoading,
  isPermissionGranted
}) => {
  const { t } = useTranslation();

  // Don't render if permission is not granted or no position data
  if (!isPermissionGranted || !position) {
    return null;
  }

  const currentPositionIcon = createCurrentPositionIcon(isLoading);
  const shouldShowAccuracyCircle = accuracy && accuracy > 0;
  const shouldShowWarning = accuracy && accuracy > 1000;

  return (
    <>
      {/* Accuracy circle - render first so it appears behind the marker */}
      {shouldShowAccuracyCircle && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            opacity: 0.5
          }}
        />
      )}

      {/* Current position marker */}
      <Marker
        position={[position.lat, position.lng]}
        icon={currentPositionIcon}
        zIndexOffset={1000} // Ensure it appears above other markers
      >
        <Tooltip
          direction="top"
          offset={[0, -20]}
          opacity={1}
          permanent={false}
        >
          <div>
            {t('geolocation.currentLocation')}
            {shouldShowWarning && (
              <div style={{ color: '#f59e0b', fontSize: '0.8em', marginTop: '2px' }}>
                {t('geolocation.lowAccuracyWarning')}
              </div>
            )}
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

export default CurrentPositionMarker;