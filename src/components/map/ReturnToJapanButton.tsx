import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaHome } from 'react-icons/fa';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import type { JapanViewConfig } from '@/types/geolocation';

interface ReturnToJapanButtonProps {
  onReturnToJapan: () => void;
  isAnimating: boolean;
  controlPosition?: 'topright' | 'bottomright' | 'topleft' | 'bottomleft';
}

// Japan default view configuration
export const JAPAN_DEFAULT_VIEW: JapanViewConfig = {
  center: [36.2048, 138.2529],
  zoom: 6,
  animationOptions: {
    duration: 1.5,
    easeLinearity: 0.25
  }
};

// Custom Leaflet control for Return to Japan button
class ReturnToJapanControl extends L.Control {
  private container: HTMLDivElement | null = null;
  private root: any = null;
  private onReturnToJapan: () => void;
  private isAnimating: boolean;
  private t: any;

  constructor(
    onReturnToJapan: () => void,
    isAnimating: boolean,
    t: any,
    options?: L.ControlOptions
  ) {
    super(options);
    this.onReturnToJapan = onReturnToJapan;
    this.isAnimating = isAnimating;
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
          ${this.isAnimating ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
          ${this.isAnimating ? 'animate-pulse' : ''}
        `}
        onClick={this.isAnimating ? undefined : this.handleClick}
        disabled={this.isAnimating}
        title={this.getTooltipText()}
        aria-label={this.t('returnToJapan.ariaLabel')}
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
      >
        <FaHome
          className={`
            text-gray-700 text-sm
            ${this.isAnimating ? 'animate-pulse' : ''}
          `}
        />
      </button>
    );

    this.root.render(<ButtonComponent />);
  }

  private handleClick = (): void => {
    if (!this.isAnimating) {
      this.onReturnToJapan();
    }
  };

  private handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if ((event.key === 'Enter' || event.key === ' ') && !this.isAnimating) {
      event.preventDefault();
      this.onReturnToJapan();
    }
  };

  private getTooltipText(): string {
    if (this.isAnimating) {
      return this.t('common.loading');
    }
    return this.t('returnToJapan.tooltip');
  }

  // Method to update the control state
  updateState(
    onReturnToJapan: () => void,
    isAnimating: boolean,
    t: any
  ): void {
    this.onReturnToJapan = onReturnToJapan;
    this.isAnimating = isAnimating;
    this.t = t;
    this.updateButton();
  }
}

const ReturnToJapanButton: React.FC<ReturnToJapanButtonProps> = ({
  onReturnToJapan,
  isAnimating,
  controlPosition = 'bottomright'
}) => {
  const map = useMap();
  const { t } = useTranslation();
  const controlRef = useRef<ReturnToJapanControl | null>(null);

  // Handle Return to Japan button click - navigate to Japan's default view
  const handleReturnToJapan = (): void => {
    if (!isAnimating) {
      // Navigate to Japan with smooth animation
      map.flyTo(JAPAN_DEFAULT_VIEW.center, JAPAN_DEFAULT_VIEW.zoom, {
        duration: JAPAN_DEFAULT_VIEW.animationOptions.duration,
        easeLinearity: JAPAN_DEFAULT_VIEW.animationOptions.easeLinearity
      });

      // Call the provided callback
      onReturnToJapan();
    }
  };

  useEffect(() => {
    if (!map) return;

    // Create and add the control
    const control = new ReturnToJapanControl(
      handleReturnToJapan,
      isAnimating,
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
      controlRef.current.updateState(handleReturnToJapan, isAnimating, t);
    }
  }, [isAnimating, t]);

  // This component doesn't render anything directly - it manages the Leaflet control
  return null;
};

export default ReturnToJapanButton;