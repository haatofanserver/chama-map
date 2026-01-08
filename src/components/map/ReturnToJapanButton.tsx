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

// Japan bounds for validation
export const JAPAN_BOUNDS = {
  north: 45.5,
  south: 30.0,
  east: 146.0,
  west: 129.0
};

// Animation configuration constants
export const ANIMATION_CONFIG = {
  DURATION_MIN: 1.0, // Minimum animation duration in seconds
  DURATION_MAX: 2.0, // Maximum animation duration in seconds
  EASE_LINEARITY: 0.25, // Smooth deceleration
  TIMEOUT_BUFFER: 500 // Buffer time in milliseconds for animation timeout
} as const;

// Utility function to check if the current map view is close to Japan's default view
export const isMapAtJapanView = (map: L.Map, tolerance = 0.1): boolean => {
  const center = map.getCenter();
  const zoom = map.getZoom();

  const latDiff = Math.abs(center.lat - JAPAN_DEFAULT_VIEW.center[0]);
  const lngDiff = Math.abs(center.lng - JAPAN_DEFAULT_VIEW.center[1]);
  const zoomDiff = Math.abs(zoom - JAPAN_DEFAULT_VIEW.zoom);

  return latDiff <= tolerance && lngDiff <= tolerance && zoomDiff <= 1;
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
          transition-all duration-150 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          ${this.isAnimating
            ? 'opacity-75 cursor-not-allowed bg-gray-50'
            : 'cursor-pointer hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:bg-gray-100 active:scale-95'
          }
          ${this.isAnimating ? 'animate-pulse' : ''}
        `}
        onClick={this.isAnimating ? undefined : this.handleClick}
        disabled={this.isAnimating}
        title={this.getTooltipText()}
        aria-label={this.getAriaLabel()}
        aria-describedby="return-to-japan-description"
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        tabIndex={0}
        role="button"
      >
        <FaHome
          className={`
            text-gray-700 text-sm transition-transform duration-150
            ${this.isAnimating ? 'animate-pulse' : ''}
          `}
          aria-hidden="true"
        />
        {/* Screen reader only description */}
        <span
          id="return-to-japan-description"
          className="sr-only"
        >
          {this.getScreenReaderDescription()}
        </span>
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
    // Handle Enter and Space keys for accessibility
    if ((event.key === 'Enter' || event.key === ' ') && !this.isAnimating) {
      event.preventDefault();
      event.stopPropagation();
      this.onReturnToJapan();
    }
    // Handle Escape key to blur the button
    else if (event.key === 'Escape') {
      event.preventDefault();
      (event.target as HTMLButtonElement).blur();
    }
  };

  private handleFocus = (event: React.FocusEvent<HTMLButtonElement>): void => {
    // Add visual focus indicator (handled by CSS focus: classes)
    // Announce to screen readers when focused
    event.target.setAttribute('aria-live', 'polite');
  };

  private handleBlur = (event: React.FocusEvent<HTMLButtonElement>): void => {
    // Remove live region when not focused
    event.target.removeAttribute('aria-live');
  };

  private getTooltipText(): string {
    if (this.isAnimating) {
      return this.t('common.loading');
    }
    return this.t('returnToJapan.tooltip');
  }

  private getAriaLabel(): string {
    if (this.isAnimating) {
      return `${this.t('returnToJapan.ariaLabel')} - ${this.t('common.loading')}`;
    }
    return this.t('returnToJapan.ariaLabel');
  }

  private getScreenReaderDescription(): string {
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
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Return to Japan button click - navigate to Japan's default view
  const handleReturnToJapan = (): void => {
    if (!isAnimating && map) {
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Stop any ongoing map animations to prevent conflicts
      map.stop();

      // Validate animation duration is within acceptable range
      const duration = Math.max(
        ANIMATION_CONFIG.DURATION_MIN,
        Math.min(ANIMATION_CONFIG.DURATION_MAX, JAPAN_DEFAULT_VIEW.animationOptions.duration)
      );

      // Navigate to Japan with smooth animation
      map.flyTo(JAPAN_DEFAULT_VIEW.center, JAPAN_DEFAULT_VIEW.zoom, {
        duration: duration,
        easeLinearity: ANIMATION_CONFIG.EASE_LINEARITY
      });

      // Call the provided callback to update animation state
      onReturnToJapan();

      // Set a timeout to ensure animation state is properly managed
      // This provides a fallback in case the map animation events don't fire properly
      animationTimeoutRef.current = setTimeout(() => {
        // Animation should be complete by now, but this is a safety net
        // The parent component should handle the animation state via map events
      }, (duration * 1000) + ANIMATION_CONFIG.TIMEOUT_BUFFER);
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
      // Clear any pending animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

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