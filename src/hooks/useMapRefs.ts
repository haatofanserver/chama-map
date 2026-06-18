import React, { useMemo, useRef } from 'react';
import L from 'leaflet';
import type { TrackMarkerHandle } from '../components/map/TrackMarker';
import type { PopupOpeningControl } from '@/types/map';

export const useMapRefs = () => {
  const markerRefs = useRef<Record<string, React.RefObject<TrackMarkerHandle | null>[]>>({});
  const popupRef = useRef<L.Popup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const isPopupOpeningRef = useRef(false);

  const popupOpening = useMemo<PopupOpeningControl>(
    () => ({
      markOpening: () => {
        isPopupOpeningRef.current = true;
      },
      markClosed: () => {
        isPopupOpeningRef.current = false;
      },
      isOpening: () => isPopupOpeningRef.current,
    }),
    []
  );

  const registerMarkerRef = (prefName: string, idx: number) => {
    if (!markerRefs.current[prefName]) markerRefs.current[prefName] = [];
    if (!markerRefs.current[prefName][idx]) {
      markerRefs.current[prefName][idx] = React.createRef<TrackMarkerHandle>();
    }
    return markerRefs.current[prefName][idx];
  };

  return {
    markerRefs,
    popupRef,
    mapRef,
    popupOpening,
    registerMarkerRef,
  };
};
