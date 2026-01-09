import React from 'react';
import { PrefectureProperties, TrackProperties, SmartPositionConfig } from '@/types/map';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { Feature, FeatureCollection, Geometry, MultiPolygon, Point, Position } from 'geojson';
import L from 'leaflet';
import { getFeatureStyle, getHoverStyle } from './mapStyles';
import { ViewportCalculator } from './ViewportCalculator';

export function getPrefectureForPoint(
  point: Position,
  prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>
) {
  for (const feature of prefectures.features) {
    if (booleanPointInPolygon(point, feature)) {
      return feature.properties.nam;
    }
  }
  // if no prefecture found, return the closest prefecture, with the prefecture center
  const closestPrefecture = getClosestPrefecture(point, prefectures);
  console.log('No prefecture found for point', point, ', fallback to', closestPrefecture);
  return closestPrefecture;
}

function getClosestPrefecture(point: Position, prefectures: FeatureCollection<MultiPolygon, PrefectureProperties>) {
  let closestPrefecture = '';
  let closestDistance = Infinity;
  for (const feature of prefectures.features) {
    const distance = getDistance(point, feature.properties.center);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPrefecture = feature.properties.nam;
    }
  }
  return closestPrefecture;
}

function getDistance(point: Position, center: Position) {
  return Math.sqrt((point[1] - center[0]) ** 2 + (point[0] - center[1]) ** 2);
}

export const createPrefectureHandlers = (
  setSelectedPrefecture: (name: string, positionConfig: SmartPositionConfig) => void,
  isPopupOpening: React.RefObject<boolean>,
  chamaTrack?: FeatureCollection<Point, TrackProperties>
) => {
  return (feature: Feature<Geometry, PrefectureProperties>, layer: L.Layer) => {
    const prefectureName = feature.properties.nam;
    const prefectureCenter = feature.properties.center;

    layer.on({
      click: (e: L.LeafletMouseEvent) => {
        console.log('prefecture clicked:', prefectureName);

        // Capture click position coordinates
        const clickPosition: [number, number] = [e.latlng.lat, e.latlng.lng];
        console.log('click position captured:', clickPosition);

        // Get map instance and viewport information
        const map = e.target._map as L.Map;
        const viewportBounds = map.getBounds();

        // Validate click position against prefecture boundaries
        const isValidClickPosition = ViewportCalculator.validateClickPosition(
          clickPosition,
          prefectureCenter
        );

        // Additional validation: check if click is within prefecture boundaries
        const clickPoint: Position = [clickPosition[1], clickPosition[0]]; // GeoJSON uses [lng, lat]
        const isWithinPrefecture = booleanPointInPolygon(clickPoint, feature);

        console.log('click position validation:', {
          isValidClickPosition,
          isWithinPrefecture,
          clickPosition,
          prefectureCenter
        });

        // Use validated click position or fall back to prefecture center
        const finalClickPosition = (isValidClickPosition && isWithinPrefecture)
          ? clickPosition
          : prefectureCenter;

        // Determine smart positioning based on prefecture center visibility
        const positionConfig = ViewportCalculator.determineSmartPosition(
          prefectureCenter,
          finalClickPosition,
          viewportBounds
        );

        console.log('smart position config:', positionConfig);

        isPopupOpening.current = true;
        setSelectedPrefecture(prefectureName, positionConfig);
        console.log('selectedPrefecture set to:', prefectureName, 'with position config');

        // Reset flag after a short delay
        setTimeout(() => {
          isPopupOpening.current = false;
        }, 500);
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getHoverStyle());
        layer.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle(getFeatureStyle(feature, chamaTrack));
      }
    });
  };
};
