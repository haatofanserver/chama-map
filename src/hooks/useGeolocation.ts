import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  UserGeolocationPosition,
  GeolocationErrorType,
  GeolocationOptions,
  UseGeolocationReturn
} from '../types/geolocation';
import { DEFAULT_GEOLOCATION_OPTIONS } from '../types/geolocation';

export const useGeolocation = (
  options: Partial<GeolocationOptions> = {}
): UseGeolocationReturn => {
  const [position, setPosition] = useState<UserGeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationErrorType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef(true);
  const isUserInteractingRef = useRef(false);

  const mergedOptions: GeolocationOptions = {
    ...DEFAULT_GEOLOCATION_OPTIONS,
    ...options
  };

  // Convert GeolocationError to our custom error type
  const convertGeolocationError = useCallback((geoError: GeolocationPositionError): GeolocationErrorType => {
    let code: GeolocationErrorType['code'];
    let message: string;

    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        code = 'PERMISSION_DENIED';
        message = 'Location access denied by user';
        break;
      case geoError.POSITION_UNAVAILABLE:
        code = 'POSITION_UNAVAILABLE';
        message = 'Location information unavailable';
        break;
      case geoError.TIMEOUT:
        code = 'TIMEOUT';
        message = 'Location request timed out';
        break;
      default:
        code = 'POSITION_UNAVAILABLE';
        message = 'Unknown geolocation error';
    }

    return { code, message };
  }, []);

  // Handle successful position acquisition
  const handleSuccess = useCallback((geoPosition: GeolocationPosition) => {
    const newPosition: UserGeolocationPosition = {
      lat: geoPosition.coords.latitude,
      lng: geoPosition.coords.longitude,
      accuracy: geoPosition.coords.accuracy,
      timestamp: geoPosition.timestamp
    };

    setPosition(newPosition);
    setError(null);
    setIsLoading(false);
    setIsPermissionGranted(true);
    lastActivityRef.current = Date.now();
  }, []);

  // Handle geolocation errors
  const handleError = useCallback((geoError: GeolocationPositionError) => {
    const convertedError = convertGeolocationError(geoError);
    setError(convertedError);
    setIsLoading(false);

    if (convertedError.code === 'PERMISSION_DENIED') {
      setIsPermissionGranted(false);
    }
  }, [convertGeolocationError]);

  // Get current geolocation options based on app state
  const getCurrentOptions = useCallback((): PositionOptions => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const shouldUseHighAccuracy = isActiveRef.current && (mergedOptions.mobileOptimized ? !isMobile || isUserInteractingRef.current : true);

    const baseOptions: PositionOptions = {
      enableHighAccuracy: shouldUseHighAccuracy,
      timeout: mergedOptions.timeout,
      maximumAge: isActiveRef.current ? mergedOptions.maximumAge : mergedOptions.maximumAge * 2
    };

    return baseOptions;
  }, [mergedOptions]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (backgroundTimerRef.current) {
      clearTimeout(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }

    setIsLoading(false);
  }, []);

  // Start watching position with configurable intervals
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    if (watchIdRef.current !== null) {
      stopWatching();
    }

    setIsLoading(true);
    setError(null);

    const options = getCurrentOptions();

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Set up inactivity timer for automatic cleanup
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        stopWatching();
      }, mergedOptions.inactivityTimeout);
    };

    // Set up background update timer for reduced frequency updates
    const setupBackgroundTimer = () => {
      if (backgroundTimerRef.current) {
        clearTimeout(backgroundTimerRef.current);
      }

      if (!isActiveRef.current) {
        backgroundTimerRef.current = setTimeout(() => {
          if (!isActiveRef.current && watchIdRef.current !== null) {
            // Restart with background options
            watchPosition();
          }
        }, mergedOptions.backgroundUpdateInterval);
      }
    };

    resetInactivityTimer();
    setupBackgroundTimer();
    lastActivityRef.current = Date.now();
  }, [getCurrentOptions, handleSuccess, handleError, stopWatching, mergedOptions.inactivityTimeout, mergedOptions.backgroundUpdateInterval]);

  // Request single position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 'POSITION_UNAVAILABLE',
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    lastActivityRef.current = Date.now();

    const options = getCurrentOptions();

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      options
    );
  }, [getCurrentOptions, handleSuccess, handleError]);

  // Handle visibility change for performance optimization
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isActiveRef.current = isVisible;

      if (isVisible) {
        lastActivityRef.current = Date.now();
        isUserInteractingRef.current = true;
        // Restart watching if we were watching before
        if (watchIdRef.current !== null) {
          watchPosition();
        }
      } else {
        isUserInteractingRef.current = false;
        // Reduce accuracy when not visible
        if (watchIdRef.current !== null) {
          watchPosition(); // Restart with reduced accuracy
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [watchPosition]);

  // Handle user interaction for performance optimization
  useEffect(() => {
    const handleUserInteraction = () => {
      lastActivityRef.current = Date.now();
      isUserInteractingRef.current = true;

      // If we're watching and the app is active, restart with high accuracy
      if (watchIdRef.current !== null && isActiveRef.current) {
        watchPosition();
      }

      // Reset interaction flag after a delay
      setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 30000); // 30 seconds of high accuracy after interaction
    };

    const events = ['mousedown', 'touchstart', 'keydown', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [watchPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  // Check initial permission state
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setIsPermissionGranted(result.state === 'granted');

        result.addEventListener('change', () => {
          setIsPermissionGranted(result.state === 'granted');
          if (result.state === 'denied') {
            stopWatching();
            setError({
              code: 'PERMISSION_DENIED',
              message: 'Location access denied by user'
            });
          }
        });
      }).catch(() => {
        // Permissions API not supported, will handle on first request
      });
    }
  }, [stopWatching]);

  return {
    position,
    error,
    isLoading,
    isPermissionGranted,
    requestLocation,
    watchPosition,
    stopWatching
  };
};