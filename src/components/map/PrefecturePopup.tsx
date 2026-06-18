import React, { useMemo } from 'react';
import { Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection, Point, MultiPolygon } from 'geojson';
import type { TrackMarkerHandle } from './TrackMarker';
import { TrackProperties, PrefectureProperties, SmartPositionConfig } from '@/types/map';
import type { Feature } from 'geojson';
import { getGroupingKeyForFeature } from '@/utils/groupTrackFeatures';
import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import { ViewportCalculator, PopupSize } from '@/utils/ViewportCalculator';
import styles from './PrefecturePopup.module.css';

interface PrefecturePopupProps {
  selectedPrefecture: string;
  positionConfig: SmartPositionConfig;
  chamaTrack: FeatureCollection<Point, TrackProperties>;
  japanData: FeatureCollection<MultiPolygon, PrefectureProperties>;
  markerRefs: React.RefObject<Record<string, React.RefObject<TrackMarkerHandle | null>[]>>;
  popupRef: React.RefObject<L.Popup | null>;
  groupedMap?: Record<string, Feature<Point, TrackProperties>[]>;
}

function computePopupPosition(
  map: L.Map | undefined,
  positionConfig: SmartPositionConfig
): [number, number] {
  if (!map || !positionConfig) {
    return positionConfig.prefectureCenter;
  }

  try {
    const defaultPopupSize: PopupSize = {
      width: 300,
      height: 200
    };

    let mapState: { zoom: number; size: { x: number; y: number } } | null = null;
    try {
      mapState = {
        zoom: map.getZoom(),
        size: map.getSize()
      };
    } catch (mapStateError) {
      console.warn('Could not get map state:', mapStateError);
    }

    let basePosition: [number, number];
    try {
      if (positionConfig.useClickPosition) {
        const isValidClick = ViewportCalculator.validateClickPosition(
          positionConfig.clickPosition,
          positionConfig.prefectureCenter
        );
        basePosition = isValidClick ? positionConfig.clickPosition : positionConfig.prefectureCenter;
      } else {
        basePosition = positionConfig.prefectureCenter;
      }

      if (!ViewportCalculator.validateClickPosition(basePosition, positionConfig.prefectureCenter)) {
        basePosition = positionConfig.prefectureCenter;
      }
    } catch (positionError) {
      console.error('Error determining base position:', positionError);
      basePosition = positionConfig.prefectureCenter;
    }

    let adjustedPos: [number, number];
    try {
      adjustedPos = ViewportCalculator.adjustPositionForVisibilityAndControls(
        basePosition,
        positionConfig.viewportBounds,
        defaultPopupSize,
        map
      );

      if (mapState) {
        adjustedPos = ViewportCalculator.applyMapStateSpecificAdjustments(
          adjustedPos,
          basePosition,
          mapState,
          positionConfig.viewportBounds
        );
      }

      if (ViewportCalculator.validateClickPosition(adjustedPos, positionConfig.prefectureCenter)) {
        return adjustedPos;
      }
    } catch (adjustmentError) {
      console.error('Error adjusting position for visibility and controls:', adjustmentError);
    }

    if (positionConfig.useClickPosition) {
      const isValidClick = ViewportCalculator.validateClickPosition(
        positionConfig.clickPosition,
        positionConfig.prefectureCenter
      );
      return isValidClick ? positionConfig.clickPosition : positionConfig.prefectureCenter;
    }

    return positionConfig.prefectureCenter;
  } catch (error) {
    console.error('Unexpected error in PrefecturePopup positioning:', error);
    return positionConfig.prefectureCenter;
  }
}

const PrefecturePopup = ({
  selectedPrefecture,
  positionConfig,
  chamaTrack,
  japanData,
  markerRefs,
  popupRef,
  groupedMap
}: PrefecturePopupProps) => {
  const { t, i18n } = useTranslation();
  const map = useMap();

  const tracks = chamaTrack.features.filter((f) => f.properties.prefecture === selectedPrefecture);

  // Find the center of the prefecture for popup placement
  const feature = japanData?.features.find((f) => f.properties!.nam === selectedPrefecture);

  const popupPosition = useMemo(
    () => computePopupPosition(map, positionConfig),
    [map, positionConfig]
  );

  // Deduplicated groups for the selected prefecture when groupedMap is provided
  const groupedList: Feature<Point, TrackProperties>[][] | null = groupedMap
    ? Object.values(groupedMap).filter(
      (group) => group.length > 0 && group[0].properties.prefecture === selectedPrefecture
    )
    : null;

  return (
    <Popup
      position={popupPosition}
      autoPan={false} // Disable autoPan since we're handling positioning manually
      className={styles['prefecture-popup']}
      ref={(ref) => {
        if (ref) {
          popupRef.current = ref;
        }
      }}
    >
      <div className={styles['popup-container']}>
        <div className={styles['prefecture-title']}>
          <span />
          <span>{i18n.language.startsWith('ja') ? feature?.properties.nam_ja : feature?.properties.nam}</span>
          <button
            className={styles['close-button']}
            onClick={() => {
              if (popupRef.current) {
                popupRef.current.close();
              }
            }}
            aria-label="Close popup"
          >
            <FaXmark />
          </button>
        </div>
        {(groupedList ? groupedList.length > 0 : tracks.length > 0) ? (
          <ul className={styles['locations-list']}>
            {(groupedList ?? tracks.map((f) => [f] as Feature<Point, TrackProperties>[])).map((group, idx: number) => {
              const icon = group[0].properties.icon || null;
              const rep = group[0];
              const label = i18n.language.startsWith('ja') ? rep.properties.nameJp : rep.properties.name;
              const groupCount = group.length;
              const key = getGroupingKeyForFeature(rep, 6);
              return (
                <li key={`${key}-${idx}`} className={styles['location-item']}>
                  <a
                    href="#"
                    className={styles['location-link']}
                    onClick={(e) => {
                      e.preventDefault();
                      const originalIdx = chamaTrack.features.findIndex((f1) => f1 === rep);
                      const ref = markerRefs.current[selectedPrefecture]?.[originalIdx];
                      if (ref && ref.current) {
                        setTimeout(() => {
                          ref.current?.openPopup();
                        }, 100);
                      }
                    }}
                  >
                    {icon && (
                      <>
                        <img src={icon} className={'inline-block h-[1em] w-[1em] mt-[-1px] object-contain'} />
                        &nbsp;
                      </>
                    )}
                    {label}
                    {groupCount > 1 && <span className={styles['location-count']}> ({groupCount})</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles['no-tracks']}>{t('map.noTracks')}</div>
        )}
      </div>
    </Popup>
  );
};

export default PrefecturePopup;
