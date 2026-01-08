import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { FaHome } from 'react-icons/fa';
import { createRoot, type Root } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import type { JapanViewConfig } from '@/types/geolocation';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

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

// Performance optimization constants for mobile devices
export const PERFORMANCE_CONFIG = {
  // Use requestAnimationFrame for smooth animations
  USE_RAF: true,
  // Reduce animation complexity on mobile
  MOBILE_ANIMATION_DURATION: 1.0, // Shorter duration for mobile
  DESKTOP_ANIMATION_DURATION: 1.5, // Standard duration for desktop
  // Debounce rapid clicks
  CLICK_DEBOUNCE_MS: 300,
  // Animation frame throttling for mobile
  MOBILE_FPS_TARGET: 30, // Target 30fps on mobile for better performance
  DESKTOP_FPS_TARGET: 60, // Target 60fps on desktop
  // Memory management
  CLEANUP_DELAY_MS: 100, // Delay before cleanup to ensure smooth transitions
} as const;

// Utility to detect mobile devices for performance optimization
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768) ||
    ('ontouchstart' in window);
};

// Utility to get optimal animation duration based on device
const getOptimalAnimationDuration = (): number => {
  return isMobileDevice()
    ? PERFORMANCE_CONFIG.MOBILE_ANIMATION_DURATION
    : PERFORMANCE_CONFIG.DESKTOP_ANIMATION_DURATION;
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

// Custom Leaflet control for Return to Japan button with performance optimizations
class ReturnToJapanControl extends L.Control {
  private container: HTMLDivElement | null = null;
  private root: Root | null = null;
  private onReturnToJapan: () => void;
  private isAnimating: boolean;
  private t: (key: string, options?: unknown) => string;
  private cleanupTimeoutRef: ReturnType<typeof setTimeout> | null = null;
  private lastClickTime: number = 0;
  private rafId: number | null = null;

  constructor(
    onReturnToJapan: () => void,
    isAnimating: boolean,
    t: (key: string, options?: unknown) => string,
    options?: L.ControlOptions
  ) {
    super(options);
    this.onReturnToJapan = onReturnToJapan;
    this.isAnimating = isAnimating;
    this.t = t;
  }

  onAdd(): HTMLElement {
    try {
      this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

      // Prevent map events when interacting with the control
      L.DomEvent.disableClickPropagation(this.container);
      L.DomEvent.disableScrollPropagation(this.container);

      // Create React root and render the button with error boundary
      this.root = createRoot(this.container);
      this.updateButton();

      return this.container;
    } catch (error) {
      console.error('Error creating ReturnToJapanControl:', error);
      // Return a fallback element if creation fails
      const fallback = L.DomUtil.create('div', 'leaflet-control-error');
      fallback.innerHTML = '⚠️';
      fallback.title = 'Return to Japan button failed to load';
      return fallback;
    }
  }

  onRemove(): void {
    try {
      // Clear any pending cleanup timeout
      if (this.cleanupTimeoutRef) {
        clearTimeout(this.cleanupTimeoutRef);
        this.cleanupTimeoutRef = null;
      }

      // Cancel any pending animation frame
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }

      // Cleanup React root with delay to ensure smooth transitions
      if (this.root) {
        this.cleanupTimeoutRef = setTimeout(() => {
          try {
            if (this.root) {
              this.root.unmount();
              this.root = null;
            }
          } catch (error) {
            console.error('Error unmounting ReturnToJapanControl root:', error);
          }
        }, PERFORMANCE_CONFIG.CLEANUP_DELAY_MS);
      }

      this.container = null;
    } catch (error) {
      console.error('Error removing ReturnToJapanControl:', error);
    }
  }

  updateButton(): void {
    if (!this.root) return;

    // Use requestAnimationFrame for smooth updates on mobile
    if (PERFORMANCE_CONFIG.USE_RAF && this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    const renderButton = () => {
      try {
        const ButtonComponent = () => (
          <ErrorBoundary
            fallback={
              <div className="w-11 h-11 bg-red-100 border border-red-300 rounded-sm flex items-center justify-center">
                <span className="text-red-600 text-xs">⚠️</span>
              </div>
            }
            onError={(error) => console.error('ReturnToJapanButton render error:', error)}
          >
            <button
              type="button"
              className={`
                return-to-japan-button
                min-w-11 min-h-11 w-11 h-11 
                sm:min-w-8 sm:min-h-8 sm:w-8 sm:h-8
                bg-white border-2 border-gray-300 rounded-sm
                flex items-center justify-center
                transition-all duration-150 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                touch-manipulation select-none
                ${this.isAnimating
                  ? 'opacity-75 cursor-not-allowed bg-gray-50 border-gray-200'
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
              style={{
                // Ensure minimum touch target size for accessibility
                minWidth: '44px',
                minHeight: '44px',
                // High contrast mode support
                borderColor: 'ButtonBorder',
                backgroundColor: 'ButtonFace',
                color: 'ButtonText',
                // Performance optimization: use transform3d for hardware acceleration
                transform: 'translate3d(0, 0, 0)',
                // Optimize for mobile touch
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <FaHome
                className={`
                  text-gray-700 text-sm transition-transform duration-150
                  sm:text-sm
                  ${this.isAnimating ? 'animate-pulse' : 'group-hover:scale-105'}
                `}
                aria-hidden="true"
                style={{
                  // High contrast mode support
                  color: 'ButtonText',
                  // Hardware acceleration for smooth animations
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
              {/* Screen reader only description */}
              <span
                id="return-to-japan-description"
                className="sr-only"
              >
                {this.getScreenReaderDescription()}
              </span>
            </button>
          </ErrorBoundary>
        );

        this.root?.render(<ButtonComponent />);
      } catch (error) {
        console.error('Error rendering ReturnToJapanButton:', error);
        // Render fallback UI if rendering fails
        try {
          this.root?.render(
            <div className="w-11 h-11 bg-red-100 border border-red-300 rounded-sm flex items-center justify-center">
              <span className="text-red-600 text-xs">⚠️</span>
            </div>
          );
        } catch (fallbackError) {
          console.error('Error rendering fallback UI:', fallbackError);
        }
      }
    };

    if (PERFORMANCE_CONFIG.USE_RAF) {
      this.rafId = requestAnimationFrame(renderButton);
    } else {
      renderButton();
    }
  }

  private handleClick = (): void => {
    // Debounce rapid clicks for better performance
    const now = Date.now();
    if (now - this.lastClickTime < PERFORMANCE_CONFIG.CLICK_DEBOUNCE_MS) {
      return;
    }
    this.lastClickTime = now;

    if (!this.isAnimating) {
      try {
        this.onReturnToJapan();
      } catch (error) {
        console.error('Error handling Return to Japan click:', error);
      }
    }
  };

  private handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
    try {
      // Handle Enter and Space keys for accessibility
      if ((event.key === 'Enter' || event.key === ' ') && !this.isAnimating) {
        event.preventDefault();
        event.stopPropagation();

        // Apply same debouncing as click handler
        const now = Date.now();
        if (now - this.lastClickTime < PERFORMANCE_CONFIG.CLICK_DEBOUNCE_MS) {
          return;
        }
        this.lastClickTime = now;

        this.onReturnToJapan();
      }
      // Handle Escape key to blur the button
      else if (event.key === 'Escape') {
        event.preventDefault();
        (event.target as HTMLButtonElement).blur();
      }
    } catch (error) {
      console.error('Error handling keyboard event:', error);
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
    t: (key: string, options?: unknown) => string
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
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnimationRef = useRef<number>(0);

  // Memoize optimal animation duration to avoid recalculation
  const optimalDuration = useMemo(() => getOptimalAnimationDuration(), []);

  // Handle Return to Japan button click with performance optimizations
  const handleReturnToJapan = useCallback((): void => {
    if (!map || isAnimating) return;

    try {
      // Prevent rapid successive animations
      const now = Date.now();
      if (now - lastAnimationRef.current < PERFORMANCE_CONFIG.CLICK_DEBOUNCE_MS) {
        return;
      }
      lastAnimationRef.current = now;

      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      // Stop any ongoing map animations to prevent conflicts
      map.stop();

      // Validate animation duration is within acceptable range
      const duration = Math.max(
        ANIMATION_CONFIG.DURATION_MIN,
        Math.min(ANIMATION_CONFIG.DURATION_MAX, optimalDuration)
      );

      // Use performance-optimized flyTo options
      const flyToOptions: L.ZoomPanOptions = {
        duration: duration,
        easeLinearity: ANIMATION_CONFIG.EASE_LINEARITY,
        // Performance optimization: disable movestart event for smoother animation
        noMoveStart: false,
      };

      // Navigate to Japan with smooth animation
      map.flyTo(JAPAN_DEFAULT_VIEW.center, JAPAN_DEFAULT_VIEW.zoom, flyToOptions);

      // Call the provided callback to update animation state
      onReturnToJapan();

      // Set a timeout to ensure animation state is properly managed
      // This provides a fallback in case the map animation events don't fire properly
      const timeoutDuration = (duration * 1000) + ANIMATION_CONFIG.TIMEOUT_BUFFER;
      animationTimeoutRef.current = setTimeout(() => {
        // Animation should be complete by now, but this is a safety net
        // The parent component should handle the animation state via map events
        animationTimeoutRef.current = null;
      }, timeoutDuration);

    } catch (error) {
      console.error('Error during Return to Japan navigation:', error);
      // Ensure animation state is reset even if navigation fails
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    }
  }, [map, isAnimating, onReturnToJapan, optimalDuration]);

  useEffect(() => {
    if (!map) return;

    let control: ReturnToJapanControl | null = null;

    try {
      // Create and add the control
      control = new ReturnToJapanControl(
        handleReturnToJapan,
        isAnimating,
        t as (key: string, options?: unknown) => string,
        { position: controlPosition }
      );

      controlRef.current = control;
      map.addControl(control);
    } catch (error) {
      console.error('Error creating ReturnToJapanControl:', error);
    }

    return () => {
      try {
        // Clear any pending animation timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
          animationTimeoutRef.current = null;
        }

        // Clear any pending cleanup timeout
        if (cleanupTimeoutRef.current) {
          clearTimeout(cleanupTimeoutRef.current);
          cleanupTimeoutRef.current = null;
        }

        // Remove control with proper cleanup
        if (controlRef.current && map) {
          // Delay removal to ensure smooth transitions
          cleanupTimeoutRef.current = setTimeout(() => {
            try {
              if (controlRef.current && map) {
                map.removeControl(controlRef.current);
              }
            } catch (error) {
              console.error('Error removing control during cleanup:', error);
            }
            controlRef.current = null;
          }, PERFORMANCE_CONFIG.CLEANUP_DELAY_MS);
        }
      } catch (error) {
        console.error('Error during ReturnToJapanButton cleanup:', error);
      }
    };
  }, [map, controlPosition, handleReturnToJapan, isAnimating, t]);

  // Update control state when props change with error handling
  useEffect(() => {
    try {
      if (controlRef.current) {
        controlRef.current.updateState(handleReturnToJapan, isAnimating, t as (key: string, options?: unknown) => string);
      }
    } catch (error) {
      console.error('Error updating ReturnToJapanControl state:', error);
    }
  }, [isAnimating, t, handleReturnToJapan]);

  // This component doesn't render anything directly - it manages the Leaflet control
  return null;
};

export default ReturnToJapanButton;