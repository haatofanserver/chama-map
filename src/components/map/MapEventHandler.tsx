import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { PopupEvent } from 'leaflet';
import type { PopupOpeningControl } from '@/types/map';
import { normalizeLongitude } from '@/constants/japanMapConstants';

interface MapEventHandlerProps {
  onPopupClose: () => void;
  popupOpening: PopupOpeningControl;
  mapRef: React.RefObject<L.Map | null>;
}

const wrapMapCenterToCanonicalLongitude = (map: L.Map): void => {
  const center = map.getCenter();
  const wrappedLng = normalizeLongitude(center.lng);
  if (wrappedLng !== center.lng) {
    map.setView([center.lat, wrappedLng], map.getZoom(), { animate: false });
  }
};

const MapEventHandler = ({ onPopupClose, popupOpening, mapRef }: MapEventHandlerProps) => {
  const map = useMapEvents({
    moveend: () => {
      wrapMapCenterToCanonicalLongitude(map);
    },
    popupclose: (e: PopupEvent) => {
      console.log('popup closed via map event', e);
      console.log('isPopupOpening:', popupOpening.isOpening());
      // Only close if it's not during popup opening
      if (!popupOpening.isOpening()) {
        console.log('closing prefecture popup');
        onPopupClose();
      } else {
        console.log('ignoring popup close during opening');
      }
    }
  });

  // Store map reference
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return null;
};

export default MapEventHandler;
