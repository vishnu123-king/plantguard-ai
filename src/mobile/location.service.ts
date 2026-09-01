import { FarmCoordinates } from '../shared/types/farm.types';

export interface LocationResult {
  success: boolean;
  coordinates?: FarmCoordinates;
  error?: string;
  isSimulated?: boolean;
  source?: 'device_gps' | 'saved_custom' | 'calibrated_default';
}

const STORAGE_KEY = 'plantguard_user_coordinates';

/**
 * Mobile GPS service designed for high-accuracy GPS / Browser Geolocation.
 * Handles high accuracy, permissions, fallback caching, and manual input syncing.
 */
export class MobileLocationService {
  /**
   * Retrieves saved custom user coordinates if available.
   */
  static getSavedCoordinates(): FarmCoordinates | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.warn('Could not read saved coordinates from localStorage:', e);
    }
    return null;
  }

  /**
   * Persists custom user coordinates (e.g. from Google Maps or GPS).
   */
  static saveCoordinates(coords: FarmCoordinates): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      }
    } catch (e) {
      console.warn('Could not save coordinates to localStorage:', e);
    }
  }

  /**
   * Requests live device GPS location with high accuracy (GPS sensor priority).
   */
  static async getCurrentLocation(forceFreshGps = false): Promise<LocationResult> {
    // If not forcing fresh GPS, check if user saved custom coordinates first
    if (!forceFreshGps) {
      const saved = this.getSavedCoordinates();
      if (saved) {
        return {
          success: true,
          coordinates: saved,
          isSimulated: false,
          source: 'saved_custom'
        };
      }
    }

    // Try HTML5 / Device Geolocation API
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      return new Promise((resolve) => {
        let isResolved = false;

        // Fallback timer in case the browser hangs on permission prompt or GPS lock
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            const saved = MobileLocationService.getSavedCoordinates();
            if (saved) {
              resolve({
                success: true,
                coordinates: saved,
                isSimulated: false,
                source: 'saved_custom'
              });
            } else {
              resolve({
                success: true,
                coordinates: {
                  latitude: 11.0168,
                  longitude: 76.9558,
                  accuracyM: 10.0
                },
                isSimulated: true,
                source: 'calibrated_default',
                error: 'GPS acquisition timed out. Using default regional center.'
              });
            }
          }
        }, 12000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isResolved) return;
            isResolved = true;
            clearTimeout(timeoutId);

            const coords: FarmCoordinates = {
              latitude: Number(pos.coords.latitude.toFixed(6)),
              longitude: Number(pos.coords.longitude.toFixed(6)),
              accuracyM: Number((pos.coords.accuracy || 5.0).toFixed(1))
            };

            // Save to localStorage for instant subsequent loads
            MobileLocationService.saveCoordinates(coords);

            resolve({
              success: true,
              coordinates: coords,
              isSimulated: false,
              source: 'device_gps'
            });
          },
          (err) => {
            if (isResolved) return;
            isResolved = true;
            clearTimeout(timeoutId);

            console.warn('Device GPS unavailable or permission denied:', err.message);
            const saved = MobileLocationService.getSavedCoordinates();

            if (saved) {
              resolve({
                success: true,
                coordinates: saved,
                isSimulated: false,
                source: 'saved_custom',
                error: err.message
              });
            } else {
              resolve({
                success: true,
                coordinates: {
                  latitude: 11.0168,
                  longitude: 76.9558,
                  accuracyM: 8.5
                },
                isSimulated: true,
                source: 'calibrated_default',
                error: err.message
              });
            }
          },
          {
            enableHighAccuracy: true, // Forces phone GPS chipset rather than approximate IP wifi
            timeout: 10000,
            maximumAge: 0 // Do not use stale cached coordinates
          }
        );
      });
    }

    return {
      success: true,
      coordinates: {
        latitude: 11.0168,
        longitude: 76.9558,
        accuracyM: 5.0
      },
      isSimulated: true,
      source: 'calibrated_default',
      error: 'Geolocation API not supported on this browser'
    };
  }
}

