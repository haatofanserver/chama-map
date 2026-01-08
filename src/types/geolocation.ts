export interface UserGeolocationPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export interface UserPosition {
  coordinates: {
    lat: number;
    lng: number;
  };
  accuracy: number; // meters
  timestamp: number;
  heading?: number; // degrees from north
  speed?: number; // m/s
}

export interface GeolocationErrorType {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT';
  message: string;
}

export interface GeolocationOptions {
  enableHighAccuracy: boolean;
  timeout: number; // milliseconds
  maximumAge: number; // milliseconds
  watchInterval: number; // milliseconds between updates
  inactivityTimeout: number; // milliseconds before stopping due to inactivity
  backgroundUpdateInterval: number; // milliseconds between updates when in background
  mobileOptimized: boolean; // whether to use mobile-optimized settings
}

export interface UseGeolocationReturn {
  position: UserGeolocationPosition | null;
  error: GeolocationErrorType | null;
  isLoading: boolean;
  isPermissionGranted: boolean;
  requestLocation: () => void;
  watchPosition: () => void;
  stopWatching: () => void;
}

export const DEFAULT_GEOLOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watchInterval: 5000,
  inactivityTimeout: 300000, // 5 minutes
  backgroundUpdateInterval: 30000, // 30 seconds when in background
  mobileOptimized: true
};
// Return to Japan button types
export interface JapanViewConfig {
  center: [number, number]; // [lat, lng]
  zoom: number;
  animationOptions: {
    duration: number; // seconds
    easeLinearity: number;
  };
}

export interface FlyToOptions {
  duration: number; // seconds for optimal UX
  easeLinearity: number; // for smooth deceleration
  noMoveStart?: boolean; // false to trigger move events
}