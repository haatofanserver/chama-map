import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaLocationCrosshairs } from 'react-icons/fa6';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import type { UserGeolocationPosition } from '@/types/geolocation';

interface GPSControlButtonProps {
  onLocate: () => void;
  isLoading: boolean;
  isDisabled: boolean;
  position?: UserGeolocationPosition | null;
  controlPosition?: 'topright' | 'bottomright' | 'topleft' | 'bottomleft';
}

// Custom Leaflet control for GPS button
class GPSControl extends L.Control {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private onLocate: () => void;
  private isLoading: boolean;
  private isDisabled: boolean;
  private t: any;

  constructor(
    onLocate: () => void,
    isLoading: boolean,
    isDisabled: boolean,
    _position: UserGeolocationPosition | null,
    t: any,
    options?: L.ControlOptions
  ) {
    super(options);
    this.onLocate = onLocate;
    this.isLoading = isLoading;
    this.isDisabled = isDisabled;
    this.t = t;
  }

  onAdd(): HTMLElement {
    this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

    // Prevent map events when interacting with the control
    L.DomEvent.disableClickPropagation(this.container);
    L.DomEvent.disableScrollPropagation(this.container);

    // Create React root and render the button
    this.root = createRoot(this.container);
    this.updateButton();

    return this.container;
  }

  onRemove(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.container = null;
  }

  updateButton(): void {
    if (!this.root) return;

    const ButtonComponent = () => (
      <button
        type="button"
        className={`
          w-8 h-8 bg-white border-2 border-gray-300 rounded-sm
          flex items-center justify-center
          hover:bg-gray-50 active:bg-gray-100
          transition-colors duration-150
          ${this.isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${this.isLoading ? 'animate-pulse' : ''}
        `}
        onClick={this.isDisabled ? undefined : this.handleClick}
        disabled={this.isDisabled}
        title={this.getTooltipText()}
        aria-label="Center map on current location"
      >
        <FaLocationCrosshairs
          className={`
            text-gray-700 text-sm
            ${this.isLoading ? 'animate-spin' : ''}
          `}
        />
      </button>
    );

    this.root.render(<ButtonComponent />);
  }

  private handleClick = (): void => {
    if (!this.isDisabled) {
      this.onLocate();
    }
  };

  private getTooltipText(): string {
    if (this.isDisabled) {
      return this.t('geolocation.positionUnavailable');
    }
    if (this.isLoading) {
      return this.t('common.loading');
    }
    return this.t('geolocation.currentLocation');
  }

  // Method to update the control state
  updateState(
    onLocate: () => void,
    isLoading: boolean,
    isDisabled: boolean,
    _position: UserGeolocationPosition | null,
    t: any
  ): void {
    this.onLocate = onLocate;
    this.isLoading = isLoading;
    this.isDisabled = isDisabled;
    this.t = t;
    this.updateButton();
  }
}

const GPSControlButton: React.FC<GPSControlButtonProps> = ({
  onLocate,
  isLoading,
  isDisabled,
  position,
  controlPosition = 'bottomright'
}) => {
  const map = useMap();
  const { t } = useTranslation();
  const controlRef = useRef<GPSControl | null>(null);

  // Handle GPS button click - center map on current position
  const handleLocate = (): void => {
    if (position) {
      // Center map on current position with smooth animation
      map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 15), {
        duration: 1.0,
        easeLinearity: 0.25
      });
    } else {
      // Request new location if no current position
      onLocate();
    }
  };

  useEffect(() => {
    if (!map) return;

    // Create and add the control
    const control = new GPSControl(
      handleLocate,
      isLoading,
      isDisabled,
      position ?? null,
      t,
      { position: controlPosition }
    );

    controlRef.current = control;
    map.addControl(control);

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, controlPosition]);

  // Update control state when props change
  useEffect(() => {
    if (controlRef.current) {
      controlRef.current.updateState(handleLocate, isLoading, isDisabled, position ?? null, t);
    }
  }, [isLoading, isDisabled, position, t]);

  // This component doesn't render anything directly - it manages the Leaflet control
  return null;
};

export default GPSControlButton;